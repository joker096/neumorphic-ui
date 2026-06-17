# Hub Badge Counters Design

## Problem
Hub (`RadialMenu`) buttons for Chats, Channels, and Calls lack incoming activity indicators.

## Solution
Compute summarized counters from existing data sources and attach as `badge` to `hubItems`, rendered inside each radial bubble node.

## Data Sources
- **Chats badge**: `Σ chat.unread` for all chats (`useAppStore().chats`)
- **Channels badge**: `Σ channel.unread` for all channels (`useAppStore().channels`)
- **Calls badge**: count of `missed` calls from `MOCK_CALLS` (or store when moved there) with `type === 'missed'` and `time` within last 24h; plus `1` if `activeCall` present (incoming indicator)

## UI
- Badge rendered as orange gradient circle with `count` inside each bubble, using existing `GlowingKnobLine` style (`App.tsx:102`).
- Hide badge when count is `0`.

## Implementation Notes
- Computed inside `App.tsx` near `hubItems` definition (line ~3521).
- Passed through existing `items` prop to `RadialMenu`.
- Rendered in bubble node divs (line ~1321).
- No store changes required.

## Rollout
1. Write spec and commit.
2. Add counts to `hubItems`.
3. Render badges in bubble nodes.
4. Verify via lint.
