import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ControlButton, StatusDots } from './CallControls';

const FakeIcon = () => null;

describe('ControlButton', () => {
  it('renders a labelled button and fires onClick', () => {
    const onClick = vi.fn();
    render(<ControlButton icon={FakeIcon} label="Mute" onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Mute' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('marks active state and applies the active colour ring', () => {
    const { container } = render(
      <ControlButton icon={FakeIcon} label="Mute" onClick={() => {}} active activeColor="border-red-500" />,
    );
    const button = screen.getByRole('button', { name: 'Mute' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button.className).toContain('neo-circle-pressed');
    expect(container.querySelector('.border-red-500')).not.toBeNull();
  });

  it('applies size presets to the wrapper', () => {
    const { container } = render(<ControlButton icon={FakeIcon} label="Small" onClick={() => {}} size="sm" />);
    expect(container.querySelector('button.w-11.h-11')).not.toBeNull();
    const { container: lgContainer } = render(
      <ControlButton icon={FakeIcon} label="Large" onClick={() => {}} size="lg" />,
    );
    expect(lgContainer.querySelector('button.w-16.h-16')).not.toBeNull();
  });
});

describe('StatusDots', () => {
  it('renders three animated dots', () => {
    const { container } = render(<StatusDots />);
    expect(container.querySelectorAll('.w-1.h-1')).toHaveLength(3);
  });
});
