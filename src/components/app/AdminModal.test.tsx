import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AdminModal } from './AdminModal';
import { useAppStore } from '../../store';

// Mock i18n
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

// Mock store
vi.mock('../../store', () => ({
  useAppStore: vi.fn(),
}));

describe('AdminModal', () => {
  beforeEach(() => {
    const setMock = vi.fn((val: boolean) => {});
    vi.mocked(useAppStore).mockImplementation((selector: any) => {
      const mockState = {
        shareRecording: false,
        setShareRecording: setMock,
      };
      if (typeof selector === 'function') {
        return selector(mockState);
      }
      return undefined;
    });
  });

  it('renders the title', () => {
    render(<AdminModal />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<AdminModal />);
    expect(screen.getByText(/description|описание/i)).toBeInTheDocument();
  });

  it('renders toggle switch', () => {
    render(<AdminModal />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('renders toggle in off state by default', () => {
    render(<AdminModal />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles when clicked', () => {
    let wasSetCalled = false;
    vi.mocked(useAppStore).mockImplementation((selector: any) => {
      const mockState = {
        shareRecording: !wasSetCalled,
        setShareRecording: vi.fn(() => { wasSetCalled = true; }) as any,
      };
      if (typeof selector === 'function') {
        return selector(mockState);
      }
      return undefined;
    });
    render(<AdminModal />);
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles back to false when clicked again', () => {
    let isOn = false;
    vi.mocked(useAppStore).mockImplementation((selector: any) => {
      const mockState = {
        shareRecording: isOn,
        setShareRecording: vi.fn((val: any) => {
          isOn = val as boolean;
        }) as any,
      };
      if (typeof selector === 'function') {
        return selector(mockState);
      }
      return undefined;
    });
    render(<AdminModal />);
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('renders the share recording label', () => {
    render(<AdminModal />);
    expect(screen.getByText(/shareRecording|Поделиться/i)).toBeInTheDocument();
  });

  it('renders the global control label', () => {
    render(<AdminModal />);
    expect(screen.getByText(/globalControl|Глобальный контроль/i)).toBeInTheDocument();
  });

  it('renders in a container with padding', () => {
    const { container } = render(<AdminModal />);
    expect(container.querySelector('.p-4')).toBeInTheDocument();
  });

  it('renders the modal structure', () => {
    const { container } = render(<AdminModal />);
    const card = container.querySelector('.rounded-md');
    expect(card).toBeInTheDocument();
  });
});
