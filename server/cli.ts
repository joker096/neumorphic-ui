import bcrypt from 'bcrypt'
import QRCode from 'qrcode'
import { getDb, closeDb } from './db.js'
import { generateTotpSecret } from './auth.js'

async function createAdmin(username: string, password: string): Promise<void> {
  getDb()
  const existing = getDb().prepare('SELECT id FROM admins WHERE username = ?').get(username)
  if (existing) {
    console.error(`Admin "${username}" already exists`)
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const { secret, uri } = generateTotpSecret()

  getDb().prepare(
    'INSERT INTO admins (username, password_hash, totp_secret) VALUES (?, ?, ?)'
  ).run(username, passwordHash, secret)

  console.log(`\nAdmin "${username}" created successfully!\n`)
  console.log(`TOTP Secret: ${secret}`)

  try {
    const qr = await QRCode.toString(uri, { type: 'terminal', small: true })
    console.log('\nScan this QR code in Google Authenticator:\n')
    console.log(qr)
  } catch {
    console.log(`QR generation failed. Use URI: ${uri}`)
  }

  console.log(`\nTOTP URI: ${uri}\n`)
  closeDb()
}

const username = process.argv[2]
const password = process.argv[3]

if (!username || !password) {
  console.error('Usage: npx tsx server/cli.ts <username> <password>')
  process.exit(1)
}

createAdmin(username, password).catch((err) => {
  console.error('Failed to create admin:', err)
  closeDb()
  process.exit(1)
})
