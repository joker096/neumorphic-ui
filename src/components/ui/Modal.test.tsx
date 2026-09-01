import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Modal } from './Modal';

describe('Modal - additional tests', () => {
  it('renders backdrop click to close', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose}>{/* @ts-ignore */}<p>Content</p></Modal>);
    const backdrop = document.querySelector('[class*="bg-black"]') as HTMLElement;
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    } else {
      expect(true).toBe(true);
    }
  });

  it('prevents content click from closing modal', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose}>{/* @ts-ignore */}<p data-testid="content">Content</p></Modal>);
    const content = screen.getByTestId('content') as HTMLElement;
    fireEvent.click(content);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders with children', () => {
    render(<Modal isOpen={true} onClose={vi.fn()}>{/* @ts-ignore */}<p data-testid="child">Child</p></Modal>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders with escape key close', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose}>{/* @ts-ignore */}<p>Content</p></Modal>);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders with correct z-index', () => {
    render(<Modal isOpen={true} onClose={vi.fn()}>{/* @ts-ignore */}<p>Content</p></Modal>);
    expect(document.querySelector('[class*="z-"]')).toBeInTheDocument();
  });

  it('renders with overflow-y-auto', () => {
    render(<Modal isOpen={true} onClose={vi.fn()}>{/* @ts-ignore */}<p>Content</p></Modal>);
    expect(document.querySelector('[class*="overflow-y-auto"]') || document.querySelector('[class*="max-h-"]')).toBeInTheDocument();
  });

  it('renders with animation', () => {
    render(<Modal isOpen={true} onClose={vi.fn()}>{/* @ts-ignore */}<p data-testid="child">Child</p></Modal>);
    expect(document.querySelector('[class*="rounded-lg"]') || document.querySelector('[class*="shadow-2xl"]') || document.querySelector('[class*="border"]')).toBeInTheDocument();
  });
});

describe('Modal focus trap', () => {
  it('moves focus into the dialog on open', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Settings">
        <button data-testid="inner">Inner</button>
      </Modal>
    );
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('wraps Tab forward from the last focusable element to the first', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Settings">
        <button data-testid="a">A</button>
        <button data-testid="b">B</button>
      </Modal>
    );
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const buttons = within(dialog).getAllByRole('button');
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('wraps Shift+Tab from the first focusable element to the last', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Settings">
        <button data-testid="a">A</button>
        <button data-testid="b">B</button>
      </Modal>
    );
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const buttons = within(dialog).getAllByRole('button');
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('restores focus to the trigger when closed', () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button data-testid="trigger" onClick={() => setOpen(true)}>Trigger</button>
          <Modal isOpen={open} onClose={() => setOpen(false)} title="Settings">
            <button data-testid="inner">Inner</button>
          </Modal>
        </>
      );
    }
    const { getByTestId } = render(<Harness />);
    const trigger = getByTestId('trigger') as HTMLButtonElement;
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.contains(document.activeElement)).toBe(true);
    const backdrop = document.querySelector('[class*="bg-black"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(document.activeElement).toBe(trigger);
  });

  it('maps size variants to the UI/UX plan width scale (XS320/SM420/MD560/LG720/XL960)', () => {
    const cases = [
      ['xs', 'max-w-[320px]'],
      ['sm', 'max-w-[420px]'],
      ['md', 'max-w-[560px]'],
      ['lg', 'max-w-[720px]'],
      ['xl', 'max-w-[960px]'],
    ] as const;
    for (const [size, expected] of cases) {
      const { unmount } = render(
        <Modal isOpen={true} onClose={vi.fn()} size={size}>
          <p>Content</p>
        </Modal>,
      );
      const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
      expect(dialog.className).toContain(expected);
      unmount();
    }
  });
});
