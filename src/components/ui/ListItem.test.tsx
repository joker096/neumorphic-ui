import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ListItem } from './ListItem';

const RightArrow = () => <span data-testid="right-element">{'>'}Right</span>;

describe('ListItem', () => {
  it('renders title', () => {
    render(<ListItem title="Settings" />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<ListItem title="Settings" subtitle="App preferences" />);
    expect(screen.getByText('App preferences')).toBeInTheDocument();
  });

  it('renders subtitleSecondary when provided', () => {
    render(<ListItem title="Item" subtitleSecondary="Secondary info" />);
    expect(screen.getByText('Secondary info')).toBeInTheDocument();
  });

  it('renders icon/avatar when provided', () => {
    render(
      <ListItem
        title="Profile"
        avatar={<svg data-testid="avatar-icon" />}
      />
    );
    expect(screen.getByTestId('avatar-icon')).toBeInTheDocument();
  });

  it('renders right element when provided', () => {
    render(
      <ListItem title="Item" right={<RightArrow />} />
    );
    expect(screen.getByTestId('right-element')).toBeInTheDocument();
  });

  it('fires onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ListItem title="Clickable" onClick={onClick} />);
    fireEvent.click(screen.getByText('Clickable'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders as button when onClick is provided', () => {
    const { container } = render(<ListItem title="Item" onClick={() => {}} />);
    const el = container.querySelector('button');
    expect(el).toBeInTheDocument();
  });

  it('renders as div when no onClick is provided', () => {
    const { container } = render(<ListItem title="Item" />);
    const el = container.querySelector('div');
    expect(el).toBeInTheDocument();
  });

  it('applies interactive hover style when onClick and interactive', () => {
    const { container } = render(
      <ListItem title="Item" onClick={() => {}} interactive />
    );
    const el = container.querySelector('button');
    expect(el?.className).toContain('hover:bg-[var(--list-item-hover-bg)]');
  });

  it('does not apply hover style when interactive=false', () => {
    const { container } = render(
      <ListItem title="Item" onClick={() => {}} interactive={false} />
    );
    const el = container.querySelector('button');
    expect(el?.className).not.toContain('hover:bg-[var(--list-item-hover-bg)]');
  });

  it('applies className prop', () => {
    const { container } = render(<ListItem title="Item" className="extra-class" />);
    const el = container.querySelector('div');
    expect(el?.className).toContain('extra-class');
  });
});
