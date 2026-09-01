import { useEffect, useState } from 'react';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { callManager } from '../../lib/call/CallManager';
import { toast } from 'sonner';
import type { InviteQRPayload } from '../../lib/company/types';
import type { CompanyMember, CompanyDepartment, CompanyContact } from '../../types/constants';

export type CompanyTab = 'members' | 'departments' | 'contacts' | 'inbox' | 'sitechat';
export type TFunction = (key: string, fallback?: string | Record<string, string | number>) => string;

export const useCompanyContacts = () => {
  const { t } = useI18n();
  const companyMembers = useAppStore(state => state.companyMembers);
  const companyChannels = useAppStore(state => state.companyChannels);
  const companyId = useAppStore(state => state.companyId);
  const companySettings = useAppStore(state => state.companySettings);
  const connectionStatus = useAppStore(state => state.connectionStatus);
  const hideWhenOfficeOnly = useAppStore(state => state.hideWhenOfficeOnly);
  const userProfile = useAppStore(state => state.userProfile);
  const setCompanyMembers = useAppStore(state => state.setCompanyMembers);
  const loadCompanySettings = useAppStore(state => state.loadCompanySettings);
  const loadCompanyData = useAppStore(state => state.loadCompanyData);
  const createCompanyInvite = useAppStore(state => state.createCompanyInvite);
  const joinCompanyFromInvite = useAppStore(state => state.joinCompanyFromInvite);
  const updateMemberRole = useAppStore(state => state.updateMemberRole);
  const renameMember = useAppStore(state => state.renameMember);
  const removeMember = useAppStore(state => state.removeMember);
  const companyDepartments = useAppStore(state => state.companyDepartments);
  const companyContacts = useAppStore(state => state.companyContacts);
  const addDepartment = useAppStore(state => state.addCompanyDepartment);
  const updateDepartment = useAppStore(state => state.updateCompanyDepartment);
  const removeDepartment = useAppStore(state => state.removeCompanyDepartment);
  const addContact = useAppStore(state => state.addCompanyContact);
  const updateContact = useAppStore(state => state.updateCompanyContact);
  const removeContact = useAppStore(state => state.removeCompanyContact);
  const siteChats = useAppStore(state => state.siteChats);
  const createSiteChat = useAppStore(state => state.createSiteChat);

  const [showCreate, setShowCreate] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showScanQR, setShowScanQR] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [invitePayload, setInvitePayload] = useState<InviteQRPayload | null>(null);
  const [groupMode, setGroupMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CompanyMember | null>(null);
  const [activeTab, setActiveTab] = useState<CompanyTab>('members');
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<CompanyDepartment | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CompanyContact | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!companySettings) {
        await loadCompanySettings();
      }
      await loadCompanyData?.();
      if (active) setInitialized(true);
    })();
    return () => { active = false; };
  }, []);

  const isPreview = !companyId;

  useEffect(() => {
    if (!initialized || !isPreview || companyMembers.length > 0) return;
    const currentUserMember: CompanyMember = {
      userId: userProfile.id,
      displayName: userProfile.name || 'You',
      role: 'admin',
      publicKey: '',
      joinedAt: Date.now(),
      lastActive: Date.now(),
      online: true,
    };
    setCompanyMembers([currentUserMember]);
  }, [initialized, isPreview, companyMembers.length]);

  const showCreatePrompt = initialized && isPreview;
  const isInOffice = connectionStatus === 'connected';
  const shouldHideCompany = hideWhenOfficeOnly && !isInOffice;
  const canManage = companyMembers.some(
    (member: CompanyMember) => member.userId === userProfile.id && member.role === 'admin',
  );

  const handleScanQR = () => setShowScanQR(true);

  const handleInvite = async () => {
    setShowInvite(true);
    const payload = await createCompanyInvite();
    if (payload) setInvitePayload(payload);
  };

  const handleSettings = () => setShowSettings(true);

  const handleCreated = () => setInitialized(true);

  const handleJoinCompanyFromQR = async (scannedData: string) => {
    const raw = (scannedData || '').trim();
    setShowScanQR(false);
    if (!raw) {
      toast.error(t('company.invalidInvite', 'Invalid invite code'));
      return;
    }
    try {
      const payload = JSON.parse(raw) as InviteQRPayload;
      if (payload && payload.org) {
        await joinCompanyFromInvite(payload, userProfile.name || 'Member');
        toast.success(t('company.joinedCompany', 'Joined company'));
        return;
      }
    } catch {
      /* not a JSON invite payload — fall back to plain org id */
    }
    await joinCompanyFromInvite({ org: raw, code: '', name: '', adminKey: '' }, userProfile.name || 'Member');
    toast.success(t('company.joinedCompany', 'Joined company'));
  };

  const handleSaveMemberName = (userId: string, displayName: string) => {
    renameMember(userId, displayName);
  };

  const handleSaveDepartment = (input: { name: string; description?: string; color?: string; memberIds?: string[] }) => {
    if (selectedDepartment) updateDepartment(selectedDepartment.id, input);
    else addDepartment(input);
  };

  const handleRemoveDepartment = (id: string) => {
    removeDepartment(id);
  };

  const handleSaveContact = (input: { name: string; title?: string; phone?: string; email?: string; departmentId?: string | null; notes?: string }) => {
    if (selectedContact) updateContact(selectedContact.id, input);
    else addContact(input);
  };

  const handleRemoveContact = (id: string) => {
    removeContact(id);
  };

  const handleChangeRole = (userId: string, role: 'admin' | 'manager' | 'member') => {
    updateMemberRole(userId, role);
  };

  const handleRemoveMember = (userId: string) => {
    removeMember(userId);
  };

  const toggleSelectMember = (userId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const exitGroupMode = () => {
    setGroupMode(false);
    setSelectedIds(new Set());
  };

  const startGroupVideoCall = () => {
    const participants = companyMembers
      .filter((member: CompanyMember) => member.userId !== userProfile.id && selectedIds.has(member.userId))
      .map((member: CompanyMember) => ({ peerId: member.publicKey || member.userId, displayName: member.displayName }));
    if (participants.length === 0) return;
    callManager.startCall(userProfile.id, userProfile.name || 'Me', 'video', participants).catch(() => {});
    exitGroupMode();
  };

  return {
    t,
    companyMembers,
    companyChannels,
    companyId,
    userProfile,
    companyDepartments,
    companyContacts,
    canManage,
    showCreatePrompt,
    shouldHideCompany,
    showCreate,
    setShowCreate,
    showScanQR,
    setShowScanQR,
    showInvite,
    setShowInvite,
    invitePayload,
    groupMode,
    selectedIds,
    showSettings,
    selectedMember,
    activeTab,
    departmentModalOpen,
    selectedDepartment,
    contactModalOpen,
    selectedContact,
    handleScanQR,
    handleInvite,
    handleSettings,
    handleCreated,
    handleJoinCompanyFromQR,
    handleSaveMemberName,
    handleChangeRole,
    handleRemoveMember,
    handleSaveDepartment,
    handleRemoveDepartment,
    handleSaveContact,
    handleRemoveContact,
    siteChats,
    createSiteChat,
    toggleSelectMember,
    exitGroupMode,
    startGroupVideoCall,
    setActiveTab,
    setGroupMode,
    setShowSettings,
    setSelectedMember,
    setDepartmentModalOpen,
    setSelectedDepartment,
    setContactModalOpen,
    setSelectedContact,
  };
};
