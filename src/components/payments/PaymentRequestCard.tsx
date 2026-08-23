import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { ExternalLink, Copy, Share2, Send, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'
import { toast } from '../ui/Toast'
import { gatewayUrl, verifyPayment, sharePaymentLink } from '../../services/paymento'
import { paymentStatusLabel, isPaymentSuccessful, isPaymentFailed, isPaymentPending } from '../../types/paymento'

interface PaymentRequestCardProps {
  token: string
  amount?: string | number
  currency?: string
  description?: string
  isDark?: boolean
  poll?: boolean
  onStatus?: (status: number) => void
  onSendToChat?: () => void
}

export const PaymentRequestCard = ({
  token,
  amount,
  currency,
  description,
  isDark = false,
  poll = true,
  onStatus,
  onSendToChat,
}: PaymentRequestCardProps) => {
  const url = useMemo(() => gatewayUrl(token), [token])
  const [qr, setQr] = useState<string>('')
  const [status, setStatus] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: '#000000', light: '#ffffff' } })
      .then((d) => active && setQr(d))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [url])

  useEffect(() => {
    if (!poll) return
    let cancelled = false
    const tick = async () => {
      if (cancelled) return
      try {
        const res = await verifyPayment(token)
        if (cancelled) return
        setStatus(res.status)
        onStatus?.(res.status)
        if (isPaymentSuccessful(res.status) || isPaymentFailed(res.status)) return
      } catch {
        /* ignore transient errors */
      }
      timer = setTimeout(tick, 5000)
    }
    let timer = setTimeout(tick, 1500)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [token, poll, onStatus])

  const statusBadge = (() => {
    if (status === null) return null
    if (isPaymentSuccessful(status))
      return (
        <span className="inline-flex items-center gap-1 text-emerald-500 text-xs font-semibold">
          <CheckCircle2 size={14} /> {paymentStatusLabel(status)}
        </span>
      )
    if (isPaymentFailed(status))
      return (
        <span className="inline-flex items-center gap-1 text-red-500 text-xs font-semibold">
          <XCircle size={14} /> {paymentStatusLabel(status)}
        </span>
      )
    if (isPaymentPending(status))
      return (
        <span className="inline-flex items-center gap-1 text-amber-500 text-xs font-semibold">
          <Clock size={14} /> {paymentStatusLabel(status)}
        </span>
      )
    return (
      <span className="inline-flex items-center gap-1 text-gray-500 text-xs font-semibold">
        <Loader2 size={14} className="animate-spin" /> {paymentStatusLabel(status)}
      </span>
    )
  })()

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(url)
    setCopied(true)
    toast('Payment link copied', 'success')
    setTimeout(() => setCopied(false), 1500)
  }

  const handleShare = async () => {
    await sharePaymentLink(url, description || 'Complete your payment')
    toast('Payment link shared', 'info')
  }

  return (
    <div
      className={`rounded-2xl p-4 border ${
        isDark ? 'bg-white/5 border-[var(--border-color)]' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="w-[120px] h-[120px] rounded-xl overflow-hidden bg-white shrink-0 flex items-center justify-center">
          {qr ? (
            <img src={qr} alt="Payment QR" className="w-full h-full object-contain" />
          ) : (
            <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {description && (
            <div className={`text-sm font-medium ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-900'}`}>
              {description}
            </div>
          )}
          {amount != null && (
            <div className={`text-2xl font-bold mt-0.5 ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-900'}`}>
              {amount} {currency}
            </div>
          )}
          <div className="mt-1 truncate text-xs opacity-60">{url}</div>
          <div className="mt-2">{statusBadge}</div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-[var(--accent)] text-[var(--button-primary-text)] active:scale-95 transition-transform"
        >
          <ExternalLink size={15} /> Open
        </a>
        <button
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg active:scale-95 transition-transform ${
            isDark ? 'bg-white/10 text-[var(--text-primary)' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          onClick={handleShare}
          className={`flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg active:scale-95 transition-transform ${
            isDark ? 'bg-white/10 text-[var(--text-primary)]' : 'bg-slate-100 text-slate-700'
          }`}
        >
          <Share2 size={15} />
        </button>
        {onSendToChat && (
          <button
            onClick={onSendToChat}
            title="Send to chat"
            className={`flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg active:scale-95 transition-transform ${
              isDark ? 'bg-white/10 text-[var(--text-primary)]' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Send size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
