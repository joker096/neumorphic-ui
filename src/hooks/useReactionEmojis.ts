import { useAppStore } from "../store";
import { getAvailableReactionEmojis } from "../config/reactions";

/**
 * Reaction set for the current tier. Lives in a hook so the bubble picker,
 * the hover add-reaction panel and the long-press menu all resolve the same
 * free/premium list without threading it through every component.
 */
export function useReactionEmojis(): string[] {
  const premium = useAppStore((s) => s?.premiumEntitlement?.premium ?? false);
  return getAvailableReactionEmojis(premium);
}
