import React, { useEffect, useRef, useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { CRM_FALLBACKS, DEAL_STAGES } from '../../constants/crmConstants';
import type { Deal, DealStage } from '../../lib/crm/types';
import { DealModal } from './CrmDealModal';
import { useCrmPermissions } from '../../lib/crm/permissions';

const fmt = (amount: number, currency: string) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

type Props = {
  focusDealId?: string | null;
  onFocusHandled?: () => void;
};

export const CrmDeals: React.FC<Props> = ({ focusDealId, onFocusHandled }) => {
  const { t } = useI18n();
  const deals = useAppStore((s) => s.crmDeals);
  const contacts = useAppStore((s) => s.crmContacts);
  const setDealStage = useAppStore((s) => s.setDealStage);
  const { can } = useCrmPermissions();

  const [selected, setSelected] = useState<Deal | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const lastFocus = useRef<string | null>(null);

  useEffect(() => {
    if (!focusDealId || lastFocus.current === focusDealId) return undefined;
    lastFocus.current = focusDealId;
    setHighlightId(focusDealId);
    const scrollT = window.setTimeout(() => {
      document.getElementById(`crm-deal-${focusDealId}`)?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    }, 50);
    const clearT = window.setTimeout(() => {
      setHighlightId(null);
      onFocusHandled?.();
    }, 2500);
    return () => {
      window.clearTimeout(scrollT);
      window.clearTimeout(clearT);
    };
  }, [focusDealId, onFocusHandled]);

  const contactName = (id: string) => contacts.find((c) => c.userId === id)?.displayName ?? id;
  const total = deals.filter((d) => d.stage !== 'lost').reduce((s, d) => s + d.amount, 0);

  const stageLabel = (id: DealStage) => {
    const s = DEAL_STAGES.find((x) => x.id === id);
    return s ? t(s.labelKey, (CRM_FALLBACKS as any)[s.labelKey.replace('crm.', '')]) : id;
  };

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

      <div className="flex gap-3 overflow-x-auto pb-2">
        {DEAL_STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const isOver = dragOverStage === stage.id;
          return (
            <div
              key={stage.id}
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverStage(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverStage(null);
                const id = e.dataTransfer.getData('text/plain');
                if (id && can('manageDeals')) {
                  setDealStage(id, stage.id);
                  toast.success(t('crm.stageChanged', 'Stage updated'));
                }
              }}
              className={`w-[240px] shrink-0 flex flex-col gap-2 rounded-2xl border p-2 min-h-[200px] transition-all ${
                isOver ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border-color)] bg-[var(--bg-secondary)]/40'
              }`}
            >
              <div className="flex items-center justify-between px-1">
                <span className={`text-xs font-bold uppercase tracking-widest bg-gradient-to-r ${stage.gradient} bg-clip-text text-transparent`}>
                  {t(stage.labelKey, (CRM_FALLBACKS as any)[stage.labelKey.replace('crm.', '')])} ({stageDeals.length})
                </span>
                <span className="text-[10px] text-[var(--text-secondary)]">{fmt(stageDeals.reduce((s, d) => s + d.amount, 0), 'RUB')}</span>
              </div>
              {stageDeals.length === 0 && (
                <div className="flex-1 min-h-[80px] rounded-xl border border-dashed border-[var(--border-color)] flex items-center justify-center text-[10px] text-[var(--text-secondary)]">
                  {t('crm.noDeals', CRM_FALLBACKS.noDeals)}
                </div>
              )}
              {stageDeals.map((d, i) => (
                <div
                  key={d.id}
                  id={`crm-deal-${d.id}`}
                  draggable={can('manageDeals')}
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', d.id)}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(d)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(d);
                    }
                  }}
                  className={`p-3 rounded-2xl border border-[var(--border-color)] cursor-pointer transition-all hover:bg-[var(--list-item-hover-bg)] ${
                    highlightId === d.id ? 'ring-2 ring-[var(--accent)]' : ''
                  }`}
                >
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm text-[var(--text-primary)] break-words">{d.title}</span>
                    <span className="font-bold text-sm text-[var(--text-primary)] shrink-0">{fmt(d.amount, d.currency)}</span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">{contactName(d.contactId)}</div>
                  <select
                    value={d.stage}
                    disabled={!can('manageDeals')}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      setDealStage(d.id, e.target.value as DealStage);
                      toast.success(t('crm.stageChanged', 'Stage updated'));
                    }}
                    className="w-full min-h-[30px] mt-2 px-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-[10px] outline-none border border-[var(--border-color)] focus:border-[var(--accent)] disabled:opacity-40"
                  >
                    {DEAL_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>{stageLabel(s.id)}</option>
                    ))}
                  </select>
                  </motion.div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {selected && <DealModal deal={selected} onClose={() => setSelected(null)} />}
      {showAdd && <DealModal onClose={() => setShowAdd(false)} />}
    </div>
  );
};
