import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, CheckSquare, ShieldCheck, UserPlus } from 'lucide-react';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { CRM_FALLBACKS } from '../../constants/crmConstants';
import { CrmPeople } from './CrmPeople';
import { CrmDeals } from './CrmDeals';
import { CrmTasks } from './CrmTasks';
import { CrmRoles } from './CrmRoles';
import { CrmGlobalSearch } from './CrmGlobalSearch';
import { CrmExportMenu } from './CrmExportMenu';
import { CrmInviteModal } from './CrmInviteModal';
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
};

export const CrmView: React.FC<Props> = ({ onCall, onVideoCall, onMessage }) => {
  const { t } = useI18n();
  const ensureCrmSeed = useAppStore((s) => s.ensureCrmSeed);
  const userId = useAppStore((s) => s.userProfile.id);
  const userName = useAppStore((s) => s.userProfile.name);
  const contacts = useAppStore((s) => s.crmContacts);
  const departments = useAppStore((s) => s.crmDepartments);
  const deals = useAppStore((s) => s.crmDeals);
  const tasks = useAppStore((s) => s.crmTasks);
  const { me, permissions, can } = useCrmPermissions();
  const [tab, setTab] = useState<Tab>('people');
  const [focus, setFocus] = useState<{ kind: CrmFocusKind; id: string } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    ensureCrmSeed(userId, userName);
  }, [ensureCrmSeed, userId, userName]);

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

  return (
    <div className="w-full h-full flex flex-col overflow-hidden min-h-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
        <div>
          <h2 className="text-2xl font-bold tracking-wide text-[var(--text-primary)]">{t('crm.title', CRM_FALLBACKS.title)}</h2>
          <div className="text-xs text-[var(--text-secondary)]">
            {me?.displayName} · {roleLabel} · {permissions.length} {t('crm.perms', 'perms')}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CrmExportMenu contacts={contacts} departments={departments} deals={deals} tasks={tasks} />
          {can('manageCompany') && (
            <button
              onClick={() => setInviteOpen(true)}
              className="min-h-[44px] px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            >
              <UserPlus size={15} />
              {t('crm.invite', CRM_FALLBACKS.invite)}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-color)]">
        <CrmGlobalSearch contacts={contacts} deals={deals} tasks={tasks} onPick={handlePick} />
      </div>

      <div className="flex gap-1 px-3 py-2 border-b border-[var(--border-color)] overflow-x-auto">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`flex items-center gap-1.5 px-2.5 min-h-[var(--control-height-sm)] rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
              tab === tb.id ? 'bg-[var(--accent)] text-[var(--ink-on-saturate)]' : 'text-[var(--text-secondary)] hover:bg-[var(--list-item-hover-bg)]'
            }`}
          >
            {tb.icon}
            {t(tb.labelKey, (CRM_FALLBACKS as any)[tb.labelKey.replace('crm.', '')])}
          </button>
        ))}
      </div>

      {tab === 'people' && (
        <CrmPeople
          onOpenRoles={() => setTab('roles')}
          onCall={onCall}
          onVideoCall={onVideoCall}
          onMessage={onMessage}
          focusContactId={focusPeopleId}
          onFocusHandled={focusHandled}
        />
      )}
      {tab === 'deals' && <CrmDeals focusDealId={focusDealId} onFocusHandled={focusHandled} />}
      {tab === 'tasks' && <CrmTasks focusTaskId={focusTaskId} onFocusHandled={focusHandled} />}
      {tab === 'roles' && <CrmRoles />}

      {inviteOpen && <CrmInviteModal onClose={() => setInviteOpen(false)} />}
    </div>
  );
};
