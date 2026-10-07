import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useI18n } from '../../lib/i18n'
import { SubView } from '../ui/SubView'
import { SettingsSectionTitle } from '../ui/SettingsRow'
import { toast } from '../ui/Toast'
import { PaymentRequestCard } from '../payments/PaymentRequestCard'
import { ChatPickerModal } from '../payments/ChatPickerModal'
import { createPaymentRequest, buildPaymentMessage } from '../../services/paymento'
import { generateOrderId, buildGatewayUrl } from '../../config/paymento'
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

  const handleCreate = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      toast(t('payRequests.invalidAmount', 'Enter a valid amount'), 'error')
      return
    }
    setCreating(true)
    try {
      const res = await createPaymentRequest({
        amount: amt,
        currency,
        orderId: generateOrderId(),
        description: description || undefined,
      })
      setActive({ token: res.token, paymentUrl: res.paymentUrl || buildGatewayUrl(res.token), amount: String(amt), currency, description })
      toast(t('payRequests.created', 'Payment request created'), 'success')
      setAmount('')
      setDescription('')
    } catch (e: any) {
      toast(e?.message || 'Failed', 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <SubView title={t('payRequests.title', 'Payment Requests')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('payRequests.new', 'New payment request')} isDark={isDark} />
      <div
        className={`rounded-2xl p-4 mb-2 border ${
          isDark ? 'bg-white/5 border-[var(--border-color)]' : 'bg-white border-[var(--border-color)] shadow-sm'
        }`}
      >
        <div className="flex gap-2 mb-2">
          <input
            aria-label={t('payRequests.amount', 'Amount')}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={`flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none border ${
              isDark ? 'bg-white/5 border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)]'
            }`}
          />
          <input
            aria-label={t('payRequests.currency', 'Currency')}
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={6}
            className={`w-24 rounded-lg px-3 py-2 text-sm outline-none border ${
              isDark ? 'bg-white/5 border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)]'
            }`}
          />
        </div>
        <input
          aria-label={t('payRequests.descPlaceholder', 'Description (optional)')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('payRequests.descPlaceholder', 'Description (optional)')}
          className={`w-full rounded-lg px-3 py-2 text-sm outline-none border mb-3 ${
            isDark ? 'bg-white/5 border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)]'
          }`}
        />
        <button
          onClick={handleCreate}
          disabled={creating}
          aria-label={t('payRequests.create', 'Create payment request')}
          title={t('payRequests.create', 'Create payment request')}
          className="w-full min-h-11 flex items-center justify-center gap-2 rounded-xl font-medium bg-[var(--accent)] text-[var(--button-primary-text)] active:scale-[0.99] transition-transform disabled:opacity-50"
        >
          {creating ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
          <span>{t('payRequests.create', 'Create payment request')}</span>
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
    </SubView>
  )
}
