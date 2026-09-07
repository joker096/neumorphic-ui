import { BOT_DEFAULT_OWNER_ID, BOT_ID_PREFIX } from '../constants/botConstants';
import { DEFAULT_BOT_PERMISSIONS } from '../store/defaults';
import type { BotConfig } from '../store/types';
import { deviceSecurity } from './deviceSecurity';
import { buf2hex } from './crypto/cryptoCore';

/**
 * Builds a local bot config: ECDH P-256 key pair (public key exported raw → base64),
 * device-fingerprint hash + private-JWK secret embedded in the token.
 * Single source of truth for bot creation (previously inlined in CreateBotModal).
 */
export const createBotConfig = async (name: string): Promise<BotConfig> => {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits'],
  );

  const pubRaw = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
  const privJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
  const pubBase64 = btoa(String.fromCharCode(...new Uint8Array(pubRaw)));

  const fingerprint = await deviceSecurity.getDeviceFingerprint();
  const fpHash = buf2hex(await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint))).substring(0, 8);
  const privBase64 = btoa(privJwk.d || 'mock_priv_d');

  const botId = `${BOT_ID_PREFIX}${Date.now()}`;

  return {
    id: botId,
    name: name.trim(),
    token: `bot:${botId}_${fpHash}_${privBase64}`,
    publicKey: pubBase64,
    ownerId: BOT_DEFAULT_OWNER_ID,
    commands: [],
    permissions: { ...DEFAULT_BOT_PERMISSIONS },
    isRunning: false,
  };
};
