// Compatibility surface for the canonical crypto module. Every name below has a
// real consumer; `x25519DH`, `CryptoCore` and `b64decode` were dropped because
// all callers reach those through `./crypto/cryptoCore` directly.
export {
  buf2hex,
  hex2buf,
  cryptoCore,
  generateX25519KeyPair,
  b64encode,
} from './crypto/cryptoCore'
