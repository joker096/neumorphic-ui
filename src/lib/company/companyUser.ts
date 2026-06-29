import * as idb from 'idb-keyval'
import { STORAGE_KEYS } from '../../constants/storage'
import type { CompanyUser, CompanyMember, CompanyRole } from './types'
import { generateX25519KeyPair, b64encode, b64decode } from '../../lib/crypto/cryptoCore'
import { generateEd25519KeyPair as genEd25519KeyPair } from '../../lib/crypto/ed25519'

const CURRENT_USER_KEY = 'current_company_user'

export function generateUserId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const b64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `usr_${b64}`
}

export function generateCompanyId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const b64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `org_${b64}`
}

export function generateInviteCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  const b64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return b64
}

export async function createCompanyUser(
  displayName: string,
  companyId: string,
  role: CompanyRole = 'member'
): Promise<CompanyUser> {
  const x25519KeyPair = generateX25519KeyPair()
  const ed25519KeyPair = genEd25519KeyPair()

  const user: CompanyUser = {
    userId: generateUserId(),
    companyId,
    displayName,
    publicKey: x25519KeyPair.publicKey,
    signatureKey: ed25519KeyPair.publicKey,
    devices: [],
    joinedAt: Date.now(),
    role,
  }

  await saveCurrentUser(user)
  await saveUserKeyPair(user.userId, {
    x25519Public: x25519KeyPair.publicKey,
    x25519Secret: x25519KeyPair.secretKey,
    ed25519Public: ed25519KeyPair.publicKey,
    ed25519Secret: ed25519KeyPair.secretKey,
  })

  return user
}

export async function getCurrentUser(): Promise<CompanyUser | null> {
  const data = await idb.get(CURRENT_USER_KEY)
  if (!data) return null
  return deserializeUser(data)
}

export async function saveCurrentUser(user: CompanyUser): Promise<void> {
  await idb.set(CURRENT_USER_KEY, serializeUser(user))
}

export async function clearCurrentUser(): Promise<void> {
  await idb.del(CURRENT_USER_KEY)
}

export async function saveMembers(members: CompanyMember[]): Promise<void> {
  await idb.set(STORAGE_KEYS.COMPANY_MEMBERS, members)
}

export async function getMembers(): Promise<CompanyMember[]> {
  const members = await idb.get(STORAGE_KEYS.COMPANY_MEMBERS)
  return Array.isArray(members) ? members : []
}

export async function addMember(member: CompanyMember): Promise<void> {
  const members = await getMembers()
  const existing = members.find(m => m.userId === member.userId)
  if (existing) {
    const index = members.findIndex(m => m.userId === member.userId)
    members[index] = member
  } else {
    members.push(member)
  }
  await saveMembers(members)
}

export async function removeMember(userId: string): Promise<void> {
  const members = await getMembers()
  await saveMembers(members.filter(m => m.userId !== userId))
}

export function arrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function base64ToArray(b64: string): Uint8Array {
  const padded = b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, '=')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0))
}

function serializeUser(user: CompanyUser): any {
  return {
    ...user,
    publicKey: arrayToBase64(user.publicKey),
    signatureKey: arrayToBase64(user.signatureKey),
  }
}

function deserializeUser(data: any): CompanyUser {
  return {
    ...data,
    publicKey: base64ToArray(data.publicKey),
    signatureKey: base64ToArray(data.signatureKey),
  }
}

async function saveUserKeyPair(userId: string, keyPair: {
  x25519Public: Uint8Array
  x25519Secret: Uint8Array
  ed25519Public: Uint8Array
  ed25519Secret: Uint8Array
}): Promise<void> {
  const combined = new Uint8Array(
    keyPair.x25519Secret.length +
    keyPair.x25519Public.length +
    keyPair.ed25519Secret.length +
    keyPair.ed25519Public.length
  )
  let offset = 0
  combined.set(keyPair.x25519Secret, offset); offset += keyPair.x25519Secret.length
  combined.set(keyPair.x25519Public, offset); offset += keyPair.x25519Public.length
  combined.set(keyPair.ed25519Secret, offset); offset += keyPair.ed25519Secret.length
  combined.set(keyPair.ed25519Public, offset)

  await idb.set(`mess_company_user_keys_${userId}`, arrayToBase64(combined))
}