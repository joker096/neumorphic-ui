import React, { useEffect, useRef, useState } from 'react';
import { Download, FileText, TrendingUp, CheckSquare, Building2 } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { CRM_FALLBACKS } from '../../constants/crmConstants';
import type { CrmContact, Department, Deal, CrmTask } from '../../lib/crm/types';
import {
  downloadFile, contactsToCsv, dealsToCsv, tasksToCsv, companyToCompanyJson, exportStamp,
} from '../../lib/crm/export';

type Props = {
  contacts: CrmContact[];
  departments: Department[];
  deals: Deal[];
  tasks: CrmTask[];
};

export const CrmExportMenu: React.FC<Props> = ({ contacts, departments, deals, tasks }) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const run = (filename: string, content: string, mime: string) => {
    try {
      downloadFile(filename, content, mime);
    } finally {
      setOpen(false);
    }
  };

  const stamp = exportStamp();

  const items: { label: string; icon: React.ReactNode; run: () => void }[] = [
    {
      label: t('crm.exportContactsCsv', CRM_FALLBACKS.exportContactsCsv),
      icon: <FileText size={14} />,
      run: () => run(`crm-contacts-${stamp}.csv`, contactsToCsv(contacts, departments), 'text/csv'),
    },
    {
      label: t('crm.exportDealsCsv', CRM_FALLBACKS.exportDealsCsv),
      icon: <TrendingUp size={14} />,
      run: () => run(`crm-deals-${stamp}.csv`, dealsToCsv(deals, contacts), 'text/csv'),
    },
    {
      label: t('crm.exportTasksCsv', CRM_FALLBACKS.exportTasksCsv),
      icon: <CheckSquare size={14} />,
      run: () => run(`crm-tasks-${stamp}.csv`, tasksToCsv(tasks, contacts), 'text/csv'),
    },
    {
      label: t('crm.exportCompanyJson', CRM_FALLBACKS.exportCompanyJson),
      icon: <Building2 size={14} />,
      run: () => run(`crm-company-${stamp}.json`, companyToCompanyJson(contacts, departments, deals, tasks), 'application/json'),
    },
  ];

  return (
    <div ref={boxRef} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="min-h-[44px] px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
      >
        <Download size={15} />
        {t('crm.export', CRM_FALLBACKS.export)}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-lg z-[140] overflow-hidden min-w-[190px]">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.run}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[var(--text-primary)] hover:bg-[var(--list-item-hover-bg)] transition-colors"
            >
              <span className="text-[var(--text-secondary)]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
