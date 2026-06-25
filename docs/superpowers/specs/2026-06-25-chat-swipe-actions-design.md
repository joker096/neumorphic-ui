# Chat Swipe Actions Design

## Interaction

- **Swipe left** → reveals orange "Archive" / "Unarchive" button (76px, right side)
- **Swipe right** → reveals "Voice" + "Video" buttons (left side, non-group only)
- **Tap** → opens chat (when no swipe active)
- **Archive label** is context-aware: `t('chat.archive')` for normal, `t('chat.unarchive')` for archived

## Visual

### Swipe Left → Archive
```
┌──────────────────────────────────┐
│              ┌─────────┐│▓▓▓▓▓▓▓▓│
│  JD  Johnny  │ ...     ││ Archive │
│              │ 2       │▓▓▓▓▓▓▓▓│
└──────────────────────────────────┘
```

### Swipe Right → Voice/Video
```
┌──────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓│┌────────────────┐│
│ Voice   Video ││  JD  Johnny   ││
│               ││      1:30     ││
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓│└────────────────┘│
└──────────────────────────────────┘
```

## Implementation

- Modify `ChatListView.tsx` inline `ChatListItem` component
- Add swipe-right gesture with `drag="x"` and `dragElastic`
- Add inline voice/video buttons behind the card (left side)
- Add context-aware archive label via `activeFolder === 'archived'`
- Pass `onCall` / `onVideoCall` props from App.tsx through ChatWorkspace
- Update `ChatListViewProps` to accept call callbacks
