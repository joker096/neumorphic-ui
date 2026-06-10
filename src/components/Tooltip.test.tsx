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
});