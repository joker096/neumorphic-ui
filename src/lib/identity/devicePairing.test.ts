// @vitest-environment node
import { describe, it, expect } from 'vitest';
import * as nacl from 'tweetnacl';
import { generateMasterSeed, deriveKeysFromSeed } from './masterKey';
import { createPairingQrData, parsePairingQrData, createPairingResponse, verifyPairingResponse } from './devicePairing';

describe('devicePairing', () => {
  it('creates and parses QR data in a round trip', async () => {
    const master = await deriveKeysFromSeed(await generateMasterSeed());
    const { data, secretKey } = createPairingQrData(master, 'https://relay.example.com');
    const parsed = parsePairingQrData(data);
    expect(parsed.request.serverUrl).toBe('https://relay.example.com');
    expect(parsed.ephemeralPublicKey.length).toBe(32);
    expect(secretKey.length).toBe(32);
  });

  it('parsePairingQrData throws on malformed data', () => {
    expect(() => parsePairingQrData('not-valid-base64-!!!')).toThrow();
    expect(() => parsePairingQrData(btoa('{"foo":1}'))).toThrow();
  });

  it('createPairingResponse + verifyPairingResponse succeeds', async () => {
    const master = await deriveKeysFromSeed(await generateMasterSeed());
    const { data, secretKey } = createPairingQrData(master, 'https://relay.example.com');
    const parsed = parsePairingQrData(data);
    const kp = nacl.box.keyPair();
    const deviceKp = { x25519Public: kp.publicKey, x25519Secret: kp.secretKey };
    const response = createPairingResponse(parsed.request, master, 'Laptop', secretKey, deviceKp, '123456');
    expect(response.deviceName).toBe('Laptop');
    expect(response.totpCode).toBe('123456');
    const verified = verifyPairingResponse(response, master);
    expect(verified).not.toBeNull();
    expect(verified!.deviceId).toBe(response.deviceId);
  });

  it('verifyPairingResponse returns null for the wrong master', async () => {
    const masterA = await deriveKeysFromSeed(await generateMasterSeed());
    const masterB = await deriveKeysFromSeed(await generateMasterSeed());
    const { data, secretKey } = createPairingQrData(masterA, 'https://relay.example.com');
    const parsed = parsePairingQrData(data);
    const kp = nacl.box.keyPair();
    const deviceKp = { x25519Public: kp.publicKey, x25519Secret: kp.secretKey };
    const response = createPairingResponse(parsed.request, masterA, 'Laptop', secretKey, deviceKp);
    expect(verifyPairingResponse(response, masterB)).toBeNull();
  });
});
