import { useState, useRef, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAdminI18n } from '../lib/i18n'

export default function Verify2FA() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { verify2FA } = useAuth()
  const { t } = useAdminI18n()
  const navigate = useNavigate()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (i: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[i] = value.slice(-1)
    setCode(newCode)
    if (value && i < 5) inputRefs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputRefs.current[i - 1]?.focus()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length !== 6) return
    setError('')
    setLoading(true)
    try {
      await verify2FA(fullCode)
      navigate('/')
    } catch {
      setError(t('verify2fa.invalidCode'))
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1a1d24] rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold mb-2">🔑</div>
          <h1 className="text-xl font-bold">{t('verify2fa.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('verify2fa.subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-2 mb-6">
            {code.map((digit, i) => (
              <input key={i} ref={(el: HTMLInputElement | null) => { inputRefs.current[i] = el }}
                type="text" inputMode="numeric" maxLength={1}
                value={digit} onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-10 h-12 bg-[#0d0f12] text-white text-lg font-bold text-center rounded-xl border border-white/5 focus:border-orange-500/50 outline-none"
                autoFocus={i === 0} />
            ))}
          </div>
          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
          <button type="submit" disabled={loading || code.join('').length !== 6}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all">
            {loading ? t('verify2fa.verifying') : t('verify2fa.verifyButton')}
          </button>
        </form>
      </div>
    </div>
  )
}