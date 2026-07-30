import type { ComponentType } from 'react';
import { LucideIcon } from 'lucide-react';

type NavItemProps = {
  id?: string;
  label: string;
  icon?: ComponentType<any> | LucideIcon;
  active?: boolean;
  isActive?: boolean;
  badge?: number;
  showBadge?: boolean;
  badgeCount?: number;
  onClick?: () => void;
};

export const NavItem = ({ label, icon: Icon, active, isActive, badge, badgeCount, onClick }: NavItemProps) => (
  <button
    type="button"
    className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium cursor-pointer transition-all ${
      (active || isActive) ? 'text-[var(--text-primary)] bg-white/10' : 'text-gray-400 hover:text-[var(--text-primary)]'
    }`}
    onClick={onClick}
  >
    {Icon && <Icon size={18} />}
    {label}
    {badge && badgeCount ? <span className="ml-1 text-[10px]">{badgeCount}</span> : null}
  </button>
);

