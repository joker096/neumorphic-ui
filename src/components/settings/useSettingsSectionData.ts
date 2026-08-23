import { useState } from 'react';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';

export const useSettingsSectionData = () => {
  const { t, setLang, lang } = useI18n();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>('main');

  const notificationsEnabled = useAppStore(state => state.notifications);
  const setNotificationsEnabled = useAppStore(state => state.setNotifications);
  const soundEnabled = useAppStore(state => state.soundEnabled);
  const setSoundEnabled = useAppStore(state => state.setSoundEnabled);
  const twoFactorEnabled = useAppStore(state => state.twoFactor);
  const setTwoFactorEnabled = useAppStore(state => state.setTwoFactor);
  const proxyEnabled = useAppStore(state => state.proxyEnabled);
  const setProxyEnabled = useAppStore(state => state.setProxyEnabled);
  const spamFilterEnabled = useAppStore(state => state.spamFilter);
  const setSpamFilterEnabled = useAppStore(state => state.setSpamFilter);
  const showPwaBanner = useAppStore(state => state.pwaBanner);
  const setShowPwaBanner = useAppStore(state => state.setPwaBanner);
  const deadMansSwitch = useAppStore(state => state.deadMansSwitch);
  const setDeadMansSwitch = useAppStore(state => state.setDeadMansSwitch);
  const mediaAutoLoad = useAppStore(state => state.mediaAutoLoad);
  const setMediaAutoLoad = useAppStore(state => state.setMediaAutoLoad);
  const selfDestructDefault = useAppStore(state => state.selfDestructDefault);
  const setSelfDestructDefault = useAppStore(state => state.setSelfDestructDefault);
  const obfuscationMode = useAppStore(state => state.obfuscationMode);
  const setObfuscationMode = useAppStore(state => state.setObfuscationMode);
  const obfuscationEnabled = useAppStore(state => state.obfuscationEnabled);
  const setObfuscationEnabled = useAppStore(state => state.setObfuscationEnabled);
  const proxyUrl = useAppStore(state => state.proxyUrl);
  const setProxyUrl = useAppStore(state => state.setProxyUrl);
  const torBridge = useAppStore(state => state.torBridge);
  const setTorBridge = useAppStore(state => state.setTorBridge);
  const relayBackend = useAppStore(state => state.relayBackend);
  const setRelayBackend = useAppStore(state => state.setRelayBackend);
  const autoReconnectEnabled = useAppStore(state => state.autoReconnect);
  const setAutoReconnectEnabled = useAppStore(state => state.setAutoReconnect);
  const p2pMeshEnabled = useAppStore(state => state.p2pMesh);
  const setP2pMeshEnabled = useAppStore(state => state.setP2pMesh);
  const visNumber = useAppStore(state => state.visNumber);
  const setVisNumber = useAppStore(state => state.setVisNumber);
  const visActivity = useAppStore(state => state.visActivity);
  const setVisActivity = useAppStore(state => state.setVisActivity);
  const uiAnimations = useAppStore(state => state.uiAnimations);
  const setUiAnimations = useAppStore(state => state.setUiAnimations);
  const dndEnabled = useAppStore(state => state.dndEnabled);
  const setDndEnabled = useAppStore(state => state.setDndEnabled);
  const dndFrom = useAppStore(state => state.dndFrom);
  const setDndFrom = useAppStore(state => state.setDndFrom);
  const dndTo = useAppStore(state => state.dndTo);
  const setDndTo = useAppStore(state => state.setDndTo);
  const priorityContacts = useAppStore(state => state.priorityContacts);
  const setPriorityContacts = useAppStore(state => state.setPriorityContacts);
  const saveAudioRecordings = useAppStore(state => state.saveAudioRecordings);
  const setSaveAudioRecordings = useAppStore(state => state.setSaveAudioRecordings);
  const saveVideoRecordings = useAppStore(state => state.saveVideoRecordings);
  const setSaveVideoRecordings = useAppStore(state => state.setSaveVideoRecordings);
  const recordingsRetentionDays = useAppStore(state => state.recordingsRetentionDays);
  const setRecordingsRetentionDays = useAppStore(state => state.setRecordingsRetentionDays);

  const {
    stealthMode,
    anonymousMode,
    readReceipts,
    deliveryReceipts,
    typingIndicators,
    turnServerUrl,
    allowForwarding,
    allowMetadata,
    forwardCountLimit,
    forwardAnonymization,
    onlineStatus,
    ghostViewMode,
    contactReadReceipts,
    devices,
    currentSession,
    cloudSync,
    locationShares,
    addDevice,
    removeDevice,
    updateSettings,
    toggleContactReadReceipt,
    setCloudSyncEnabled,
    triggerCloudSync,
    stopLiveLocation,
    removeLocationShare,
    bots,
    setBots,
    connectionStatus,
    transportBackend,
    latencyMs,
    blockedBackends,
    regionBlocked,
  } = useAppStore();

  return {
    t,
    setLang,
    lang,
    searchQuery,
    setSearchQuery,
    activeSection,
    setActiveSection,
    notificationsEnabled,
    setNotificationsEnabled,
    soundEnabled,
    setSoundEnabled,
    twoFactorEnabled,
    setTwoFactorEnabled,
    proxyEnabled,
    setProxyEnabled,
    spamFilterEnabled,
    setSpamFilterEnabled,
    showPwaBanner,
    setShowPwaBanner,
    deadMansSwitch,
    setDeadMansSwitch,
    mediaAutoLoad,
    setMediaAutoLoad,
    selfDestructDefault,
    setSelfDestructDefault,
    obfuscationMode,
    setObfuscationMode,
    obfuscationEnabled,
    setObfuscationEnabled,
    proxyUrl,
    setProxyUrl,
    torBridge,
    setTorBridge,
    relayBackend,
    setRelayBackend,
    autoReconnectEnabled,
    setAutoReconnectEnabled,
    p2pMeshEnabled,
    setP2pMeshEnabled,
    visNumber,
    setVisNumber,
    visActivity,
    setVisActivity,
    uiAnimations,
    setUiAnimations,
    dndEnabled,
    setDndEnabled,
    dndFrom,
    setDndFrom,
    dndTo,
    setDndTo,
    priorityContacts,
    setPriorityContacts,
    saveAudioRecordings,
    setSaveAudioRecordings,
    saveVideoRecordings,
    setSaveVideoRecordings,
    recordingsRetentionDays,
    setRecordingsRetentionDays,
    stealthMode,
    anonymousMode,
    readReceipts,
    deliveryReceipts,
    typingIndicators,
    turnServerUrl,
    allowForwarding,
    allowMetadata,
    forwardCountLimit,
    forwardAnonymization,
    onlineStatus,
    ghostViewMode,
    contactReadReceipts,
    devices,
    currentSession,
    cloudSync,
    locationShares,
    addDevice,
    removeDevice,
    updateSettings,
    toggleContactReadReceipt,
    setCloudSyncEnabled,
    triggerCloudSync,
    stopLiveLocation,
    removeLocationShare,
    bots,
    setBots,
    connectionStatus,
    transportBackend,
    latencyMs,
    blockedBackends,
    regionBlocked,
  };
};
