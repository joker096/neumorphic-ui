import { useEffect, useState } from 'react'
import { Plus, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react'
import { useI18n } from '../../lib/i18n'
import { SubView } from '../ui/SubView'
import { SettingsSectionTitle, SettingsRow } from '../ui/SettingsRow'
import { toast } from '../ui/Toast'
import { PaymentRequestCard } from '../payments/PaymentRequestCard'
import { ChatPickerModal } from '../payments/ChatPickerModal'
import { createPaymentRequest, listPayments, buildPaymentMessage, type PaymentListItem } from '../../services/paymento'
import { getPaymentoConfig } from '../../lib/paymentoConfig'
import { generateOrderId, buildGatewayUrl } from '../../config/paymento'
import { paymentStatusLabel, isPaymentSuccessful, isPaymentFailed } from '../../types/paymento'
import { useAppStore } from '../../store'

interface PaymentRequestsSectionProps {
  isDark?: boolean
  onBack: () => void
}

interface PaymentPayload {
  token: string
  paymentUrl: string
  amount: string
  currency: string
  description: string
}

export const PaymentRequestsSection = ({ isDark = false, onBack }: PaymentRequestsSectionProps) => {
  const { t } = useI18n()
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [active, setActive] = useState<{ token: string; paymentUrl: string; amount: string; currency: string; description: string } | null>(null)
  const [list, setList] = useState<PaymentListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [noCreds, setNoCreds] = useState(false)
  const [picker, setPicker] = useState<PaymentPayload | null>(null)

  const handleSendToChat = (payload: PaymentPayload) => {
    setPicker(payload)
  }

  const handlePickChat = (chat: any) => {
    if (!picker) return
    const msg = buildPaymentMessage(picker)
    useAppStore.getState().forwardMessage(msg, String(chat.id))
    toast(t('payRequests.sentToChat', 'Payment card sent to chat'), 'success')
    setPicker(null)
  }

  const refresh = async () => {
    setLoading(true)
    try {
      setList(await listPayments(30))
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleCreate = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      toast(t('payRequests.invalidAmount', 'Enter a valid amount'), 'error')
      return
    }
    setCreating(true)
    try {
      const cfg = await getPaymentoConfig()
      if (!cfg.apiKey || !cfg.secretKey) {
        setNoCreds(true)
        toast(t('payRequests.noCreds', 'Configure Paymento API credentials in Store Settings first'), 'error')
        return
      }
      const res = await createPaymentRequest({
        amount: amt,
        currency,
        orderId: generateOrderId(),
        description: description || undefined,
        returnUrl: cfg.returnUrl || undefined,
      })
      setActive({ token: res.token, paymentUrl: res.paymentUrl || buildGatewayUrl(res.token), amount: String(amt), currency, description })
      toast(t('payRequests.created', 'Payment request created'), 'success')
      setAmount('')
      setDescription('')
      refresh()
    } catch (e: any) {
      toast(e?.message || 'Failed', 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <SubView title={t('payRequests.title', 'Payment Requests')} isDark={isDark} onBack={onBack}>
      {noCreds && (
        <div
          className={`rounded-2xl p-4 mb-2 border flex items-start gap-3 ${
            isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
          }`}
        >
          <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
            {t('payRequests.noCredsHint', 'Open Store Settings to add your Paymento API Key and Secret.')}
          </p>
        </div>
      )}

      <SettingsSectionTitle title={t('payRequests.new', 'New payment request')} isDark={isDark} />
      <div
        className={`rounded-2xl p-4 mb-2 border ${
          isDark ? 'bg-white/5 border-[var(--border-color)]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex gap-2 mb-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={`flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none border ${
              isDark ? 'bg-white/5 border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-slate-300 text-slate-900'
            }`}
          />
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={6}
            className={`w-24 rounded-lg px-3 py-2 text-sm outline-none border ${
              isDark ? 'bg-white/5 border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-slate-300 text-slate-900'
            }`}
          />
        </div>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('payRequests.descPlaceholder', 'Description (optional)')}
          className={`w-full rounded-lg px-3 py-2 text-sm outline-none border mb-3 ${
            isDark ? 'bg-white/5 border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-slate-300 text-slate-900'
          }`}
        />
        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-[var(--accent)] text-[var(--button-primary-text)] active:scale-[0.99] transition-transform disabled:opacity-50"
        >
          {creating ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
          {t('payRequests.create', 'Create payment request')}
        </button>
      </div>

      {active && (
        <div className="mb-2">
          <PaymentRequestCard
            token={active.token}
            amount={active.amount}
            currency={active.currency}
            description={active.description}
            isDark={isDark}
            onSendToChat={() =>
              handleSendToChat({
                token: active.token,
                paymentUrl: active.paymentUrl,
                amount: active.amount,
                currency: active.currency,
                description: active.description,
              })
            }
          />
        </div>
      )}

      <ChatPickerModal
        open={picker !== null}
        onClose={() => setPicker(null)}
        onPick={handlePickChat}
        title={t('payRequests.sendToChat', 'Send payment to chat')}
      />

      <div className="flex items-center justify-between px-1 mt-2">
        <SettingsSectionTitle title={t('payRequests.recent', 'Recent payments')} isDark={isDark} />
        <button
          onClick={refresh}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg active:scale-95 ${
            isDark ? 'text-[var(--accent)] hover:bg-white/5' : 'text-[var(--accent)] hover:bg-black/5'
          }`}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> {t('common.refresh', 'Refresh')}
        </button>
      </div>

      <div className="space-y-2">
        {list.length === 0 && !loading && (
          <p className={`text-center text-sm py-6 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
            {t('payRequests.empty', 'No payments yet')}
          </p>
        )}
        {list.map((p) => (
          <div
            key={p.order_id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
              isDark ? 'bg-white/5 border-[var(--border-color)]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium truncate ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-900'}`}>
                {p.amount} {p.currency}
              </div>
              <div className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{p.order_id}</div>
            </div>
            <span
              className={`text-xs font-semibold ${
                isPaymentSuccessful(p.status)
                  ? 'text-emerald-500'
                  : isPaymentFailed(p.status)
                    ? 'text-red-500'
                    : 'text-amber-500'
              }`}
            >
              {paymentStatusLabel(p.status)}
            </span>
          </div>
        ))}
      </div>
    </SubView>
  )
}
