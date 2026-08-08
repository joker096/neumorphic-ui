import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({ motion: { div: 'div' } }));
vi.mock('lucide-react', () => ({ Volume2: 'div', VolumeX: 'div', ArrowLeft: 'div' }));

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'systemPlayer.audioSettings': 'Audio Settings',
        'systemPlayer.masterVolume': 'Master Volume',
        'systemPlayer.eq5Band': '5-Band Equalizer',
        'systemPlayer.resetEq': 'Reset EQ',
      };
      return map[key] ?? key;
    },
  }),
}));

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
