// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CrmModal } from './CrmModal';

describe('CrmModal', () => {
  it('renders title, children and footer in a labelled modal dialog', () => {
    render(
      <CrmModal onClose={() => {}} title="Deal details" footer={<button>Confirm</button>}>
        <p>deal body</p>
      </CrmModal>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Deal details' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('deal body')).toBeTruthy();
    expect(screen.getByText('Confirm')).toBeTruthy();
    expect(dialog.className).toContain('max-w-[420px]');
  });

  it('calls onClose when the close button is pressed', () => {
    const onClose = vi.fn();
    render(
      <CrmModal onClose={onClose} title="Close me">
        x
      </CrmModal>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('omits the footer and applies a custom width', () => {
    render(
      <CrmModal onClose={() => {}} title="No footer" maxWidth="max-w-[600px]">
        x
      </CrmModal>,
    );
    const dialog = screen.getByRole('dialog', { name: 'No footer' });
    expect(dialog.className).toContain('max-w-[600px]');
    expect(dialog.className).not.toContain('max-w-[420px]');
  });
});
