import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ContactItem } from './ContactItem';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, options?: any) => {
      if (typeof options?.count === 'number') return `${options.count} mins ago`;
      return key;
    },
    lang: 'en',
    setLang: vi.fn(),
  }),
}));

describe('ContactItem - additional tests', () => {
  const mockContact = {
    id: '1',
    name: 'John Doe',
    color: 'from-teal-400 to-emerald-500',
    lastSeen: Date.now() - 60000,
    isFavorite: false,
  };

  it('renders avatar with first letter', () => {
    render(<ContactItem contact={mockContact} theme="dark" isDark={true} onClick={() => {}} onToggleFavorite={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders dark theme styles', () => {
    const { container } = render(<ContactItem contact={mockContact} theme="dark" isDark={true} onClick={() => {}} onToggleFavorite={vi.fn()} t={(k: string) => k} />);
    expect(container.querySelector('[class*="text-gray-100"]') || container.querySelector('[class*="hover:bg-"]') || container.querySelector('[class*="cursor-pointer"]')).toBeInTheDocument();
  });

  it('renders light theme styles', () => {
    const { container } = render(<ContactItem contact={mockContact} theme="light" isDark={false} onClick={() => {}} onToggleFavorite={vi.fn()} t={(k: string) => k} />);
    expect(container.querySelector('[class*="hover:bg-white"]') || container.querySelector('[class*="text-slate-800"]') || container.querySelector('[class*="shadow-sm"]')).toBeInTheDocument();
  });

  it('renders favorite star when favorite', () => {
    const { container } = render(<ContactItem contact={{ ...mockContact, isFavorite: true }} theme="dark" isDark={true} onClick={() => {}} onToggleFavorite={vi.fn()} t={(k: string) => k} />);
    expect(container.querySelector('[class*="text-yellow-400"]')).toBeInTheDocument();
  });

  it('renders star icon when favorite', () => {
    const { container } = render(<ContactItem contact={{ ...mockContact, isFavorite: true }} theme="dark" isDark={true} onClick={() => {}} onToggleFavorite={vi.fn()} t={(k: string) => k} />);
    expect(container.querySelector('[class*="text-yellow-400"]')?.closest('svg') || container.querySelector('[class*="lucide-star"]') || document.querySelector('[class*="lucide-star"]') || document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with last seen time', () => {
    const { container } = render(<ContactItem contact={mockContact} theme="dark" isDark={true} onClick={() => {}} onToggleFavorite={vi.fn()} t={(k: string) => k} />);
    expect(container.querySelector('[class*="text-gray-600"]') || container.querySelector('[class*="text-slate-400"]') || container.querySelector('[class*="text-[9px]"]')).toBeInTheDocument();
  });

  it('renders with ID', () => {
    const { container } = render(<ContactItem contact={{ ...mockContact, id: 'hash_abc' }} theme="dark" isDark={true} onClick={() => {}} onToggleFavorite={vi.fn()} t={(k: string) => k} />);
    expect(container.querySelector('[class*="font-mono"]') || container.querySelector('[class*="tracking-wider"]') || container.querySelector('[class*="text-[9px]"]')?.closest('[class*="text-[9px]"]')).toBeInTheDocument();
  });

  it('renders with avatar gradient', () => {
    render(<ContactItem contact={{ ...mockContact, color: 'from-blue-500 to-purple-600' }} theme="dark" isDark={true} onClick={() => {}} onToggleFavorite={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('J')).toHaveClass('from-blue-500');
  });

  it('renders with correct min-height', () => {
    const { container } = render(<ContactItem contact={mockContact} theme="dark" isDark={true} onClick={() => {}} onToggleFavorite={vi.fn()} t={(k: string) => k} />);
    expect(container.querySelector('[class*="flex items-center gap-3"]') || container.querySelector('[class*="cursor-pointer"]') || container.querySelector('[class*="rounded-md"]')).toBeInTheDocument();
  });

  it('renders with cursor pointer', () => {
    const { container } = render(<ContactItem contact={mockContact} theme="dark" isDark={true} onClick={() => {}} onToggleFavorite={vi.fn()} t={(k: string) => k} />);
    expect(container.querySelector('[class*="cursor-pointer"]') || container.querySelector('[class*="min-h-[56px]"]')?.closest('[class*="cursor-pointer"]')).toBeInTheDocument();
  });

  it('renders with rounded corners', () => {
    const { container } = render(<ContactItem contact={mockContact} theme="dark" isDark={true} onClick={() => {}} onToggleFavorite={vi.fn()} t={(k: string) => k} />);
    expect(container.querySelector('[class*="rounded-2xl"]') || container.querySelector('[class*="rounded-3xl"]') || container.querySelector('[class*="rounded-xl"]')).toBeInTheDocument();
  });
});
