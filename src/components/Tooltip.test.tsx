import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(<Tooltip content="Test tooltip"><button>Hover me</button></Tooltip>);
    
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('shows tooltip on mouse enter', () => {
    render(<Tooltip content="Test tooltip"><button>Hover me</button></Tooltip>);
    
    fireEvent.mouseEnter(screen.getByText('Hover me'));
    
    expect(screen.getByText('Test tooltip')).toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', () => {
    render(<Tooltip content="Test tooltip"><button>Hover me</button></Tooltip>);
    
    fireEvent.mouseEnter(screen.getByText('Hover me'));
    expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    
    fireEvent.mouseLeave(screen.getByText('Hover me'));
    
    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip on focus', () => {
    render(<Tooltip content="Test tooltip"><button>Focus me</button></Tooltip>);
    
    fireEvent.focus(screen.getByText('Focus me'));
    
    expect(screen.getByText('Test tooltip')).toBeInTheDocument();
  });

  it('hides tooltip on blur', () => {
    render(<Tooltip content="Test tooltip"><button>Focus me</button></Tooltip>);
    
    fireEvent.focus(screen.getByText('Focus me'));
    expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    
    fireEvent.blur(screen.getByText('Focus me'));
    
    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
  });

  it('positions tooltip at top by default', () => {
    render(<Tooltip content="Top tooltip"><button>Hover</button></Tooltip>);
    
    fireEvent.mouseEnter(screen.getByText('Hover'));
    
    expect(screen.getByText('Top tooltip')).toBeInTheDocument();
  });

  it('positions tooltip at bottom', () => {
    render(<Tooltip content="Bottom tooltip" position="bottom"><button>Hover</button></Tooltip>);
    
    fireEvent.mouseEnter(screen.getByText('Hover'));
    
    expect(screen.getByText('Bottom tooltip')).toBeInTheDocument();
  });

  it('positions tooltip at left', () => {
    render(<Tooltip content="Left tooltip" position="left"><button>Hover</button></Tooltip>);
    
    fireEvent.mouseEnter(screen.getByText('Hover'));
    
    expect(screen.getByText('Left tooltip')).toBeInTheDocument();
  });

  it('positions tooltip at right', () => {
    render(<Tooltip content="Right tooltip" position="right"><button>Hover</button></Tooltip>);
    
    fireEvent.mouseEnter(screen.getByText('Hover'));
    
    expect(screen.getByText('Right tooltip')).toBeInTheDocument();
  });

  it('hides tooltip on scroll', async () => {
    render(<Tooltip content="Test tooltip"><button>Hover me</button></Tooltip>);
    
    fireEvent.mouseEnter(screen.getByText('Hover me'));
    expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    
    window.dispatchEvent(new Event('scroll'));
    await act(async () => {});
    
    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
  });

  it('hides tooltip on resize', async () => {
    render(<Tooltip content="Test tooltip"><button>Hover me</button></Tooltip>);
    
    fireEvent.mouseEnter(screen.getByText('Hover me'));
    expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    
    window.dispatchEvent(new Event('resize'));
    await act(async () => {});
    
    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
  });

  it('applies correct tooltip styles', () => {
    render(<Tooltip content="Styled tooltip"><button>Hover</button></Tooltip>);
    
    fireEvent.mouseEnter(screen.getByText('Hover'));
    
    expect(screen.getByText('Styled tooltip')).toBeInTheDocument();
  });

  it('renders custom children correctly', () => {
    render(
      <Tooltip content="Custom child">
        <div className="custom-child">Custom</div>
      </Tooltip>
    );
    
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('handles rapid mouse enter/leave', () => {
    render(<Tooltip content="Rapid tooltip"><button>Hover</button></Tooltip>);
    
    for (let i = 0; i < 5; i++) {
      fireEvent.mouseEnter(screen.getByText('Hover'));
      fireEvent.mouseLeave(screen.getByText('Hover'));
    }
    
    expect(screen.queryByText('Rapid tooltip')).not.toBeInTheDocument();
  });

  it('portals the tooltip into document.body with role="tooltip"', () => {
    const { container } = render(<Tooltip content="Portaled tip"><button>Hover me</button></Tooltip>);

    fireEvent.mouseEnter(screen.getByText('Hover me'));

    const tip = screen.getByRole('tooltip');
    expect(document.body).toContainElement(tip);
    expect(container).not.toContainElement(tip);
    expect(container.firstElementChild).toHaveAttribute('data-tooltip', 'Portaled tip');
  });

  it('links the wrapper to the visible tooltip via aria-describedby', () => {
    const { container } = render(<Tooltip content="Described tip"><button>Hover me</button></Tooltip>);
    const wrapper = container.firstElementChild!;

    expect(wrapper).not.toHaveAttribute('aria-describedby');

    fireEvent.mouseEnter(screen.getByText('Hover me'));
    const tip = screen.getByRole('tooltip');
    expect(wrapper).toHaveAttribute('aria-describedby', tip.id);

    fireEvent.mouseLeave(screen.getByText('Hover me'));
    expect(wrapper).not.toHaveAttribute('aria-describedby');
  });

  it('does not add an empty tab stop on the wrapper', () => {
    const { container } = render(<Tooltip content="Tip"><button>Focus me</button></Tooltip>);
    expect(container.firstElementChild).not.toHaveAttribute('tabindex');
  });

  it('exposes the requested side as data-placement', () => {
    render(<Tooltip content="Top tip"><button>Hover</button></Tooltip>);
    fireEvent.mouseEnter(screen.getByText('Hover'));
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-placement', 'top');

    fireEvent.mouseLeave(screen.getByText('Hover'));
    render(<Tooltip content="Bottom tip" position="bottom"><button>Hover2</button></Tooltip>);
    fireEvent.mouseEnter(screen.getByText('Hover2'));
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-placement', 'bottom');
  });

  it('hides on Escape', () => {
    render(<Tooltip content="Escapable tip"><button>Hover me</button></Tooltip>);

    fireEvent.mouseEnter(screen.getByText('Hover me'));
    expect(screen.getByText('Escapable tip')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('Escapable tip')).not.toBeInTheDocument();
  });

  it('caps the tooltip width so long hint text wraps instead of overflowing', () => {
    render(<Tooltip content="A very long hint that used to run off the screen edge"><button>Hover me</button></Tooltip>);

    fireEvent.mouseEnter(screen.getByText('Hover me'));

    expect(screen.getByRole('tooltip').style.maxWidth).toBe('min(70vw, 260px)');
  });

  it('shows on touch press and auto-hides after the touch window', () => {
    render(<Tooltip content="Touch tip"><button>Tap me</button></Tooltip>);

    fireEvent.pointerDown(screen.getByText('Tap me'), { pointerType: 'touch' });
    expect(screen.getByText('Touch tip')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.queryByText('Touch tip')).not.toBeInTheDocument();
  });

  it('ignores mouse pointer presses (hover already covers them)', () => {
    render(<Tooltip content="Mouse tip"><button>Press me</button></Tooltip>);

    fireEvent.pointerDown(screen.getByText('Press me'), { pointerType: 'mouse' });

    expect(screen.queryByText('Mouse tip')).not.toBeInTheDocument();
  });
});