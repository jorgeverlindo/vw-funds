// ─── Comments — constants ─────────────────────────────────────────────────────
// Re-exports PROJECT_OWNERS as CommentUser[] so the comments feature has a
// single source of truth for users — no duplication.

import { PROJECT_OWNERS } from "@projects/CreateProjectDialog";
import type { CommentUser } from "./types";

/**
 * All users that can author comments, be @mentioned, or receive notifications.
 * Derived directly from PROJECT_OWNERS — do NOT maintain a separate list.
 */
export const COMMENT_USERS: CommentUser[] = (PROJECT_OWNERS as readonly {
  id: string; name: string; email: string; initials: string; color: string; avatar: string | null;
}[]).map(o => ({
  id:       o.id,
  name:     o.name,
  email:    o.email,
  initials: o.initials,
  color:    o.color,
  avatar:   o.avatar,
}));

/** Look up a user by ID. Returns undefined if not found. */
export function getUserById(id: string): CommentUser | undefined {
  return COMMENT_USERS.find(u => u.id === id);
}

/** The "logged-in" user for this prototype session. */
export const CURRENT_USER: CommentUser = COMMENT_USERS[0]; // Jorge Verlindo

/** localStorage key prefix for persisting comments per project. */
export const COMMENTS_STORAGE_KEY = (projectId: string) =>
  `constellation_comments_${projectId}`;

/** localStorage key for persisting notifications (global). */
export const NOTIFS_STORAGE_KEY = "constellation_notifications";

/** Modules that can be used to filter/group comments. */
export const COMMENT_MODULES = [
  "Offers",
  "Templates",
  "Backgrounds",
  "Preview",
] as const;

export type CommentModule = typeof COMMENT_MODULES[number];
