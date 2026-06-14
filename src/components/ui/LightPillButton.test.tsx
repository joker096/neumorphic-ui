import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LightPillButton } from './LightPillButton';
import { Search } from 'lucide-react';

describe('LightPillButton', () => {
  it('renders title', () => {
    render(<LightPillButton title="Click Me" />);
    expect(screen.getByText('Click Me')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    render(<LightPillButton title="Test" subtitle="Sub" />);
    expect(screen.getByText('Sub')).toBeTruthy();
  });

  it('renders badge when provided', () => {
    render(<LightPillButton title="Test" badge="3" />);
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('renders icon when provided and badge is not', () => {
    const { container } = render(<LightPillButton title="Test" icon={Search} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('toggles active state on click', () => {
    render(<LightPillButton title="Toggle" />);
    const div = screen.getByText('Toggle').closest('div')!;
    fireEvent.click(div);
    expect(screen.getByText('Toggle')).toBeTruthy();
  });
});
