// Client for the crypto Web Worker — offloads AES-GCM/HMAC/PBKDF2 from main thread

type WorkerRequest = {
  type: 'encrypt' | 'decrypt' | 'hmac' | 'hash' | 'deriveKey'
  key?: Uint8Array
  iv?: Uint8Array
  plaintext?: Uint8Array
  ciphertext?: Uint8Array
  message?: Uint8Array
  salt?: Uint8Array
  iterations?: number
  length?: number
}

let worker: Worker | null = null
let requestId = 0
const pending = new Map<string, { resolve: (v: Uint8Array) => void; reject: (e: Error) => void }>()

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./crypto.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<{ id: string; result?: Uint8Array; error?: string }>) => {
      const { id, result, error } = e.data
      const p = pending.get(id)
      if (!p) return
      pending.delete(id)
      if (error) p.reject(new Error(error))
      else p.resolve(result!)
    }
  }
  return worker
}

async function run(type: WorkerRequest['type'], data: Omit<WorkerRequest, 'type'>): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const id = String(++requestId)
    pending.set(id, { resolve, reject })
    getWorker().postMessage({ type, id, data })
  })
}

export const cryptoWorker = {
  encrypt(key: Uint8Array, iv: Uint8Array, plaintext: Uint8Array) {
    return run('encrypt', { key, iv, plaintext })
  },
  decrypt(key: Uint8Array, iv: Uint8Array, ciphertext: Uint8Array) {
    return run('decrypt', { key, iv, ciphertext })
  },
  hmac(key: Uint8Array, message: Uint8Array) {
    return run('hmac', { key, message })
  },
  hash(message: Uint8Array) {
    return run('hash', { message })
  },
  deriveKey(passphrase: Uint8Array, salt: Uint8Array, iterations = 600000, length = 256) {
    return run('deriveKey', { message: passphrase, salt, iterations, length })
  },
  terminate() {
    if (worker) { worker.terminate(); worker = null }
  },
}
