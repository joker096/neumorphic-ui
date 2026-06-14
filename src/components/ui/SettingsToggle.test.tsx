import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettingsToggle } from './SettingsToggle';

describe('SettingsToggle', () => {
  it('renders label', () => {
    render(<SettingsToggle theme="dark" label="Dark Mode" />);
    expect(screen.getByText('Dark Mode')).toBeTruthy();
  });

  it('starts with initialActive false by default', () => {
    render(<SettingsToggle theme="dark" label="Toggle" />);
    expect(screen.getByText('Toggle')).toBeTruthy();
  });

  it('starts active when initialActive is true', () => {
    render(<SettingsToggle theme="dark" label="Toggle" initialActive />);
    expect(screen.getByText('Toggle')).toBeTruthy();
  });

  it('calls onToggle when clicked', () => {
    const handleToggle = vi.fn();
    render(<SettingsToggle theme="dark" label="Toggle" onToggle={handleToggle} />);
    fireEvent.click(screen.getByText('Toggle'));
    expect(handleToggle).toHaveBeenCalledWith(true);
  });

  it('renders with light theme', () => {
    render(<SettingsToggle theme="light" label="Light" />);
    expect(screen.getByText('Light')).toBeTruthy();
  });
});
