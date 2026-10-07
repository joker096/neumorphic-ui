import React, { useEffect, useState } from 'react';
import { Crown, Users, TrendingUp, CheckSquare, ShieldCheck, UserPlus, Upload, SlidersHorizontal } from 'lucide-react';
import { useAppStore } from '../../store';
import { useUiStore } from '../../store/uiStore';
import { useI18n } from '../../lib/i18n';
import { getAvailableCrmTabs } from '../../config/premium';
import { CRM_FALLBACKS } from '../../constants/crmConstants';
import { CrmPeople } from './CrmPeople';
import { CrmDeals } from './CrmDeals';
import { CrmTasks } from './CrmTasks';
import { CrmRoles } from './CrmRoles';
import { CrmGlobalSearch } from './CrmGlobalSearch';
import { CrmExportMenu } from './CrmExportMenu';
import { CrmInviteModal } from './CrmInviteModal';
import { CrmImportWizard } from './CrmImportWizard';
import { CrmNextStepsBanner } from './CrmNextStepsBanner';
import { useCrmPermissions } from '../../lib/crm/permissions';
import type { CrmFocusKind } from '../../lib/crm/types';

type Tab = 'people' | 'deals' | 'tasks' | 'roles';

const TABS: { id: Tab; labelKey: string; icon: React.ReactNode }[] = [
  { id: 'people', labelKey: 'crm.tabPeople', icon: <Users size={16} /> },
  { id: 'deals', labelKey: 'crm.tabDeals', icon: <TrendingUp size={16} /> },
  { id: 'tasks', labelKey: 'crm.tabTasks', icon: <CheckSquare size={16} /> },
  { id: 'roles', labelKey: 'crm.tabRoles', icon: <ShieldCheck size={16} /> },
];

type Props = {
  theme?: 'dark' | 'light';
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onMessage?: (name: string, color?: string) => void;
  onOpenPremium?: () => void;
};

export const CrmView: React.FC<Props> = ({ onCall, onVideoCall, onMessage, onOpenPremium }) => {
  const { t } = useI18n();
  const premium = Boolean(useAppStore((s) => s.premiumEntitlement?.premium));
  const ensureCrmSeed = useAppStore((s) => s.ensureCrmSeed);
  const userId = useAppStore((s) => s.userProfile.id);
  const userName = useAppStore((s) => s.userProfile.name);
  const contacts = useAppStore((s) => s.crmContacts);
  const departments = useAppStore((s) => s.crmDepartments);
  const deals = useAppStore((s) => s.crmDeals);
  const tasks = useAppStore((s) => s.crmTasks);
  const crmFilters = useAppStore((s) => s.crmFilters);
  const { me, permissions, can } = useCrmPermissions();
  const [tab, setTab] = useState<Tab>('people');
  const [focus, setFocus] = useState<{ kind: CrmFocusKind; id: string } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    void ensureCrmSeed(userId, userName).catch(() => {});
  }, [ensureCrmSeed, userId, userName]);

  const availableTabs = getAvailableCrmTabs(premium);

  useEffect(() => {
    if (!premium && tab !== 'people') setTab('people');
  }, [premium, tab]);

  // Cross-view entry point (e.g. the chat-list reminder) asks CRM to land on a
  // specific tab; consume and clear the one-shot request.
  const crmTabRequest = useUiStore((s) => s.crmTabRequest);
  const requestCrmTab = useUiStore((s) => s.requestCrmTab);
  useEffect(() => {
    if (!crmTabRequest) return;
    if (availableTabs.includes(crmTabRequest)) setTab(crmTabRequest);
    requestCrmTab(null);
  }, [crmTabRequest, availableTabs, requestCrmTab]);

  const roleLabel = me?.role === 'admin' ? t('crm.roleAdmin', CRM_FALLBACKS.roleAdmin)
    : me?.role === 'manager' ? t('crm.roleManager', CRM_FALLBACKS.roleManager)
    : t('crm.roleMember', CRM_FALLBACKS.roleMember);

  const handlePick = (kind: CrmFocusKind, id: string) => {
    setTab(kind);
    setFocus({ kind, id });
  };

  const focusHandled = () => setFocus(null);
  const focusPeopleId = focus?.kind === 'people' ? focus.id : null;
  const focusDealId = focus?.kind === 'deals' ? focus.id : null;
  const focusTaskId = focus?.kind === 'tasks' ? focus.id : null;

  const filterCount =
    (crmFilters.role !== 'all' ? 1 : 0) +
    (crmFilters.departmentId !== 'all' ? 1 : 0) +
    (crmFilters.status !== 'all' ? 1 : 0) +
    (crmFilters.tag !== 'all' ? 1 : 0) +
    (crmFilters.assignedToMe ? 1 : 0);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden min-h-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)]">
        <div className="min-w-0">
          <div className="text-xs text-[var(--text-secondary)] truncate">
            {me?.displayName} · {roleLabel} · {permissions.length} {t('crm.perms', 'perms')}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'people' && (
            <button
              onClick={() => setFiltersOpen((prev) => !prev)}
              aria-label={t('crm.filters', CRM_FALLBACKS.filters)}
              aria-pressed={filtersOpen}
              title={t('crm.filters', CRM_FALLBACKS.filters)}
              className={`w-9 h-9 min-w-11 min-h-11 rounded-xl border flex items-center justify-center text-xs font-bold transition-all relative ${
                filtersOpen
                  ? 'bg-[var(--accent)] text-[var(--ink-on-saturate)] border-[var(--accent)]'
                  : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent)]'
              }`}
            >
              <SlidersHorizontal size={16} className={`transition-transform ${filtersOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
              <span className="sr-only">{t('crm.filters', CRM_FALLBACKS.filters)}</span>
              {filterCount > 0 && (
                <span data-testid="crm-filter-badge" className="absolute -top-1 -right-1 text-[11px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--accent)] text-[var(--ink-on-saturate)]">
                  {filterCount}
                </span>
              )}
            </button>
          )}
          {!premium && onOpenPremium && (
            <button
              onClick={() => onOpenPremium()}
              aria-label={t('premium.crmUnlock', 'Open Premium')}
              title={t('premium.crmUnlock', 'Open Premium')}
              className="w-9 h-9 min-w-11 min-h-11 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all"
            >
              <Crown size={16} aria-hidden="true" />
              <span className="sr-only">{t('premium.crmUnlock', 'Open Premium')}</span>
            </button>
          )}
          {premium && (
            <>
              <CrmExportMenu contacts={contacts} departments={departments} deals={deals} tasks={tasks} />
              <button
                onClick={() => setImportOpen(true)}
                aria-label={t('crm.import.title', 'Import CRM data')}
                title={t('crm.import.title', 'Import CRM data')}
                className="w-9 h-9 min-w-11 min-h-11 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              >
                <Upload size={16} aria-hidden="true" />
                <span className="sr-only">{t('crm.import.title', 'Import CRM data')}</span>
              </button>
              {can('manageCompany') && (
                <button
                  onClick={() => setInviteOpen(true)}
                  aria-label={t('crm.invite', CRM_FALLBACKS.invite)}
                  title={t('crm.invite', CRM_FALLBACKS.invite)}
                  className="w-9 h-9 min-w-11 min-h-11 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                >
                  <UserPlus size={16} aria-hidden="true" />
                  <span className="sr-only">{t('crm.invite', CRM_FALLBACKS.invite)}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border-color)]">
        <CrmGlobalSearch contacts={contacts} deals={premium ? deals : []} tasks={premium ? tasks : []} onPick={handlePick} />
      </div>

      <div className="flex gap-1 px-2 py-1 border-b border-[var(--border-color)] overflow-x-auto">
        {TABS.filter((tb) => availableTabs.includes(tb.id)).map((tb) => {
          const label = t(tb.labelKey, (CRM_FALLBACKS as any)[tb.labelKey.replace('crm.', '')]);
          const active = tab === tb.id;
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              title={label}
              aria-label={label}
              aria-current={active}
              className={`flex items-center justify-center gap-1.5 px-2.5 min-h-[var(--control-height-sm)] rounded-xl transition-all ${
                active
                  ? 'neo-pressed text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--list-item-hover-bg)]'
              }`}
            >
              {tb.icon}
              <span className="text-xs font-semibold leading-none whitespace-nowrap">{label}</span>
            </button>
          );
        })}
      </div>

      {availableTabs.includes('tasks') && <CrmNextStepsBanner onOpenTasks={() => setTab('tasks')} />}

      {tab === 'people' && (
        <CrmPeople
          onOpenRoles={premium ? () => setTab('roles') : undefined}
          onCall={onCall}
          onVideoCall={onVideoCall}
          onMessage={onMessage}
          focusContactId={focusPeopleId}
          onFocusHandled={focusHandled}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((prev) => !prev)}
        />
      )}
      {tab === 'deals' && <CrmDeals focusDealId={focusDealId} onFocusHandled={focusHandled} onMessage={onMessage} />}
      {tab === 'tasks' && <CrmTasks focusTaskId={focusTaskId} onFocusHandled={focusHandled} />}
      {tab === 'roles' && <CrmRoles />}

      {inviteOpen && <CrmInviteModal onClose={() => setInviteOpen(false)} />}
      {importOpen && <CrmImportWizard onClose={() => setImportOpen(false)} />}
    </div>
  );
};
