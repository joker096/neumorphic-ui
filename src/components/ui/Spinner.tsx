import { type ComponentType } from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export const Spinner: ComponentType<SpinnerProps> = ({ size = "md", color, className = "" }) => (
  <div
    className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${color ? `border-${color} border-t-transparent` : "border-orange-500"} ${className}`}
    role="status"
    aria-label="loading"
  />
);
