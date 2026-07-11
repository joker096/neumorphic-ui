import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({ motion: { div: 'div' } }));
vi.mock('lucide-react', () => ({ Volume2: 'div', VolumeX: 'div', ArrowLeft: 'div' }));

import { EqualizerPanel } from './EqualizerPanel';

const defaultProps = {
  isRadioMode: false,
  volume: 50,
  setVolume: vi.fn(),
  eqGains: [0, 0, 0, 0, 0],
  setEqGains: vi.fn(),
  showEq: true,
  setShowEq: vi.fn(),
  currentPreset: 'Flat',
  setCurrentPreset: vi.fn(),
  savedPresets: [],
  setSavedPresets: vi.fn(),
  applyPreset: vi.fn(),
  savePreset: vi.fn(),
  deletePreset: vi.fn(),
};

describe('EqualizerPanel', () => {
  it('renders audio settings title', () => {
    render(<EqualizerPanel {...defaultProps} />);
    expect(screen.getByText('Audio Settings')).toBeInTheDocument();
  });

  it('renders master volume section', () => {
    render(<EqualizerPanel {...defaultProps} />);
    expect(screen.getByText('Master Volume')).toBeInTheDocument();
  });

  it('renders equalizer section', () => {
    render(<EqualizerPanel {...defaultProps} />);
    expect(screen.getByText('5-Band Equalizer')).toBeInTheDocument();
  });

  it('renders volume slider', () => {
    render(<EqualizerPanel {...defaultProps} />);
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBeGreaterThan(0);
  });

  it('renders reset EQ button', () => {
    render(<EqualizerPanel {...defaultProps} />);
    expect(screen.getByText('Reset EQ')).toBeInTheDocument();
  });
});
