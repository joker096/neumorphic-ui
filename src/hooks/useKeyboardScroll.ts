import { useEffect, useRef } from 'react';

const KEYBOARD_INPUT_SELECTORS = 'input, textarea, select, [contenteditable]';

/**
 * Scroll a container to keep the focused input above the virtual keyboard.
 *
 * Uses `visualViewport.height` (falling back to `window.innerHeight`) — on
 * Android the virtual keyboard resizes the *visual* viewport while
 * `innerHeight` usually stays put, so measuring `innerHeight` leaves the
 * composer hidden behind the keyboard. Also re-runs the scroll while the
 * field stays focused and the visual viewport resizes (keyboard opening/closing).
 */
export function useKeyboardScroll(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let savedScrollTop: number | null = null;

    const visibleHeight = () => window.visualViewport?.height ?? window.innerHeight;

    const scrollIntoViewOf = (target: HTMLElement) => {
      requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        const keyboardThreshold = visibleHeight() * 0.6;

        if (rect.bottom > keyboardThreshold) {
          const scrollAmount = rect.bottom - keyboardThreshold + 20;
          container.scrollBy({
            top: scrollAmount,
            behavior: 'smooth',
          });
        }
      });
    };

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target || !target.matches(KEYBOARD_INPUT_SELECTORS)) return;

      savedScrollTop = container.scrollTop;
      scrollIntoViewOf(target);
    };

    const handleBlur = () => {
      setTimeout(() => {
        if (savedScrollTop !== null) {
          container.scrollTo({
            top: savedScrollTop,
            behavior: 'smooth',
          });
          savedScrollTop = null;
        }
      }, 300);
    };

    const elements = container.querySelectorAll(KEYBOARD_INPUT_SELECTORS);
    elements.forEach((el: Element) => {
      el.addEventListener('focus', handleFocus);
      el.addEventListener('blur', handleBlur);
    });

    const observer = new MutationObserver(() => {
      const newElements = container.querySelectorAll(KEYBOARD_INPUT_SELECTORS);
      newElements.forEach((el: Element) => {
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('blur', handleBlur);
        el.addEventListener('focus', handleFocus);
        el.addEventListener('blur', handleBlur);
      });
    });

    observer.observe(container, { childList: true, subtree: true });

    // While the visual viewport resizes (keyboard opening/closing) and an input
    // is still focused, keep it above the keyboard.
    const vv = window.visualViewport;
    const onVvResize = () => {
      if (document.activeElement && document.activeElement.matches(KEYBOARD_INPUT_SELECTORS)) {
        scrollIntoViewOf(document.activeElement as HTMLElement);
      }
    };
    vv?.addEventListener('resize', onVvResize);

    return () => {
      observer.disconnect();
      vv?.removeEventListener('resize', onVvResize);
      const allElements = container.querySelectorAll(KEYBOARD_INPUT_SELECTORS);
      allElements.forEach((el: Element) => {
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('blur', handleBlur);
      });
    };
  }, []);
}
