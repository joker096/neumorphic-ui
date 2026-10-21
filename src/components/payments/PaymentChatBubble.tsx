import { useEffect, useState } from 'react'
import { ExternalLink, Copy, Check, CheckCircle2, XCircle, Loader2, Clock, Wallet } from 'lucide-react'
import { verifyPayment } from '../../services/paymento'
import { paymentStatusLabel, isPaymentSuccessful, isPaymentFailed, isPaymentPending } from '../../types/paymento'
import { toast } from '../ui/Toast'
import { useI18n } from '../../lib/i18n'
import { formatCurrency } from '../../utils/currency'
import { INLINE_SEMIBOLD_CLASS, CAPS_MUTED_CLASS } from '../ui/textClasses';
import { PAYMENT_SUCCESS_STATUS_CLASS, PAYMENT_FAILED_STATUS_CLASS, PAYMENT_PENDING_STATUS_CLASS } from './paymentClasses';
interface PaymentChatBubbleProps {
  msg: any
}

export const PaymentChatBubble = ({ msg }: PaymentChatBubbleProps) => {
  const { t, lang } = useI18n()
  const token = msg?.paymentToken as string | undefined
  const url = (msg?.paymentUrl as string) || ''
  const amount = msg?.amount
  const currency = msg?.currency
  const description = msg?.description
  const [status, setStatus] = useState<number>(typeof msg?.orderStatus === 'number' ? msg.orderStatus : 0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const tick = async () => {
      if (cancelled) return
      try {
        const res = await verifyPayment(token)
        if (cancelled) return
        setStatus(res.status)
      } catch {
        /* transient errors ignored */
      }
      timer = setTimeout(tick, 5000)
    }
    timer = setTimeout(tick, 1500)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [token])

  const badge = (() => {
    if (isPaymentSuccessful(status))
      return (
        <span className={PAYMENT_SUCCESS_STATUS_CLASS}>
          <CheckCircle2 size={14} /> {paymentStatusLabel(status)}
        </span>
      )
    if (isPaymentFailed(status))
      return (
        <span className={PAYMENT_FAILED_STATUS_CLASS}>
          <XCircle size={14} /> {paymentStatusLabel(status)}
        </span>
      )
    if (isPaymentPending(status))
      return (
        <span className={PAYMENT_PENDING_STATUS_CLASS}>
          <Clock size={14} /> {paymentStatusLabel(status)}
        </span>
      )
    return (
      <span className={INLINE_SEMIBOLD_CLASS}>
        <Loader2 size={14} className="animate-spin" /> {paymentStatusLabel(status)}
      </span>
    )
  })()

  const handleCopy = async () => {
    if (!url) return
    await navigator.clipboard?.writeText(url)
    setCopied(true)
    toast(t('payments.linkCopied'), 'success')
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      className={"mt-2 rounded-2xl p-3 border bg-white border-[var(--border-color)] shadow-sm text-[var(--text-primary)] dark:bg-white/5 dark:shadow-none"}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={"flex items-center justify-center w-8 h-8 rounded-xl bg-orange-100 dark:bg-white/10"}
        >
          <Wallet size={16} className="text-[var(--accent)]" />
        </span>
        <span className={CAPS_MUTED_CLASS}>{t('payments.request')}</span>
      </div>
      {description && <div className="text-sm font-medium">{description}</div>}
      {amount != null && amount !== '' && (
        <div className="text-2xl font-bold mt-0.5">
          {formatCurrency(Number(amount), currency, lang, 2)}
        </div>
      )}
      <div className="mt-1 truncate text-xs opacity-60">{url}</div>
      <div className="mt-2">{badge}</div>
      <div className="flex gap-2 mt-3">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium min-h-11 px-3 rounded-lg bg-[var(--accent)] text-[var(--button-primary-text)] active:scale-95 transition-transform"
        >
          <ExternalLink size={16} /> {t('payments.pay')}
        </a>
        <button
          onClick={handleCopy}
          aria-label={copied ? t('payments.copied') : t('payments.copy')}
          title={copied ? t('payments.copied') : t('payments.copy')}
          className={"flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg active:scale-95 transition-transform w-9 h-9 min-w-11 min-h-11 bg-black/5 text-[var(--text-secondary)] dark:bg-white/10 dark:text-[var(--text-primary)]"}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span className="sr-only">{copied ? t('payments.copied') : t('payments.copy')}</span>
        </button>
      </div>
    </div>
  )
}
