import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({ Globe: 'div', Check: 'div', ChevronLeft: 'div', ChevronRight: 'div' }));

import { LanguageSection } from './LanguageSection';

describe('LanguageSection', () => {
  it('renders language options', () => {
    render(<LanguageSection language="en" setLanguage={vi.fn()} setLang={vi.fn()} onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Русский')).toBeInTheDocument();
  });

  it('highlights selected language', () => {
    render(<LanguageSection language="ru" setLanguage={vi.fn()} setLang={vi.fn()} onBack={vi.fn()} t={(k: string) => k} />);
    const checkIcons = document.querySelectorAll('.text-emerald-500');
    expect(checkIcons.length).toBeTruthy();
  });

  it('calls setLanguage and setLang on click', () => {
    const setLanguage = vi.fn();
    const setLang = vi.fn();
    render(<LanguageSection language="en" setLanguage={setLanguage} setLang={setLang} onBack={vi.fn()} t={(k: string) => k} />);
    fireEvent.click(screen.getByText('Русский'));
    expect(setLanguage).toHaveBeenCalledWith('ru');
    expect(setLang).toHaveBeenCalledWith('ru');
  });
});
