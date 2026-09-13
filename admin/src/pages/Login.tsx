import { useState, FormEvent, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAdminI18n } from '../lib/i18n'
import { api } from '../api/client'
import { Lock, User, Shield } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captchaChallenge, setCaptchaChallenge] = useState('')
  const [captchaSessionId, setCaptchaSessionId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaError, setCaptchaError] = useState('')
  const { login } = useAuth()
  const { t } = useAdminI18n()
  const navigate = useNavigate()
  const captchaInputRef = useRef<HTMLInputElement>(null)

  // The captcha challenge is issued by the server (CSPRNG) — the client never
  // generates its own. A local Math.random captcha would be bypassable and
  // would not satisfy the server's verification anyway.
  const loadCaptcha = async () => {
    try {
      const res = await api.login('', '')
      if (res.needsCaptcha && res.sessionId && res.challenge) {
        setCaptchaChallenge(res.challenge)
        setCaptchaSessionId(res.sessionId)
        setCaptchaAnswer('')
        setCaptchaError('')
        return
      }
    } catch {
      // Network error: keep the current challenge (if any) so the user can retry.
    }
  }

  useEffect(() => {
    void loadCaptcha()
  }, [])

  const handleRefreshCaptcha = () => {
    loadCaptcha()
    captchaInputRef.current?.focus()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setCaptchaError('')

    if (!captchaSessionId || captchaAnswer.trim() === '') {
      await loadCaptcha()
      captchaInputRef.current?.focus()
      return
    }

    setLoading(true)
    try {
      const res = (await login(username, password, captchaSessionId, captchaAnswer)) as any
      if (res?.needsCaptcha) {
        await loadCaptcha()
        captchaInputRef.current?.focus()
        return
      }
      if (res?.error) {
        if (String(res.error).includes('CAPTCHA')) {
          setCaptchaError(t('login.captchaInvalid'))
          await loadCaptcha()
        } else {
          setError(String(res.error))
        }
        captchaInputRef.current?.focus()
        return
      }
      if (!res?.sessionToken) {
        setCaptchaError(t('login.captchaInvalid'))
        await loadCaptcha()
        captchaInputRef.current?.focus()
        return
      }
      navigate('/login/2fa')
    } catch (err: any) {
      const message = err?.message
      if (message === 'Unauthorized') {
        setError(t('login.invalidCredentials'))
      } else if (message === 'CAPTCHA verification failed') {
        setCaptchaError(t('login.captchaInvalid'))
        await loadCaptcha()
      } else if (message?.includes('Too many attempts')) {
        setError(message)
      } else {
        setError(t('login.invalidCredentials'))
      }
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
                {captchaChallenge || '…'}
              </div>
              <button type="button" onClick={handleRefreshCaptcha}
                className="self-center px-3 py-1 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 text-xs transition-all" title={t('login.refreshCaptcha')}
                aria-label={t('login.refreshCaptcha')}>
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