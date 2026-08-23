import { secureGetItem, secureSetItem, secureRemoveItem } from './secureStorage'
import { PAYMENTO_SECURE_KEYS } from '../config/paymento'
import type { PaymentoConfig } from '../types/paymento'

async function read(key: string): Promise<string> {
  return (await secureGetItem(key)) || ''
}

async function write(key: string, value: string): Promise<void> {
  if (value) await secureSetItem(key, value)
  else await secureRemoveItem(key)
}

export async function getPaymentoConfig(): Promise<PaymentoConfig> {
  const [apiKey, secretKey, ipnUrl, returnUrl, enabled] = await Promise.all([
    read(PAYMENTO_SECURE_KEYS.apiKey),
    read(PAYMENTO_SECURE_KEYS.secretKey),
    read(PAYMENTO_SECURE_KEYS.ipnUrl),
    read(PAYMENTO_SECURE_KEYS.returnUrl),
    read(PAYMENTO_SECURE_KEYS.enabled),
  ])
  return {
    apiKey,
    secretKey,
    ipnUrl,
    returnUrl,
    enabled: enabled === '1',
  }
}

export async function savePaymentoConfig(partial: Partial<PaymentoConfig>): Promise<PaymentoConfig> {
  const current = await getPaymentoConfig()
  const next: PaymentoConfig = { ...current, ...partial }
  await Promise.all([
    write(PAYMENTO_SECURE_KEYS.apiKey, next.apiKey),
    write(PAYMENTO_SECURE_KEYS.secretKey, next.secretKey),
    write(PAYMENTO_SECURE_KEYS.ipnUrl, next.ipnUrl),
    write(PAYMENTO_SECURE_KEYS.returnUrl, next.returnUrl),
    write(PAYMENTO_SECURE_KEYS.enabled, next.enabled ? '1' : ''),
  ])
  return next
}

export async function setPaymentoIpnUrl(url: string): Promise<PaymentoConfig> {
  return savePaymentoConfig({ ipnUrl: url })
}

export async function clearPaymentoSecret(): Promise<PaymentoConfig> {
  return savePaymentoConfig({ secretKey: '' })
}
