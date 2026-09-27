import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MessageContextMenu } from './MessageContextMenu';
import { I18nProvider } from '../../lib/i18n';

describe('MessageContextMenu', () => {
  const baseActions = [
    { key: 'reply', label: 'Reply', onClick: vi.fn() },
    { key: 'copy', label: 'Copy', onClick: vi.fn() },
    { key: 'delete', label: 'Delete', danger: true, onClick: vi.fn() },
  ];

  const renderMenu = (props: any) =>
    render(
      <I18nProvider>
        <MessageContextMenu {...props} />
      </I18nProvider>,
    );

  it('renders nothing when closed', () => {
    const { container } = renderMenu({ open: false, onClose: vi.fn(), actions: baseActions });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders all actions when open', () => {
    renderMenu({ open: true, onClose: vi.fn(), actions: baseActions });
    expect(screen.getByText('Reply')).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders a title when provided', () => {
    renderMenu({ open: true, onClose: vi.fn(), title: 'Hello', actions: baseActions });
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('fires the action and closes when an item is clicked', () => {
    const onClose = vi.fn();
    const onClick = vi.fn();
    renderMenu({
      open: true,
      onClose,
      actions: [{ key: 'reply', label: 'Reply', onClick }],
    });
    fireEvent.click(screen.getByText('Reply'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on cancel', () => {
    const onClose = vi.fn();
    renderMenu({ open: true, onClose, actions: baseActions });
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on backdrop click', () => {
    const onClose = vi.fn();
    const { container } = renderMenu({ open: true, onClose, actions: baseActions });
    const backdrop = document.querySelector('.fixed.inset-0 > div');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('anchors next to the pressed bubble instead of using the bottom sheet', () => {
    const onClose = vi.fn();
    renderMenu({
      open: true,
      onClose,
      actions: baseActions,
      anchorRect: { left: 10, top: 220, right: 200, bottom: 300, width: 190, height: 80 },
    });
    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(menu.style.position).toBe('fixed');
    expect(menu.style.left).toBe('18px');
    expect(menu.style.top).toBe('220px');
    // Sheet-only affordances are gone in anchored mode.
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    expect(document.querySelector('.fixed.inset-0 > div')).toBeNull();
    fireEvent.click(screen.getByText('Copy'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes the anchored menu on outside mousedown', () => {
    const onClose = vi.fn();
    renderMenu({
      open: true,
      onClose,
      actions: baseActions,
      anchorRect: { left: 10, top: 220, right: 200, bottom: 300, width: 190, height: 80 },
    });
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
