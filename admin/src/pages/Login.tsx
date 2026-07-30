import { useState, FormEvent, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAdminI18n } from '../lib/i18n'
import { Lock, User, Shield } from 'lucide-react'

interface CaptchaState {
  challenge: string
  answer: number
}

function generateCaptcha(): CaptchaState {
  const ops = ['+', '-', '\u00d7']
  const op = ops[Math.floor(Math.random() * ops.length)]
  let a = 0, b = 0, answer = 0
  if (op === '+') {
    a = Math.floor(Math.random() * 50) + 1
    b = Math.floor(Math.random() * 50) + 1
    answer = a + b
  } else if (op === '-') {
    a = Math.floor(Math.random() * 50) + 10
    b = Math.floor(Math.random() * Math.min(a, 50)) + 1
    answer = a - b
  } else {
    a = Math.floor(Math.random() * 12) + 1
    b = Math.floor(Math.random() * 12) + 1
    answer = a * b
  }
  return { challenge: `${a} ${op} ${b} = ?`, answer }
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captcha, setCaptcha] = useState<CaptchaState>(generateCaptcha)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaError, setCaptchaError] = useState('')
  const { login } = useAuth()
  const { t } = useAdminI18n()
  const navigate = useNavigate()
  const captchaInputRef = useRef<HTMLInputElement>(null)

  const handleRefreshCaptcha = () => {
    setCaptcha(generateCaptcha())
    setCaptchaAnswer('')
    setCaptchaError('')
    captchaInputRef.current?.focus()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setCaptchaError('')

    const userAnswer = parseInt(captchaAnswer, 10)
    if (userAnswer !== captcha.answer) {
      setCaptchaError(t('login.captchaInvalid'))
      setCaptcha(generateCaptcha())
      setCaptchaAnswer('')
      captchaInputRef.current?.focus()
      return
    }

    setLoading(true)
    try {
      await login(username, password)
      navigate('/login/2fa')
    } catch {
      setError(t('login.invalidCredentials'))
      setCaptcha(generateCaptcha())
      setCaptchaAnswer('')
      captchaInputRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[var(--bg-tertiary)] rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold mb-2">🔐</div>
          <h1 className="text-xl font-bold">{t('login.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">{t('login.username')}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-2.5 border border-[var(--border-color)] focus:border-orange-500/50 outline-none text-sm"
                placeholder={t('login.usernamePlaceholder')} required autoFocus />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">{t('login.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-2.5 border border-[var(--border-color)] focus:border-orange-500/50 outline-none text-sm"
                placeholder={t('login.passwordPlaceholder')} required />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">{t('login.captcha')}</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-[var(--bg-primary)] rounded-xl px-3 py-2.5 text-sm text-gray-300 font-mono select-none">
                {captcha.challenge}
              </div>
              <button type="button" onClick={handleRefreshCaptcha}
                className="self-center px-3 py-1 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 text-xs transition-all" title={t('login.refreshCaptcha')}>
                ⟲
              </button>
            </div>
            <div className="relative mt-1">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input ref={captchaInputRef} type="number" inputMode="numeric" value={captchaAnswer}
                onChange={e => setCaptchaAnswer(e.target.value)}
                className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-2.5 border border-[var(--border-color)] focus:border-orange-500/50 outline-none text-sm placeholder:text-gray-600"
                placeholder={t('login.captchaPlaceholder')} required />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {captchaError && <p className="text-red-500 text-sm text-center">{captchaError}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all">
            {loading ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>
      </div>
    </div>
  )
}
