import React, { type ComponentType } from "react";

/** Icon sources accepted by `AppIcon` — any lucide icon or a compatible wrapper. */
export type AppIconSource = ComponentType<
  { size?: number; strokeWidth?: number; fill?: string; className?: string }
>;

export interface AppIconProps
  extends Omit<React.ComponentProps<AppIconSource>, "size" | "strokeWidth" | "fill"> {
  icon: AppIconSource;
  size?: number;
  strokeWidth?: number;
  /** Emphasised glyph (2.5 stroke) for active/selected/pressed states. */
  active?: boolean;
  /** Filled glyph (fill="currentColor") — color controlled via className. */
  filled?: boolean;
}

/** MIT: 2.5 stroke for tiny glyphs (≤14px) is already the house rule; centralise it.
 *  Standalone icons default to 16px on the optical size ramp. */
const BASE_STROKE = 2;
const EMPHASIS_STROKE = 2.5;
const TINY_SIZE = 14;

export function AppIcon({
  icon: Icon,
  size = 16,
  strokeWidth,
  active = false,
  filled = false,
  ...rest
}: AppIconProps) {
  const effectiveStrokeWidth =
    strokeWidth ?? (size <= TINY_SIZE || active ? EMPHASIS_STROKE : BASE_STROKE);
  return (
    <Icon
      size={size}
      strokeWidth={effectiveStrokeWidth}
      fill={filled ? "currentColor" : "none"}
      {...rest}
    />
  );
}