import React, { useState } from 'react'
import { ChevronLeft, Building2, BookOpen, Plus, X, Loader2 } from 'lucide-react'
import { useI18n } from '../../lib/i18n'
import { useAppStore } from '../../store'
import { SettingsSectionTitle, SettingsToggleRow, SettingsRow, SettingsGroup } from '../ui/SettingsRow'
import { toast } from '../ui/Toast'

type CompanySettingsViewProps = {
  isDark: boolean
  onBack: () => void
  onOpenGuide?: () => void
}

export const CompanySettingsView = ({ isDark, onBack, onOpenGuide }: CompanySettingsViewProps) => {
  const { t } = useI18n()
  const hideWhenOfficeOnly = useAppStore(s => s.hideWhenOfficeOnly)
  const setHideWhenOfficeOnly = useAppStore(s => s.setHideWhenOfficeOnly)
  const companyId = useAppStore(s => s.companyId)
  const companySettings = useAppStore(s => s.companySettings)
  const createCompany = useAppStore(s => s.createCompany)

  const [showCreate, setShowCreate] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [yourName, setYourName] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!orgName.trim() || !yourName.trim() || creating) return
    setCreating(true)
    try {
      await createCompany(orgName.trim(), yourName.trim())
      toast(t('company.createdSuccessfully', 'Company created successfully'), 'success')
      setShowCreate(false)
      setOrgName('')
      setYourName('')
    } catch {
      toast(t('company.settingsSaveFailed', 'Failed to create company'), 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="w-full max-w-[500px] flex flex-col p-5 mb-8 pb-[calc(56px+var(--spacing-16)+env(safe-area-inset-bottom,0px))] sm:pb-8">
      <div className="w-full shrink-0 mb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label={t('common.back')}
          className={`min-w-11 min-h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
            isDark
              ? 'bg-[var(--bg-tertiary)] hover:bg-[var(--hover-bg-dark)] text-[var(--text-secondary)]'
              : 'bg-[var(--bg-primary)] hover:bg-white text-[var(--text-secondary)] shadow-sm'
          }`}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1">
          <div className={`text-lg font-bold ${'text-[var(--text-primary)]'}`}>
            {t('settings.company')}
          </div>
        </div>
      </div>

{/* Scrolling is handled by the parent SettingsView root (overflow-y-auto). */}
<div className="overflow-x-hidden pr-1 flex flex-col gap-6">
        <SettingsGroup isDark={isDark}>
          <button
            onClick={onOpenGuide}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors active:scale-[0.99] hover:bg-black/5"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/10' : 'bg-amber-100'}`}>
                <BookOpen size={16} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
              </span>
              <span className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-900'}`}>{t('company.guide.title', 'Company guide')}</span>
                <span className={`block text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t('company.guide.subtitle', 'How companies & roles work')}</span>
              </span>
            </span>
          </button>
        </SettingsGroup>

        {!companyId && !showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            aria-label={t('company.createTitle', 'Create Company')}
            title={t('company.createTitle', 'Create Company')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl min-h-11 font-bold text-sm transition-colors active:scale-[0.99] bg-[var(--accent)] text-[var(--button-primary-text)]"
          >
            <Plus size={16} aria-hidden="true" />
            <span>{t('company.createTitle', 'Create Company')}</span>
          </button>
        )}

        {showCreate && (
          <div className={`rounded-xl p-4 flex flex-col gap-3 ${isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-color)]' : 'bg-white shadow-sm border border-[var(--border-color)]'}`}>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-1.5 block">{t('company.orgName', 'Company')}</label>
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder={t('company.namePlaceholder', 'Acme Inc.')}
                className="w-full min-h-11 px-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border-color)] focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-1.5 block">{t('company.yourName', 'Your Name')}</label>
              <input
                value={yourName}
                onChange={(e) => setYourName(e.target.value)}
                placeholder={t('company.displayNamePlaceholder', 'John Doe')}
                className="w-full min-h-11 px-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border-color)] focus:border-[var(--accent)]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                aria-label={t('company.cancel', 'Cancel')}
                title={t('company.cancel', 'Cancel')}
                className="flex-1 min-w-11 min-h-11 rounded-xl font-bold text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:brightness-110 flex items-center justify-center gap-2"
              >
                <X size={18} aria-hidden="true" />
                <span>{t('company.cancel', 'Cancel')}</span>
              </button>
              <button
                onClick={handleCreate}
                disabled={!orgName.trim() || !yourName.trim() || creating}
                aria-label={t('company.create', 'Create Company')}
                title={t('company.create', 'Create Company')}
                className="flex-1 min-w-11 min-h-11 rounded-xl font-bold text-sm bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
                <span>{t('company.create', 'Create Company')}</span>
              </button>
            </div>
          </div>
        )}

        {companyId && (
          <div className={`rounded-xl p-4 ${isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-color)]' : 'bg-white shadow-sm border border-[var(--border-color)]'}`}>
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-1.5">{t('company.orgId', 'org_b64test123')}</div>
            <div className="font-mono text-xs break-all text-[var(--accent)]">{companyId}</div>
            {companySettings?.name && (
              <div className="mt-2 text-sm text-[var(--text-primary)]">{companySettings.name}</div>
            )}
          </div>
        )}

         <div className="pb-16 sm:pb-0">
           <div className="w-full">
             <SettingsSectionTitle title={t('settings.companyVisibility')} isDark={isDark} />
             <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-color)]' : 'bg-white shadow-sm border border-[var(--border-color)]'}`}>
               <SettingsToggleRow
                 icon={<Building2 size={16} />}
                  iconColor="t-accent"
                  iconBg="t-accent-bg"
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



