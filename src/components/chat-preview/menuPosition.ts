export const MENU_WIDTH = 188;
export const VIEWPORT_MARGIN = 8;
export const MOUSE_ROW_HEIGHT = 36;
export const TOUCH_ROW_HEIGHT = 44;

/** Viewport rect of the long-pressed element, used to place a menu next to it. */
export interface MenuAnchorRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/** Snapshots a DOM rect into a plain anchor descriptor. */
export function toMenuAnchorRect(rect: DOMRect | null | undefined): MenuAnchorRect | null {
  if (!rect) return null;
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
}

/**
 * Places a popup so it always stays fully on screen. Rect anchors (long press)
 * align to the element's top edge and flip above it when they would overflow the
 * bottom; point anchors (right click) keep the cursor position and clamp.
 */
export function resolveMenuPosition(
  anchor: { x: number; y: number } | null,
  anchorRect: MenuAnchorRect | null,
  height: number,
): { x: number; y: number } {
  const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN);
  const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN);

  if (anchorRect) {
    const x = Math.min(Math.max(anchorRect.left + VIEWPORT_MARGIN, VIEWPORT_MARGIN), maxX);
    const fitsBelow = anchorRect.top + height <= maxY;
    const y = fitsBelow
      ? Math.max(anchorRect.top, VIEWPORT_MARGIN)
      : Math.max(Math.min(anchorRect.bottom - height, maxY), VIEWPORT_MARGIN);
    return { x, y };
  }

  if (!anchor) return { x: VIEWPORT_MARGIN, y: VIEWPORT_MARGIN };
  return { x: Math.min(anchor.x, maxX), y: Math.min(anchor.y, maxY) };
}
