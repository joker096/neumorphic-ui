import { useEffect, useRef } from 'react';

const KEYBOARD_INPUT_SELECTORS = 'input, textarea, select, [contenteditable]';

export function useKeyboardScroll(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target || !target.matches(KEYBOARD_INPUT_SELECTORS)) return;

      requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const keyboardThreshold = viewportHeight * 0.6;

        if (rect.bottom > keyboardThreshold) {
          const scrollAmount = rect.bottom - keyboardThreshold + 20;
          container.scrollBy({
            top: scrollAmount,
            behavior: 'smooth',
          });
        }
      });
    };

    const handleBlur = () => {
      setTimeout(() => {
        container.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }, 300);
    };

    const elements = container.querySelectorAll('input, textarea, select, [contenteditable]');
    elements.forEach((el: Element) => {
      el.addEventListener('focus', handleFocus);
      el.addEventListener('blur', handleBlur);
    });

    const observer = new MutationObserver(() => {
      const newElements = container.querySelectorAll('input, textarea, select, [contenteditable]');
      newElements.forEach((el: Element) => {
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('blur', handleBlur);
        el.addEventListener('focus', handleFocus);
        el.removeEventListener('blur', handleBlur);
      });
    });

    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      const allElements = container.querySelectorAll('input, textarea, select, [contenteditable]');
      allElements.forEach((el: Element) => {
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('blur', handleBlur);
      });
    };
  }, []);
}
