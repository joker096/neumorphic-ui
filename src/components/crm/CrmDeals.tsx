import React, { useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { CRM_FALLBACKS, DEAL_STAGES, crmAvatarAt } from '../../constants/crmConstants';
import type { Deal } from '../../lib/crm/types';
import { DealModal } from './CrmDealModal';
import { useCrmPermissions } from '../../lib/crm/permissions';

const fmt = (amount: number, currency: string) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

export const CrmDeals: React.FC = () => {
  const { t } = useI18n();
  const deals = useAppStore((s) => s.crmDeals);
  const contacts = useAppStore((s) => s.crmContacts);
  const setDealStage = useAppStore((s) => s.setDealStage);
  const removeDeal = useAppStore((s) => s.removeDeal);
  const { can } = useCrmPermissions();

  const [selected, setSelected] = useState<Deal | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const contactName = (id: string) => contacts.find((c) => c.userId === id)?.displayName ?? id;
  const total = deals.filter((d) => d.stage !== 'lost').reduce((s, d) => s + d.amount, 0);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-3 py-3">
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
          <TrendingUp size={14} /> {fmt(total, 'RUB')}
        </div>
        {can('manageDeals') && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110">
            <Plus size={15} /> {t('crm.addDeal', CRM_FALLBACKS.addDeal)}
          </button>
        )}
      </div>

      {deals.length === 0 && (
        <div className="py-10 text-center text-sm text-[var(--text-secondary)]">{t('crm.noDeals', CRM_FALLBACKS.noDeals)}</div>
      )}

      <div className="flex flex-col gap-4">
        {DEAL_STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          if (stageDeals.length === 0) return null;
          return (
            <div key={stage.id}>
              <div className="flex items-center justify-between px-2 mb-2">
                <span className={`text-[11px] font-bold uppercase tracking-widest bg-gradient-to-r ${stage.gradient} bg-clip-text text-transparent`}>
                  {t(stage.labelKey, (CRM_FALLBACKS as any)[stage.labelKey.replace('crm.', '')])} ({stageDeals.length})
                </span>
                <span className="text-[11px] text-[var(--text-secondary)]">{fmt(stageDeals.reduce((s, d) => s + d.amount, 0), 'RUB')}</span>
              </div>
              <div className="flex flex-col gap-2">
                {stageDeals.map((d, i) => (
                  <motion.button
                    key={d.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelected(d)}
                    className="w-full text-left p-3 rounded-2xl cursor-pointer transition-all hover:bg-[var(--list-item-hover-bg)] border border-[var(--border-color)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-[var(--text-primary)] break-words">{d.title}</span>
                      <span className="font-bold text-sm text-[var(--text-primary)] shrink-0">{fmt(d.amount, d.currency)}</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-1">{contactName(d.contactId)}</div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {DEAL_STAGES.filter((s) => s.id !== stage.id).map((s) => (
                        <button
                          key={s.id}
                          onClick={(e) => { e.stopPropagation(); setDealStage(d.id, s.id); toast.success(t('crm.stageChanged', 'Stage updated')); }}
                          disabled={!can('manageDeals')}
                          className={`text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] disabled:opacity-40 cursor-pointer`}
                        >
                          → {t(s.labelKey, (CRM_FALLBACKS as any)[s.labelKey.replace('crm.', '')])}
                        </button>
                      ))}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected && <DealModal deal={selected} onClose={() => setSelected(null)} />}
      {showAdd && <DealModal onClose={() => setShowAdd(false)} />}
    </div>
  );
};
