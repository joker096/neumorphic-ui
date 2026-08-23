import { CompanyHeader } from './company/CompanyHeader';
import { CompanyInfoCard } from './company/CompanyInfoCard';
import { CreateCompanyModal } from './company/CreateCompanyModal';
import { MemberDetailModal } from './company/MemberDetailModal';
import { DepartmentList } from './company/DepartmentList';
import { DepartmentModal } from './company/DepartmentModal';
import { ContactList } from './company/ContactList';
import { ContactModal } from './company/ContactModal';
import { CompanyCreatePrompt } from './company/CompanyCreatePrompt';
import { CompanyTabs } from './company/CompanyTabs';
import { CompanyMembersPanel } from './company/CompanyMembersPanel';
import { CompanyScanQrModal } from './company/CompanyScanQrModal';
import { CompanyInviteModal } from './company/CompanyInviteModal';
import { CompanySettingsModal } from './company/CompanySettingsModal';
import { useCompanyContacts } from './company/useCompanyContacts';
import { AnimatePresence } from 'motion/react';

type CompanyContactsViewProps = {
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onMessage?: (name: string, color?: string) => void;
  theme?: 'dark' | 'light';
};

export const CompanyContactsView = ({ onCall, onVideoCall, onMessage, theme }: CompanyContactsViewProps) => {
  const company = useCompanyContacts();
  const isDark = theme === 'dark';

  if (company.shouldHideCompany) {
    return null;
  }

  return (
    <div className="w-full flex-1 flex flex-col overflow-y-auto px-3 md:px-5 py-3 md:py-5">
      <CompanyHeader onScanQR={company.handleScanQR} onInvite={company.handleInvite} onSettings={company.handleSettings} canManage={company.canManage} />
      <CompanyInfoCard
        isDark={isDark}
        orgId={company.companyId || ''}
        connected={company.t('company.connected') || 'Connected'}
      />

      {company.showCreatePrompt ? (
        <CompanyCreatePrompt t={company.t} onCreate={() => company.setShowCreate(true)} />
      ) : (
        <>
          <CompanyTabs activeTab={company.activeTab} onSelect={company.setActiveTab} t={company.t} />

          {company.activeTab === 'members' && (
            <CompanyMembersPanel
              isDark={isDark}
              members={company.companyMembers}
              channels={company.companyChannels}
              canManage={company.canManage}
              currentUserId={company.userProfile.id}
              groupMode={company.groupMode}
              selectedIds={company.selectedIds}
              t={company.t}
              onCall={onCall}
              onVideoCall={onVideoCall}
              onMessage={onMessage}
              onToggleSelect={company.toggleSelectMember}
              onMemberEdit={company.setSelectedMember}
              onEnterGroupMode={() => company.setGroupMode(true)}
              onExitGroupMode={company.exitGroupMode}
              onStartGroupCall={company.startGroupVideoCall}
            />
          )}

          {company.activeTab === 'departments' && (
            <DepartmentList
              isDark={isDark}
              departments={company.companyDepartments}
              members={company.companyMembers}
              canManage={company.canManage}
              onAdd={() => {
                company.setSelectedDepartment(null);
                company.setDepartmentModalOpen(true);
              }}
              onDepartmentClick={company.setSelectedDepartment}
              departmentsLabel={company.t('company.departments') || 'Departments'}
              addLabel={company.t('company.addDepartment') || 'Add department'}
              t={company.t}
            />
          )}

          {company.activeTab === 'contacts' && (
            <ContactList
              isDark={isDark}
              contacts={company.companyContacts}
              departments={company.companyDepartments}
              canManage={company.canManage}
              onAdd={() => {
                company.setSelectedContact(null);
                company.setContactModalOpen(true);
              }}
              onContactClick={company.setSelectedContact}
              contactsLabel={company.t('company.contacts') || 'Contacts'}
              addLabel={company.t('company.addContact') || 'Add contact'}
              t={company.t}
            />
          )}
        </>
      )}

      <AnimatePresence>
        {company.showScanQR && (
          <CompanyScanQrModal
            isDark={isDark}
            title={company.t('company.scanQR') || 'Scan QR to Join'}
            description={company.t('company.scanDescription') || 'Point camera at company QR code'}
            onClose={() => company.setShowScanQR(false)}
            onScanResult={company.handleJoinCompanyFromQR}
          />
        )}

        {company.showInvite && (
          <CompanyInviteModal
            isDark={isDark}
            title={company.t('company.invite') || 'Invite Members'}
            description={company.t('company.inviteDescription') || 'Share this QR code with team members'}
            invitePayload={company.invitePayload}
            companyId={company.companyId}
            onClose={() => company.setShowInvite(false)}
          />
        )}

        {company.showSettings && <CompanySettingsModal onClose={() => company.setShowSettings(false)} />}

        {company.showCreate && (
          <CreateCompanyModal
            onClose={() => company.setShowCreate(false)}
            onCreated={company.handleCreated}
          />
        )}

        {company.selectedMember && (
          <MemberDetailModal
            member={company.selectedMember}
            isDark={isDark}
            canManage={company.canManage}
            isCurrentUser={company.selectedMember.userId === company.userProfile.id}
            onClose={() => company.setSelectedMember(null)}
            onSave={(displayName) => company.handleSaveMemberName(company.selectedMember?.userId ?? '', displayName)}
            onChangeRole={(role) => company.handleChangeRole(company.selectedMember?.userId ?? '', role)}
            onRemove={() => company.handleRemoveMember(company.selectedMember?.userId ?? '')}
          />
        )}

        {company.departmentModalOpen && (
          <DepartmentModal
            department={company.selectedDepartment}
            members={company.companyMembers}
            isDark={isDark}
            canManage={company.canManage}
            onClose={() => company.setDepartmentModalOpen(false)}
            onSave={company.handleSaveDepartment}
            onRemove={company.canManage ? company.handleRemoveDepartment : undefined}
          />
        )}

        {company.contactModalOpen && (
          <ContactModal
            contact={company.selectedContact}
            departments={company.companyDepartments}
            isDark={isDark}
            canManage={company.canManage}
            onClose={() => company.setContactModalOpen(false)}
            onSave={company.handleSaveContact}
            onRemove={company.canManage ? company.handleRemoveContact : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
