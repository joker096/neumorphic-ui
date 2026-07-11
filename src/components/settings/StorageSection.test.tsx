import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({
  HardDrive: 'div', Download: 'div', Upload: 'div', Trash2: 'div',
  Key: 'div', Cloud: 'div', Info: 'div', ChevronLeft: 'div', ChevronRight: 'div',
}));

vi.mock('../../store', () => ({
  useAppStore: Object.assign(
    (selector: any) => selector?.({
      chats: [], contacts: [], channels: [], bots: [],
      soundEnabled: true, currentLanguage: 'en',
      stealthMode: false, ghostViewMode: false,
      readReceipts: true, typingIndicators: true,
      deliveryReceipts: true, onlineStatus: true,
      anonymousMode: false, allowForwarding: true,
      allowMetadata: false, forwardCountLimit: 5,
      turnServerUrl: '',
    }),
    { getState: () => ({}) }
  ),
}));

import { StorageSection } from './StorageSection';

describe('StorageSection', () => {
  it('renders section title', () => {
    render(<StorageSection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('settings.dataStorage')).toBeInTheDocument();
  });

  it('renders backup options', () => {
    render(<StorageSection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('settings.exportBackup')).toBeInTheDocument();
    expect(screen.getByText('settings.importBackup.title')).toBeInTheDocument();
  });

  it('renders clear cache option', () => {
    render(<StorageSection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('settings.clearCache')).toBeInTheDocument();
  });

  it('renders encryption keys option', () => {
    render(<StorageSection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('settings.exportEncryptionKeys')).toBeInTheDocument();
  });
});
