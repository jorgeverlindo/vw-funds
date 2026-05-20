// ─── Comments feature — public API ───────────────────────────────────────────
// Import from "@comments" (alias configured below) instead of relative paths.

export type {
  CommentData,
  CommentUser,
  CommentsContextValue,
  EntityRef,
  EntityType,
  NotifAction,
  NotifItem,
  Reply,
  Attachment,
} from "./types";

export {
  COMMENT_MODULES,
  COMMENT_USERS,
  COMMENTS_STORAGE_KEY,
  CURRENT_USER,
  NOTIFS_STORAGE_KEY,
  getUserById,
} from "./constants";

export type { CommentModule } from "./constants";

export {
  CommentsProvider,
  useComments,
  useCommentsRequired,
} from "./CommentsContext";

export {
  formatTimestamp,
  genId,
  htmlToPlainText,
  sanitizeHtml,
  extractMentionIds,
} from "./utils";
