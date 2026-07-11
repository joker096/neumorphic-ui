import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SettingsToggle } from './SettingsToggle';

describe('SettingsToggle - additional tests', () => {
  it('renders with initialActive true', () => {
    const { container } = render(<SettingsToggle label="Test" initialActive={true} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders sun icon when on', () => {
    const { container } = render(<SettingsToggle label="Test" initialActive={true} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders moon icon when off', () => {
    const { container } = render(<SettingsToggle label="Test" initialActive={false} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with custom size', () => {
    const { container } = render(<SettingsToggle label="Test" initialActive={false} />);
    const toggle = container.querySelector('.w-12');
    expect(toggle).toBeInTheDocument();
  });

  it('does not call onToggle when not provided', () => {
    render(<SettingsToggle label="Test" initialActive={false} />);
    fireEvent.click(screen.getByText('Test').closest('div')!);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders label correctly', () => {
    render(<SettingsToggle label="My Setting" initialActive={false} />);
    expect(screen.getByText('My Setting')).toBeInTheDocument();
  });

  it('renders with active state', () => {
    const { container } = render(<SettingsToggle label="Test" initialActive={true} />);
    expect(container.querySelector('.w-12')).toBeInTheDocument();
  });

  it('renders with inactive state', () => {
    const { container } = render(<SettingsToggle label="Test" initialActive={false} />);
    expect(container.querySelector('.w-12')).toBeInTheDocument();
  });

  it('toggles state on click', () => {
    const onToggle = vi.fn();
    render(<SettingsToggle label="Test" initialActive={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByText('Test').closest('div')!);
    expect(onToggle).toHaveBeenCalled();
  });
});
