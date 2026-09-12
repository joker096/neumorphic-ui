import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { QrCode } from '../QrCode';
import { P2PTransport } from '../../lib/p2p/P2PTransport';
import { SettingsGroup, SettingsSectionTitle } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { Check, Copy, Send, Unplug } from 'lucide-react';

interface MeshSectionProps {
  isDark?: boolean;
  onBack?: () => void;
  t?: (key: string, fallback?: string) => string;
}

/**
 * Serverless LAN pairing proof-of-concept: two app instances on the same
 * local network exchange a QR invite (offer) and a QR answer, establishing a
 * direct WebRTC data channel WITHOUT any signaling server. Session keys are
 * derived locally on both sides from an ephemeral ECDH (X25519) exchange.
 *
 * Strings use `t(key, enFallback)` on purpose: the mesh.* keys intentionally
 * live only in the fallback layer for the PoC (missing keys fall back to the
 * English fallback in every locale, keeping the x8 locale gate green).
 */
export const MeshSection = ({ isDark = false, onBack, t = (k: string, fallback?: string) => fallback ?? k }: MeshSectionProps) => {
  const callerRef = useRef<P2PTransport | null>(null);
  const guestRef = useRef<P2PTransport | null>(null);
  const [deviceKeys] = useState(() => {
    const suffix = (crypto.randomUUID ? crypto.randomUUID() : `lan-${Date.now()}`).slice(0, 8);
    return { caller: `caller-${suffix}`, guest: `guest-${suffix}` };
  });
  const [offer, setOffer] = useState('');
  const [answer, setAnswer] = useState('');
  const [guestOfferDraft, setGuestOfferDraft] = useState('');
  const [callerAnswerDraft, setCallerAnswerDraft] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [answerBusy, setAnswerBusy] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [peerLabel, setPeerLabel] = useState('');
  const [lastIncoming, setLastIncoming] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const destroy = () => {
    callerRef.current?.disconnect();
    callerRef.current = null;
    guestRef.current?.disconnect();
    guestRef.current = null;
  };

  useEffect(() => destroy, []);

  const makeTransport = (ref: MutableRefObject<P2PTransport | null>, localPublicKey: string): P2PTransport => {
    ref.current?.disconnect();
    const tr = new P2PTransport({
      signalingUrl: '',
      localPublicKey,
      onMessage: (data) => setLastIncoming(data),
      onConnected: (peerId) => {
        setConnected(true);
        setPeerLabel(peerId.slice(0, 12));
      },
      onDisconnected: () => setConnected(false),
      obfuscationEnabled: true,
    } as any);
    tr.enablePairingMode();
    ref.current = tr;
    return tr;
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleCreateOffer = async () => {
    setInviteBusy(true);
    setLastIncoming(null);
    try {
      const payload = await makeTransport(callerRef, deviceKeys.caller).createPairingOffer();
      setOffer(payload);
    } catch {
      setOffer('');
      setLastIncoming('failed');
    } finally {
      setInviteBusy(false);
    }
  };

  const handleGenerateAnswer = async () => {
    setAnswerBusy(true);
    setLastIncoming(null);
    try {
      const payload = await makeTransport(guestRef, deviceKeys.guest).acceptPairingOffer(guestOfferDraft.trim());
      setAnswer(payload);
    } catch {
      setAnswer('');
      setLastIncoming('invalid invite');
    } finally {
      setAnswerBusy(false);
    }
  };

  const handleConnectCaller = async () => {
    setConnecting(true);
    try {
      await callerRef.current?.acceptPairingAnswer(callerAnswerDraft.trim());
    } catch {
      setLastIncoming('invalid answer');
    } finally {
      setConnecting(false);
    }
  };

  const handleSendTest = () => {
    const tr = callerRef.current ?? guestRef.current;
    if (!tr) return;
    tr.send(`lan-test:${Date.now()}`).catch(() => {});
  };

  const actionCls = `min-h-11 px-4 rounded-lg text-sm font-medium transition active:scale-[0.97] disabled:opacity-50 bg-[var(--accent)] text-[var(--ink-on-saturate)] hover:opacity-90`;

  return (
    <SubView key="mesh" title={t('mesh.title', 'LAN Mesh')} isDark={isDark} onBack={onBack}>
      <p className={`mb-4 text-[13px] leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
        {t('mesh.hint', 'Serverless peer-to-peer: two devices on the same network exchange an invite QR and an answer QR. No signaling server involved — the session is encrypted with an ephemeral ECDH (X25519) + AES-GCM key pair derived locally on both sides.')}
      </p>

      <SettingsSectionTitle title={t('mesh.stepCaller', 'Step 1 — Inviter')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <div className="p-4">
          <button className={actionCls} onClick={handleCreateOffer} disabled={inviteBusy}>
            {inviteBusy ? t('common.loading', 'Loading…') : t('mesh.createInvite', 'Create invite QR')}
          </button>
          {offer && (
            <div className="mt-4 flex flex-col items-center gap-3">
              <QrCode data={offer} size={180} />
              <textarea
                value={offer}
                readOnly
                aria-label={t('mesh.invitePayload', 'Invite payload')}
                className={`w-full h-20 resize-none rounded-lg p-2 text-[11px] font-mono ${isDark ? 'bg-black/30 text-gray-300' : 'bg-slate-100 text-slate-600'}`}
              />
              <div className="flex items-center gap-2 w-full">
                <button className={`min-h-11 flex-1 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 ${isDark ? 'bg-white/5 text-gray-200' : 'bg-slate-100 text-slate-700'}`} onClick={() => copy(offer)}>
                  {copied ? <Check size={16} /> : <Copy size={16} />} {t('mesh.copy', 'Copy')}
                </button>
              </div>
            </div>
          )}
        </div>
      </SettingsGroup>

      <SettingsSectionTitle title={t('mesh.stepGuest', 'Step 2 — Guest (same network only)')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <div className="p-4 flex flex-col gap-3">
          <textarea
            value={guestOfferDraft}
            onChange={(e) => setGuestOfferDraft(e.target.value)}
            placeholder={t('mesh.invitePlaceholder', 'Paste the invite payload here…')}
            aria-label={t('mesh.inviteInput', 'Invite payload input')}
            className={`min-h-24 w-full resize-none rounded-lg p-2 text-[11px] font-mono ${isDark ? 'bg-black/30 text-gray-300' : 'bg-slate-100 text-slate-600'}`}
          />
          <button className={actionCls} onClick={handleGenerateAnswer} disabled={answerBusy || !guestOfferDraft.trim()}>
            {answerBusy ? t('common.loading', 'Loading…') : t('mesh.generateAnswer', 'Generate answer QR')}
          </button>
          {answer && (
            <div className="flex flex-col items-center gap-3">
              <QrCode data={answer} size={180} />
              <textarea
                value={answer}
                readOnly
                aria-label={t('mesh.answerPayload', 'Answer payload')}
                className={`w-full h-20 resize-none rounded-lg p-2 text-[11px] font-mono ${isDark ? 'bg-black/30 text-gray-300' : 'bg-slate-100 text-slate-600'}`}
              />
              <button className={`min-h-11 w-full rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 ${isDark ? 'bg-white/5 text-gray-200' : 'bg-slate-100 text-slate-700'}`} onClick={() => copy(answer)}>
                {copied ? <Check size={16} /> : <Copy size={16} />} {t('mesh.copy', 'Copy')}
              </button>
            </div>
          )}
        </div>
      </SettingsGroup>

      <SettingsSectionTitle title={t('mesh.stepCallerFinal', 'Step 3 — Inviter (finish)')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <div className="p-4 flex flex-col gap-3">
          <textarea
            value={callerAnswerDraft}
            onChange={(e) => setCallerAnswerDraft(e.target.value)}
            placeholder={t('mesh.answerPlaceholder', 'Paste the answer payload here…')}
            aria-label={t('mesh.answerInput', 'Answer payload input')}
            className={`min-h-24 w-full resize-none rounded-lg p-2 text-[11px] font-mono ${isDark ? 'bg-black/30 text-gray-300' : 'bg-slate-100 text-slate-600'}`}
          />
          <button className={actionCls} onClick={handleConnectCaller} disabled={connecting || !callerAnswerDraft.trim()}>
            {connecting ? t('common.loading', 'Loading…') : t('mesh.connect', 'Connect')}
          </button>
        </div>
      </SettingsGroup>

      <SettingsGroup isDark={isDark} className="mb-6">
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>{t('mesh.session', 'Session')}</span>
            <span className={`flex items-center gap-1.5 text-xs font-medium ${connected ? 'text-emerald-500' : isDark ? 'text-gray-400' : 'text-slate-400'}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              {connected ? t('mesh.connected', 'Connected') : t('mesh.idle', 'Idle')}
            </span>
          </div>
          {peerLabel && <div className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t('mesh.peer', 'Peer')}: {peerLabel}</div>}
          {connected && (
            <button className="min-h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 bg-emerald-500/15 text-emerald-600" onClick={handleSendTest}>
              <Send size={16} /> {t('mesh.sendTest', 'Send test message')}
            </button>
          )}
          {lastIncoming && (
            <div className={`rounded-lg p-2 text-xs font-mono break-words ${isDark ? 'bg-black/30 text-gray-300' : 'bg-slate-100 text-slate-600'}`}>
              {t('mesh.received', 'Received')}: {lastIncoming}
            </div>
          )}
          {connected && (
            <button className="min-h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 bg-rose-500/10 text-rose-500" onClick={destroy}>
              <Unplug size={16} /> {t('mesh.reset', 'Disconnect / reset session')}
            </button>
          )}
        </div>
      </SettingsGroup>
    </SubView>
  );
};