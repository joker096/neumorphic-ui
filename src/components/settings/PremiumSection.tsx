import { useCallback, useState } from 'react'
import { Crown, FileUp, Smile, TrendingUp } from 'lucide-react'
import { useI18n } from '../../lib/i18n'
import { SubView } from '../ui/SubView'
import { SettingsRow, SettingsGroup, SettingsSectionTitle } from '../ui/SettingsRow'
import { toast } from '../ui/Toast'
import { PaymentRequestCard } from '../payments/PaymentRequestCard'
import { getDevicePublicKey } from '../../services/entitlements'
import { buildSubscriptionOrderId, getPremiumPlan, PREMIUM_PLANS } from '../../config/premium'
import type { PremiumPlan } from '../../config/premium'
import { createPaymentRequest } from '../../services/paymento'
import { isPaymentSuccessful } from '../../types/paymento'
import { useAppStore } from '../../store'

interface PremiumSectionProps {
  isDark?: boolean
  onBack: () => void
}

interface ActivePayment {
  token: string
  plan: PremiumPlan
}

export const PremiumSection = ({ isDark = false, onBack }: PremiumSectionProps) => {
  const { t } = useI18n()
  const premiumEntitlement = useAppStore((s) => s.premiumEntitlement)
  const refreshPremiumEntitlement = useAppStore((s) => s.refreshPremiumEntitlement)
  const [paying, setPaying] = useState(false)
  const [active, setActive] = useState<ActivePayment | null>(null)

  const handleStatus = useCallback((status: number) => {
    if (!isPaymentSuccessful(status)) return
    setActive(null)
    void refreshPremiumEntitlement()
    toast(t('premium.success', 'Premium activated'), 'success')
  }, [refreshPremiumEntitlement, t])

  const handlePay = async (planId: string) => {
    const plan = getPremiumPlan(planId)
    if (!plan || paying) return
    setPaying(true)
    try {
      const pk = await getDevicePublicKey()
      const res = await createPaymentRequest({
        amount: plan.price,
        currency: plan.currency,
        orderId: buildSubscriptionOrderId(pk, plan.id),
      })
      setActive({ token: res.token, plan })
    } catch (e: any) {
      toast(e?.message || t('premium.createError', 'Could not create payment request'), 'error')
    } finally {
      setPaying(false)
    }
  }

  const expiresLabel =
    premiumEntitlement.premium && premiumEntitlement.expiresAt
      ? t('premium.expiresAt', { date: new Date(premiumEntitlement.expiresAt).toLocaleDateString() })
      : undefined

  return (
    <SubView title={t('premium.title', 'Premium')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('premium.statusLabel', 'Premium status')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          icon={<Crown size={16} />}
          iconBg={isDark ? 'bg-amber-500/10' : 'bg-amber-100'}
          iconColor={isDark ? 'text-amber-400' : 'text-amber-600'}
          title={premiumEntitlement.premium ? t('premium.active', 'Active') : t('premium.inactive', 'Inactive')}
          subtitle={expiresLabel}
          isDark={isDark}
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('premium.perksTitle', 'What Premium unlocks')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          icon={<Crown size={16} />}
          iconBg={isDark ? 'bg-amber-500/10' : 'bg-amber-100'}
          iconColor={isDark ? 'text-amber-400' : 'text-amber-600'}
          title={t('premium.perkStickers', 'Full ICQ sticker pack')}
          isDark={isDark}
        />
        <SettingsRow
          icon={<Smile size={16} />}
          iconBg={isDark ? 'bg-amber-500/10' : 'bg-amber-100'}
          iconColor={isDark ? 'text-amber-400' : 'text-amber-600'}
          title={t('premium.perkReactions', 'Extended reaction set')}
          isDark={isDark}
        />
        <SettingsRow
          icon={<FileUp size={16} />}
          iconBg={isDark ? 'bg-amber-500/10' : 'bg-amber-100'}
          iconColor={isDark ? 'text-amber-400' : 'text-amber-600'}
          title={t('premium.perkFiles', 'Attachments up to 500 MB')}
          isDark={isDark}
        />
        <SettingsRow
          icon={<TrendingUp size={16} />}
          iconBg={isDark ? 'bg-amber-500/10' : 'bg-amber-100'}
          iconColor={isDark ? 'text-amber-400' : 'text-amber-600'}
          title={t('premium.perkCrm', 'CRM deals, tasks and roles')}
          isDark={isDark}
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('premium.plans', 'Plans')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        {Object.values(PREMIUM_PLANS).map((plan) => (
          <SettingsRow
            key={plan.id}
            icon={<Crown size={16} />}
            iconBg={isDark ? 'bg-amber-500/10' : 'bg-amber-100'}
            iconColor={isDark ? 'text-amber-400' : 'text-amber-600'}
            title={plan.id === 'premium90' ? t('premium.plan90', 'Premium · 90 days') : t('premium.plan30', 'Premium · 30 days')}
            value={paying ? t('premium.paying', 'Creating payment…') : t('premium.pay', { amount: `$${plan.price}` })}
            isDark={isDark}
            onClick={() => void handlePay(plan.id)}
          />
        ))}
      </SettingsGroup>

      {active && (
        <div className="mb-2">
          <PaymentRequestCard
            token={active.token}
            amount={active.plan.price}
            currency={active.plan.currency}
            isDark={isDark}
            onStatus={handleStatus}
          />
          <div className={`text-center text-xs py-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            {t('premium.waitingConfirm', 'Waiting for payment confirmation')}
          </div>
        </div>
      )}
    </SubView>
  )
}
