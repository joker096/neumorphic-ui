import { useState, useEffect } from 'react'
import { Shield, Check, Copy, Smartphone } from 'lucide-react'
import { SubView } from '../ui/SubView'
import { useAppStore } from '../../store'
import { generateTotp, verifyTotp } from '../../lib/auth/clientTotp'

interface TotpSetupProps {
  isDark: boolean
  onBack: () => void
  t: (key: string) => string
}

export const TotpSetup = ({ isDark, onBack, t }: TotpSetupProps) => {
  const { totpSecret, setTotpSecret } = useAppStore()
  const [qrUrl, setQrUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [verified, setVerified] = useState(!!totpSecret)

  useEffect(() => {
    if (!verified && !secret) {
      const result = generateTotp()
      setSecret(result.secret)
      setQrUrl(result.url)
    }
  }, [verified, secret])

  const handleVerify = () => {
    if (verifyTotp(verifyCode, secret)) {
      setTotpSecret(secret)
      setVerified(true)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(secret)
  }

  return (
    <SubView title={t('settings.twoFactorAuth')} isDark={isDark} onBack={onBack}>
      <div className="p-4 space-y-4">
        {verified ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check size={32} className="text-emerald-500" />
            </div>
            <p className="text-emerald-500 font-semibold">{t('settings.totpVerified')}</p>
            <p className="text-sm opacity-60">{t('settings.totpSubtitle')}</p>
          </div>
        ) : (
          <>
            <p className="text-sm opacity-70">{t('settings.totpInstruction')}</p>
            {qrUrl && (
              <div className="flex justify-center">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrUrl)}&size=200x200`} alt={t('settings.twoFactorAuth')} className="rounded-lg" />
              </div>
            )}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-black/10 dark:bg-white/10">
              <code className="flex-1 text-xs break-all font-mono">{secret}</code>
              <button onClick={handleCopy} className="p-1 hover:opacity-70"><Copy size={16} /></button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text" maxLength={6} placeholder={t('settings.totpPlaceholder')}
                value={verifyCode} onChange={e => setVerifyCode(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border bg-transparent text-center text-lg font-mono tracking-widest"
              />
              <button onClick={handleVerify} disabled={verifyCode.length !== 6}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white disabled:opacity-40">
                {t('settings.verify')}
              </button>
            </div>
          </>
        )}
      </div>
    </SubView>
  )
}
