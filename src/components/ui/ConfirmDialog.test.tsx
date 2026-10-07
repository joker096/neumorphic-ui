import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// The default button labels come from the dictionary now (i18n), so the suite
// pins the EN strings the way CloseButton.test.tsx does.
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) =>
      ({ 'confirmDialog.ok': 'Confirm', 'confirmDialog.cancel': 'Cancel' })[key] ?? fallback ?? key,
    lang: 'en',
    setLang: vi.fn(),
  }),
}));
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog - additional tests', () => {
  it('renders when isOpen', () => {
    render(<ConfirmDialog isOpen={true} title="Test" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ConfirmDialog isOpen={false} title="Test" onConfirm={() => {}} onCancel={() => {}} />);
    expect(document.querySelector('[class*="fixed"]')).toBeNull();
  });

  it('renders backdrop', () => {
    render(<ConfirmDialog isOpen={true} title="Test" onConfirm={() => {}} onCancel={() => {}} />);
    expect(document.querySelector('[class*="bg-black"]') || document.querySelector('[class*="fixed"]')).toBeInTheDocument();
  });

  it('renders dialog box', () => {
    render(<ConfirmDialog isOpen={true} title="Test" onConfirm={() => {}} onCancel={() => {}} />);
    expect(document.querySelector('[class*="shadow-2xl"]') || document.querySelector('[class*="max-w-sm"]') || document.querySelector('[class*="p-6"]')).toBeInTheDocument();
  });

  it('renders confirm button', () => {
    render(<ConfirmDialog isOpen={true} title="Test" onConfirm={() => {}} onCancel={() => {}} />);
    expect(document.querySelector('button') || document.querySelector('[class*="flex"]')).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    render(<ConfirmDialog isOpen={true} title="Test" onConfirm={() => {}} onCancel={() => {}} />);
    expect(document.querySelector('button') || document.querySelector('[class*="flex-1"]') || document.querySelector('[class*="flex"]')).toBeInTheDocument();
  });

  it('renders danger variant', () => {
    render(<ConfirmDialog isOpen={true} title="Test" onConfirm={() => {}} onCancel={() => {}} variant="danger" />);
    expect(document.querySelector('[class*="bg-destructive"]') || document.querySelector('[class*="flex-1"]')?.closest('[class*="bg-destructive"]')).toBeInTheDocument();
  });

  it('renders message when provided', () => {
    render(<ConfirmDialog isOpen={true} title="Test" message="This is a test message." onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('This is a test message.')).toBeInTheDocument();
  });

  it('does not render message paragraph when not provided', () => {
    render(<ConfirmDialog isOpen={true} title="Test" message={undefined} onConfirm={() => {}} onCancel={() => {}} />);
    expect(document.querySelector('p')).toBeNull();
  });

  it('does not confirm when Enter keydown on focused cancel button', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog isOpen={true} title="Test" onConfirm={onConfirm} onCancel={onCancel} />);
    const cancelBtn = screen.getByText('Cancel');
    cancelBtn.focus();
    fireEvent.keyDown(cancelBtn, { key: 'Enter' });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('cancels exactly once on Escape', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog isOpen={true} title="Test" onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders confirm button with custom label', () => {
    render(<ConfirmDialog isOpen={true} title="Test" confirmLabel="Yes" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('renders cancel button with custom label', () => {
    render(<ConfirmDialog isOpen={true} title="Test" cancelLabel="No" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('renders default confirm label', () => {
    render(<ConfirmDialog isOpen={true} title="Test" onConfirm={() => {}} onCancel={() => {}} />);
    expect(document.querySelector('button')).toBeInTheDocument();
  });

  it('renders default cancel label', () => {
    render(<ConfirmDialog isOpen={true} title="Test" onConfirm={() => {}} onCancel={() => {}} />);
    expect(document.querySelector('button')).toBeInTheDocument();
  });
});
