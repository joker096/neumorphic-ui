import { useState } from 'react';
import { Sheet } from './ui/Sheet';
import { Shield, Check, Copy, RefreshCw } from 'lucide-react';

const EMOJI_SET = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐮', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅',
  '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌',
  '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖',
  '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬',
  '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘',
];

function keyToEmojiFingerprint(publicKey: string): string[] {
  let hash = 0;
  for (let i = 0; i < Math.min(publicKey.length, 32); i++) {
    hash = ((hash << 5) - hash) + publicKey.charCodeAt(i);
    hash = hash & hash;
  }
  const indices: number[] = [];
  for (let i = 0; i < 7; i++) {
    const idx = Math.abs((hash >> (i * 4)) ^ publicKey.charCodeAt(i * 3 || 1)) % EMOJI_SET.length;
    indices.push(idx);
  }
  return indices.map(i => EMOJI_SET[i]);
}

function keyToHexFingerprint(publicKey: string): string {
  let hash = 0;
  for (let i = 0; i < publicKey.length; i++) {
    const char = publicKey.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex.slice(0, 4)} ${hex.slice(4, 8)}`.toUpperCase();
}

interface KeyVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  peerName: string;
  peerPublicKey: string;
  isDark: boolean;
}

export function KeyVerificationModal({ isOpen, onClose, peerName, peerPublicKey, isDark }: KeyVerificationModalProps) {
  const [copied, setCopied] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const emojiFingerprint = keyToEmojiFingerprint(peerPublicKey);
  const hexFingerprint = keyToHexFingerprint(peerPublicKey);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `Mess&Anger Safety Number\nPeer: ${peerName}\nFingerprint: ${emojiFingerprint.join(' ')}\nHex: ${hexFingerprint}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} detent="medium">
      <div className="flex flex-col items-center gap-6 pt-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
          <Shield size={32} className={isDark ? 'text-green-400' : 'text-green-600'} />
        </div>

        <div className="text-center">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Safety Number
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Verify with {peerName} out-of-band
          </p>
        </div>

        <div className={`w-full p-6 rounded-2xl ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F2F2F7]'}`}>
          <div className="flex justify-center gap-2 flex-wrap mb-4">
            {emojiFingerprint.map((emoji, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                  isDark ? 'bg-[#2C2C2E]' : 'bg-white shadow-sm'
                }`}
              >
                {emoji}
              </div>
            ))}
          </div>

          <div className={`text-center font-mono text-xs tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
            {hexFingerprint}
          </div>
        </div>

        <div className={`text-xs text-center px-4 leading-relaxed ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
          Compare these emoji with {peerName} in person or via a trusted channel.
          If they match, the connection is secure.
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={handleCopy}
            className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
              copied
                ? 'bg-green-500 text-white'
                : isDark
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-black/5 text-slate-700 hover:bg-black/10'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            onClick={() => { setIsVerified(true); onClose(); }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              isDark
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            <Check size={16} className="inline mr-1" />
            Verified
          </button>
        </div>
      </div>
    </Sheet>
  );
}
