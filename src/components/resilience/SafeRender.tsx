import type { ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

type SafeRenderProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export const SafeRender = ({ children, fallback }: SafeRenderProps) => (
  <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>
);
