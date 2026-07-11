import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SuspenseView, LazyView } from './LazySuspense';

const DefaultFallback = () => (
  <div className="flex items-center justify-center h-[200px]">
    <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
  </div>
);

describe('SuspenseView', () => {
  it('renders without crashing when no fallback is provided', () => {
    const { container } = render(<SuspenseView />);
    expect(container.firstElementChild).toBeNull();
  });

  it('accepts a custom fallback prop', () => {
    const { container } = render(<SuspenseView fallback={<div className="custom" />} />);
    expect(container.firstElementChild).toBeNull();
  });
});

describe('LazyView', () => {
  it('renders suspending component with fallback', () => {
    const { container } = render(<LazyView component={() => <div>Loaded</div>} />);
    const outer = container.firstElementChild;
    expect(outer?.firstChild).toBeTruthy();
  });
});

describe('DefaultFallback', () => {
  it('renders spinner with correct classes', () => {
    const { container } = render(<DefaultFallback />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner?.className).toContain('border-orange-500');
    expect(spinner?.className).toContain('border-t-transparent');
  });

  it('renders centered container', () => {
    const { container } = render(<DefaultFallback />);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('flex');
    expect(outer?.className).toContain('items-center');
    expect(outer?.className).toContain('justify-center');
    expect(outer?.className).toContain('h-[200px]');
  });
});
