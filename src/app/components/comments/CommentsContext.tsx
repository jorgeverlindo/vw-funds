// ─── CommentsContext ──────────────────────────────────────────────────────────
// Global state for comments + notifications.
// Wrap ProjectDetailView (or any subtree that needs comments) with
// <CommentsProvider projectId={...}> to activate.
//
// If no provider is present, the hook returns a safe no-op context so
// existing components that don't use comments are completely unaffected.

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import type {
  CommentData,
  CommentsContextValue,
  CommentUser,
  NotifAction,
  NotifItem,
  Reply,
} from "./types";
import {
  COMMENT_USERS,
  COMMENTS_STORAGE_KEY,
  CURRENT_USER,
  NOTIFS_STORAGE_KEY,
  getUserById,
} from "./constants";
import {
  extractMentionIds,
  genId,
  htmlToPlainText,
  loadFromStorage,
  saveToStorage,
} from "./utils";

// ─── Context ──────────────────────────────────────────────────────────────────

const CommentsCtx = createContext<CommentsContextValue | null>(null);

// ─── Reducer ──────────────────────────────────────────────────────────────────

type CommentAction =
  | { type: "SET";    comments: CommentData[] }
  | { type: "ADD";    comment:  CommentData }
  | { type: "EDIT";   commentId: string; message: string }
  | { type: "DELETE"; commentId: string }
  | { type: "PIN";    commentId: string; pinned: boolean; pinnedAt?: number }
  | { type: "ADD_REPLY";    commentId: string; reply: Reply }
  | { type: "EDIT_REPLY";   commentId: string; replyId: string; message: string }
  | { type: "DELETE_REPLY"; commentId: string; replyId: string };

function commentsReducer(state: CommentData[], action: CommentAction): CommentData[] {
  switch (action.type) {
    case "SET":    return action.comments;
    case "ADD":    return [action.comment, ...state];
    case "EDIT":   return state.map(c => c.id === action.commentId
                     ? { ...c, message: action.message, isEdited: true } : c);
    case "DELETE": return state.filter(c => c.id !== action.commentId);
    case "PIN":    return state.map(c => c.id === action.commentId
                     ? { ...c, isPinned: action.pinned, pinnedAt: action.pinned ? action.pinnedAt : undefined } : c);
    case "ADD_REPLY": return state.map(c => c.id === action.commentId
                     ? { ...c, replies: [...c.replies, action.reply] } : c);
    case "EDIT_REPLY": return state.map(c => c.id === action.commentId
                     ? { ...c, replies: c.replies.map(r => r.id === action.replyId
                         ? { ...r, message: action.message, isEdited: true } : r) } : c);
    case "DELETE_REPLY": return state.map(c => c.id === action.commentId
                     ? { ...c, replies: c.replies.filter(r => r.id !== action.replyId) } : c);
    default: return state;
  }
}

type NotifAction2 =
  | { type: "SET";      items: NotifItem[] }
  | { type: "ADD";      item:  NotifItem }
  | { type: "MARK";     id:    string }
  | { type: "MARK_ALL" };

function notifsReducer(state: NotifItem[], action: NotifAction2): NotifItem[] {
  switch (action.type) {
    case "SET":      return action.items;
    case "ADD":      return [action.item, ...state];
    case "MARK":     return state.map(n => n.id === action.id ? { ...n, isRead: true } : n);
    case "MARK_ALL": return state.map(n => ({ ...n, isRead: true }));
    default: return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface CommentsProviderProps {
  projectId:   string;
  projectName?: string;
  children:    React.ReactNode;
}

export function CommentsProvider({ projectId, projectName = "", children }: CommentsProviderProps) {
  const storageKey = COMMENTS_STORAGE_KEY(projectId);

  // ── State ──────────────────────────────────────────────────────────────────
  const [comments,  dispatchComments]  = useReducer(commentsReducer, undefined,
    () => loadFromStorage<CommentData[]>(storageKey, []));

  const [notifications, dispatchNotifs] = useReducer(notifsReducer, undefined,
    () => loadFromStorage<NotifItem[]>(NOTIFS_STORAGE_KEY, []));

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // ── Persist on change ─────────────────────────────────────────────────────
  // useRef tracks latest so we can save without stale-closure issues
  const commentsRef = useRef(comments);
  commentsRef.current = comments;
  const notifsRef = useRef(notifications);
  notifsRef.current = notifications;

  const persistComments = useCallback((next: CommentData[]) => {
    saveToStorage(storageKey, next);
  }, [storageKey]);

  const persistNotifs = useCallback((next: NotifItem[]) => {
    saveToStorage(NOTIFS_STORAGE_KEY, next);
  }, []);

  // ── Helper: emit notifications for @mentions ──────────────────────────────
  const emitMentionNotifs = useCallback((
    message:       string,
    action:        NotifAction,
    commentId:     string,
    replyId?:      string,
    entityId?:     string,
  ) => {
    const mentionIds = extractMentionIds(message);
    const preview    = htmlToPlainText(message).slice(0, 80);

    mentionIds.forEach(recipientId => {
      if (recipientId === CURRENT_USER.id) return; // don't notify yourself
      const notif: NotifItem = {
        id:              genId("n"),
        action,
        actorId:         CURRENT_USER.id,
        recipientId,
        projectId,
        projectName,
        timestamp:       Date.now(),
        isRead:          false,
        targetCommentId: commentId,
        targetReplyId:   replyId,
        targetEntityId:  entityId,
        preview,
      };
      const next = [notif, ...notifsRef.current];
      dispatchNotifs({ type: "ADD", item: notif });
      persistNotifs(next);
    });
  }, [projectId, projectName, persistNotifs]);

  // ── Comment CRUD ──────────────────────────────────────────────────────────

  const addComment = useCallback((draft: Omit<CommentData, "id" | "timestamp" | "authorId">) => {
    const comment: CommentData = {
      ...draft,
      id:        genId("c"),
      projectId,
      authorId:  CURRENT_USER.id,
      timestamp: Date.now(),
    };
    dispatchComments({ type: "ADD", comment });
    const next = [comment, ...commentsRef.current];
    persistComments(next);
    emitMentionNotifs(comment.message, "mentioned_you", comment.id, undefined, comment.entityMention?.id);
    return comment;
  }, [projectId, persistComments, emitMentionNotifs]);

  const editComment = useCallback((commentId: string, message: string) => {
    dispatchComments({ type: "EDIT", commentId, message });
    const next = commentsRef.current.map(c =>
      c.id === commentId ? { ...c, message, isEdited: true } : c);
    persistComments(next);
  }, [persistComments]);

  const deleteComment = useCallback((commentId: string) => {
    dispatchComments({ type: "DELETE", commentId });
    const next = commentsRef.current.filter(c => c.id !== commentId);
    persistComments(next);
  }, [persistComments]);

  const pinComment = useCallback((commentId: string, pinned: boolean) => {
    const pinnedAt = pinned ? Date.now() : undefined;
    dispatchComments({ type: "PIN", commentId, pinned, pinnedAt });
    const next = commentsRef.current.map(c =>
      c.id === commentId ? { ...c, isPinned: pinned, pinnedAt } : c);
    persistComments(next);
  }, [persistComments]);

  // ── Reply CRUD ────────────────────────────────────────────────────────────

  const addReply = useCallback((
    commentId: string,
    draft:     Omit<Reply, "id" | "timestamp" | "authorId">,
  ) => {
    const reply: Reply = {
      ...draft,
      id:        genId("r"),
      authorId:  CURRENT_USER.id,
      timestamp: Date.now(),
    };
    dispatchComments({ type: "ADD_REPLY", commentId, reply });
    const next = commentsRef.current.map(c =>
      c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c);
    persistComments(next);
    emitMentionNotifs(reply.message, "replied_to_you", commentId, reply.id, reply.entityMention?.id);
  }, [persistComments, emitMentionNotifs]);

  const editReply = useCallback((commentId: string, replyId: string, message: string) => {
    dispatchComments({ type: "EDIT_REPLY", commentId, replyId, message });
    const next = commentsRef.current.map(c =>
      c.id === commentId
        ? { ...c, replies: c.replies.map(r => r.id === replyId ? { ...r, message, isEdited: true } : r) }
        : c);
    persistComments(next);
  }, [persistComments]);

  const deleteReply = useCallback((commentId: string, replyId: string) => {
    dispatchComments({ type: "DELETE_REPLY", commentId, replyId });
    const next = commentsRef.current.map(c =>
      c.id === commentId
        ? { ...c, replies: c.replies.filter(r => r.id !== replyId) }
        : c);
    persistComments(next);
  }, [persistComments]);

  // ── Notifications ─────────────────────────────────────────────────────────

  const markRead = useCallback((notifId: string) => {
    dispatchNotifs({ type: "MARK", id: notifId });
    const next = notifsRef.current.map(n => n.id === notifId ? { ...n, isRead: true } : n);
    persistNotifs(next);
  }, [persistNotifs]);

  const markAllRead = useCallback(() => {
    dispatchNotifs({ type: "MARK_ALL" });
    const next = notifsRef.current.map(n => ({ ...n, isRead: true }));
    persistNotifs(next);
  }, [persistNotifs]);

  // ── Panel/notif toggles ───────────────────────────────────────────────────
  const openPanel   = useCallback(() => { setIsPanelOpen(true);  setIsNotifOpen(false); }, []);
  const closePanel  = useCallback(() => setIsPanelOpen(false), []);
  const togglePanel = useCallback(() => setIsPanelOpen(p => { if (!p) setIsNotifOpen(false); return !p; }), []);
  const openNotif   = useCallback(() => { setIsNotifOpen(true);  setIsPanelOpen(false); }, []);
  const closeNotif  = useCallback(() => setIsNotifOpen(false), []);
  const toggleNotif = useCallback(() => setIsNotifOpen(p => { if (!p) setIsPanelOpen(false); return !p; }), []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const pinnedIds   = useMemo(() => new Set(comments.filter(c => c.isPinned).map(c => c.id)), [comments]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead && n.recipientId === CURRENT_USER.id).length, [notifications]);

  // ── Context value (stable reference via useMemo) ──────────────────────────
  const value = useMemo<CommentsContextValue>(() => ({
    comments,
    notifications,
    unreadCount,
    pinnedIds,
    currentUser: CURRENT_USER,

    addComment,
    editComment,
    deleteComment,
    pinComment,
    addReply,
    editReply,
    deleteReply,
    markRead,
    markAllRead,

    isPanelOpen,
    openPanel,
    closePanel,
    togglePanel,
    isNotifOpen,
    openNotif,
    closeNotif,
    toggleNotif,
  }), [
    comments, notifications, unreadCount, pinnedIds,
    addComment, editComment, deleteComment, pinComment,
    addReply, editReply, deleteReply, markRead, markAllRead,
    isPanelOpen, openPanel, closePanel, togglePanel,
    isNotifOpen, openNotif, closeNotif, toggleNotif,
  ]);

  return <CommentsCtx.Provider value={value}>{children}</CommentsCtx.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the comments context.
 * Safe to call from any component — returns null if no provider is present,
 * so existing components outside the comments tree are unaffected.
 */
export function useComments(): CommentsContextValue | null {
  return useContext(CommentsCtx);
}

/**
 * Same as useComments() but throws if no provider.
 * Use inside components that strictly require the context.
 */
export function useCommentsRequired(): CommentsContextValue {
  const ctx = useContext(CommentsCtx);
  if (!ctx) throw new Error("useCommentsRequired must be used inside <CommentsProvider>");
  return ctx;
}

// ─── Re-export user helpers for convenience ───────────────────────────────────
export { COMMENT_USERS, CURRENT_USER, getUserById };
