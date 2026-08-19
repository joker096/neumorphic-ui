import { Shield, UserCog, User as UserIcon } from 'lucide-react';
import type { CrmContact, CustomRole, SystemRole } from '../../lib/crm/types';
import { SYSTEM_ROLES } from '../../constants/crmConstants';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { CRM_FALLBACKS } from '../../constants/crmConstants';

function roleLabel(role: SystemRole, t: (k: string, f?: string) => string) {
  const meta = SYSTEM_ROLES.find((r) => r.id === role);
  return meta ? t(meta.labelKey, (CRM_FALLBACKS as any)[meta.labelKey.replace('crm.', '')]) : role;
}

const tone: Record<string, string> = {
  admin: 'bg-[var(--accent)]/15 text-[var(--accent)]',
  manager: 'bg-[var(--color-success)]/15 text-[var(--color-success)]',
  member: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
};

export const RoleBadge: React.FC<{ contact: CrmContact }> = ({ contact }) => {
  const { t } = useI18n();
  const customRoles = useAppStore((s) => s.crmCustomRoles);
  const custom = contact.customRoleId
    ? customRoles.find((r: CustomRole) => r.id === contact.customRoleId)
    : undefined;

  const Icon = contact.role === 'admin' ? Shield : contact.role === 'manager' ? UserCog : UserIcon;

  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${tone[contact.role]}`}>
        <Icon size={10} />
        {roleLabel(contact.role, t)}
      </span>
      {custom && (
        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
          {custom.name}
        </span>
      )}
    </span>
  );
};
