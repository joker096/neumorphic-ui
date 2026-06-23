// Bot sandbox — prevents bots from accessing sensitive browser APIs

const ALLOWED_FETCH_DOMAINS = [
  'api.tenor.com',
  'api.giphy.com',
  'i.imgur.com',
  'fonts.googleapis.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
]

let sandboxActive = false
let origLocalStorage: Storage | null = null
let origIndexedDB: IDBFactory | null = null
let origFetch: typeof globalThis.fetch | null = null
let origOpen: typeof XMLHttpRequest.prototype.open | null = null

export function activateBotSandbox(): void {
  if (sandboxActive) return
  sandboxActive = true

  origLocalStorage = window.localStorage
  origIndexedDB = window.indexedDB
  origFetch = globalThis.fetch
  origOpen = XMLHttpRequest.prototype.open

  const storageHandler: ProxyHandler<Storage> = {
    get(_target, prop) {
      if (prop === 'getItem' || prop === 'setItem' || prop === 'removeItem' || prop === 'clear' || prop === 'key' || prop === 'length') {
        return () => { throw new Error('BotSandbox: localStorage access denied') }
      }
      return undefined as any
    },
  }
  Object.defineProperty(window, 'localStorage', {
    get: () => new Proxy({} as Storage, storageHandler),
    configurable: true,
  })

  Object.defineProperty(window, 'indexedDB', {
    get: () => { throw new Error('BotSandbox: IndexedDB access denied') },
    configurable: true,
  })

  globalThis.fetch = new Proxy(origFetch, {
    apply(target, thisArg, args: [RequestInfo, RequestInit?]) {
      const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : ''
      const allowed = ALLOWED_FETCH_DOMAINS.some(d => url.includes(d))
      if (!allowed) {
        return Promise.reject(new Error(`BotSandbox: fetch to ${url} denied`))
      }
      return Reflect.apply(target, thisArg, args)
    },
  }) as typeof globalThis.fetch

  XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
    apply(target, thisArg, args) {
      const method = String(args[0])
      const url = String(args[1])
      const allowed = ALLOWED_FETCH_DOMAINS.some(d => url.includes(d))
      if (!allowed) {
        throw new Error(`BotSandbox: XHR to ${url} denied`)
      }
      return Reflect.apply(target, thisArg, args)
    },
  }) as typeof XMLHttpRequest.prototype.open
}

export function deactivateBotSandbox(): void {
  if (!sandboxActive) return
  sandboxActive = false

  if (origLocalStorage) {
    Object.defineProperty(window, 'localStorage', {
      get: () => origLocalStorage,
      configurable: true,
    })
  }
  if (origIndexedDB) {
    Object.defineProperty(window, 'indexedDB', {
      get: () => origIndexedDB,
      configurable: true,
    })
  }
  if (origFetch) {
    globalThis.fetch = origFetch
  }
  if (origOpen) {
    XMLHttpRequest.prototype.open = origOpen
  }
}
