import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SecurityChallengeModal, type SecurityChallengeModalProps } from './SecurityChallengeModal';

const t = (key: string) => key;

const base: SecurityChallengeModalProps = {
  isOpen: true,
  title: 'Confirm',
  message: 'Export encryption keys',
  pin: '',
  setPin: vi.fn(),
  totp: '',
  setTotp: vi.fn(),
  needsPin: true,
  needsTotp: false,
  allowBiometric: false,
  error: false,
  biometricError: false,
  busy: false,
  biometricBusy: false,
  blockedSeconds: 0,
  canSubmit: false,
  onSubmit: vi.fn(),
  onBiometric: vi.fn(),
  onCancel: vi.fn(),
  t,
};

describe('SecurityChallengeModal', () => {
  it('renders in a portal with dialog semantics and the reason', () => {
    render(<SecurityChallengeModal {...base} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.body.contains(dialog)).toBe(true);
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Export encryption keys')).toBeInTheDocument();
  });

  it('accepts digits only in the PIN field', () => {
    const setPin = vi.fn();
    render(<SecurityChallengeModal {...base} setPin={setPin} />);

    const input = screen.getByPlaceholderText('settings.enterPin');
    fireEvent.change(input, { target: { value: '12a4 56' } });
    expect(setPin).toHaveBeenCalledWith('12456');
  });

  it('keeps the submit button disabled until the hook says it is satisfiable', () => {
    const onSubmit = vi.fn();
    const { rerender } = render(<SecurityChallengeModal {...base} onSubmit={onSubmit} />);

    expect(screen.getByRole('button', { name: 'settings.verify' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'settings.verify' }));
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(<SecurityChallengeModal {...base} canSubmit onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: 'settings.verify' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('submits from the PIN field on Enter', () => {
    const onSubmit = vi.fn();
    render(<SecurityChallengeModal {...base} canSubmit onSubmit={onSubmit} />);

    fireEvent.keyDown(screen.getByPlaceholderText('settings.enterPin'), { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('requires a 6-digit code field for the strong level', () => {
    const setTotp = vi.fn();
    render(<SecurityChallengeModal {...base} needsTotp setTotp={setTotp} />);

    const field = screen.getByPlaceholderText('lock.totpLabel');
    expect(field).toHaveAttribute('inputmode', 'numeric');
    expect(field).toHaveAttribute('autocomplete', 'one-time-code');
    expect(field).toHaveAttribute('maxlength', '6');
    fireEvent.change(field, { target: { value: '12345x' } });
    expect(setTotp).toHaveBeenCalledWith('12345');
  });

  it('offers the authenticator only when the caller allows it', () => {
    const onBiometric = vi.fn();
    const { rerender } = render(<SecurityChallengeModal {...base} allowBiometric onBiometric={onBiometric} />);

    fireEvent.click(screen.getByRole('button', { name: 'lock.biometric' }));
    expect(onBiometric).toHaveBeenCalledTimes(1);

    rerender(<SecurityChallengeModal {...base} allowBiometric={false} />);
    expect(screen.queryByRole('button', { name: 'lock.biometric' })).not.toBeInTheDocument();
  });

  it('reports the brute-force penalty instead of the PIN error', () => {
    const { rerender } = render(<SecurityChallengeModal {...base} error />);
    expect(screen.getByRole('status')).toHaveTextContent('settings.pinIncorrect');

    rerender(<SecurityChallengeModal {...base} error blockedSeconds={17} />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('lock.tooManyAttempts');
    expect(status).toHaveTextContent('17s');
    expect(status).not.toHaveTextContent('settings.pinIncorrect');
  });

  it('reports a rejected fingerprint separately', () => {
    render(<SecurityChallengeModal {...base} biometricError />);
    expect(screen.getByRole('status')).toHaveTextContent('lock.biometricFailed');
  });

  it('disables the inputs while the penalty is running and cancels on Escape', () => {
    const onCancel = vi.fn();
    render(<SecurityChallengeModal {...base} blockedSeconds={5} onCancel={onCancel} />);

    expect(screen.getByPlaceholderText('settings.enterPin')).toBeDisabled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when closed', () => {
    render(<SecurityChallengeModal {...base} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});