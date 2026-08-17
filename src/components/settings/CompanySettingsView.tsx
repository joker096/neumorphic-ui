import React from 'react'
import { ChevronLeft, Building2 } from 'lucide-react'
import { useI18n } from '../../lib/i18n'
import { useAppStore } from '../../store'
import { SettingsSectionTitle, SettingsToggleRow } from '../ui/SettingsRow'

type CompanySettingsViewProps = {
  isDark: boolean
  onBack: () => void
}

export const CompanySettingsView = ({ isDark, onBack }: CompanySettingsViewProps) => {
  const { t } = useI18n()
  const hideWhenOfficeOnly = useAppStore(s => s.hideWhenOfficeOnly)
  const setHideWhenOfficeOnly = useAppStore(s => s.setHideWhenOfficeOnly)

  return (
    <div className="w-full max-w-[500px] flex flex-col p-5 mb-8 pb-28 sm:pb-8">
      <div className="w-full shrink-0 mb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 ${
            isDark
              ? 'bg-[var(--bg-tertiary)] hover:bg-[var(--hover-bg-dark)] text-[var(--text-secondary)]'
              : 'bg-[var(--bg-primary)] hover:bg-white text-[var(--text-secondary)] shadow-sm'
          }`}
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <div className="flex-1">
          <div className={`text-lg font-bold ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
            {t('settings.company')}
          </div>
        </div>
      </div>

{/* Scrolling is handled by the parent SettingsView root (overflow-y-auto). */}
<div className="overflow-x-hidden pr-1 flex flex-col gap-6">
         <div className="pb-16 sm:pb-0">
           <div className="w-full">
             <SettingsSectionTitle title={t('settings.companyVisibility')} isDark={isDark} />
             <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-color)]' : 'bg-white shadow-sm border border-[var(--border-color)]'}`}>
               <SettingsToggleRow
                 icon={<Building2 size={16} />}
                 iconColor={isDark ? 'text-orange-400' : 'text-orange-600'}
                 iconBg={isDark ? 'bg-[var(--color-warning)]/10' : 'bg-orange-100'}
title={t('settings.hideWhenOfficeOnly')}
                  subtitle={t('settings.hideWhenOfficeOnlySubtitle')}
                 isOn={hideWhenOfficeOnly}
                 onToggle={() => setHideWhenOfficeOnly(!hideWhenOfficeOnly)}
                 isDark={isDark}
               />
             </div>
           </div>
         </div>
       </div>
    </div>
  )
}


