import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useAdminI18n } from '../lib/i18n'
import StatTable from '../components/StatTable'

export default function Users() {
  const { t } = useAdminI18n()
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 50

  useEffect(() => {
    setLoading(true)
    api.getUsers(page, limit).then(r => {
      setUsers(r.users)
      setTotal(r.total)
    }).finally(() => setLoading(false))
  }, [page])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold">{t('users.title')} ({total})</h1>
      </div>
      <StatTable
        columns={[
          { key: 'public_key', label: t('users.publicKey'), render: (v: string) => v ? v.slice(0, 16) + '...' : '-' },
          { key: 'country', label: t('users.country'), render: (v: string) => v || '-' },
          { key: 'ip', label: t('users.ip'), render: (v: string) => v || '-' },
          { key: 'is_online', label: t('users.status'), render: (v: number) => v ? t('users.online') : t('users.offline') },
          { key: 'last_seen', label: t('users.lastSeen'), render: (v: string) => v ? new Date(v).toLocaleString() : '-' },
        ]}
        data={users} />
      <div className="flex justify-center gap-2">
        <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
          className="px-3 py-1.5 rounded-lg bg-[#1a1d24] text-sm disabled:opacity-30">
          {t('users.previous')}
        </button>
        <span className="text-sm text-gray-500 self-center">{t('users.page')} {page} / {Math.ceil(total / limit)}</span>
        <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}
          className="px-3 py-1.5 rounded-lg bg-[#1a1d24] text-sm disabled:opacity-30">
          {t('users.next')}
        </button>
      </div>
    </div>
  )
}
