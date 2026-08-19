import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { CRM_FALLBACKS, DEAL_STAGES } from '../../constants/crmConstants';
import type { Deal, DealStage } from '../../lib/crm/types';
import { CrmModal } from './CrmModal';
import { useCrmPermissions } from '../../lib/crm/permissions';

const inputCls =
  'w-full min-h-[44px] px-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border-color)] focus:border-[var(--accent)] text-sm';
const labelCls = 'text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 block';

type Props = { deal?: Deal; onClose: () => void };

export const DealModal: React.FC<Props> = ({ deal, onClose }) => {
  const { t } = useI18n();
  const contacts = useAppStore((s) => s.crmContacts);
  const userId = useAppStore((s) => s.userProfile.id);
  const addDeal = useAppStore((s) => s.addDeal);
  const updateDeal = useAppStore((s) => s.updateDeal);
  const { can } = useCrmPermissions();

  const editable = can('manageDeals');
  const isNew = !deal;

  const [form, setForm] = useState({
    title: deal?.title ?? '',
    contactId: deal?.contactId ?? '',
    stage: (deal?.stage ?? 'new') as DealStage,
    amount: String(deal?.amount ?? ''),
    currency: deal?.currency ?? 'RUB',
    ownerId: deal?.ownerId ?? userId,
    expectedClose: deal?.expectedClose ? new Date(deal.expectedClose).toISOString().slice(0, 10) : '',
    notes: deal?.notes ?? '',
  });

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) { toast.error(t('crm.titleRequired', 'Title is required')); return; }
    if (!form.contactId) { toast.error(t('crm.contactRequired', 'Select a contact')); return; }
    const payload = {
      title: form.title.trim(),
      contactId: form.contactId,
      stage: form.stage,
      amount: Number(form.amount) || 0,
      currency: form.currency,
      ownerId: form.ownerId,
      expectedClose: form.expectedClose ? new Date(form.expectedClose).getTime() : null,
      notes: form.notes,
    };
    if (isNew) { addDeal(payload); toast.success(t('crm.dealCreated', 'Deal created')); }
    else if (deal) { updateDeal(deal.id, payload); toast.success(t('crm.dealSaved', 'Deal saved')); }
    onClose();
  };

  return (
    <CrmModal
      onClose={onClose}
      title={isNew ? t('crm.newDeal', 'New deal') : deal!.title}
      footer={
        editable ? (
          <button onClick={handleSave} className="w-full min-h-[44px] rounded-xl font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110">
            {t('crm.save', CRM_FALLBACKS.save)}
          </button>
        ) : (
          <div className="text-center text-xs text-[var(--text-secondary)] py-2">{t('crm.readOnly', 'Read only — managers can edit')}</div>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className={labelCls}>{t('crm.dealTitle', CRM_FALLBACKS.dealTitle)}</label>
          <input value={form.title} disabled={!editable} onChange={(e) => set('title', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('crm.contact', 'Contact')}</label>
          <select value={form.contactId} disabled={!editable} onChange={(e) => set('contactId', e.target.value)} className={inputCls}>
            <option value="">—</option>
            {contacts.filter((c) => c.status !== 'internal').map((c) => <option key={c.userId} value={c.userId}>{c.displayName}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{t('crm.stage', CRM_FALLBACKS.stage)}</label>
            <select value={form.stage} disabled={!editable} onChange={(e) => set('stage', e.target.value as DealStage)} className={inputCls}>
              {DEAL_STAGES.map((s) => <option key={s.id} value={s.id}>{t(s.labelKey, (CRM_FALLBACKS as any)[s.labelKey.replace('crm.', '')])}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t('crm.owner', CRM_FALLBACKS.owner)}</label>
            <select value={form.ownerId} disabled={!editable} onChange={(e) => set('ownerId', e.target.value)} className={inputCls}>
              {contacts.map((c) => <option key={c.userId} value={c.userId}>{c.displayName}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{t('crm.amount', CRM_FALLBACKS.amount)}</label>
            <input value={form.amount} disabled={!editable} onChange={(e) => set('amount', e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t('crm.expectedClose', CRM_FALLBACKS.expectedClose)}</label>
            <input type="date" value={form.expectedClose} disabled={!editable} onChange={(e) => set('expectedClose', e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>{t('crm.notes', CRM_FALLBACKS.notes)}</label>
          <textarea value={form.notes} disabled={!editable} onChange={(e) => set('notes', e.target.value)} rows={3} className={`${inputCls} py-2 resize-none`} />
        </div>
      </div>
    </CrmModal>
  );
};
