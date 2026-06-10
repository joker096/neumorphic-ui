import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MeshRadar } from './MeshRadar';

const mockCanvasContext = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: '',
  fillText: vi.fn(),
  createImageData: vi.fn(),
  createLinearGradient: vi.fn(),
  createPattern: vi.fn(),
  createRadialGradient: vi.fn(),
  getContextAttributes: vi.fn(),
  getImageData: vi.fn(),
  getLineDash: vi.fn(),
  getTransform: vi.fn(),
  isContextLost: vi.fn(),
  isPointInPath: vi.fn(),
  measureText: vi.fn(),
  putImageData: vi.fn(),
  resetTransform: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  scrollPath: vi.fn(),
  scrollPathIntoView: vi.fn(),
  setLineDash: vi.fn(),
  setTransform: vi.fn(),
  transform: vi.fn(),
  globalCompositeOperation: '',
  globalAlpha: 1,
  direction: '',
  imageSmoothingEnabled: true,
  lineCap: '',
  lineDashOffset: 0,
  lineJoin: '',
  pixelStore: {} as any,
  imageSmoothingQuality: '',
  createConicGradient: vi.fn(),
  submitCommand: vi.fn(),
} as any;

describe('MeshRadar', () => {
  let originalRequestAnimationFrame: typeof requestAnimationFrame;
  let originalCancelAnimationFrame: typeof cancelAnimationFrame;
  let animationFrameCallback: FrameRequestCallback | null = null;

  beforeEach(() => {
    originalRequestAnimationFrame = global.requestAnimationFrame;
    originalCancelAnimationFrame = global.cancelAnimationFrame;

    global.requestAnimationFrame = vi.fn((cb) => {
      animationFrameCallback = cb;
      return 1;
    });
    global.cancelAnimationFrame = vi.fn();

    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext) as any;
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
    animationFrameCallback = null;
  });

  it('renders the radar canvas with correct dimensions', () => {
    render(<MeshRadar theme="dark" />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '380');
    expect(canvas).toHaveAttribute('height', '380');
  });

  it('displays LIVE status indicator', () => {
    render(<MeshRadar theme="dark" />);

    expect(screen.getByText(/LIVE/)).toBeInTheDocument();
    expect(screen.getByText(/Mesh Radar/)).toBeInTheDocument();
  });

  it('renders node list with mock connections', () => {
    render(<MeshRadar theme="dark" />);

    expect(screen.getByText(/relay_7a3f/)).toBeInTheDocument();
    expect(screen.getByText(/WebRTC/)).toBeInTheDocument();
    expect(screen.getByText(/0\.4 km/)).toBeInTheDocument();
    expect(screen.getByText(/bridge_c29e/)).toBeInTheDocument();
    expect(screen.getByText(/DHT/)).toBeInTheDocument();
    expect(screen.getByText(/1\.2 km/)).toBeInTheDocument();
    expect(screen.getByText(/node_f88b/)).toBeInTheDocument();
    expect(screen.getByText(/Noise/)).toBeInTheDocument();
    expect(screen.getByText(/3\.8 km/)).toBeInTheDocument();
  });

  it('applies dark theme styles correctly', () => {
    render(<MeshRadar theme="dark" />);

    const canvas = document.querySelector('canvas')!;
    const container = canvas.parentElement!;
    expect(container).toHaveClass('bg-[#101216]');
    expect(container).toHaveClass('border-green-500/20');
  });

  it('applies light theme styles correctly', () => {
    render(<MeshRadar theme="light" />);

    const canvas = document.querySelector('canvas')!;
    const container = canvas.parentElement!;
    expect(container).toHaveClass('bg-[#e2e8f0]');
    expect(canvas).toHaveClass('border-emerald-500/30');
  });

  it('cleans up animation frame on unmount', () => {
    const { unmount } = render(<MeshRadar theme="dark" />);

    expect(global.requestAnimationFrame).toHaveBeenCalled();

    unmount();

    expect(global.cancelAnimationFrame).toHaveBeenCalledWith(1);
  });

  it('calls canvas drawing operations on animation frame', () => {
    render(<MeshRadar theme="dark" />);

    if (animationFrameCallback) {
      animationFrameCallback(0);
    }

    expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    expect(mockCanvasContext.beginPath).toHaveBeenCalled();
    expect(mockCanvasContext.arc).toHaveBeenCalled();
    expect(mockCanvasContext.fill).toHaveBeenCalled();
    expect(mockCanvasContext.stroke).toHaveBeenCalled();
  });

  it('draws sweep line and nodes', () => {
    render(<MeshRadar theme="dark" />);

    if (animationFrameCallback) {
      animationFrameCallback(0);
    }

    expect(mockCanvasContext.moveTo).toHaveBeenCalled();
    expect(mockCanvasContext.lineTo).toHaveBeenCalled();
    expect(mockCanvasContext.fillText).toHaveBeenCalled();
  });
});

describe('MeshRadar theme switching', () => {
  let rerender: ReturnType<typeof render>['rerender'];

  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext) as any;
    const { rerender: r } = render(<MeshRadar theme="dark" />);
    rerender = r;
    vi.clearAllMocks();
  });

  it('updates canvas when theme changes', () => {
    rerender(<MeshRadar theme="light" />);

    expect(screen.getByText(/LIVE/)).toBeInTheDocument();
    const canvas = document.querySelector('canvas')!;
    const container = canvas.parentElement!;
    expect(container).toHaveClass('bg-[#e2e8f0]');
  });
});