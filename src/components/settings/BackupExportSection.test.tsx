import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({
  Database: 'div', FileJson: 'div', FileUp: 'div', Lock: 'div', Trash2: 'div', Upload: 'div',
  X: 'div', ChevronLeft: 'div', ChevronRight: 'div',
}));
vi.mock('motion/react', () => ({ motion: { div: 'div' } }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));
vi.mock('../ui/Toast', () => ({ toast: vi.fn() }));
vi.mock('./TextInputModal', () => ({
  TextInputModal: vi.fn((props: any) => (
    <div data-testid="text-input-modal" data-open={String(props.isOpen)}>
      <button onClick={() => props.onConfirm('')}>confirm-empty</button>
      <button onClick={() => props.onConfirm('secret123')}>confirm-pass</button>
      <button onClick={() => props.onCancel()}>cancel-modal</button>
    </div>
  )),
}));
vi.mock('../ui/ConfirmDialog', () => ({
  ConfirmDialog: vi.fn((props: any) => (
    <div data-testid="confirm-dialog" data-open={String(props.isOpen)}>
      <button data-testid="cfrm-ok" onClick={() => props.onConfirm()}>confirm-dialog</button>
      <button data-testid="cfrm-x" onClick={() => props.onCancel()}>cancel-dialog</button>
    </div>
  )),
}));
vi.mock('../../lib/backup', () => ({
  applyBackup: vi.fn(() => Promise.resolve()),
  clearLocalCache: vi.fn(() => Promise.resolve()),
  decryptBackupFile: vi.fn(() => Promise.resolve(null)),
  downloadBackup: vi.fn(() => Promise.resolve()),
  downloadChatsExport: vi.fn(() => Promise.resolve()),
  parseBackupFile: vi.fn(() => Promise.resolve(null)),
  LAST_BACKUP_KEY: 'lastBackupKey',
}));
vi.mock('../../lib/backupCrypto', () => ({ isEncryptedBackup: vi.fn(() => false) }));

import { BackupExportSection } from './BackupExportSection';
import { toast } from '../ui/Toast';
import { downloadBackup, downloadChatsExport, clearLocalCache, applyBackup, decryptBackupFile, parseBackupFile, LAST_BACKUP_KEY } from '../../lib/backup';
import { isEncryptedBackup } from '../../lib/backupCrypto';

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

const openDialog = () =>
  screen.getAllByTestId('confirm-dialog').find(el => el.getAttribute('data-open') === 'true')!;

const renderSection = (props: { isDark?: boolean; onBack?: () => void } = {}) =>
  render(<BackupExportSection isDark={props.isDark} onBack={props.onBack ?? vi.fn()} />);

describe('BackupExportSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders header, sections and Never last backup', () => {
    renderSection();
    expect(screen.getByRole('button', { name: t('common.back') })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: t('settings.backupExport', 'Backup & Export') })).toBeInTheDocument();
    expect(screen.getByText(t('settings.backup', 'Backup'))).toBeInTheDocument();
    expect(screen.getByText(t('settings.exportData', 'Export data'))).toBeInTheDocument();
    expect(screen.getAllByText(t('settings.importBackupFile', 'Import from backup file'))).toHaveLength(2); // section + row
    expect(screen.getByText(t('settings.dangerZone', 'Danger Zone'))).toBeInTheDocument();
    expect(screen.getByText(t('settings.never', 'Never'))).toBeInTheDocument();
  });

  it('formats existing last backup timestamp', () => {
    const ts = '2026-08-01T00:00:00.000Z';
    localStorage.setItem(LAST_BACKUP_KEY, ts);
    renderSection();
    expect(screen.getByText(new Date(ts).toLocaleString())).toBeInTheDocument();
  });

  it('creates encrypted backup with password and updates last backup', async () => {
    renderSection();
    fireEvent.click(screen.getByLabelText(t('settings.createBackup', 'Back up now')));
    expect(screen.getByTestId('text-input-modal')).toHaveAttribute('data-open', 'true');
    fireEvent.click(screen.getByText('confirm-pass'));
    await waitFor(() => expect(downloadBackup).toHaveBeenCalledWith('secret123'));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(t('toast.encryptedBackupCreated', 'Encrypted backup created'), 'success'));
    expect(localStorage.getItem(LAST_BACKUP_KEY)).not.toBeNull();
  });

  it('rejects empty password with error toast', async () => {
    renderSection();
    fireEvent.click(screen.getByLabelText(t('settings.createBackup', 'Back up now')));
    fireEvent.click(screen.getByText('confirm-empty'));
    expect(toast).toHaveBeenCalledWith(t('toast.noPasswordProvided', 'No password provided'), 'error');
    expect(downloadBackup).not.toHaveBeenCalled();
  });

  it('exports chat history with password', async () => {
    renderSection();
    fireEvent.click(screen.getByText(t('settings.exportJson', 'Export chat history (encrypted)')));
    fireEvent.click(screen.getByText('confirm-pass'));
    await waitFor(() => expect(downloadChatsExport).toHaveBeenCalledWith('secret123'));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(t('settings.exportSuccess', 'Export successful'), 'success'));
  });

  it('imports encrypted backup after password prompt', async () => {
    (isEncryptedBackup as any).mockReturnValue(true);
    (decryptBackupFile as any).mockResolvedValue({ chats: [] });
    (applyBackup as any).mockResolvedValue(undefined);
    renderSection();
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [new File([new Uint8Array([1, 2, 3])], 'backup.enc')] } });
    await waitFor(() => expect(screen.getByTestId('text-input-modal')).toHaveAttribute('data-open', 'true'));
    fireEvent.click(screen.getByText('confirm-pass'));
    await waitFor(() => expect(decryptBackupFile).toHaveBeenCalled());
    await waitFor(() => expect(openDialog()).toBeTruthy());
    fireEvent.click(openDialog().querySelector('[data-testid="cfrm-ok"]')!);
    await waitFor(() => expect(applyBackup).toHaveBeenCalledWith({ chats: [] }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(t('toast.backupRestored', 'Backup restored'), 'success'));
  });

  it('imports plain json backup directly', async () => {
    (isEncryptedBackup as any).mockReturnValue(false);
    (parseBackupFile as any).mockResolvedValue({ chats: [] });
    (applyBackup as any).mockResolvedValue(undefined);
    renderSection();
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [new File([new Uint8Array([1, 2, 3])], 'backup.json')] } });
    await waitFor(() => expect(parseBackupFile).toHaveBeenCalled());
    await waitFor(() => expect(openDialog()).toBeTruthy());
    fireEvent.click(openDialog().querySelector('[data-testid="cfrm-ok"]')!);
    await waitFor(() => expect(applyBackup).toHaveBeenCalledWith({ chats: [] }));
  });

  it('clears cache through danger zone confirm dialog', async () => {
    renderSection();
    fireEvent.click(screen.getByText(t('settings.clearCacheSubtitle', 'Clear temporary files and cache data')));
    expect(openDialog()).toBeTruthy();
    fireEvent.click(openDialog().querySelector('[data-testid="cfrm-ok"]')!);
    await waitFor(() => expect(clearLocalCache).toHaveBeenCalled());
    await waitFor(() => expect(toast).toHaveBeenCalledWith(t('settings.cacheCleared', 'Cache cleared'), 'success'));
    expect(screen.getByText(t('settings.never', 'Never'))).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    renderSection({ onBack });
    fireEvent.click(screen.getByRole('button', { name: t('common.back') }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});