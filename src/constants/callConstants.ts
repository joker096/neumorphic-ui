/**
 * Centralised constants for the call UI.
 *
 * Extracts hardcoded visual tokens (gradient classes, control sizes, fallback
 * strings) and call-state labels that were previously inlined inside the call
 * components, so they can be reused, themed and audited in one place.
 */

/** Gradient used for the caller avatar bubble across call screens. */
export const CALL_AVATAR_GRADIENT = "bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)]";

/** Softer gradient variant used for the video-call avatar fallback. */
export const CALL_AVATAR_GRADIENT_SOFT = "bg-gradient-to-br from-[var(--accent)]/80 to-[var(--accent2)]/80";

/** Background for the non-video (audio) call stage — uses app surface, not black. */
export const CALL_AUDIO_STAGE_GRADIENT = "bg-[var(--bg-primary)]";

/** Gradient for the primary "end call" destructive action. */
export const CALL_END_GRADIENT = "bg-gradient-to-br from-[var(--danger)] to-[var(--danger)]";

/** Gradient used for a participant tile without a live stream. */
export const CALL_GROUP_AVATAR_GRADIENT = "bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)]";

/** Idle (not joined) huddle banner accent gradient. */
export const CALL_HUDDLE_IDLE_GRADIENT = "bg-gradient-to-r from-purple-500/20 to-blue-500/20";

/** Active (joined) huddle banner accent gradient. */
export const CALL_HUDDLE_ACTIVE_GRADIENT = "bg-gradient-to-r from-green-500/20 to-blue-500/20";

/** Fallback initial rendered when a participant name is empty. */
export const CALL_DEFAULT_INITIAL = "U";

/** Short label rendered on the demo/preview call badge. */
export const CALL_DEMO_BADGE_LABEL = "Demo";

/** Default chat name used when a huddle has no explicit name. */
export const CALL_HUDDLE_DEFAULT_NAME = "Huddle";

/** Maps a raw call status to a translation key (when one exists). */
export const CALL_STATUS_LABEL_KEYS: Partial<Record<string, string>> = {
  connecting: "call.connecting",
};

/** Size presets for the circular call control buttons. */
export interface ControlButtonSize {
  wrapper: string;
  icon: number;
}

export const CALL_CONTROL_SIZES: Record<"sm" | "md" | "lg", ControlButtonSize> = {
  sm: { wrapper: "w-11 h-11", icon: 18 },
  md: { wrapper: "w-14 h-14", icon: 22 },
  lg: { wrapper: "w-16 h-16", icon: 26 },
};

/** Active-state focus ring colour per control intent. */
export const CALL_CONTROL_ACTIVE_COLORS = {
  danger: "border-[var(--danger)]/70",
  info: "border-[var(--accent)]/70",
} as const;
