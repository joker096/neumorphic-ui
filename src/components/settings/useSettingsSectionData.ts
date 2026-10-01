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
  const soundVolume = useAppStore(state => state.soundVolume);
  const setSoundVolume = useAppStore(state => state.setSoundVolume);
  const twoFactorEnabled = useAppStore(state => state.twoFactor);
  const setTwoFactorEnabled = useAppStore(state => state.setTwoFactor);
  const mediaAutoLoad = useAppStore(state => state.mediaAutoLoad);
  const setMediaAutoLoad = useAppStore(state => state.setMediaAutoLoad);
  const selfDestructDefault = useAppStore(state => state.selfDestructDefault);
  const setSelfDestructDefault = useAppStore(state => state.setSelfDestructDefault);
  const obfuscationEnabled = useAppStore(state => state.obfuscationEnabled);
  const setObfuscationEnabled = useAppStore(state => state.setObfuscationEnabled);
  const relayBackend = useAppStore(state => state.relayBackend);
  const setRelayBackend = useAppStore(state => state.setRelayBackend);
  const autoReconnectEnabled = useAppStore(state => state.autoReconnect);
  const setAutoReconnectEnabled = useAppStore(state => state.setAutoReconnect);
  const uiAnimations = useAppStore(state => state.uiAnimations);
  const setUiAnimations = useAppStore(state => state.setUiAnimations);
  const themeMode = useAppStore(state => state.themeMode);
  const setThemeMode = useAppStore(state => state.setThemeMode);
  const accentColor = useAppStore(state => state.accentColor);
  const setAccentColor = useAppStore(state => state.setAccentColor);
  const chatBackground = useAppStore(state => state.chatBackground);
  const setChatBackground = useAppStore(state => state.setChatBackground);
  const customChatBackground = useAppStore(state => state.customChatBackground);
  const setCustomChatBackground = useAppStore(state => state.setCustomChatBackground);
  const density = useAppStore(state => state.density);
  const setDensity = useAppStore(state => state.setDensity);
  const messageRadius = useAppStore(state => state.messageRadius);
  const setMessageRadius = useAppStore(state => state.setMessageRadius);
  const animationIntensity = useAppStore(state => state.animationIntensity);
  const setAnimationIntensity = useAppStore(state => state.setAnimationIntensity);
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
  const premiumEntitlement = useAppStore(state => state.premiumEntitlement);

  const {
    stealthMode,
    readReceipts,
    deliveryReceipts,
    typingIndicators,
    turnServerUrl,
    turnServerUser,
    turnServerPass,
    forwardAnonymization,
    onlineStatus,
    ghostViewMode,
    devices,
    currentSession,
    cloudSync,
    liveShare,
    addDevice,
    removeDevice,
    updateSettings,
    setCloudSyncEnabled,
    triggerCloudSync,
    stopLiveLocation,
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
    soundVolume,
    setSoundVolume,
    twoFactorEnabled,
    setTwoFactorEnabled,
    mediaAutoLoad,
    setMediaAutoLoad,
    selfDestructDefault,
    setSelfDestructDefault,
    obfuscationEnabled,
    setObfuscationEnabled,
    relayBackend,
    setRelayBackend,
    autoReconnectEnabled,
    setAutoReconnectEnabled,
    uiAnimations,
    setUiAnimations,
    themeMode,
    setThemeMode,
    accentColor,
    setAccentColor,
    chatBackground,
    setChatBackground,
    customChatBackground,
    setCustomChatBackground,
    density,
    setDensity,
    messageRadius,
    setMessageRadius,
    animationIntensity,
    setAnimationIntensity,
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
    premiumEntitlement,
    stealthMode,
    readReceipts,
    deliveryReceipts,
    typingIndicators,
    turnServerUrl,
    turnServerUser,
    turnServerPass,
    forwardAnonymization,
    onlineStatus,
    ghostViewMode,
    devices,
    currentSession,
    cloudSync,
    liveShare,
    addDevice,
    removeDevice,
    updateSettings,
    setCloudSyncEnabled,
    triggerCloudSync,
    stopLiveLocation,
    bots,
    setBots,
    connectionStatus,
    transportBackend,
    latencyMs,
    blockedBackends,
    regionBlocked,
  };
};
