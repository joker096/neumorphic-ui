import type { ComponentType } from "react";

export type LandingFeature = {
  icon: ComponentType<{ size: number; className?: string }>;
  title: string;
  desc: string;
};
