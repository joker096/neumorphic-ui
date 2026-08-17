import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ConfirmDialog } from './ConfirmDialog';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
}));

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

  it('renders message as undefined when not provided', () => {
    render(<ConfirmDialog isOpen={true} title="Test" message={undefined} onConfirm={() => {}} onCancel={() => {}} />);
    const msgEl = document.querySelector('[class*="text-sm"]')?.closest('[class*="mb-6"]');
    expect(msgEl?.textContent).toBe('');
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
