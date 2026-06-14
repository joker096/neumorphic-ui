import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DarkPillButton } from './DarkPillButton';
import { Search } from 'lucide-react';

describe('DarkPillButton', () => {
  it('renders title', () => {
    render(<DarkPillButton title="Click Me" />);
    expect(screen.getByText('Click Me')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    render(<DarkPillButton title="Test" subtitle="Sub" />);
    expect(screen.getByText('Sub')).toBeTruthy();
  });

  it('renders badge when provided', () => {
    render(<DarkPillButton title="Test" badge="7" />);
    expect(screen.getByText('7')).toBeTruthy();
  });

  it('renders icon when provided and badge is not', () => {
    const { container } = render(<DarkPillButton title="Test" icon={Search} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('toggles active state on click', () => {
    render(<DarkPillButton title="Toggle" />);
    const div = screen.getByText('Toggle').closest('div')!;
    fireEvent.click(div);
    expect(screen.getByText('Toggle')).toBeTruthy();
  });
});
