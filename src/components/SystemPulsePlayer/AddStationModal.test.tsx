import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({ motion: { div: 'div' } }));

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
