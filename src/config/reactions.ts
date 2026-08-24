// Reaction sets. Free tier: 6 base emojis. Premium: +12 extended emojis (18 total).
export const FREE_REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '😢', '🎉']

export const PREMIUM_REACTION_EMOJIS = ['🧡', '💚', '💙', '🖤', '😍', '🥹', '😭', '😡', '🤯', '👏', '💯', '💀']

export function getAvailableReactionEmojis(premium: boolean): string[] {
  return premium ? [...FREE_REACTION_EMOJIS, ...PREMIUM_REACTION_EMOJIS] : FREE_REACTION_EMOJIS
}
