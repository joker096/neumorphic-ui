import { useState } from 'react'
import { Smartphone, Trash2, RefreshCw, CheckCircle } from 'lucide-react'
import { SubView } from '../ui/SubView'
import { useAppStore } from '../../store'
import type { DeviceInfo } from '../../store'

type SyncStatus = 'idle' | 'requesting' | 'syncing' | 'live' | 'error'

interface SyncSettingsProps {
  isDark: boolean
  onBack: () => void
  t: (key: string) => string
}

export const SyncSettings = ({ isDark, onBack, t }: SyncSettingsProps) => {
  const { devices, removeDevice, syncStatus, setSyncStatus, syncLastTimestamp, setSyncLastTimestamp } = useAppStore()
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    setSyncStatus('syncing')
    await new Promise(r => setTimeout(r, 2000))
    setSyncLastTimestamp(new Date().toISOString())
    setSyncStatus('live')
    setSyncing(false)
  }

  const statusColor: Record<SyncStatus, string> = {
    idle: 'text-gray-400', requesting: 'text-blue-400', syncing: 'text-yellow-400',
    live: 'text-emerald-400', error: 'text-red-400',
  }

  return (
    <SubView title={t('settings.devicesAndSync')} isDark={isDark} onBack={onBack}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-black/5 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className={syncing ? 'animate-spin text-blue-400' : ''} />
            <span className="text-sm">{t('settings.syncStatus')}: <span className={`font-medium ${statusColor[syncStatus]}`}>{syncStatus}</span></span>
          </div>
          <button onClick={handleSync} disabled={syncing}
            className="px-3 py-1 text-xs rounded-lg bg-blue-500 text-white disabled:opacity-40">
            {syncing ? t('settings.syncing') : t('settings.syncNow')}
          </button>
        </div>
        {syncLastTimestamp && <p className="text-xs opacity-50">{t('settings.lastSync')}: {new Date(syncLastTimestamp).toLocaleString()}</p>}

        <p className="text-sm font-semibold mt-4">{t('settings.pairedDevices')}</p>
        <div className="space-y-2">
          {devices.map((device: DeviceInfo) => (
            <div key={device.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Smartphone size={20} className="opacity-60" />
                <div>
                  <p className="text-sm font-semibold">{device.name}</p>
                  <p className="text-xs opacity-50">{device.platform} · {new Date(device.lastActive).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {device.isCurrent && <CheckCircle size={16} className="text-emerald-500" />}
                {!device.isCurrent && (
                  <button onClick={() => removeDevice(device.id)} className="p-1 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SubView>
  )
}
