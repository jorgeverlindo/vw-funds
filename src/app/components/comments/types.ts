// ─── Comments feature — shared types ─────────────────────────────────────────
// Single source of truth for all comment-related interfaces.
// No imports from app modules here — keeps this file portable and cycle-free.

// ── User ──────────────────────────────────────────────────────────────────────

/** A user that can author comments, be @mentioned, or receive notifications. */
export interface CommentUser {
  id:       string;
  name:     string;
  email:    string;
  initials: string;
  color:    string;        // hex — used as avatar background
  avatar:   string | null; // URL or null → show initials
}

// ── Entity reference (card attached to a comment) ─────────────────────────────

export type EntityType = "offer" | "template" | "background" | "preview" | "vehicle";

export interface EntityRef {
  id:    string;
  label: string;   // e.g. "2026 Honda CR-V TrailSport AWD"
  type:  EntityType;
}

// ── Attachment ────────────────────────────────────────────────────────────────

export interface Attachment {
  id:            string;
  name:          string;
  thumbnailUrl?: string;
}

// ── Reply ─────────────────────────────────────────────────────────────────────

export interface Reply {
  id:             string;
  authorId:       string;   // → CommentUser.id
  timestamp:      number;   // Date.now()
  message:        string;   // sanitized HTML from contentEditable
  isEdited?:      boolean;
  attachments?:   Attachment[];
  entityMention?: EntityRef;
}

// ── Comment (root thread) ─────────────────────────────────────────────────────

export interface CommentData {
  id:             string;
  projectId:      string;
  authorId:       string;   // → CommentUser.id
  timestamp:      number;   // Date.now()
  message:        string;   // sanitized HTML
  replies:        Reply[];
  attachments:    Attachment[];
  entityMention?: EntityRef;
  module?:        string;   // "Offers" | "Templates" | "Backgrounds" | "Preview"
  isPinned?:      boolean;
  pinnedAt?:      number;   // Date.now() — set when pinned
  isEdited?:      boolean;
}

// ── Notification ──────────────────────────────────────────────────────────────

export type NotifAction =
  | "mentioned_you"
  | "replied_to_you"
  | "commented"
  | "pinned"
  | "assigned_you";

export interface NotifItem {
  id:              string;
  action:          NotifAction;
  actorId:         string;   // who triggered it → CommentUser.id
  recipientId:     string;   // who should see it → CommentUser.id
  projectId:       string;
  projectName:     string;
  timestamp:       number;
  isRead:          boolean;
  // deep-link targets
  targetCommentId?: string;
  targetReplyId?:   string;
  targetEntityId?:  string;
  preview?:         string;  // first ~80 chars of the message, plain text
}

// ── Context shape ─────────────────────────────────────────────────────────────

export interface CommentsContextValue {
  /** All comments for the currently open project, sorted newest-first. */
  comments:         CommentData[];
  /** All notifications for the current user, sorted newest-first. */
  notifications:    NotifItem[];
  /** Unread notification count (badge). */
  unreadCount:      number;
  /** IDs of pinned comments for quick lookup. */
  pinnedIds:        Set<string>;
  /** The "logged-in" user for this session. */
  currentUser:      CommentUser;

  // ── Comment CRUD ──────────────────────────────────────────────────────────
  addComment:    (draft: Omit<CommentData, "id" | "timestamp" | "authorId">) => CommentData;
  editComment:   (commentId: string, message: string) => void;
  deleteComment: (commentId: string) => void;
  pinComment:    (commentId: string, pinned: boolean) => void;

  // ── Reply CRUD ────────────────────────────────────────────────────────────
  addReply:    (commentId: string, draft: Omit<Reply, "id" | "timestamp" | "authorId">) => void;
  editReply:   (commentId: string, replyId: string, message: string) => void;
  deleteReply: (commentId: string, replyId: string) => void;

  // ── Notifications ─────────────────────────────────────────────────────────
  markRead:    (notifId: string) => void;
  markAllRead: () => void;

  // ── Panel state (kept here so TopBar badge and panel stay in sync) ────────
  isPanelOpen:    boolean;
  openPanel:      () => void;
  closePanel:     () => void;
  togglePanel:    () => void;
  isNotifOpen:    boolean;
  openNotif:      () => void;
  closeNotif:     () => void;
  toggleNotif:    () => void;

  // ── Entity attach (Etapa 3) ───────────────────────────────────────────────
  /** The entity card pre-selected for the next comment. Cleared after submit. */
  pendingEntity:       EntityRef | null;
  /** Open the panel and pre-load an entity so the next comment is linked to it. */
  openPanelForEntity:  (entity: EntityRef) => void;
  /** Clear the pending entity (user dismissed the banner). */
  clearPendingEntity:  () => void;

  // ── Deep-link highlight ───────────────────────────────────────────────────
  /** Comment currently highlighted from a deep-link navigation. Cleared after ~5s. */
  highlightedCommentId: string | null;
  /** Set the highlighted comment (pass null to clear). */
  highlightComment:     (id: string | null) => void;
}
