import { Building2, Plus, Loader2, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { CompanyDepartment, CompanyMember } from '../../types/constants';
import { memberColorAt } from '../../constants/companyConstants';

type DepartmentListProps = {
  isDark?: boolean;
  departments: CompanyDepartment[];
  members: CompanyMember[];
  canManage?: boolean;
  onAdd?: () => void;
  onDepartmentClick?: (department: CompanyDepartment) => void;
  departmentsLabel: string;
  addLabel: string;
  t: (key: string, args?: Record<string, string | number> | string) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const DepartmentList = ({
  isDark = false,
  departments,
  members,
  canManage = false,
  onAdd,
  onDepartmentClick,
  departmentsLabel,
  addLabel,
  t,
  loading = false,
  error = null,
  onRetry,
}: DepartmentListProps) => {
  const memberById = (id: string) => members.find((m) => m.userId === id);

  return (
    <div className="w-full mb-4">
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-[var(--accent)]">
          <Building2 size={14} />
          <span className="truncate">{departmentsLabel} ({departments.length})</span>
        </div>
        {canManage && onAdd && (
          <button
            onClick={onAdd}
            className="min-h-[44px] min-w-[44px] px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">{addLabel}</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-[var(--text-secondary)]">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-xs">{t('company.loading', 'Loading...')}</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <AlertCircle size={20} className="text-[var(--color-warning)]" />
          <span className="text-xs text-[var(--text-secondary)]">{error}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="min-h-[44px] px-4 rounded-xl text-xs font-bold cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110"
            >
              {t('company.retry', 'Retry')}
            </button>
          )}
        </div>
      ) : departments.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--text-secondary)]">
          {t('company.departmentsEmpty', 'No departments yet')}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {departments.map((dept, i) => {
              const assigned = dept.memberIds
                .map(memberById)
                .filter(Boolean) as CompanyMember[];
              return (
                <motion.button
                  key={dept.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  onClick={() => onDepartmentClick?.(dept)}
                  className="w-full text-left p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all bg-[var(--bg-tertiary)] hover:brightness-110"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br ${dept.color || memberColorAt(i)}`}>
                    <Building2 size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-[var(--text-primary)] truncate">{dept.name}</div>
                    {dept.description ? (
                      <div className="text-xs text-[var(--text-secondary)] truncate">{dept.description}</div>
                    ) : null}
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {t('company.departmentMemberCount', '{count} member(s)').replace('{count}', String(assigned.length))}
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    {assigned.slice(0, 3).map((m, idx) => (
                      <div
                        key={m.userId}
                        title={m.displayName}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${memberColorAt(idx)} ring-2 ring-[var(--bg-tertiary)]`}
                      >
                        {initials(m.displayName)}
                      </div>
                    ))}
                    {assigned.length > 3 && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-[var(--bg-secondary)] text-[var(--text-primary)] ring-2 ring-[var(--bg-tertiary)]">
                        +{assigned.length - 3}
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
