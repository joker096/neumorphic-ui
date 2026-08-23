import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({ motion: { div: 'div' } }));

vi.mock('../../lib/i18n', () => {
  const translations: Record<string, string> = {
    'systemPlayer.addRadioStation': 'Add Radio Station',
    'systemPlayer.stationName': 'Station Name',
    'systemPlayer.stationNamePlaceholder': 'e.g. MetroPulse FM',
    'systemPlayer.streamUrl': 'Stream URL',
    'systemPlayer.streamUrlPlaceholder': 'https://stream.example.com/live',
    'systemPlayer.addStation': 'Add Station',
    'systemPlayer.cancel': 'Cancel',
    'systemPlayer.nameRequired': 'Name is required',
    'systemPlayer.urlRequired': 'URL is required',
    'systemPlayer.urlInvalid': 'URL must start with http:// or https://',
  };
  return {
    useI18n: () => ({
      lang: 'en',
      setLang: () => {},
      t: (key: string) => translations[key] ?? key,
    }),
  };
});

import { AddStationModal } from './AddStationModal';

const defaultProps = {
  showAddStationModal: true,
  setShowAddStationModal: vi.fn(),
  stationName: '',
  setStationName: vi.fn(),
  stationUrl: '',
  setStationUrl: vi.fn(),
  stationAddError: '',
  setStationAddError: vi.fn(),
  setRadioStations: vi.fn(),
  radioStations: [],
  setRadioStationIndex: vi.fn(),
  setIsPlaying: vi.fn(),
  setIsRadioMode: vi.fn(),
};

describe('AddStationModal', () => {
  it('renders nothing when hidden', () => {
    const { container } = render(<AddStationModal {...defaultProps} showAddStationModal={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders title and inputs when visible', () => {
    render(<AddStationModal {...defaultProps} />);
    expect(screen.getByText('Add Radio Station')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. MetroPulse FM')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://stream.example.com/live')).toBeInTheDocument();
  });

  it('renders add and cancel buttons', () => {
    render(<AddStationModal {...defaultProps} />);
    expect(screen.getByText('Add Station')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('shows validation error on empty submit', () => {
    const setStationAddError = vi.fn();
    render(<AddStationModal {...defaultProps} setStationAddError={setStationAddError} />);
    fireEvent.click(screen.getByText('Add Station'));
    expect(setStationAddError).toHaveBeenCalledWith('Name is required');
  });

  it('shows URL validation error', () => {
    const setStationAddError = vi.fn();
    render(<AddStationModal {...defaultProps} stationName="Test" setStationAddError={setStationAddError} />);
    fireEvent.click(screen.getByText('Add Station'));
    expect(setStationAddError).toHaveBeenCalledWith('URL is required');
  });
});
