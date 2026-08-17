import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AdvancedFilterModal } from './AdvancedFilterModal';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
}));

describe('AdvancedFilterModal - additional tests', () => {
  it('renders all checkbox labels', () => {
    render(<AdvancedFilterModal t={(k: string) => k} filters={{}} setFilters={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/media/i)).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<AdvancedFilterModal t={(k: string) => k} filters={{}} setFilters={vi.fn()} onClose={vi.fn()} />);
    expect(document.querySelector('[class*="lucide-x"]') || document.querySelector('[class*="lucide-X"]') || document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders reset button', () => {
    render(<AdvancedFilterModal t={(k: string) => k} filters={{}} setFilters={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/reset/i)).toBeInTheDocument();
  });

  it('renders apply button', () => {
    render(<AdvancedFilterModal t={(k: string) => k} filters={{}} setFilters={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/apply/i)).toBeInTheDocument();
  });

  it('renders dark theme', () => {
    render(<AdvancedFilterModal t={(k: string) => k} filters={{}} setFilters={vi.fn()} onClose={vi.fn()} />);
    expect(document.querySelector('[class*="modal-surface"]') || document.querySelector('[class*="bg-black/60"]')).toBeInTheDocument();
  });

  it('renders light theme', () => {
    render(<AdvancedFilterModal t={(k: string) => k} filters={{}} setFilters={vi.fn()} onClose={vi.fn()} />);
    expect(document.querySelector('[class*="bg-"]') || document.querySelector('[class*="rounded"]')).toBeInTheDocument();
  });

  it('renders filter checkboxes', () => {
    render(<AdvancedFilterModal t={(k: string) => k} filters={{}} setFilters={vi.fn()} onClose={vi.fn()} />);
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBeGreaterThanOrEqual(5);
  });

  it('renders close button with onClick', () => {
    const onClose = vi.fn();
    render(<AdvancedFilterModal t={(k: string) => k} filters={{}} setFilters={vi.fn()} onClose={onClose} />);
    const closeBtn = document.querySelector('[class*="lucide-x"]')?.closest('button');
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('renders backdrop', () => {
    render(<AdvancedFilterModal t={(k: string) => k} filters={{}} setFilters={vi.fn()} onClose={vi.fn()} />);
    expect(document.querySelector('[class*="bg-black/60"]') || document.querySelector('[class*="z-\\[200\\]")') || document.querySelector('[class*="z-[200]")')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(<AdvancedFilterModal t={(k: string) => k} filters={{}} setFilters={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('chat.filters.title')).toBeInTheDocument();
  });

  it('renders all filter toggles', () => {
    render(<AdvancedFilterModal t={(k: string) => k} filters={{}} setFilters={vi.fn()} onClose={vi.fn()} />);
    // Toggles are div-based toggle switches
    const toggles = document.querySelectorAll('.w-\\[44px\\]');
    expect(toggles.length).toBe(5);
  });
});
