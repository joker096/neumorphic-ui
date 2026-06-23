import { useEffect } from 'react'

export function useScreenshotProtection(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return
    const styleId = '__screenshot_protect_style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .screenshot-protect::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(0,0,0,0.95);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: monospace;
          font-size: 14px;
          letter-spacing: 0.1em;
        }
        .screenshot-protect::after {
          content: '🔒 Mess&Anger';
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 100000;
          color: rgba(255,255,255,0.6);
          font-family: system-ui, sans-serif;
          font-size: 18px;
          letter-spacing: 0.15em;
          font-weight: 600;
        }
      `
      document.head.appendChild(style)
    }
    const handleVisibility = () => {
      if (document.hidden) {
        document.documentElement.classList.add('screenshot-protect')
      } else {
        document.documentElement.classList.remove('screenshot-protect')
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      document.documentElement.classList.remove('screenshot-protect')
    }
  }, [enabled])
}
