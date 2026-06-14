import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HubToggleIcon } from './HubToggleIcon';
import { Search } from 'lucide-react';

describe('HubToggleIcon', () => {
  it('renders with icon', () => {
    const { container } = render(
      <HubToggleIcon active={false} icon={Search} color="purple" isDark />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders active state', () => {
    const { container } = render(
      <HubToggleIcon active icon={Search} color="purple" isDark />
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders with light theme', () => {
    const { container } = render(
      <HubToggleIcon active={false} icon={Search} color="blue" isDark={false} />
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <HubToggleIcon
        active={false}
        icon={Search}
        color="green"
        isDark
        onClick={handleClick}
      />
    );
    const div = container.querySelector('div')!;
    fireEvent.click(div);
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders with different colors', () => {
    const { container: purple } = render(
      <HubToggleIcon active icon={Search} color="purple" isDark />
    );
    expect(purple.querySelector('svg')).toBeTruthy();

    const { container: blue } = render(
      <HubToggleIcon active icon={Search} color="blue" isDark />
    );
    expect(blue.querySelector('svg')).toBeTruthy();

    const { container: green } = render(
      <HubToggleIcon active icon={Search} color="green" isDark />
    );
    expect(green.querySelector('svg')).toBeTruthy();
  });
});
