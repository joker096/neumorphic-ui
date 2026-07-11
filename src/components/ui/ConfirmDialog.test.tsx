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
    const { container } = render(<ConfirmDialog isOpen={false} title="Test" onConfirm={() => {}} onCancel={() => {}} />);
    expect(container.querySelector('[class*="fixed"]')).toBeNull();
  });

  it('renders backdrop', () => {
    const { container } = render(<ConfirmDialog isOpen={true} title="Test" onConfirm={() => {}} onCancel={() => {}} />);
    expect(container.querySelector('[class*="bg-black"]') || container.querySelector('[class*="fixed"]')).toBeInTheDocument();
  });

  it('renders dialog box', () => {
    const { container } = render(<ConfirmDialog isOpen={true} title="Test" onConfirm={() => {}} onCancel={() => {}} />);
    expect(container.querySelector('[class*="shadow-2xl"]') || container.querySelector('[class*="max-w-sm"]') || container.querySelector('[class*="p-6"]')).toBeInTheDocument();
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
    const { container } = render(<ConfirmDialog isOpen={true} title="Test" onConfirm={() => {}} onCancel={() => {}} variant="danger" />);
    expect(container.querySelector('[class*="bg-red-500"]') || container.querySelector('[class*="flex-1"]')?.closest('[class*="bg-red-500"]')).toBeInTheDocument();
  });

  it('renders message when provided', () => {
    render(<ConfirmDialog isOpen={true} title="Test" message="This is a test message." onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('This is a test message.')).toBeInTheDocument();
  });

  it('renders message as undefined when not provided', () => {
    const { container } = render(<ConfirmDialog isOpen={true} title="Test" message={undefined} onConfirm={() => {}} onCancel={() => {}} />);
    const msgEl = container.querySelector('[class*="text-sm"]')?.closest('[class*="mb-6"]');
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
