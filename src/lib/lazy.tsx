/**
 * Lazy-loading utility for code-splitting components
 */
import React from "react";

export function lazyWithFallback<T extends React.ComponentType<any>>(
  component: () => Promise<{ default: T }>,
  fallback?: React.ReactNode,
): React.FC<ComponentProps<T>> {
  const LazyComponent = React.lazy(component);
  return function LazyComponentWrapper(props: ComponentProps<T>) {
    return (
      <React.Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  };
}

type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;
