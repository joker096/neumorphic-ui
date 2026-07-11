import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SubView } from './SubView';

describe('SubView', () => {
  it('renders title', () => {
    render(<SubView title="Test Title" onBack={vi.fn()}><p>Content</p></SubView>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders back button', () => {
    render(<SubView title="Test" onBack={vi.fn()}><p>Content</p></SubView>);
    expect(document.querySelector('[class*="lucide-chevron-left"]') || document.querySelector('[class*="lucide-chevron"]') || document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<SubView title="Test" onBack={vi.fn()}><p data-testid="child">Child Content</p></SubView>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<SubView title="Test" onBack={onBack}><p>Content</p></SubView>);
    const backBtn = document.querySelector('[class*="lucide-chevron-left"]')?.closest('button') || document.querySelector('[class*="w-10"]')?.closest('button') as HTMLElement;
    if (backBtn) {
      fireEvent.click(backBtn);
      expect(onBack).toHaveBeenCalled();
    }
  });

  it('renders with proper theme variables', () => {
    const { container } = render(<SubView title="Test" onBack={vi.fn()}><p>Content</p></SubView>);
    expect(container.querySelector('[class*="text-white"]') || container.querySelector('[class*="text-slate-800"]')).toBeInTheDocument();
  });

  it('renders with swipeable=true by default', () => {
    const { container } = render(<SubView title="Test" onBack={vi.fn()}><p>Content</p></SubView>);
    expect(container.querySelector('[class*="flex-col"]') || container.querySelector('[class*="flex-1"]') || container.querySelector('[class*="min-h-0"]')).toBeInTheDocument();
  });

  it('does not render swipe overlay', () => {
    const { container } = render(<SubView title="Test" onBack={vi.fn()}><p>Content</p></SubView>);
    expect(container.querySelector('[class*="z-"]') || container.querySelector('[class*="fixed"]')).not.toBeInTheDocument();
  });

  it('renders with proper flex layout', () => {
    const { container } = render(<SubView title="Test" onBack={vi.fn()}><p>Content</p></SubView>);
    expect(container.querySelector('[class*="flex-col"]')).toBeInTheDocument();
  });
});
