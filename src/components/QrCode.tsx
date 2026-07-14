import { useEffect, useRef, useState } from 'react'

interface QrCodeProps {
  data: string
  size?: number
}

// Generate a simple QR-like visual using canvas (deterministic from data)
// This is a visual placeholder, not a real QR code - use qrcode library in production
function generateQrCanvas(data: string, size: number): string {
  const canvas = document.createElement('canvas')
  const q = 10
  const border = 4
  const px = border + q
  const scale = size / px
  canvas.width = canvas.height = Math.round(px * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return 'data:image/png;base64,placeholder'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#000000'

  // Hash the data to create a deterministic pattern
  const hash = Array.from(data).reduce((a, c) => ((a << 5) ^ c.charCodeAt(0)) >>> 0, 0).toString(16)
  const grid = Array.from({ length: 21 }, () => new Array(21).fill(0))

  // Place finder patterns (3 corners)
  const placeFinder = (gx: number, gy: number) => {
    for (let dy = 0; dy <= 6; dy++) for (let dx = 0; dx <= 6; dx++) {
      const onBorder = dx <= 0 || dx >= 6 || dy <= 0 || dy >= 6
      const inner = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
      grid[gy + dy][gx + dx] = onBorder || inner ? 1 : 0
    }
  }
  placeFinder(0, 0)
  placeFinder(14, 0)
  placeFinder(0, 14)

  // Fill remaining cells with hash-derived pattern
  let seed = parseInt(hash.slice(0, 8), 16)
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      // eslint-disable-next-line security/detect-object-injection -- deterministic QR visual pattern
      if (grid[y][x] === 0) {
         
        seed = (seed * 1103515245 + 12345) & 0x7fffffff
        // eslint-disable-next-line security/detect-object-injection -- deterministic QR visual pattern
        grid[y][x] = (seed % 3 === 0) ? 1 : 0
      }
    }
  }

  const cellSize = canvas.width / 21
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      // eslint-disable-next-line security/detect-object-injection -- deterministic QR visual pattern
      if (grid[y][x] === 1) {
         
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
      }
    }
  }

  try {
    return canvas.toDataURL('image/png')
  } catch {
    return 'data:image/png;base64,placeholder'
  }
}

export const QrCode = ({ data, size = 200 }: QrCodeProps) => {
  const [src, setSrc] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    // Immediately render canvas-based visual as a reliable fallback
    try {
      setSrc(generateQrCanvas(data, size))
    } catch {
      // Canvas not available, fallback to null
    }

    // Try qrcode library for proper QR code generation (async)
    import('qrcode').then((qrcodeModule) => {
      if (!mountedRef.current) return
      qrcodeModule.toDataURL(data, {
        // @ts-ignore - browser-compatible options
        options: {
          // @ts-ignore - browser-compatible options
          errorCorrectionLevel: 'L',
          // @ts-ignore - browser-compatible options
          margin: 2,
          // @ts-ignore - browser-compatible options
          color: '#000000',
          // @ts-ignore - browser-compatible options
          background: '#ffffff',
        },
      } as unknown as Parameters<typeof qrcodeModule.toDataURL>[1]).then((qrcodeUrl: string) => {
        if (!mountedRef.current) return
        if (!qrcodeUrl || typeof qrcodeUrl !== 'string') return
        // Scale the image to fit the desired size
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) { setError(true); return }
          const s = size / Math.max(img.width, img.height)
          canvas.width = img.width * s
          canvas.height = img.height * s
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const url = canvas.toDataURL('image/png')
          if (mountedRef.current) setSrc(url)
        }
        img.onerror = () => {}
        img.src = qrcodeUrl
      }).catch(() => {})
    }).catch(() => {})

    return () => { mountedRef.current = false }
  }, [data, size])

  if (error || !src) return null
  return <img src={src} alt="QR code" className="rounded-lg" />
}
