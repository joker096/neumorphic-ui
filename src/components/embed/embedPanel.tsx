/**
 * Presentational shell of the embed widget (panel + FAB + toast). The stateful
 * logic lives in `EmbedWidget`; this file stays under the 300-line audit budget.
 */

import type { CSSProperties, ReactNode, RefObject } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';
import type { RelayStatus } from '../../lib/company/relaySocket';
import { EmbedContactForm, type WidgetContact } from './EmbedContactForm';

export interface WidgetMessage {
  id: string;
  text: string;
  own: boolean;
  ts: number;
}

const BRAND = 'Mess&Anger';

const URL_RE = /(https?:\/\/[^\s]+)/g;
/** Render message text, turning bare links into real <a> anchors (new tab). */
function autolink(text: string): ReactNode {
  const parts = text.split(URL_RE);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    URL_RE.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="ew-link"
        onClick={(e) => e.stopPropagation()}
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

type T = (k: string, fb?: string) => string;

export interface EmbedPanelProps {
  open: boolean;
  title: string;
  accent: string;
  position: 'bottom-right' | 'bottom-left';
  isDark: boolean;
  relayStatus: RelayStatus;
  showContactForm: boolean;
  contact: WidgetContact;
  onContactChange: (field: keyof WidgetContact, value: string) => void;
  sendingContact: boolean;
  onSendContact: () => void;
  relayNote: string | null;
  greeting?: string;
  messages: WidgetMessage[];
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  hideBrand: boolean;
  unread: number;
  toast: string | null;
  onToggleOpen: () => void;
  onClose: () => void;
  onOpenToast: () => void;
  t: T;
  panelRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  messagesRef: RefObject<HTMLDivElement | null>;
}

export function EmbedPanel({
  open, title, accent, position, isDark, relayStatus, showContactForm, contact,
  onContactChange, sendingContact, onSendContact, relayNote, greeting, messages,
  draft, onDraftChange, onSend, hideBrand, unread, toast, onToggleOpen,
  onClose, onOpenToast, t, panelRef, inputRef, messagesRef,
}: EmbedPanelProps) {
  return (
    <div
      data-ew-theme={isDark ? 'dark' : 'light'}
      data-ew-pos={position}
      className={`ew-root ${position === 'bottom-left' ? 'ew-bot-left' : 'ew-bot-right'}`}
      style={{ '--ew-accent': accent } as CSSProperties}
    >
      {open && (
        <div className="ew-panel" ref={panelRef}>
          <div className="ew-header" style={{ backgroundColor: accent, color: '#ffffff' }}>
            <div className="ew-header-left">
              <div className="ew-header-avatar">{title.charAt(0).toUpperCase()}</div>
              <span className="ew-header-title">{title}</span>
              {relayStatus === 'online' && <div className="ew-online-dot" aria-label="online" />}
            </div>
            <button onClick={onClose} aria-label={t('embed.close')} title={t('embed.close')} className="ew-close">
              <X size={18} />
            </button>
          </div>
          {showContactForm && (
            <EmbedContactForm
              t={t}
              accent={accent}
              contact={contact}
              onChange={onContactChange}
              onSend={() => void onSendContact()}
              sending={sendingContact}
            />
          )}
          <div className="ew-messages" ref={messagesRef} aria-live="polite">
            {relayNote && <div className="ew-offline-note">{relayNote}</div>}
            {greeting && messages.length === 0 && (
              <div className="ew-msg-row ew-msg-other">
                <div className="ew-msg">{autolink(greeting)}</div>
              </div>
            )}
            {messages.length === 0 && !greeting ? (
              <div className="ew-empty">{t('embed.start')}</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`ew-msg-row ${m.own ? 'ew-msg-own' : 'ew-msg-other'}`}>
                  <div className={`ew-msg ${m.own ? 'ew-msg-own-bubble' : ''}`}>{autolink(m.text)}</div>
                  <div className="ew-time">
                    {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="ew-composer">
            <input
              aria-label={t('embed.typeMessage')}
              ref={inputRef}
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void onSend();
                }
              }}
              placeholder={t('embed.typeMessage')}
              className="ew-input"
            />
            <button
              onClick={() => void onSend()}
              disabled={!draft.trim()}
              aria-label={t('embed.send', 'Send')}
              title={t('embed.send', 'Send')}
              className="ew-send"
              style={{ backgroundColor: accent }}
            >
              <Send size={16} />
            </button>
          </div>
          {!hideBrand && (
            <div className="ew-footer">{t('embed.poweredBy', 'Powered by ')}<b>{BRAND}</b></div>
          )}
        </div>
      )}
      <button
        onClick={onToggleOpen}
        aria-label={open ? t('embed.close') : t('embed.openChat')}
        className="ew-fab"
        style={{ backgroundColor: accent }}
      >
        {open ? <X size={24} /> : <MessageSquare size={24} />}
        {!open && unread > 0 && <span className="ew-fab-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {toast && !open && (
        <button className="ew-toast" onClick={onOpenToast} aria-label={t('embed.openChat')}>
          {toast}
        </button>
      )}
    </div>
  );
}
