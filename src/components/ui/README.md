# UI Components

Atomic UI components — each file exports a single, focused component following the Single Responsibility Principle.

## Components

| Component | Description |
|---|---|
| `Spinner.tsx` | Reusable loading spinner (replaces inline spinner implementations) |
| `Button.tsx` | Atomic button with variants and touch-target compliance |
| `Input.tsx` | Text/email/tel/number inputs with validation |
| `Typography.tsx` | Heading and text components |
| `Card.tsx` | Content container with neumorphic styling |
| `Modal.tsx` | Modal dialog with focus trap and escape handling |
| `Select.tsx` | Dropdown selector with keyboard navigation |
| `Avatar.tsx` | User avatar with status indicators |
| `AvatarRow.tsx` | Story/avatar row with theme-aware styling |
| `FormModal.tsx` | Form modal with cancel/submit actions |
| `FormField.tsx` | Form field with label, input, and error state |
| `FormActions.tsx` | Submit/cancel button row with loading state |
| `SettingsToggle.tsx` | Settings toggle switch with theme support |
| `ToggleSwitch.tsx` | Simple on/off toggle with CSS variable colors |
| `SettingsRow.tsx` | Settings list row with icon and action |
| `ListItem.tsx` | List item with optional leading/trailing content |
| `SearchInput.tsx` | Search input with clear button |
| `CloseButton.tsx` | Circular close button (44x44px touch target) |
| `BackButton.tsx` | Back navigation button |
| `PageHeader.tsx` | Page header with back button and title |
| `SubView.tsx` | Sub-view container with back navigation |
| `EmptyState.tsx` | Empty state illustration with message |
| `KeyButton.tsx` | Phone keypad button with press animation |
| `BatteryStatus.tsx` | Battery level indicator with theme support |
| `LazySuspense.tsx` | Suspense wrapper with consistent loading fallback |
| `GifSearch.tsx` | GIF search with offline handling |
| `UndoDeleteSnackbar.tsx` | Undo snackbar with timed dismiss |

## Design Principles

- All colors use CSS custom properties from `../styles/tokens.css`
- Touch targets are minimum 44x44px
- Components adapt to dark/light themes via `data-theme` attribute
- All interactive elements use semantic HTML (`<button>`, `<input>`)
