import { useState } from 'react'
import { Camera, Smartphone, Check, X, QrCode as QrCodeIcon } from 'lucide-react'
import { SubView } from '../ui/SubView'
import { useAppStore } from '../../store'
import { createPairingQrData, parsePairingQrData } from '../../lib/identity/devicePairing'
import { QrCode } from '../QrCode'

interface PairingFlowProps {
  isDark: boolean
  onBack: () => void
  t: (key: string) => string
}

export const PairingFlow = ({ isDark, onBack, t }: PairingFlowProps) => {
  const { pairingQrData, setPairingQrData } = useAppStore()
  const [mode, setMode] = useState<'host' | 'join' | null>(null)

  const handleHost = () => {
    setMode('host')
  }

  const handleJoin = () => {
    setMode('join')
  }

  return (
    <SubView title={t('settings.pairDevice')} isDark={isDark} onBack={onBack}>
      <div className="p-4 space-y-4">
        {!mode ? (
          <div className="space-y-3">
            <button onClick={handleHost}
              className="w-full p-4 rounded-xl border flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5">
              <QrCodeIcon size={24} />
              <div className="text-left">
                <p className="font-semibold">{t('settings.hostDevice')}</p>
                <p className="text-sm opacity-60">{t('settings.hostDeviceSubtitle')}</p>
              </div>
            </button>
            <button onClick={handleJoin}
              className="w-full p-4 rounded-xl border flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5">
              <Smartphone size={24} />
              <div className="text-left">
                <p className="font-semibold">{t('settings.joinDevice')}</p>
                <p className="text-sm opacity-60">{t('settings.joinDeviceSubtitle')}</p>
              </div>
            </button>
          </div>
        ) : mode === 'host' ? (
          <div className="text-center space-y-4">
            <p className="text-sm opacity-70">{t('settings.scanWithNewDevice')}</p>
            {pairingQrData ? (
              <QrCode data={pairingQrData} size={250} />
            ) : (
              <p className="text-sm opacity-50">{t('settings.generateQR')}</p>
            )}
            <button onClick={() => { setMode(null); setPairingQrData('') }}
              className="text-sm opacity-60 hover:opacity-100">{t('common.cancel')}</button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-sm opacity-70">{t('settings.scanOtherDevice')}</p>
            <div className="w-48 h-48 mx-auto rounded-xl border-2 border-dashed flex items-center justify-center">
              <Camera size={48} className="opacity-30" />
            </div>
            <p className="text-xs opacity-50">{t('settings.cameraRequired')}</p>
            <button onClick={() => setMode(null)} className="text-sm opacity-60 hover:opacity-100">{t('common.cancel')}</button>
          </div>
        )}
      </div>
    </SubView>
  )
}
