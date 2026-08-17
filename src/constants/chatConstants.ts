/**
 * Chat-specific static constants.
 *
 * Centralises hardcoded visual data (gradient classes, mock content) that was
 * previously inlined inside components, so it can be reused and themed without
 * duplication.
 */

/** Brand gradient used for the primary "send" action across chat inputs. */
export const CHAT_SEND_GRADIENT = "bg-gradient-to-tr from-[#6f7fff] to-[#965dff]";

/** Decorative gradient classes used for mock media previews in the profile view. */
export const CHAT_PROFILE_MEDIA_GRADIENTS: readonly string[] = [
  "from-rose-500 to-orange-500",
  "from-blue-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-400 to-rose-500",
  "from-fuchsia-500 to-purple-500",
  "from-slate-600 to-slate-900",
  "from-cyan-500 to-blue-500",
  "from-lime-500 to-emerald-500",
];

/** Placeholder member names shown in group/channel profile member lists. */
export const CHAT_PROFILE_MOCK_MEMBERS: readonly string[] = ["Alice", "Bob", "Carol"];

/** Default subscriber/member counts used when a chat does not provide them. */
export const CHAT_PROFILE_DEFAULT_SUBSCRIBERS = 1240;
export const CHAT_PROFILE_DEFAULT_MEMBERS = 24;
