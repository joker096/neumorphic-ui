import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CrmLeadSuggestionBar } from './CrmLeadSuggestionBar';

const baseProps = () => ({
  hint: 'Add +79001112233 as a CRM lead',
  actionLabel: 'Add',
  dismissLabel: 'Close',
  onAdd: vi.fn(),
  onDismiss: vi.fn(),
});

describe('CrmLeadSuggestionBar', () => {
  it('renders the hint text', () => {
    render(<CrmLeadSuggestionBar {...baseProps()} />);
    expect(screen.getByText('Add +79001112233 as a CRM lead')).toBeInTheDocument();
  });

  it('calls onAdd when the action is clicked', () => {
    const props = baseProps();
    render(<CrmLeadSuggestionBar {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(props.onAdd).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when the close button is clicked', () => {
    const props = baseProps();
    render(<CrmLeadSuggestionBar {...props} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(props.onDismiss).toHaveBeenCalledTimes(1);
  });
});
