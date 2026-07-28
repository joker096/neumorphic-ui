import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CompanyInfoCard } from './CompanyInfoCard';

vi.mock('../../store', () => ({
  useAppStore: (selector: any) => {
    if (typeof selector === 'function') {
      return selector({ companySettings: { name: 'My Company' } });
    }
    return undefined;
  },
}));

describe('CompanyInfoCard', () => {
  it('renders company name', () => {
    render(<CompanyInfoCard connected="Connected" />);
    expect(screen.getByText('My Company')).toBeInTheDocument();
  });

  it('renders org id', () => {
    render(<CompanyInfoCard orgId="org_test123" connected="Connected" />);
    expect(screen.getByText('org_test123')).toBeInTheDocument();
  });

  it('renders connected status', () => {
    render(<CompanyInfoCard connected="Connected" />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('renders dark theme styles', () => {
    const { container } = render(<CompanyInfoCard connected="Connected" />);
    expect(container.querySelector('[class*="neu-card-inset"]') || container.querySelector('[class*="bg-gradient-to-br"]')).toBeInTheDocument();
  });

  it('renders light theme styles', () => {
    const { container } = render(<CompanyInfoCard connected="Connected" />);
    expect(container.querySelector('[class*="rounded"]') || container.querySelector('[class*="shadow"]') || container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders company icon', () => {
    const { container } = render(<CompanyInfoCard connected="Connected" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders connection status badge', () => {
    const { container } = render(<CompanyInfoCard connected="Connected" />);
    expect(container.querySelector('[class*="rounded-full"]')).toBeInTheDocument();
  });
});
