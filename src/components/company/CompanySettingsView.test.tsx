import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({ X: 'div', Phone: 'div', Mail: 'div', MapPin: 'div', Globe: 'div', FileText: 'div' }));

vi.mock('../../store', () => ({
  useAppStore: (selector: any) => selector?.({
    companySettings: { name: 'Acme Inc', phone: '+7 495 123-45-67' },
    updateCompanyField: vi.fn(),
  }),
}));

import { CompanySettingsView } from './CompanySettingsView';

describe('CompanySettingsView', () => {
  it('renders title', () => {
    render(<CompanySettingsView onClose={vi.fn()} />);
    expect(screen.getByText('Company Settings')).toBeInTheDocument();
  });

  it('renders form fields', () => {
    render(<CompanySettingsView onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText('Enter company name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+7 (495) 123-45-67')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<CompanySettingsView onClose={vi.fn()} />);
    const closeBtn = screen.getByRole('button');
    expect(closeBtn).toBeInTheDocument();
  });
});
