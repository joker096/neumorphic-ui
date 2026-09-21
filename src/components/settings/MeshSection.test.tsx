import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MeshSection } from './MeshSection';

const h = vi.hoisted(() => {
  const pair = vi.fn(() => Promise.resolve('offer-payload'));
  const accept = vi.fn(() => Promise.resolve('answer-payload'));
  const disconnect = vi.fn();
  const enablePairing = vi.fn();
  const send = vi.fn(() => Promise.resolve(undefined));
  const P2PTransport = vi.fn(function (this: any) {
    this.createPairingOffer = pair;
    this.acceptPairingOffer = accept;
    this.acceptPairingAnswer = accept;
    this.enablePairingMode = enablePairing;
    this.disconnect = disconnect;
    this.send = send;
  });
  return { pair, accept, disconnect, enablePairing, send, P2PTransport };
});

vi.mock('../../lib/p2p/P2PTransport', () => ({
  P2PTransport: h.P2PTransport,
}));

describe('MeshSection (LAN pairing UI)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.P2PTransport.mockClear();
    h.pair.mockImplementation(() => Promise.resolve('offer-payload'));
    h.accept.mockImplementation(() => Promise.resolve('answer-payload'));
  });

  const renderMesh = () =>
    render(<MeshSection isDark={false} onBack={vi.fn()} t={(k: string) => k} />);

  it('renders the three steps and session status', () => {
    renderMesh();
    expect(screen.getByText('mesh.stepCaller')).toBeInTheDocument();
    expect(screen.getByText('mesh.stepGuest')).toBeInTheDocument();
    expect(screen.getByText('mesh.stepCallerFinal')).toBeInTheDocument();
    expect(screen.getByText('mesh.idle')).toBeInTheDocument();
  });

  it('create invite live-starts the caller transport and exposes the payload', async () => {
    renderMesh();
    fireEvent.click(screen.getByRole('button', { name: /mesh\.createInvite/i }));
    expect(h.P2PTransport).toHaveBeenCalledTimes(1);
    expect(h.enablePairing).toHaveBeenCalled();
    await screen.findByDisplayValue('offer-payload');
    expect(screen.getByRole('button', { name: /mesh\.copy/i })).toBeInTheDocument();
  });

  it('generate answer requires an invite draft and live-starts the guest transport', async () => {
    renderMesh();
    const generateBtn = () => screen.getByRole('button', { name: /mesh\.generateAnswer/i });
    expect(generateBtn()).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('mesh.invitePlaceholder'), { target: { value: 'offer-payload' } });
    expect(generateBtn()).toBeEnabled();
    fireEvent.click(generateBtn());
    expect(h.accept).toHaveBeenCalledWith('offer-payload');
    await screen.findByDisplayValue('answer-payload');
  });

  it('connect finisher requires an answer draft and completes the caller side', async () => {
    renderMesh();
    fireEvent.click(screen.getByRole('button', { name: /mesh\.createInvite/i }));
    await screen.findByDisplayValue('offer-payload');
    const connectBtn = () => screen.getByRole('button', { name: /mesh\.connect/i });
    expect(connectBtn()).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('mesh.answerPlaceholder'), { target: { value: 'answer-payload' } });
    expect(connectBtn()).toBeEnabled();
    fireEvent.click(connectBtn());
    expect(h.accept).toHaveBeenCalledWith('answer-payload');
  });

  it('invalid guest offer reports a non-empty error and clears the answer', async () => {
    h.accept.mockImplementation(() => Promise.reject(new Error('bad payload')));
    renderMesh();
    fireEvent.change(screen.getByPlaceholderText('mesh.invitePlaceholder'), { target: { value: 'garbage' } });
    fireEvent.click(screen.getByRole('button', { name: /mesh\.generateAnswer/i }));
    await screen.findByText(/invalid invite/i);
    expect(screen.queryByDisplayValue('answer-payload')).not.toBeInTheDocument();
  });

  it('tears the transports down on unmount', () => {
    const { unmount } = renderMesh();
    fireEvent.click(screen.getByRole('button', { name: /mesh\.createInvite/i }));
    unmount();
    expect(h.disconnect).toHaveBeenCalled();
  });

  it('constructs both transports with real ed25519 identities (no "failed" pairing)', async () => {
    renderMesh();
    fireEvent.click(screen.getByRole('button', { name: /mesh\.createInvite/i }));
    await screen.findByDisplayValue('offer-payload');
    const callerConfig = (h.P2PTransport.mock.calls[0] as any[])[0];
    expect(callerConfig.localPublicKey).toMatch(/^[0-9a-f]{64}$/);
    expect(callerConfig.identityPublicKey).toBeInstanceOf(Uint8Array);
    expect(callerConfig.identityPublicKey.length).toBe(32);
    expect(callerConfig.identitySecretKey).toBeInstanceOf(Uint8Array);
    expect(callerConfig.identitySecretKey.length).toBe(64);
    expect(callerConfig.obfuscationEnabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText('mesh.invitePlaceholder'), { target: { value: 'offer-payload' } });
    fireEvent.click(screen.getByRole('button', { name: /mesh\.generateAnswer/i }));
    await screen.findByDisplayValue('answer-payload');
    const guestConfig = (h.P2PTransport.mock.calls[1] as any[])[0];
    expect(guestConfig.localPublicKey).toMatch(/^[0-9a-f]{64}$/);
    expect(guestConfig.localPublicKey).not.toBe(callerConfig.localPublicKey);
  });
});