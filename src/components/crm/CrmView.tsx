import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, CheckSquare, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { CRM_FALLBACKS } from '../../constants/crmConstants';
import { CrmPeople } from './CrmPeople';
import { CrmDeals } from './CrmDeals';
import { CrmTasks } from './CrmTasks';
import { CrmRoles } from './CrmRoles';
import { useCrmPermissions } from '../../lib/crm/permissions';

type Tab = 'people' | 'deals' | 'tasks' | 'roles';

const TABS: { id: Tab; labelKey: string; icon: React.ReactNode }[] = [
  { id: 'people', labelKey: 'crm.tabPeople', icon: <Users size={16} /> },
  { id: 'deals', labelKey: 'crm.tabDeals', icon: <TrendingUp size={16} /> },
  { id: 'tasks', labelKey: 'crm.tabTasks', icon: <CheckSquare size={16} /> },
  { id: 'roles', labelKey: 'crm.tabRoles', icon: <ShieldCheck size={16} /> },
];

export const CrmView: React.FC<{ theme?: 'dark' | 'light' }> = () => {
  const { t } = useI18n();
  const ensureCrmSeed = useAppStore((s) => s.ensureCrmSeed);
  const userId = useAppStore((s) => s.userProfile.id);
  const userName = useAppStore((s) => s.userProfile.name);
  const { me, permissions } = useCrmPermissions();
  const [tab, setTab] = useState<Tab>('people');

  useEffect(() => {
    ensureCrmSeed(userId, userName);
  }, [ensureCrmSeed, userId, userName]);

  const roleLabel = me?.role === 'admin' ? t('crm.roleAdmin', CRM_FALLBACKS.roleAdmin)
    : me?.role === 'manager' ? t('crm.roleManager', CRM_FALLBACKS.roleManager)
    : t('crm.roleMember', CRM_FALLBACKS.roleMember);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden min-h-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
        <div>
          <h2 className="text-2xl font-bold tracking-wide text-[var(--text-primary)]">{t('crm.title', CRM_FALLBACKS.title)}</h2>
          <div className="text-[11px] text-[var(--text-secondary)]">
            {me?.displayName} · {roleLabel} · {permissions.length} {t('crm.perms', 'perms')}
          </div>
        </div>
      </div>

      <div className="flex gap-1 px-3 py-2 border-b border-[var(--border-color)] overflow-x-auto">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              tab === tb.id ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--list-item-hover-bg)]'
            }`}
          >
            {tb.icon}
            {t(tb.labelKey, (CRM_FALLBACKS as any)[tb.labelKey.replace('crm.', '')])}
          </button>
        ))}
      </div>

      {tab === 'people' &&       <CrmPeople onOpenRoles={() => setTab('roles')} />}
      {tab === 'deals' && <CrmDeals />}
      {tab === 'tasks' && <CrmTasks />}
      {tab === 'roles' && <CrmRoles />}
    </div>
  );
};
