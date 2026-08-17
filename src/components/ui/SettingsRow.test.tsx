import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SettingsRow, SettingsGroup } from './SettingsRow';

describe('SettingsRow - additional tests', () => {
  it('renders with icon', () => {
    const { container } = render(<SettingsRow title="Test" icon={<span data-testid="icon">Icon</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders with icon background', () => {
    const { container } = render(<SettingsRow title="Test" icon={<span data-testid="icon">Icon</span>} iconBg="bg-blue-500" iconColor="text-white" />);
    expect(container.querySelector('[class*="bg-blue-500"]')).toBeInTheDocument();
  });

  it('renders without icon when not provided', () => {
    const { container } = render(<SettingsRow title="Test" />);
    expect(container.querySelector('[class*="w-8.h-8"]') || container.querySelector('[class*="rounded-lg"]') || container.querySelector('[class*="w-8"]')).not.toBeInTheDocument();
  });

  it('renders chevron when no rightElement', () => {
    const { container } = render(<SettingsRow title="Test" />);
    expect(container.querySelector('[class*="lucide-chevron-right"]') || container.querySelector('[class*="text-gray-400"]') || container.querySelector('[class*="opacity-30"]')).toBeInTheDocument();
  });

  it('renders rightElement when provided', () => {
    const { container } = render(<SettingsRow title="Test" rightElement={<span data-testid="right">Right</span>} />);
    expect(screen.getByTestId('right')).toBeInTheDocument();
  });

  it('renders keyboard support', () => {
    const onClick = vi.fn();
    render(<SettingsRow title="Test" onClick={onClick} />);
    const row = screen.getByText('Test').closest('[role="button"]') as HTMLElement;
    fireEvent.keyDown(row, { key: ' ' });
    expect(onClick).toHaveBeenCalled();
  });

  it('renders with custom className', () => {
    const { container } = render(<SettingsRow title="Test" className="custom-class" />);
    expect(container.querySelector('[class*="custom-class"]')).toBeInTheDocument();
  });

  it('renders with neutral styling', () => {
    const { container } = render(<SettingsRow title="Test" />);
    expect(container.querySelector('[class*="text-white"]') || container.querySelector('[class*="text-foreground"]')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(<SettingsRow title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<SettingsRow title="Test" subtitle="Subtitle" />);
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
  });

  it('renders value', () => {
    render(<SettingsRow title="Test" value="Value" />);
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('renders with onClick', () => {
    const onClick = vi.fn();
    render(<SettingsRow title="Test" onClick={onClick} />);
    const row = screen.getByText('Test').closest('[role="button"]') as HTMLElement;
    fireEvent.click(row);
    expect(onClick).toHaveBeenCalled();
  });

  it('renders with Enter key', () => {
    const onClick = vi.fn();
    render(<SettingsRow title="Test" onClick={onClick} />);
    const row = screen.getByText('Test').closest('[role="button"]') as HTMLElement;
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
  });
});

describe('SettingsGroup', () => {
  it('renders with custom className', () => {
    const { container } = render(<SettingsGroup className="custom-class"><p>Child</p></SettingsGroup>);
    expect(container.querySelector('[class*="custom-class"]')).toBeInTheDocument();
  });
});
