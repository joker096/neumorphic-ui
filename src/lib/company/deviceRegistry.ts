import * as idb from 'idb-keyval'
import { generateX25519KeyPair, b64encode } from '../crypto/cryptoCore'
import type { DeviceRecord } from './types'

const DEVICES_KEY = 'mess_company_devices'
const CURRENT_DEVICE_ID_KEY = 'mess_current_device_id'

export function generateDeviceId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const b64 = b64encode(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `dev_${b64}`
}

export async function createDevice(name: string = 'This Device'): Promise<DeviceRecord> {
  const keyPair = generateX25519KeyPair()
  const device: DeviceRecord = {
    deviceId: generateDeviceId(),
    name,
    publicKey: keyPair.publicKey,
    masterKeyRef: `mess_company_user_keys_${generateDeviceId()}`,
    isCurrent: true,
    lastActive: Date.now(),
  }
  return device
}

export async function saveDevice(device: DeviceRecord): Promise<void> {
  const devices = await getDevices()
  const existing = devices.find(d => d.deviceId === device.deviceId)
  if (existing) {
    const index = devices.findIndex(d => d.deviceId === device.deviceId)
    devices[index] = device
  } else {
    devices.push(device)
  }
  await idb.set(DEVICES_KEY, serializeDevices(devices))
}

export async function getDevices(): Promise<DeviceRecord[]> {
  const data = await idb.get(DEVICES_KEY)
  return deserializeDevices(data)
}

export async function getCurrentDeviceId(): Promise<string | null> {
  return await idb.get(CURRENT_DEVICE_ID_KEY)
}

export async function setCurrentDeviceId(id: string): Promise<void> {
  await idb.set(CURRENT_DEVICE_ID_KEY, id)
  const devices = await getDevices()
  for (const d of devices) {
    d.isCurrent = d.deviceId === id
  }
  await idb.set(DEVICES_KEY, serializeDevices(devices))
}

export async function removeDevice(deviceId: string): Promise<void> {
  const devices = await getDevices()
  await idb.set(DEVICES_KEY, serializeDevices(
    devices.filter(d => d.deviceId !== deviceId)
  ))
}

function serializeDevices(devices: DeviceRecord[]): any[] {
  return devices.map(d => ({
    ...d,
    publicKey: arrayToBase64(d.publicKey),
  }))
}

function deserializeDevices(data: any): DeviceRecord[] {
  if (!Array.isArray(data)) return []
  return data.map(d => ({
    ...d,
    publicKey: base64ToArray(d.publicKey),
  }))
}

function arrayToBase64(arr: Uint8Array): string {
  return b64encode(arr)
}

function base64ToArray(b64: string): Uint8Array {
  const padded = b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, '=')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0))
}