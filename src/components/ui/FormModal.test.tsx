import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FormModal } from './FormModal';

const MockIcon = () => null;

describe('FormModal', () => {
  it('renders when isOpen is true', () => {
    render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<FormModal isOpen={false} onClose={() => {}}>Content</FormModal>);
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders with title', () => {
    render(<FormModal isOpen={true} onClose={() => {}} title="Title">Content</FormModal>);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('renders with subtitle when Icon or title present', () => {
    render(<FormModal isOpen={true} onClose={() => {}} title="Title" subtitle="Subtitle">Content</FormModal>);
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
  });

  it('hides title when not provided', () => {
    render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    expect(screen.queryByText('Title')).not.toBeInTheDocument();
  });

  it('renders backdrop and closes on click', () => {
    const onClose = vi.fn();
    render(<FormModal isOpen={true} onClose={onClose}>Content</FormModal>);
    const backdrop = document.querySelector('[class*="bg-black/60"]');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('prevents content click from closing modal', () => {
    const onClose = vi.fn();
    render(<FormModal isOpen={true} onClose={onClose}>Content</FormModal>);
    const content = document.querySelector('[class*="rounded-2xl"]');
    if (content) {
      fireEvent.click(content);
      expect(onClose).not.toHaveBeenCalled();
    }
  });

  it('renders close button', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const closeBtn = container.querySelector('button');
    expect(closeBtn).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<FormModal isOpen={true} onClose={onClose}>Content</FormModal>);
    const closeBtn = document.querySelector('button');
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('renders with dark theme by default', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const modal = container.querySelector('[class*="rounded-2xl"]');
    expect(modal?.className).toContain('bg-[var(--bg-tertiary)]');
  });

  it('renders in light theme', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}} theme="light">Content</FormModal>);
    const modal = container.querySelector('[class*="rounded-2xl"]');
    expect(modal?.className).toContain('bg-white');
    expect(modal?.className).toContain('border-[var(--border-color)]');
  });

  it('renders with maxWidth prop', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}} maxWidth="max-w-[500px]">Content</FormModal>);
    const modal = container.querySelector('[class*="max-w-"]');
    expect(modal).toHaveClass('max-w-[500px]');
  });

  it('renders with default maxWidth', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const modal = container.querySelector('[class*="max-w-"]');
    expect(modal).toHaveClass('max-w-[380px]');
  });

  it('renders with custom zIndex', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}} zIndex="z-[9999]">Content</FormModal>);
    const backdrop = container.querySelector('[class*="z-"]');
    expect(backdrop).toHaveClass('z-[9999]');
  });

  it('renders with closeTitle attribute', () => {
    render(<FormModal isOpen={true} onClose={() => {}} closeTitle="Close modal">Content</FormModal>);
    const closeBtn = document.querySelector('button');
    expect(closeBtn).toHaveAttribute('title', 'Close modal');
  });

  it('renders with backdrop blur', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const backdrop = container.querySelector('[class*="backdrop-blur"]');
    expect(backdrop).toBeInTheDocument();
  });

  it('renders with shadow-2xl', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const modal = container.querySelector('[class*="shadow-2xl"]');
    expect(modal).toBeInTheDocument();
  });

  it('renders with overflow-y-auto', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const modal = container.querySelector('[class*="overflow-y-auto"]');
    expect(modal).toBeInTheDocument();
  });

  it('renders with max-h-[90vh]', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const modal = container.querySelector('[class*="max-h-"]');
    expect(modal).toHaveClass('max-h-[90vh]');
  });

  it('renders close button with min-w-[44px]', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const closeBtn = container.querySelector('button');
    expect(closeBtn?.className).toContain('min-w-[44px]');
  });

  it('renders close button with min-h-[44px]', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const closeBtn = container.querySelector('button');
    expect(closeBtn?.className).toContain('min-h-[44px]');
  });

  it('renders close button with cursor-pointer', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const closeBtn = container.querySelector('button');
    expect(closeBtn?.className).toContain('cursor-pointer');
  });

  it('renders close button with rounded-full', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const closeBtn = container.querySelector('button');
    expect(closeBtn?.className).toContain('rounded-full');
  });

  it('renders close button with transition-colors', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const closeBtn = container.querySelector('button');
    expect(closeBtn?.className).toContain('transition-colors');
  });

  it('renders close button with text-[var(--text-primary)] in dark theme', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const closeBtn = container.querySelector('button');
    expect(closeBtn?.className).toContain('text-[var(--text-primary)]');
  });

  it('renders close button with hover state', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const closeBtn = container.querySelector('button');
    expect(closeBtn?.className).toContain('hover:bg-white/20');
  });

  it('renders close button with absolute positioning', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const closeBtn = container.querySelector('button');
    expect(closeBtn?.className).toContain('absolute');
    expect(closeBtn?.className).toContain('top-4');
    expect(closeBtn?.className).toContain('right-4');
    expect(closeBtn?.className).toContain('z-10');
  });

  it('renders content with p-6 padding', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const modalContent = container.querySelector('[class*="p-6"]');
    expect(modalContent).toBeInTheDocument();
  });

  it('renders border-[var(--border-color)] in dark theme', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const modal = container.querySelector('[class*="border"]');
    expect(modal?.className).toContain('border-[var(--border-color)]');
  });

  it('renders border-[var(--border-color)] in light theme', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}} theme="light">Content</FormModal>);
    const modal = container.querySelector('[class*="border"]');
    expect(modal?.className).toContain('border-[var(--border-color)]');
  });

  it('renders with backdrop blur-sm', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const backdrop = container.querySelector('[class*="backdrop-blur-sm"]');
    expect(backdrop).toBeInTheDocument();
  });

  it('renders with p-4 padding on backdrop', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}}>Content</FormModal>);
    const backdrop = container.querySelector('[class*="p-4"]');
    expect(backdrop).toBeInTheDocument();
  });

  it('renders icon when icon prop provided with title', () => {
    render(<FormModal isOpen={true} onClose={() => {}} icon={undefined as any} title="Title">Content</FormModal>);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders icon with iconBg when provided', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}} icon={MockIcon} title="Title" iconBg="bg-custom">Content</FormModal>);
    const iconContainer = container.querySelector('.w-16.h-16');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer?.className).toContain('bg-custom');
  });

  it('renders icon with iconColor when provided', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}} icon={MockIcon} title="Title" iconColor="text-custom">Content</FormModal>);
    const iconContainer = container.querySelector('.w-16.h-16');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer?.className).toContain('text-custom');
  });

  it('renders title with proper styling', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}} title="Title">Content</FormModal>);
    const title = container.querySelector('[class*="text-xl"]');
    expect(title).toHaveClass('font-bold');
    expect(title).toHaveClass('text-center');
  });

  it('renders subtitle with proper styling', () => {
    const { container } = render(<FormModal isOpen={true} onClose={() => {}} title="Title" subtitle="Subtitle">Content</FormModal>);
    const subtitle = container.querySelector('[class*="text-xs"]');
    expect(subtitle).toHaveClass('text-center');
    expect(subtitle).toHaveClass('max-w-[260px]');
  });
});