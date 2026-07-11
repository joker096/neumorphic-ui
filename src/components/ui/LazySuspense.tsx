/**
 * Suspense wrapper for lazy-loaded views
 * Provides consistent loading states across all lazy components
 */
import { Suspense, type ComponentType, type ReactNode } from "react";

interface SuspenseWrapperProps {
  fallback?: ReactNode;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center h-[200px]">
    <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
  </div>
);

export const SuspenseView = ({ fallback = <DefaultFallback /> }: SuspenseWrapperProps) => (
  <Suspense fallback={fallback}>{null}</Suspense>
);

export const LazyView = ({ component: Component }: { component: ComponentType }) => (
  <Suspense fallback={<DefaultFallback />}>
    <Component />
  </Suspense>
);
