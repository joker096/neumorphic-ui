import React from "react";

type SkeletonProps = {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: number | string;
  height?: number | string;
  animation?: "pulse" | "wave";
};

export const Skeleton = ({
  className = "",
  variant = "rectangular",
  width,
  height,
  animation = "wave",
}: SkeletonProps) => {
  const base =
    "bg-[var(--bg-tertiary)]/60 overflow-hidden relative";

  const variants: Record<string, string> = {
    text: "rounded h-3 w-full",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const animations: Record<string, string> = {
    pulse: "animate-pulse",
    wave: "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent after:animate-[shimmer_1.5s_infinite]",
  };

  const style: React.CSSProperties = {
    width: width ?? "100%",
    height: height ?? (variant === "text" ? undefined : 40),
  };

  return (
    <span
      className={`${base} ${variants[variant]} ${animations[animation]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};
