import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CompanySettingsModal } from './CompanySettingsModal';

const captured: { onClose?: () => void } = {};

vi.mock('./CompanyProfileEditor', () => ({
  CompanyProfileEditor: (props: { onClose: () => void }) => {
    captured.onClose = props.onClose;
    return React.createElement('div', { 'data-testid': 'profile-editor' });
  },
}));

describe('CompanySettingsModal', () => {
  it('renders the backdrop overlay', () => {
    const { container } = render(<CompanySettingsModal onClose={vi.fn()} />);
    expect(container.firstElementChild).toHaveClass('fixed', 'inset-0', 'z-50');
  });

  it('renders CompanyProfileEditor inside the modal', () => {
    render(<CompanySettingsModal onClose={vi.fn()} />);
    expect(screen.getByTestId('profile-editor')).toBeInTheDocument();
  });

  it('passes onClose to CompanyProfileEditor', () => {
    const onClose = vi.fn();
    render(<CompanySettingsModal onClose={onClose} />);
    expect(captured.onClose).toBe(onClose);
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<CompanySettingsModal onClose={onClose} />);
    fireEvent.click(container.firstElementChild as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when the content area is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<CompanySettingsModal onClose={onClose} />);
    const backdrop = container.firstElementChild as HTMLElement;
    const content = backdrop.querySelector('div');
    expect(content).not.toBeNull();
    fireEvent.click(content as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
  });
});
