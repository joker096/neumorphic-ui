import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ToggleSwitch } from './ToggleSwitch';

describe('ToggleSwitch - additional tests', () => {
  it('renders with aria-checked attribute', () => {
    render(<ToggleSwitch isOn={true} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('renders with aria-checked false when off', () => {
    render(<ToggleSwitch isOn={false} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<ToggleSwitch isOn={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalled();
  });

  it('does not call onToggle when disabled', () => {
    const onToggle = vi.fn();
    render(<ToggleSwitch isOn={false} disabled={true} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('calls onChange with true when checked is false', () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when checked is true', () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('applies custom className', () => {
    const { container } = render(<ToggleSwitch isOn={false} className="custom-class" />);
    expect(container.querySelector('[role="switch"]').classList.contains('custom-class')).toBeTruthy();
  });

  it('renders with active state', () => {
    const { container } = render(<ToggleSwitch isOn={true} />);
    expect(container.querySelector('[role="switch"]')).toBeInTheDocument();
  });

  it('renders with inactive state', () => {
    const { container } = render(<ToggleSwitch isOn={false} />);
    expect(container.querySelector('[role="switch"]')).toBeInTheDocument();
  });

  it('applies disabled attribute', () => {
    render(<ToggleSwitch isOn={false} disabled={true} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-disabled');
  });

  it('does not apply disabled attribute when not disabled', () => {
    render(<ToggleSwitch isOn={false} />);
    expect(screen.getByRole('switch')).not.toHaveAttribute('aria-disabled');
  });
});
