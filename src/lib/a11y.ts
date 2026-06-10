import { useState, useEffect } from 'react';

// Accessibility - Announce events and manage focus

export type AccessibilityPriority = 'polite' | 'assertive' | 'busy';

export function announce(message: string, priority: AccessibilityPriority = 'polite'): void {
  const region = document.getElementById('sr-region') || document.createElement('div');

  if (!document.getElementById('sr-region')) {
    region.id = 'sr-region';
    region.setAttribute('aria-live', priority === 'assertive' ? 'assertive' : 'polite');
    region.setAttribute('role', 'status');
    region.style.cssText = 'position: absolute; left: -9999px;';
    document.body.appendChild(region);
  }

  region.textContent = '';
  setTimeout(() => {
    region.textContent = message;
  }, 100);
}

export function useFocusTrap(element: HTMLElement | null): () => void {
  if (!element) {
    return () => {};
  }

  const focusableSelectors = 'a[href], button, [tabindex]:not([tabindex="-1"])';
  const focusableElements = element.querySelectorAll(focusableSelectors);

  const firstFocusable = focusableElements[0] as HTMLElement | null;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement | null;

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      if (focusableElements.length === 0) {
        return;
      }

      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown);

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, []);

  return prefersReducedMotion;
}
