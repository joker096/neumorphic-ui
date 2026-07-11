import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Reveal } from './Reveal';

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('Reveal', () => {
  it('renders children', () => {
    render(<Reveal><span>Hidden content</span></Reveal>);
    expect(screen.getByText('Hidden content')).toBeInTheDocument();
  });

  it('initially renders with opacity 0', () => {
    const { container } = render(<Reveal>Content</Reveal>);
    const el = container.firstElementChild;
    expect(el?.getAttribute('style')).toContain('opacity: 0');
  });

  it('initially renders with blur filter', () => {
    const { container } = render(<Reveal>Content</Reveal>);
    const el = container.firstElementChild;
    expect(el?.getAttribute('style')).toContain('blur(4px)');
  });

  it('initially renders with translateY offset for up direction', () => {
    const { container } = render(<Reveal>Content</Reveal>);
    const el = container.firstElementChild;
    expect(el?.getAttribute('style')).toContain('translateY(4rem)');
  });

  it('uses none transform when direction is none', () => {
    const { container } = render(<Reveal direction="none">Content</Reveal>);
    const el = container.firstElementChild;
    expect(el?.getAttribute('style')).toContain('transform: none');
  });

  it('applies className prop', () => {
    const { container } = render(
      <Reveal className="extra-class">Content</Reveal>
    );
    const el = container.firstElementChild;
    expect(el?.className).toContain('extra-class');
  });

  it('sets up IntersectionObserver on mount', () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal('IntersectionObserver', class {
      observe = observe;
      unobserve = vi.fn();
      disconnect = disconnect;
    });

    render(<Reveal>Content</Reveal>);
    expect(observe).toHaveBeenCalled();
  });
});
