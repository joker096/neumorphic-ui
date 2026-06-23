export async function computeSafetyNumber(myPublicKey: string, theirPublicKey: string): Promise<string> {
  const sorted = [myPublicKey, theirPublicKey].sort()
  const combined = new TextEncoder().encode(sorted[0] + sorted[1])
  const hash = await crypto.subtle.digest('SHA-256', combined)
  const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
  const groups: string[] = []
  for (let i = 0; i < hex.length && groups.length < 12; i += 5) {
    groups.push(hex.slice(i, i + 5))
  }
  return groups.join(' ')
}

export function computeVerificationLevel(hex: string): number {
  const digits = hex.replace(/\s/g, '')
  let matches = 0
  for (let i = 0; i < digits.length - 1; i++) {
    if (digits[i] === digits[i + 1]) matches++
    if (digits[i] === digits[i + 2]) matches++
    if (digits[i] === '0' || digits[i] === 'F') matches++
  }
  return Math.min(100, matches)
}

export function getVerificationColor(level: number): string {
  if (level >= 80) return '#22c55e'
  if (level >= 50) return '#eab308'
  return '#94a3b8'
}
