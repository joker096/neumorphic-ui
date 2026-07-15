import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const setCompanySettings = vi.fn();

vi.mock('lucide-react', () => ({
  X: 'div',
  Phone: 'div',
  Mail: 'div',
  MapPin: 'div',
  Globe: 'div',
  FileText: 'div',
  Save: 'div',
  Loader2: 'div',
}));

vi.mock('../../store', () => ({
  useAppStore: (selector: any) => selector?.({
    companySettings: null,
    setCompanySettings,
  }),
}));

const mockGetCompanySettings = vi.fn();
const mockSaveCompanySettings = vi.fn();

vi.mock('../../lib/idb', () => ({
  getCompanySettings: (...args: any[]) => mockGetCompanySettings(...args),
  saveCompanySettings: (...args: any[]) => mockSaveCompanySettings(...args),
}));

vi.mock('../../constants/companyMockData', () => ({
  MOCK_COMPANY_SETTINGS: {
    name: 'Acme Inc',
    phone: '+7 495 123-45-67',
    email: 'info@acme.com',
    address: '123 Main St',
    website: 'https://acme.com',
    taxId: '7701234567',
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { CompanySettingsView } from './CompanySettingsView';

describe('CompanySettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCompanySettings.mockResolvedValue(null);
  });

  it('renders title after loading', async () => {
    render(<CompanySettingsView onClose={vi.fn()} />);
    expect(await screen.findByText('Company Settings')).toBeInTheDocument();
  });

  it('renders all 6 form fields with correct placeholders', async () => {
    render(<CompanySettingsView onClose={vi.fn()} />);
    expect(await screen.findByPlaceholderText('Enter company name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+7 (495) 123-45-67')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('info@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('123 Main St, City')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('7701234567')).toBeInTheDocument();
  });

  it('renders all field labels', async () => {
    render(<CompanySettingsView onClose={vi.fn()} />);
    expect(await screen.findByText('Company Name')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Website')).toBeInTheDocument();
    expect(screen.getByText('Tax ID (INN)')).toBeInTheDocument();
  });

  it('pre-fills inputs from mock data when no stored data', async () => {
    render(<CompanySettingsView onClose={vi.fn()} />);
    const nameInput = await screen.findByPlaceholderText('Enter company name') as HTMLInputElement;
    expect(nameInput.value).toBe('Acme Inc');
    const phoneInput = screen.getByPlaceholderText('+7 (495) 123-45-67') as HTMLInputElement;
    expect(phoneInput.value).toBe('+7 495 123-45-67');
  });

  it('pre-fills inputs from stored data when available', async () => {
    mockGetCompanySettings.mockResolvedValue({
      name: 'Stored Corp',
      phone: '+7 999 888-77-66',
      email: 'stored@test.com',
      address: 'Test Ave',
      website: 'https://stored.com',
      taxId: '1112223334',
    });
    render(<CompanySettingsView onClose={vi.fn()} />);
    const nameInput = await screen.findByPlaceholderText('Enter company name') as HTMLInputElement;
    expect(nameInput.value).toBe('Stored Corp');
    const phoneInput = screen.getByPlaceholderText('+7 (495) 123-45-67') as HTMLInputElement;
    expect(phoneInput.value).toBe('+7 999 888-77-66');
  });

  it('renders close button and calls onClose when clicked', async () => {
    const onClose = vi.fn();
    render(<CompanySettingsView onClose={onClose} />);
    const buttons = await screen.findAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('updates local state on input change (no store call on change)', async () => {
    render(<CompanySettingsView onClose={vi.fn()} />);
    const input = await screen.findByPlaceholderText('Enter company name');
    fireEvent.change(input, { target: { value: 'New Corp' } });
    expect((input as HTMLInputElement).value).toBe('New Corp');
    expect(setCompanySettings).not.toHaveBeenCalled();
  });

  it('saves settings on save button click', async () => {
    render(<CompanySettingsView onClose={vi.fn()} />);
    const nameInput = await screen.findByPlaceholderText('Enter company name');
    fireEvent.change(nameInput, { target: { value: 'Updated Corp' } });

    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveCompanySettings).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Corp' }));
      expect(setCompanySettings).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Corp' }));
    });
  });

  it('uses correct input types', async () => {
    render(<CompanySettingsView onClose={vi.fn()} />);
    expect(await screen.findByPlaceholderText('+7 (495) 123-45-67')).toHaveAttribute('type', 'tel');
    expect(screen.getByPlaceholderText('info@company.com')).toHaveAttribute('type', 'email');
    expect(screen.getByPlaceholderText('https://company.com')).toHaveAttribute('type', 'url');
  });
});
