import { describe, it, expect } from 'vitest';
import * as nacl from 'tweetnacl';
import { generateMasterSeed, deriveKeysFromSeed } from './masterKey';
import { generateDeviceKeyPair, verifyDeviceKey } from './deviceKeys';

describe('deviceKeys', () => {
  it('generates a device keypair signed by the master key', async () => {
    const master = await deriveKeysFromSeed(await generateMasterSeed());
    const device = generateDeviceKeyPair(master, 'Phone');
    expect(device.name).toBe('Phone');
    expect(device.deviceId.startsWith('dvc_')).toBe(true);
    expect(device.x25519Public.length).toBe(32);
    expect(device.x25519Secret.length).toBe(32);
    expect(device.signature.length).toBe(64);
  });

  it('verifyDeviceKey succeeds for a valid signature', async () => {
    const master = await deriveKeysFromSeed(await generateMasterSeed());
    const device = generateDeviceKeyPair(master, 'Phone');
    expect(verifyDeviceKey(device, master.ed25519Public)).toBe(true);
  });

  it('verifyDeviceKey fails for the wrong master public key', async () => {
    const masterA = await deriveKeysFromSeed(await generateMasterSeed());
    const masterB = await deriveKeysFromSeed(await generateMasterSeed());
    const device = generateDeviceKeyPair(masterA, 'Phone');
    expect(verifyDeviceKey(device, masterB.ed25519Public)).toBe(false);
  });
});
