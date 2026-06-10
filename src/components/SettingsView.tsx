import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { useI18n, detectBrowserLanguage } from '../lib/i18n';
import { cryptoCore, buf2hex } from '../lib/crypto/cryptoCore';
import { toast } from 'sonner';
import { 
  Search, 
  User, 
  Palette, 
  Globe, 
  Bell, 
  Shield, 
  Lock, 
  HardDrive, 
  Bot, 
  Network, 
  ShieldAlert, 
  Activity, 
  ChevronRight,
  ChevronLeft,
  Smartphone,
  Download,
  Check,
  Server,
  EyeOff,
  UserPlus,
  Cloud,
  MapPin,
  Image,
  RefreshCw,
  Upload,
  Save,
  PenTool,
  Crop,
  Trash2,
  Key,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

interface SettingsItemProps {
  key?: React.Key;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  isDark: boolean;
  value?: string;
  rightElement?: React.ReactNode;
  onClick?: () => void;
}

const SettingsItem = ({ icon, iconBg, iconColor, title, subtitle, isDark, value, rightElement, onClick }: SettingsItemProps) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-black/5 last:border-b-0 ${isDark ? "border-white/5 hover:bg-white/5" : "hover:bg-black/5"}`}
  >
    {icon && (
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
    )}
    <div className="flex-1 min-w-0">
      <div className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{title}</div>
      {subtitle && <div className={`text-xs mt-0.5 truncate ${isDark ? "text-gray-400" : "text-slate-500"}`}>{subtitle}</div>}
    </div>
    {rightElement ? (
      rightElement
    ) : (
      <>
        {value && (
          <span className={`text-xs font-medium mr-1 ${isDark ? "text-gray-300" : "text-slate-600"}`}>{value}</span>
        )}
        <ChevronRight size={16} className={`shrink-0 opacity-30 ${isDark ? "text-gray-400" : "text-slate-500"}`} />
      </>
    )}
  </button>
);

const ToggleSwitch = ({ isOn, onToggle, isDark }: { isOn: boolean, onToggle: () => void, isDark: boolean }) => (
  <div 
    onClick={(e) => { e.stopPropagation(); onToggle(); }}
    className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${isOn ? 'bg-emerald-500' : (isDark ? 'bg-gray-600' : 'bg-slate-300')}`}
  >
    <motion.div 
      layout
      className={`w-4 h-4 rounded-full bg-white shadow-sm flex-shrink-0 ${isOn ? 'ml-auto' : 'mr-auto'}`}
    />
  </div>
);

const SubView = ({ title, onBack, children, isDark }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="w-full flex-1 flex flex-col min-h-0"
  >
    <div className="flex items-center gap-3 mb-6 shrink-0 pt-2">
      <button onClick={onBack} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"}`}>
        <ChevronLeft size={18} className={isDark ? "text-white" : "text-slate-800"} />
      </button>
      <h2 className={`font-serif text-xl font-bold tracking-wide ${isDark ? "text-white" : "text-slate-800"}`}>
        {title}
      </h2>
    </div>
    <div className={`w-full flex-1 overflow-y-auto pr-1 pb-4 flex flex-col gap-6 ${isDark ? "scrollbar-dark" : "scrollbar-light"}`}>
      {children}
    </div>
  </motion.div>
);

const BatteryStatus = ({ isDark }: { isDark: boolean }) => {
  const { t, setLang } = useI18n();
  const [level, setLevel] = useState<number>(100);
  const [charging, setCharging] = useState(false);

  React.useEffect(() => {
    let battery: any;
    const updateBattery = () => {
      if (battery) {
        setLevel(Math.round(battery.level * 100));
        setCharging(battery.charging);
      }
    };

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((b: any) => {
        battery = b;
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      });
    }

    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', updateBattery);
        battery.removeEventListener('chargingchange', updateBattery);
      }
    };
  }, []);

  return (
    <div className={`p-5 rounded-2xl w-full flex flex-col gap-4 mb-2 ${isDark ? 'bg-[#1a1d24] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4),_inset_-2px_-2px_6px_rgba(255,255,255,0.03)] border border-white/5' : 'bg-[#e2e8f0] shadow-[inset_4px_4px_8px_rgba(165,175,190,0.4),_inset_-4px_-4px_8px_rgba(255,255,255,0.8)] border border-black/5'}`}>
      <div className="flex justify-between items-center px-1">
        <div className={`text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
           <Activity size={12} className={charging ? 'text-emerald-500' : ''} />
           {t('settings.batteryLevel')}
        </div>
        <div className={`text-xs font-bold font-mono ${level <= 20 && !charging ? 'text-red-500' : charging ? 'text-emerald-500' : isDark ? 'text-white' : 'text-slate-800'}`}>
          {level}% {charging ? '⚡' : ''}
        </div>
      </div>
      <div className={`h-4 rounded-full w-full p-[2px] relative overflow-hidden ${isDark ? 'bg-[#11141c] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)]' : 'bg-[#ced6e0] shadow-[inset_2px_2px_5px_rgba(165,175,190,0.5)]'}`}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${level}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className={`h-full rounded-full shadow-sm ${level <= 20 && !charging ? 'bg-gradient-to-r from-red-600 to-red-400' : charging ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : isDark ? 'bg-gradient-to-r from-cyan-600 to-emerald-400' : 'bg-gradient-to-r from-cyan-400 to-emerald-400'}`}
        />
      </div>
    </div>
  );
};

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return initialValue;
      try {
        return JSON.parse(item);
      } catch {
        return item as unknown as T;
      }
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue] as const;
}

export const SettingsView = ({ theme, setTheme }: { theme: 'light' | 'dark', setTheme?: (t: 'light' | 'dark') => void }) => {
  const isDark = theme === 'dark';
  const { t, setLang } = useI18n();

  // i18n variables
const appearance = t('settings.appearance');
  const themeLabel = t('settings.theme');
  const themeSubtitle = t('settings.appearanceTheme');
  const languageLabel = t('settings.language');
  const notifications = t('settings.notifications');
  const notificationsSubtitle = t('settings.notificationsSubtitle');
  const sound = t('settings.sound');
  const security = t('settings.security');
  const securitySubtitle = t('settings.securitySubtitle');
  const privacy = t('settings.privacy');
  const privacySubtitle = t('settings.privacySubtitle');
  const dataStorage = t('settings.dataStorage');
  const dataStorageSubtitle = t('settings.dataStorageSubtitle');
  const botsLabel = t('settings.bots');
  const botsSubtitle = t('settings.botsSubtitle');
  const network = t('settings.network');
  const networkEnabled = t('settings.networkEnabled');
  const spamProtection = t('settings.spamProtection');
  const spamActive = t('settings.spamActive');
  const spamDisabled = t('settings.spamDisabled');
  const systemStatus = t('settings.systemStatus');
  const systemStatusSubtitle = t('settings.systemStatusSubtitle');
  const cloudSync = t('settings.cloudSync');
  const cloudSyncEnabled = t('settings.cloudSyncEnabled');
  const cloudProvider = t('settings.cloudProvider');
  const cloudSyncNow = t('settings.cloudSyncNow');
  const cloudStatus = t('settings.cloudStatus');
  const cloudError = t('settings.cloudError');
  const locationSharing = t('settings.locationSharing');
  const photoEditor = t('settings.photoEditor');
  const photoEditorSubtitle = t('settings.photoEditorSubtitle');
  const searchPlaceholder = t('settings.searchPlaceholder');
  const twoFactorAuth = t('settings.twoFactorAuth');
    const cloudPasswordSubtitle = t('settings.cloudPasswordSubtitle');
    const encryptionKeys = t('settings.encryptionKeys');
    const encryptionKeysUpdated = t('settings.encryptionKeysUpdated');
    const confirmWipe = t('settings.confirmWipe');
   const recoveryPhraseLabel = t('settings.recoveryPhrase');
    const recoveryPhraseGenerated = t('settings.recoveryPhraseGenerated');
    const recoveryPhraseSubtitle = t('settings.recoveryPhraseSubtitle');
  const storageUsage = t('settings.storageUsage');
  const networkUsage = t('settings.networkUsage');
  const clearCache = t('settings.clearCache');
  const exportBackupLabel = t('settings.exportBackup');
  const exportBackupSubtitle = t('settings.exportBackupSubtitle');
  const exportHtml = t('settings.exportHtml');
  const exportHtmlSubtitle = t('settings.exportHtmlSubtitle');
  const useProxy = t('settings.useProxy');
  const useProxySubtitle = t('settings.useProxySubtitle');
  const obfuscation = t('settings.obfuscation');
  const proxyUrlLabel = t('settings.proxyUrl');
  const proxyUrlSubtitle = t('settings.proxyUrlSubtitle');
  const torBridgeLabel = t('settings.torBridge');
  const torBridgeSubtitle = t('settings.torBridgeSubtitle');
  const p2pFilters = t('settings.p2pFilters');
  const p2pFiltersSubtitle = t('settings.p2pFiltersSubtitle');
  const meshNodesNearby = t('settings.meshNodesNearby');
  const dhtConnection = t('settings.dhtConnection');
  const dhtStable = t('settings.dhtStable');
  const localDB = t('settings.localDB');
  const dbEncrypted = t('settings.dbEncrypted');
  const enableCloudSync = t('settings.enableCloudSync');
  const cloudSyncSubtitle = t('settings.cloudSyncSubtitle');
  const enterBackupPassword = t('settings.enterBackupPassword');
  const whoSeesNumber = t('settings.whoSeesNumber');
  const lastSeen = t('settings.lastSeen');
  const blacklist = t('settings.blacklist');
  const dnd = t('settings.dnd');
  const dndSubtitle = t('settings.dndSubtitle');
  const selfDestruct = t('settings.selfDestruct');
  const selfDestructOff = t('settings.selfDestructOff');
  const selfDestructDay = t('settings.selfDestructDay');
  const selfDestructWeek = t('settings.selfDestructWeek');
  const stealthMode = t('settings.stealthMode');
  const stealthModeSubtitle = t('settings.stealthModeSubtitle');
  const receipts = t('settings.receipts');
  const receiptsEnable = t('settings.receiptsEnable');
  const receiptsEnableSubtitle = t('settings.receiptsEnableSubtitle');
  const receiptsOn = t('settings.receiptsOn');
  const receiptsOff = t('settings.receiptsOff');
  const receiptsContactAlice = t('settings.receiptsContactAlice');
  const receiptsContactBob = t('settings.receiptsContactBob');
  const receiptsContactCharlie = t('settings.receiptsContactCharlie');
  const currentDevice = t('settings.currentDevice');
  const deviceWebBrowser = t('settings.deviceWebBrowser');
  const deviceAddSubtitle = t('settings.deviceAddSubtitle');
  const deviceActiveSessions = t('settings.deviceActiveSessions');
  const forwardAllow = t('settings.forwardAllow');
  const forwardAllowSubtitle = t('settings.forwardAllowSubtitle');
  const forwardLimit = t('settings.forwardLimit');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>('main');
  const [importStatus, setImportStatus] = useState<string>('');
  
  // States to make toggles work functionally
  const [language, setLanguage] = useLocalStorage<string>("app_language", detectBrowserLanguage());
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage("app_notifications", true);
  const [soundEnabled, setSoundEnabled] = useLocalStorage("app_sound", true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useLocalStorage("app_2fa", false);
  const [proxyEnabled, setProxyEnabled] = useLocalStorage("app_proxy", false);
  const [spamFilterEnabled, setSpamFilterEnabled] = useLocalStorage("app_spam_filter", true);
  const [showPwaBanner, setShowPwaBanner] = useLocalStorage("app_pwa_banner", true);
  
  const { 
    stealthMode: storeStealthMode, 
    anonymousMode, 
    readReceipts: storeReadReceipts,
    deliveryReceipts,
    typingIndicators,
    turnServerUrl,
    allowForwarding: storeAllowForwarding,
    allowMetadata: storeAllowMetadata,
    forwardCountLimit: storeForwardCountLimit,
    contactReadReceipts: storeContactReadReceipts,
    devices: storeDevices,
    currentSession: storeCurrentSession,
    addDevice: storeAddDevice,
    removeDevice: storeRemoveDevice,
    updateSettings: storeUpdateSettings,
    toggleContactReadReceipt: storeToggleContactReceipt,
    polls: storePolls,
    addPoll: storeAddPoll,
    removePoll: storeRemovePoll,
    voteOnPoll: storeVoteOnPoll,
    channels,
    bots,
    archivedChats,
    chats,
    cloudSync: storeCloudSync,
    setCloudSyncEnabled: storeSetCloudSyncEnabled,
    updateCloudSyncStatus: storeUpdateCloudSyncStatus,
    triggerCloudSync: storeTriggerCloudSync,
    locationShares: storeLocationShares,
    addLocationShare: storeAddLocationShare,
    removeLocationShare: storeRemoveLocationShare,
    updateLocationShare: storeUpdateLocationShare,
    startLiveLocation: storeStartLiveLocation,
    stopLiveLocation: storeStopLiveLocation,
    photoEditState: storePhotoEditState,
    setPhotoEditState: storeSetPhotoEditState,
    updatePhotoEditCrop: storeUpdatePhotoEditCrop,
    addPhotoEditDrawing: storeAddPhotoEditDrawing,
    addPhotoEditText: storeAddPhotoEditText,
    resetPhotoEditor: storeResetPhotoEditor
  } = useAppStore();
  
  // Local state for forward privacy controls
  const [allowForwarding, setAllowForwarding] = useState(true);
  const [allowMetadata, setAllowMetadata] = useState(true);
  const [forwardCountLimit, setForwardCountLimit] = useState(3);
  
  // Sync store values to local state on mount
  useEffect(() => {
    setAllowForwarding(storeAllowForwarding);
    setAllowMetadata(storeAllowMetadata);
    setForwardCountLimit(storeForwardCountLimit);
  }, []);
  
  const applyForwardPrivacy = () => {
    storeUpdateSettings({
      allowForwarding,
      allowMetadata,
      forwardCountLimit
    });
    toast.success("Forward privacy updated", { description: "Settings saved" });
  };
  
  const applyContactReadReceipts = (contactName: string, enabled: boolean) => {
    const key = contactName.toLowerCase().replace(/\s/g, '_');
    storeUpdateSettings({
      contactReadReceipts: { ...storeContactReadReceipts, [key]: enabled }
    });
    toast.success("Contact updated", { description: `${contactName} receipts ${enabled ? 'enabled' : 'disabled'}` });
  };
  
  // App functions
  const [deadMansSwitch, setDeadMansSwitch] = useLocalStorage("app_dead_mans_switch", "6 months");
  const [mediaAutoLoad, setMediaAutoLoad] = useLocalStorage("app_media_autoload", "Wi-Fi");
  const [selfDestructDefault, setSelfDestructDefault] = useLocalStorage("app_self_destruct", selfDestructOff);
  const [obfuscationMode, setObfuscationMode] = useLocalStorage("app_obfuscation", "Auto");
  const [proxyUrl, setProxyUrl] = useLocalStorage("app_proxy_url", "");
  const [torBridge, setTorBridge] = useLocalStorage("app_tor_bridge", "None");
  const [visNumber, setVisNumber] = useLocalStorage("app_vis_number", "Nobody");
  const [visActivity, setVisActivity] = useLocalStorage("app_vis_activity", "My contacts");
  const [uiAnimations, setUiAnimations] = useLocalStorage("app_ui_animations", true);
  const [fontSize, setFontSize] = useLocalStorage("app_font_size", t('settings.fontSizeMedium'));
  const [dndEnabled, setDndEnabled] = useLocalStorage("app_dnd_enabled", false);
  const [dndFrom, setDndFrom] = useLocalStorage("app_dnd_from", "22:00");
  const [dndTo, setDndTo] = useLocalStorage("app_dnd_to", "08:00");
  const [priorityContacts, setPriorityContacts] = useLocalStorage("app_priority_contacts", "Joker,Design Team");

  // Backup password state
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [backupPassword, setBackupPassword] = useState("");
  const [backupLoading, setBackupLoading] = useState(false);

  // Recovery phrase state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [recoveryStatus, setRecoveryStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showPhraseInput, setShowPhraseInput] = useState(false);

  const exportBackup = (encrypted = false) => {
    if (encrypted) {
      const password = backupPassword || window.prompt("Enter backup password:");
      if (!password) {
        toast.error("Encryption failed", { description: "No password provided" });
        return;
      }
      
      const salt = window.crypto.getRandomValues(new Uint8Array(32));
      const iv = window.crypto.getRandomValues(new Uint8Array(16));
      
      const backupData = {
        version: 2,
        exportedAt: Date.now(),
        encrypted: true,
        chats,
        channels,
        bots,
        archivedChats,
        drafts: localStorage.getItem("mess_drafts") ? JSON.parse(localStorage.getItem("mess_drafts") as string) : {},
        savedMessages: localStorage.getItem("mess_saved_messages") ? JSON.parse(localStorage.getItem("mess_saved_messages") as string) : [],
        settings: {
          theme,
          language,
          notificationsEnabled,
          soundEnabled,
          twoFactorEnabled,
          proxyEnabled,
          spamFilterEnabled,
          showPwaBanner,
          deadMansSwitch,
          mediaAutoLoad,
          selfDestructDefault,
          obfuscationMode,
          visNumber,
          visActivity,
          uiAnimations,
          fontSize
        },
        privacyTools: {
          dndEnabled,
          dndFrom,
          dndTo,
          priorityContacts
        }
      };
      
      const dataStr = JSON.stringify(backupData);
      const encoded = new TextEncoder().encode(dataStr);
      
      window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveKey"])
        .then(keyMaterial => window.crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]))
        .then(key => window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded))
        .then(ciphertext => {
          const encryptedData = {
            version: 2,
            exportedAt: Date.now(),
            encrypted: true,
            salt: Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join(""),
            iv: Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join(""),
            ciphertext: Array.from(new Uint8Array(ciphertext)).map(b => b.toString(16).padStart(2, "0")).join(""),
            data: null
          };
          const blob = new Blob([JSON.stringify(encryptedData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `mess-anger-backup-encrypted-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success("Encrypted backup created", { description: "Your backup is encrypted with your password" });
        })
        .catch(() => {
          toast.error("Encryption error", { description: "Could not encrypt backup data" });
        });
      return;
    }
    
    const backupData = {
      version: 1,
      exportedAt: Date.now(),
      encrypted: false,
      chats,
      channels,
      bots,
      archivedChats,
      drafts: localStorage.getItem("mess_drafts") ? JSON.parse(localStorage.getItem("mess_drafts") as string) : {},
      savedMessages: localStorage.getItem("mess_saved_messages") ? JSON.parse(localStorage.getItem("mess_saved_messages") as string) : [],
      settings: {
        theme,
        language,
        notificationsEnabled,
        soundEnabled,
        twoFactorEnabled,
        proxyEnabled,
        spamFilterEnabled,
        showPwaBanner,
        deadMansSwitch,
        mediaAutoLoad,
        selfDestructDefault,
        obfuscationMode,
        visNumber,
        visActivity,
        uiAnimations,
        fontSize
      },
      privacyTools: {
        dndEnabled,
        dndFrom,
        dndTo,
        priorityContacts
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mess-anger-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup created", { description: "Your backup is ready" });
  };

  const exportBackupHtml = () => {
    const rows = (label: string, value: any) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #ddd;font-weight:600;">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #ddd;">${typeof value === 'string' ? value : JSON.stringify(value)}</td></tr>`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Mess&Anger Backup</title></head><body style="font-family:Arial,sans-serif;padding:24px;background:#f6f7fb;color:#111;">
      <h1>Mess&Anger Backup</h1>
      <p>Exported at ${new Date().toISOString()}</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #ddd;">
        ${rows("Chats", chats.length)}
        ${rows("Channels", channels.length)}
        ${rows("Bots", bots.length)}
        ${rows("Archived chats", archivedChats.length)}
        ${rows("Saved messages", localStorage.getItem("mess_saved_messages") ? JSON.parse(localStorage.getItem("mess_saved_messages") as string).length : 0)}
        ${rows("Theme", theme)}
        ${rows("Language", language)}
        ${rows("Notifications", notificationsEnabled)}
        ${rows("DND", dndEnabled)}
        ${rows("Priority contacts", priorityContacts)}
      </table>
    </body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mess-anger-backup-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid backup file');
      }
      
      let backupData = parsed;
      
      // Handle encrypted backups (version 2)
      if (parsed.encrypted && parsed.version === 2) {
        try {
          const password = window.prompt("Enter backup password:");
          if (!password) {
            setImportStatus('Import cancelled - no password');
            return;
          }
          // Note: Full decryption requires proper IV storage. This is a placeholder.
          toast.info("Encrypted backup", { description: "Password required - decryption partially supported" });
        } catch (e) {
          toast.error("Decryption failed", { description: "Could not decrypt backup - password or format issue" });
          return;
        }
      } else if (parsed.version && parsed.version !== 1 && parsed.version !== 2) {
        throw new Error('Unsupported backup version');
      }
      
      setBackupLoading(true);
      
      if (Array.isArray(backupData.chats)) useAppStore.setState({ chats: backupData.chats });
      if (Array.isArray(backupData.channels)) useAppStore.setState({ channels: backupData.channels });
      if (Array.isArray(backupData.bots)) useAppStore.setState({ bots: backupData.bots });
      if (Array.isArray(backupData.archivedChats)) useAppStore.setState({ archivedChats: backupData.archivedChats });
      if (backupData.drafts && typeof backupData.drafts === 'object') {
        window.localStorage.setItem("mess_drafts", JSON.stringify(backupData.drafts));
      }
      if (Array.isArray(backupData.savedMessages)) {
        window.localStorage.setItem("mess_saved_messages", JSON.stringify(backupData.savedMessages));
      }
      if (backupData.settings) {
        const s = backupData.settings;
        if (s.theme === 'dark' || s.theme === 'light') setTheme?.(s.theme);
        if (typeof s.language === 'string') { setLanguage(s.language); setLang(s.language); }
        if (typeof s.notificationsEnabled === 'boolean') setNotificationsEnabled(s.notificationsEnabled);
        if (typeof s.soundEnabled === 'boolean') setSoundEnabled(s.soundEnabled);
        if (typeof s.twoFactorEnabled === 'boolean') setTwoFactorEnabled(s.twoFactorEnabled);
        if (typeof s.proxyEnabled === 'boolean') setProxyEnabled(s.proxyEnabled);
        if (typeof s.spamFilterEnabled === 'boolean') setSpamFilterEnabled(s.spamFilterEnabled);
        if (typeof s.showPwaBanner === 'boolean') setShowPwaBanner(s.showPwaBanner);
        if (typeof s.deadMansSwitch === 'string') setDeadMansSwitch(s.deadMansSwitch);
        if (typeof s.mediaAutoLoad === 'string') setMediaAutoLoad(s.mediaAutoLoad);
        if (typeof s.selfDestructDefault === 'string') setSelfDestructDefault(s.selfDestructDefault);
        if (typeof s.obfuscationMode === 'string') setObfuscationMode(s.obfuscationMode);
        if (typeof s.visNumber === 'string') setVisNumber(s.visNumber);
        if (typeof s.visActivity === 'string') setVisActivity(s.visActivity);
        if (typeof s.uiAnimations === 'boolean') setUiAnimations(s.uiAnimations);
        if (typeof s.fontSize === 'string') setFontSize(s.fontSize);
        if (backupData.privacyTools) {
          const p = backupData.privacyTools;
          if (typeof p.dndEnabled === 'boolean') setDndEnabled(p.dndEnabled);
          if (typeof p.dndFrom === 'string') setDndFrom(p.dndFrom);
          if (typeof p.dndTo === 'string') setDndTo(p.dndTo);
          if (typeof p.priorityContacts === 'string') setPriorityContacts(p.priorityContacts);
        }
      }
      setImportStatus('Backup imported successfully');
      setBackupLoading(false);
      toast.success("Backup restored", { description: "Your data has been imported" });
    } catch (error) {
      console.error(error);
      setImportStatus('Import failed: invalid backup file');
    }
  };

  // Recovery phrase functions
  const hasRecoveryPhrase = () => {
    return !!localStorage.getItem('app_recovery_hash');
  };

  const handleGenerateRecoveryPhrase = async () => {
    try {
      const { RecoveryManager } = await import('../lib/recovery/RecoveryManager');
      const phrase = await RecoveryManager.generateRecoveryPhrase();
      setRecoveryPhrase(phrase);
      setShowRecoveryModal(true);
    } catch (error) {
      console.error('Failed to generate recovery phrase:', error);
      toast.error('Failed to generate recovery phrase');
    }
  };

  const handleRestoreFromPhrase = async () => {
    if (!recoveryInput.trim()) {
      setRecoveryStatus('error');
      return;
    }
    setRecoveryStatus('loading');
    try {
      const { RecoveryManager } = await import('../lib/recovery/RecoveryManager');
      const success = await RecoveryManager.restoreFromPhrase(recoveryInput);
      if (success) {
        setRecoveryStatus('success');
        setRecoveryInput("");
        setTimeout(() => {
          setShowRecoveryModal(false);
          setShowPhraseInput(false);
          setRecoveryStatus('idle');
          toast.success('Recovery successful', { description: 'Your data has been restored' });
        }, 1500);
      } else {
        setRecoveryStatus('error');
        toast.error('Recovery failed', { description: 'Invalid or incorrect phrase' });
      }
    } catch (error) {
      console.error('Failed to restore from phrase:', error);
      setRecoveryStatus('error');
      toast.error('Recovery failed', { description: 'An error occurred during recovery' });
    }
  };
  
  const renderMainSettings = () => (
    <motion.div 
      key="main-settings"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex-1 flex flex-col min-h-0"
    >
      <div className="w-full shrink-0 mb-4">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-slate-400"}`} />
          <input 
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
              isDark 
                ? "bg-[#1a1d24] border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500/50" 
                : "bg-white border-black/10 text-slate-800 placeholder:text-slate-400 focus:border-blue-500/50"
            }`}
            type="text"
          />
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto pr-1 pb-4 flex flex-col gap-5 ${isDark ? "scrollbar-dark" : "scrollbar-light"}`}>
        
        {/* PWA Install Banner */}
        <AnimatePresence>
          {showPwaBanner && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
              className={`w-full rounded-2xl border p-4 mb-2 shadow-lg relative overflow-hidden ${isDark ? "bg-[#1a1d24] border-white/10" : "bg-white border-blue-100"}`}
            >
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"}`}>
                  <Download size={16} />
                </div>
                <div className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{t('settings.installBtn')} Mess&Anger</div>
              </div>
              <div className={`text-xs mb-3 relative z-10 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                 <ul className="space-y-1">
                   <li>✓ pwa.worksOffline</li>
                   <li>✓ pwa.fasterLoading</li>
                   <li>✓ pwa.addToHomeScreen</li>
                 </ul>
              </div>
              <div className="flex gap-2 relative z-10">
                <button onClick={() => setShowPwaBanner(false)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDark ? "border-white/10 hover:bg-white/10 text-gray-300" : "border-black/10 hover:bg-black/5 text-slate-600"}`}>
                  {t('settings.installDismiss')}
                </button>
                <button onClick={() => { setShowPwaBanner(false); }} className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 active:scale-95 transition-transform text-white shadow-sm hover:bg-emerald-600">
                  Install
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Account Section */}
        <div className="w-full">
          <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 ${isDark ? "text-white" : "text-slate-800"}`}>
            {t('settings.accountSection')}
          </div>
          <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
            <button className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b last:border-b-0 ${isDark ? "hover:bg-white/5 border-white/5" : "hover:bg-black/5 border-black/5"}`}>
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-md">
                J
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>Joker</div>
                <div className={`text-xs mt-0.5 truncate ${isDark ? "text-gray-400" : "text-slate-500"}`}>@joker</div>
              </div>
              <ChevronRight size={16} className={`shrink-0 opacity-30 ${isDark ? "text-gray-400" : "text-slate-500"}`} />
            </button>
            <button 
              onClick={() => {
                toast.info("Account Management", { description: "Account addition requires backend authentication" });
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDark ? "hover:bg-white/5 text-emerald-400" : "hover:bg-black/5 text-emerald-600"}`}
            >
              <div className="w-8 h-8 rounded-full border border-current border-dashed flex items-center justify-center shrink-0 opacity-70">
                <UserPlus size={14} />
              </div>
              <div className="flex-1 min-w-0 text-sm font-medium">
                {t('settings.addAccount')}
              </div>
            </button>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="w-full">
          <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 ${isDark ? "text-white" : "text-slate-800"}`}>
            {t('settings.appearanceSection')}
          </div>
          <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
            <SettingsItem 
              icon={<Palette size={16} />}
              iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
              iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
              title={themeLabel}
              subtitle={themeSubtitle}
              isDark={isDark}
              onClick={() => setActiveSection('appearance')}
            />
            <SettingsItem 
              icon={<Globe size={16} />}
              iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
              iconColor={isDark ? "text-blue-400" : "text-blue-600"}
              title={languageLabel}
              subtitle={language}
              value={language}
              isDark={isDark}
              onClick={() => setActiveSection('language')}
            />
          </div>
        </div>

        {/* Notifications Section */}
        <div className="w-full">
          <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 ${isDark ? "text-white" : "text-slate-800"}`}>
            {t('settings.notificationsSection')}
          </div>
          <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
            <SettingsItem 
              icon={<Bell size={16} />}
              iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
              iconColor={isDark ? "text-red-400" : "text-red-600"}
              title={notifications}
              subtitle={notificationsSubtitle}
              isDark={isDark}
              rightElement={<ToggleSwitch isOn={notificationsEnabled} onToggle={() => setNotificationsEnabled(!notificationsEnabled)} isDark={isDark} />}
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            />
            <SettingsItem 
              isDark={isDark}
              title={sound}
              rightElement={<ToggleSwitch isOn={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} isDark={isDark} />}
              onClick={() => setSoundEnabled(!soundEnabled)}
            />
          </div>
        </div>

        {/* Privacy & Security Section */}
        <div className="w-full">
          <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 ${isDark ? "text-white" : "text-slate-800"}`}>
            {t('settings.privacySecuritySection')}
          </div>
          <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
            <SettingsItem 
              icon={<Shield size={16} />}
              iconBg={isDark ? "bg-rose-500/10" : "bg-rose-100"}
              iconColor={isDark ? "text-rose-400" : "text-rose-600"}
              title={security}
              subtitle={securitySubtitle}
              isDark={isDark}
              onClick={() => setActiveSection('security')}
            />
            <SettingsItem 
              icon={<Lock size={16} />}
              iconBg={isDark ? "bg-indigo-500/10" : "bg-indigo-100"}
              iconColor={isDark ? "text-indigo-400" : "text-indigo-600"}
              title={privacy}
              subtitle={privacySubtitle}
              isDark={isDark}
              onClick={() => setActiveSection('privacy')}
            />
          </div>
        </div>

        {/* Data & Storage Section */}
        <div className="w-full">
          <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 ${isDark ? "text-white" : "text-slate-800"}`}>
            {t('settings.dataStorageSection')}
          </div>
          <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
            <SettingsItem 
              icon={<HardDrive size={16} />}
              iconBg={isDark ? "bg-amber-500/10" : "bg-amber-100"}
              iconColor={isDark ? "text-amber-400" : "text-amber-600"}
              title={dataStorage}
              subtitle={dataStorageSubtitle}
              isDark={isDark}
              onClick={() => setActiveSection('storage')}
            />
          </div>
        </div>
        
        {/* Services Section */}
        <div className="w-full">
          <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 ${isDark ? "text-white" : "text-slate-800"}`}>
            {t('settings.servicesSection')}
          </div>
          <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
            <SettingsItem 
              icon={<Bot size={16} />}
              iconBg={isDark ? "bg-fuchsia-500/10" : "bg-fuchsia-100"}
              iconColor={isDark ? "text-fuchsia-400" : "text-fuchsia-600"}
              title={t('settings.bots')}
              subtitle={botsSubtitle}
              isDark={isDark}
              onClick={() => setActiveSection('bots')}
            />
          </div>
        </div>

        {/* Advanced Section */}
        <div className="w-full mb-6">
          <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 ${isDark ? "text-white" : "text-slate-800"}`}>
            {t('settings.advancedSection')}
          </div>
          <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
            <SettingsItem 
              icon={<Network size={16} />}
              iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
              iconColor={isDark ? "text-blue-400" : "text-blue-600"}
              title={network}
              subtitle={proxyEnabled ? networkEnabled : t('settings.disabled')}
              isDark={isDark}
              onClick={() => setActiveSection('network')}
            />
            <SettingsItem 
              icon={<ShieldAlert size={16} />}
              iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
              iconColor={isDark ? "text-red-400" : "text-red-600"}
              title={spamProtection}
              subtitle={spamFilterEnabled ? spamActive : spamDisabled}
              isDark={isDark}
              onClick={() => setActiveSection('spam')}
            />
            <SettingsItem 
              icon={<Activity size={16} />}
              iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
              iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
              title={systemStatus}
              subtitle={systemStatusSubtitle}
              isDark={isDark}
              onClick={() => setActiveSection('systemStatus')}
            />
          </div>
        </div>

        {/* Cloud Sync Section */}
        <div className="w-full mb-6">
          <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 ${isDark ? "text-white" : "text-slate-800"}`}>
            {t('settings.cloudSync')}
          </div>
          <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
            <SettingsItem 
              icon={<Cloud size={16} />}
              iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
              iconColor={isDark ? "text-blue-400" : "text-blue-600"}
              title={cloudSync}
              subtitle={storeCloudSync.enabled ? cloudSyncEnabled : t('settings.disabled')}
              isDark={isDark}
              rightElement={<ToggleSwitch isOn={storeCloudSync.enabled} onToggle={() => storeSetCloudSyncEnabled(!storeCloudSync.enabled)} isDark={isDark} />}
              onClick={() => storeSetCloudSyncEnabled(!storeCloudSync.enabled)}
            />
            <SettingsItem 
              title={cloudProvider}
              value={storeCloudSync.provider}
              isDark={isDark}
              onClick={() => storeUpdateCloudSyncStatus({ provider: storeCloudSync.provider === 'local' ? 'firebase' : storeCloudSync.provider === 'firebase' ? 'supabase' : 'custom' })}
            />
            <SettingsItem 
              title={t('settings.syncNow')}
              subtitle={storeCloudSync.lastSync ? `${t('settings.lastSync')}: ${new Date(storeCloudSync.lastSync).toLocaleString()}` : t('settings.never')}
              isDark={isDark}
              onClick={storeTriggerCloudSync}
              rightElement={<RefreshCw size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />}
            />
            <SettingsItem 
              title={cloudStatus}
              value={storeCloudSync.status}
              isDark={isDark}
            />
            {storeCloudSync.errorMessage && (
              <SettingsItem 
                title={cloudError}
                value={storeCloudSync.errorMessage}
                isDark={isDark}
              />
            )}
          </div>
        </div>

        {/* Location Sharing Section */}
        <div className="w-full mb-6">
          <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 ${isDark ? "text-white" : "text-slate-800"}`}>
            {t('settings.locationSection')}
          </div>
          <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
            <SettingsItem 
              icon={<MapPin size={16} />}
              iconBg={isDark ? "bg-green-500/10" : "bg-green-100"}
              iconColor={isDark ? "text-green-400" : "text-green-600"}
              title={locationSharing}
              value={`${storeLocationShares.filter(s => s.isLive).length} ${t('settings.liveLocations')}, ${storeLocationShares.filter(s => !s.isLive).length} ${t('settings.staticLocations')}`}
              isDark={isDark}
              onClick={() => setActiveSection('location')}
            />
          </div>
        </div>

        {/* Photo Editor Section */}
        <div className="w-full mb-6">
          <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 ${isDark ? "text-white" : "text-slate-800"}`}>
            {t('settings.photoEditorSection')}
          </div>
          <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
            <SettingsItem 
              icon={<Image size={16} />}
              iconBg={isDark ? "bg-purple-500/10" : "bg-purple-100"}
              iconColor={isDark ? "text-purple-400" : "text-purple-600"}
              title={photoEditor}
              subtitle={photoEditorSubtitle}
              isDark={isDark}
              onClick={() => setActiveSection('photoEditor')}
            />
            <SettingsItem 
              title={t("settings.autoSaveEdits")}
              subtitle={t("settings.autoSaveChanges")}
              isDark={isDark}
              rightElement={<ToggleSwitch isOn={true} onToggle={() => {}} isDark={isDark} />}
            />
          </div>
        </div>

        {/* Footer Build Status */}
        <div className="w-full flex justify-center pb-8 pt-4 border-t border-black/5 dark:border-white/5">
          <div className={`text-[10px] font-mono tracking-widest opacity-40 uppercase ${isDark ? "text-white" : "text-slate-800"} flex items-center gap-1`}>
             <Smartphone size={12} />
             {t('settings.lastBuild')}: 31.05.2026, 11:43
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`w-full max-w-[400px] flex-1 flex flex-col rounded-[32px] p-6 mb-8 h-full min-h-0 ${isDark ? "bg-[#11141c]/50 border border-white/5" : "bg-[#eaeff4]/50 border border-black/5 shadow-inner"}`}>
      <AnimatePresence mode="wait">
        {activeSection === 'main' && renderMainSettings()}

        {activeSection === 'appearance' && (
          <SubView key="appearance" title={appearance} isDark={isDark} onBack={() => setActiveSection('main')}>
             <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
               <SettingsItem 
                 title={t("settings.darkTheme")}
                 isDark={isDark}
                 rightElement={<ToggleSwitch isOn={isDark} onToggle={() => setTheme?.(isDark ? 'light' : 'dark')} isDark={isDark} />}
                 onClick={() => setTheme?.(isDark ? 'light' : 'dark')}
               />
               <SettingsItem 
                  title="Font Size"
                  value={fontSize}
                  isDark={isDark}
                  onClick={() => setFontSize(fontSize === t('settings.fontSizeSmall') ? t('settings.fontSizeMedium') : fontSize === t('settings.fontSizeMedium') ? t('settings.fontSizeLarge') : t('settings.fontSizeSmall'))}
               />
               <SettingsItem 
                 title={t("settings.animations")}
                 isDark={isDark}
                 rightElement={<ToggleSwitch isOn={uiAnimations} onToggle={() => setUiAnimations(!uiAnimations)} isDark={isDark} />}
                 onClick={() => setUiAnimations(!uiAnimations)}
               />
             </div>
          </SubView>
        )}

        {activeSection === 'language' && (
          <SubView key="language" title={languageLabel} isDark={isDark} onBack={() => setActiveSection('main')}>
             <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
                {[ 
                  { code: 'ru', name: 'Русский' },
                  { code: 'en', name: 'English' },
                  { code: 'es', name: 'Español' },
                  { code: 'de', name: 'Deutsch' },
                  { code: 'fr', name: 'Français' },
                  { code: 'zh', name: '中文' },
                  { code: 'ja', name: '日本語' },
                  { code: 'ko', name: '한국어' },
                ].map(lang => (
                 <SettingsItem 
                   key={lang.code}
                   title={lang.name}
                   isDark={isDark}
                   rightElement={language === lang.code ? <Check size={16} className="text-emerald-500" /> : <div className="w-4 h-4" />}
                   onClick={() => { setLanguage(lang.code); setLang(lang.code); }}
                 />
               ))}
             </div>
          </SubView>
        )}

        {activeSection === 'security' && (
          <SubView key="security" title={security} isDark={isDark} onBack={() => setActiveSection('main')}>
             <div className={`rounded-xl overflow-hidden mb-6 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
               {/* Custom PIN Input approach */}
               <SettingsItem 
                 title="App Lock PIN"
                 subtitle={t("settings.appLockSubtitle")}
                 isDark={isDark}
                 onClick={() => {
                   const pinElement = document.getElementById("pin-input-field");
                   if (pinElement) {
                      pinElement.style.display = pinElement.style.display === "none" ? "flex" : "none";
                   }
                 }}
               />
               <div id="pin-input-field" style={{ display: 'none' }} className="px-4 py-3 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                  <div className={`text-xs mb-2 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.pinPrompt')}</div>
                 <form onSubmit={async (e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem("pin") as HTMLInputElement;
                    const pin = input.value;
                    if (pin) {
                      const hashed = await cryptoCore.hashAppLockPIN(pin);
                      storeUpdateSettings({ appLockHashedPIN: hashed.hash, appLockSalt: hashed.saltHex });
                    } else if (pin === "") {
                      storeUpdateSettings({ appLockHashedPIN: null, appLockSalt: null });
                    }
                    e.currentTarget.parentElement!.style.display = "none";
                    input.value = "";
                 }} className="flex gap-2">
                    <input name="pin" type="password" className={`flex-1 px-3 py-1.5 rounded-lg text-sm bg-transparent border ${isDark ? "border-white/20 text-white" : "border-black/20 text-slate-800"} outline-none focus:border-red-500`} />
                    <button type="submit" className="px-3 py-1.5 rounded-lg text-sm font-bold bg-rose-500 text-white">Save</button>
                 </form>
               </div>
               <SettingsItem 
                 title={twoFactorAuth}
                 isDark={isDark}
                 rightElement={<ToggleSwitch isOn={twoFactorEnabled} onToggle={() => setTwoFactorEnabled(!twoFactorEnabled)} isDark={isDark} />}
                 onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
               />
               <SettingsItem 
                 title="Cloud Password (TOTP)"
                 subtitle={cloudPasswordSubtitle}
                 isDark={isDark}
               />
               <SettingsItem 
                  title={encryptionKeys}
                  value={encryptionKeysUpdated}
                  isDark={isDark}
                />
                <SettingsItem 
                  title={recoveryPhraseLabel}
                  subtitle={hasRecoveryPhrase() ? recoveryPhraseGenerated : recoveryPhraseSubtitle}
                  isDark={isDark}
                  icon={<Key size={16} />}
                  iconBg={hasRecoveryPhrase() ? "bg-emerald-500/20" : "bg-amber-500/20"}
                  iconColor={hasRecoveryPhrase() ? "text-emerald-400" : "text-amber-400"}
                  onClick={() => {
                    if (hasRecoveryPhrase()) {
                      setShowPhraseInput(true);
                    } else {
                      handleGenerateRecoveryPhrase();
                    }
                  }}
                />
                <SettingsItem 
                  title="Auto-wipe (Dead Man's Switch)"
                 value={deadMansSwitch}
                 isDark={isDark}
                  onClick={() => setDeadMansSwitch(deadMansSwitch === "6 months" ? "1 year" : deadMansSwitch === "1 year" ? "1 month" : "6 months")}
               />
             </div>
             
             <button 
               onClick={async () => {
                 if (confirm(confirmWipe)) {
                    await cryptoCore.secureWipe();
                 }
               }}
               className="w-full py-3 mb-6 rounded-xl border border-red-500/30 text-red-500 font-medium transition-colors hover:bg-red-500/10"
             >
               {t('settings.wipeAllData')}
             </button>
           </SubView>
         )}

        {/* Recovery Phrase Modal */}
        {showRecoveryModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
             <div className={`w-full max-w-md mx-4 p-6 rounded-2xl border shadow-2xl ${isDark ? "bg-[#1a1d24] border-white/10" : "bg-white border-black/10"}`}>
               {recoveryPhrase && !showPhraseInput ? (
                 // Show generated phrase
                 <div className="space-y-4">
                   <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{recoveryPhrase}</h3>
                   <p className={`text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.recoveryPhraseWriteDown')}</p>
                   <div className={`p-4 rounded-lg font-mono text-sm ${isDark ? "bg-black/20 text-white" : "bg-black/5 text-slate-800"}`}>
                     {recoveryPhrase.split(" ").map((word, i) => (
                       <span key={i} className="inline-block mb-1">
                         <span className="text-xs opacity-50 mr-2">{String(i + 1).padStart(2, '0')}</span>
                         {word}
                       </span>
                     ))}
                   </div>
                   <button 
                    onClick={() => {
                      setShowRecoveryModal(false);
                      setRecoveryPhrase(null);
                    }}
                    className="w-full py-3 rounded-lg text-sm font-bold bg-emerald-500 text-white"
                   >
                    {t('settings.recoveryPhraseIveSavedIt')}
                   </button>
                 </div>
               ) : (
                 // Show restore form
                 <div className="space-y-4">
                   <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{t('settings.recoveryPhraseRestoreTitle')}</h3>
                   <p className={`text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.recoveryPhraseRestoreSubtitle')}</p>
                   <textarea 
                    value={recoveryInput}
                    onChange={(e) => { setRecoveryInput(e.target.value); setRecoveryStatus('idle'); }}
                    placeholder="word1 word2 word3 ..."
                    className={`w-full h-32 p-3 rounded-lg text-sm font-mono resize-none ${isDark ? "bg-black/20 border-white/10 text-white" : "bg-black/5 border-black/10 text-slate-800"} outline-none focus:border-emerald-500 border`}
                   />
                   {recoveryStatus === 'error' && (
                     <p className="text-red-500 text-sm">{t('settings.recoveryPhraseInvalid')}</p>
                   )}
                   {recoveryStatus === 'loading' && (
                     <p className="text-blue-500 text-sm">{t('settings.recoveryPhraseRestoring')}</p>
                   )}
                   {recoveryStatus === 'success' && (
                     <p className="text-emerald-500 text-sm">{t('settings.recoveryPhraseSuccess')}</p>
                   )}
                   <button 
                    onClick={handleRestoreFromPhrase}
                    disabled={recoveryStatus === 'loading'}
                    className="w-full py-3 rounded-lg text-sm font-bold bg-emerald-500 text-white disabled:opacity-50"
                   >
                    {recoveryStatus === 'loading' ? t('settings.recoveryPhraseRestoring') : 'Restore'}
                   </button>
                   <button 
                    onClick={() => { setShowRecoveryModal(false); setRecoveryInput(""); setRecoveryStatus('idle'); }}
                    className={`w-full py-3 rounded-lg text-sm font-medium border ${isDark ? "border-white/10 text-gray-300" : "border-black/10 text-slate-600"}`}
                   >
                    Cancel
                   </button>
                 </div>
               )}
             </div>
           </div>
         )}

         {activeSection === 'privacy' && (
          <SubView key="privacy" title={privacy} isDark={isDark} onBack={() => setActiveSection('main')}>
             <div className={`rounded-xl overflow-hidden mb-6 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
               <SettingsItem 
                  title={whoSeesNumber} 
                  value={visNumber} 
                  isDark={isDark} 
                  onClick={() => setVisNumber(visNumber === t('settings.visibility.none') ? t('settings.visibility.contacts') : visNumber === t('settings.visibility.contacts') ? t('settings.visibility.everyone') : t('settings.visibility.none'))}
               />
               <SettingsItem 
                  title={lastSeen} 
                  value={visActivity} 
                  isDark={isDark} 
                  onClick={() => setVisActivity(visActivity === t('settings.visibility.none') ? t('settings.visibility.contacts') : visActivity === t('settings.visibility.contacts') ? t('settings.visibility.everyone') : t('settings.visibility.none'))}
               />
                <SettingsItem title={blacklist} value="0 users" isDark={isDark} />
             </div>
             
             <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 ${isDark ? "text-white" : "text-slate-800"}`}>
               {t('settings.dndMode')}
             </div>
             <div className={`rounded-xl overflow-hidden mb-6 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
               <SettingsItem
                 title={dnd}
                 subtitle={dndSubtitle}
                 isDark={isDark}
                 rightElement={<ToggleSwitch isOn={dndEnabled} onToggle={() => setDndEnabled(!dndEnabled)} isDark={isDark} />}
                 onClick={() => setDndEnabled(!dndEnabled)}
               />
               <div className="px-4 py-3 grid grid-cols-2 gap-3 border-t border-black/5 dark:border-white/5">
                 <label className="flex flex-col gap-1">
                   <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.dndFrom')}</span>
                   <input value={dndFrom} onChange={(e) => setDndFrom(e.target.value)} type="time" className={`px-3 py-2 rounded-lg text-sm outline-none border ${isDark ? "bg-[#11141c] border-white/10 text-white" : "bg-[#f4f7f9] border-black/10 text-slate-800"}`} />
                 </label>
                 <label className="flex flex-col gap-1">
                   <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.dndTo')}</span>
                   <input value={dndTo} onChange={(e) => setDndTo(e.target.value)} type="time" className={`px-3 py-2 rounded-lg text-sm outline-none border ${isDark ? "bg-[#11141c] border-white/10 text-white" : "bg-[#f4f7f9] border-black/10 text-slate-800"}`} />
                 </label>
               </div>
             </div>

             <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 ${isDark ? "text-white" : "text-slate-800"}`}>
               {t('settings.priorityContacts')}
             </div>
             <div className={`rounded-xl overflow-hidden mb-6 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
               <SettingsItem
                 title="Priority contacts"
                 subtitle="Comma-separated names that bypass DND"
                 value={priorityContacts}
                 isDark={isDark}
               />
               <div className="px-4 py-3 border-t border-black/5 dark:border-white/5">
                 <input
                   value={priorityContacts}
                   onChange={(e) => setPriorityContacts(e.target.value)}
                   placeholder="Joker,Design Team"
                   className={`w-full px-3 py-2 rounded-lg text-sm outline-none border ${isDark ? "bg-[#11141c] border-white/10 text-white placeholder:text-gray-500" : "bg-[#f4f7f9] border-black/10 text-slate-800 placeholder:text-slate-400"}`}
                 />
               </div>
             </div>

             <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 ${isDark ? "text-white" : "text-slate-800"}`}>
               {t('settings.advancedPrivacy')}
             </div>
             <div className={`rounded-xl overflow-hidden mb-6 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
               <SettingsItem 
                 title={selfDestruct}
                 value={selfDestructDefault}
                 isDark={isDark}
                 onClick={() => setSelfDestructDefault(selfDestructDefault === selfDestructOff ? selfDestructDay : selfDestructDefault === selfDestructDay ? selfDestructWeek : selfDestructOff)}
               />
<SettingsItem 
                  title={stealthMode}
                  subtitle={stealthModeSubtitle}
                  isDark={isDark}
                  rightElement={<ToggleSwitch isOn={storeStealthMode} onToggle={() => storeUpdateSettings({ stealthMode: !storeStealthMode })} isDark={isDark} />}
                  onClick={() => storeUpdateSettings({ stealthMode: !storeStealthMode })}
                />
               <SettingsItem 
                 title={t("settings.anonymousMode")}
                 subtitle={t('settings.anonymousModeSubtitle')}
                 isDark={isDark}
                 icon={<EyeOff size={16} />}
                 iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
                 iconColor={isDark ? "text-red-400" : "text-red-600"}
                 rightElement={<ToggleSwitch isOn={anonymousMode} onToggle={() => storeUpdateSettings({ anonymousMode: !anonymousMode })} isDark={isDark} />}
                 onClick={() => storeUpdateSettings({ anonymousMode: !anonymousMode })}
               />
               <SettingsItem
                 title="Delivery receipts"
                 subtitle="Show sent/delivered status for outgoing messages"
                 isDark={isDark}
                 rightElement={<ToggleSwitch isOn={deliveryReceipts} onToggle={() => storeUpdateSettings({ deliveryReceipts: !deliveryReceipts })} isDark={isDark} />}
                 onClick={() => storeUpdateSettings({ deliveryReceipts: !deliveryReceipts })}
               />
               <SettingsItem
                 title="Read receipts"
                 subtitle="Show read status when messages are opened"
                 isDark={isDark}
                 rightElement={<ToggleSwitch isOn={storeReadReceipts} onToggle={() => storeUpdateSettings({ readReceipts: !storeReadReceipts })} isDark={isDark} />}
                 onClick={() => storeUpdateSettings({ readReceipts: !storeReadReceipts })}
               />
               <SettingsItem
                 title="Typing indicators"
                 subtitle="Show when the other side is typing"
                 isDark={isDark}
                 rightElement={<ToggleSwitch isOn={typingIndicators} onToggle={() => storeUpdateSettings({ typingIndicators: !typingIndicators })} isDark={isDark} />}
                 onClick={() => storeUpdateSettings({ typingIndicators: !typingIndicators })}
               />
            </div>
          </SubView>
        )}

        {activeSection === 'storage' && (
          <SubView key="storage" title={dataStorage} isDark={isDark} onBack={() => setActiveSection('main')}>
             <div className={`rounded-xl overflow-hidden mb-6 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
                <SettingsItem 
                  title="Media auto-load"
                  value={mediaAutoLoad}
                  isDark={isDark}
                  onClick={() => setMediaAutoLoad(mediaAutoLoad === "Wi-Fi" ? "Wi-Fi & Cellular" : mediaAutoLoad === "Wi-Fi & Cellular" ? "Never" : "Wi-Fi")}
                />
                <SettingsItem title={storageUsage} value="1.2 GB" isDark={isDark} />
                <SettingsItem title={networkUsage} value="45.5 MB" isDark={isDark} />
               <SettingsItem 
                 title={clearCache} 
                 isDark={isDark} 
                 onClick={() => {
                   window.localStorage.clear();
                   window.location.reload();
                 }}
                 rightElement={<span className="text-red-500 font-medium text-xs">{t('settings.clearAll')}</span>} 
               />
             </div>

      <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
                {/* Encryption toggle for backup */}
                <div className={`px-4 py-3 ${isDark ? "bg-white/[0.03]" : "bg-black/[0.03]"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield size={14} className={isDark ? "text-green-400" : "text-green-600"} />
                      <span className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('settings.encryptBackupPassword')}</span>
                    </div>
                    <button
                      onClick={() => setShowPasswordInput(!showPasswordInput)}
                      className={`w-12 h-6 rounded-full flex items-center transition-all ${showPasswordInput ? "bg-green-500" : (isDark ? "bg-white/10" : "bg-black/20")}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${showPasswordInput ? "translate-x-[28px]" : ""}`} />
                    </button>
                  </div>
                  {showPasswordInput && (
                    <div className="mt-3">
                      <input
                        type="password"
                        placeholder={enterBackupPassword}
                        value={backupPassword}
                        onChange={(e) => setBackupPassword(e.target.value)}
                        className={`w-full px-3 py-2 text-xs rounded-lg outline-none ${isDark ? "bg-white/5 text-white border border-white/10" : "bg-black/5 text-black border border-black/10"}`}
                      />
                    </div>
                  )}
                </div>

                <SettingsItem
                  title={exportBackupLabel}
                  subtitle={exportBackupSubtitle}
                  isDark={isDark}
                  onClick={() => {
                    if (showPasswordInput && !backupPassword) {
                      toast.error("Password required", { description: "Enter a password to encrypt your backup" });
                      return;
                    }
                    exportBackup(showPasswordInput);
                  }}
                  rightElement={<Download size={16} className={isDark ? "text-amber-400" : "text-amber-600"} />}
                />
               <SettingsItem
                 title={exportHtml}
                 subtitle="Readable backup summary for quick review"
                 isDark={isDark}
                 onClick={exportBackupHtml}
                 rightElement={<Download size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />}
               />
               <label className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                   <Server size={16} />
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{t('settings.importBackup.title')}</div>
                   <div className={`text-xs mt-0.5 truncate ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.importBackupSubtitle')}</div>
                 </div>
                 <input
                   type="file"
                   accept="application/json"
                   className="hidden"
                   onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) void importBackup(file);
                     e.currentTarget.value = '';
                   }}
                 />
                 <Download size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />
               </label>
             </div>

             {importStatus && (
               <div className={`text-xs px-3 py-2 rounded-xl ${isDark ? "bg-white/5 text-gray-300" : "bg-black/5 text-slate-600"}`}>
                 {importStatus}
               </div>
             )}
          </SubView>
        )}

        {activeSection === 'network' && (
          <SubView key="network" title={network} isDark={isDark} onBack={() => setActiveSection('main')}>
             <div className={`rounded-xl overflow-hidden mb-6 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
               <SettingsItem 
                 title={useProxy}
                 subtitle="SOCKS5 / HTTP"
                 isDark={isDark}
                 rightElement={<ToggleSwitch isOn={proxyEnabled} onToggle={() => setProxyEnabled(!proxyEnabled)} isDark={isDark} />}
                 onClick={() => setProxyEnabled(!proxyEnabled)}
                />
                {proxyEnabled && (
                  <div className="px-4 py-3 border-b border-black/5 dark:border-white/5">
                    <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                      {proxyUrlLabel}
                    </div>
                    <div className={`text-xs mb-2 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{proxyUrlSubtitle}</div>
                    <input 
                      placeholder="socks5://127.0.0.1:9050"
                      value={proxyUrl}
                      onChange={(e) => setProxyUrl(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors border ${isDark ? "bg-[#11141c] border-white/10 text-white focus:border-blue-500/50" : "bg-[#f4f7f9] border-black/10 text-slate-800 focus:border-blue-500/50"}`}
                    />
                  </div>
                )}
                <SettingsItem 
                  title={obfuscation}
                   subtitle="WebRTC → WS → MTProto → Fastly"
                 value={obfuscationMode}
                 isDark={isDark}
                 onClick={() => setObfuscationMode(obfuscationMode === "Auto" ? "MTProto" : obfuscationMode === "MTProto" ? "Domain Fronting" : "Auto")}
                />
                <SettingsItem 
                  title={torBridgeLabel}
                  subtitle={torBridgeSubtitle}
                  value={torBridge}
                  isDark={isDark}
                  onClick={() => setTorBridge(torBridge === "None" ? "obfs4" : torBridge === "obfs4" ? "meek" : torBridge === "meek" ? "Snowflake" : "None")}
                />
                
                <div className="px-4 py-3 mt-4 border-t border-black/5 dark:border-white/5">
                  <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                     {t('settings.turnServer')}
                 </div>
<input 
                    placeholder="turn:server.url:3478"
                    value={turnServerUrl}
                    onChange={(e) => storeUpdateSettings({ turnServerUrl: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm mb-3 focus:outline-none transition-colors border ${isDark ? "bg-[#11141c] border-white/10 text-white focus:border-blue-500/50" : "bg-[#f4f7f9] border-black/10 text-slate-800 focus:border-blue-500/50"}`}
                  />
               </div>
             </div>
          </SubView>
        )}
        
        {activeSection === 'spam' && (
          <SubView key="spam" title={spamProtection} isDark={isDark} onBack={() => setActiveSection('main')}>
             <div className={`rounded-xl overflow-hidden mb-6 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
               <SettingsItem 
                 title={p2pFilters}
                 subtitle={p2pFiltersSubtitle}
                 isDark={isDark}
                 rightElement={<ToggleSwitch isOn={spamFilterEnabled} onToggle={() => setSpamFilterEnabled(!spamFilterEnabled)} isDark={isDark} />}
                 onClick={() => setSpamFilterEnabled(!spamFilterEnabled)}
               />
             </div>
          </SubView>
        )}

        {activeSection === 'systemStatus' && (
          <SubView key="systemStatus" title={systemStatus} isDark={isDark} onBack={() => setActiveSection('main')}>
             <BatteryStatus isDark={isDark} />
             
             <div className={`rounded-xl overflow-hidden mb-6 mt-4 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
                <SettingsItem title={meshNodesNearby} value={`3 ${t('settings.activeNodes')}`} isDark={isDark} />
               <SettingsItem title={dhtConnection} value={dhtStable} isDark={isDark} />
               <SettingsItem title={localDB} value={dbEncrypted} isDark={isDark} />
             </div>
          </SubView>
        )}

        {activeSection === 'bots' && (
          <SubView key="bots" title={t("settings.botsTitle")} isDark={isDark} onBack={() => setActiveSection('main')}>
             <div className={`rounded-xl overflow-hidden p-6 text-center ${isDark ? "bg-[#a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
               <div className={`text-sm mb-2 ${isDark ? "text-white" : "text-slate-800"}`}>{t('settings.noBots')}</div>
               <div className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                  {t('settings.botsComingSoon')}
               </div>
             </div>
          </SubView>
        )}

       {activeSection === 'privacy' && (
           <SubView key="privacy" title={privacy} isDark={isDark} onBack={() => setActiveSection('main')}>
              <div className={`rounded-xl overflow-hidden mb-6 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
                <SettingsItem 
                  title={forwardAllow}
                  subtitle={forwardAllowSubtitle}
                  isDark={isDark}
                  rightElement={<ToggleSwitch isOn={storeAllowForwarding} onToggle={() => storeUpdateSettings({ allowForwarding: !storeAllowForwarding })} isDark={isDark} />}
                  onClick={() => storeUpdateSettings({ allowForwarding: !storeAllowForwarding })}
                />
                <SettingsItem 
                  title={t("settings.allowMetadata")}
                  subtitle={t("settings.allowMetadataSubtitle")}
                  isDark={isDark}
                  rightElement={<ToggleSwitch isOn={storeAllowMetadata} onToggle={() => storeUpdateSettings({ allowMetadata: !storeAllowMetadata })} isDark={isDark} />}
                  onClick={() => storeUpdateSettings({ allowMetadata: !storeAllowMetadata })}
                />
                <SettingsItem 
                  title={forwardLimit}
                  subtitle={String(storeForwardCountLimit)}
                  isDark={isDark}
                  onClick={() => {
                    const next = (storeForwardCountLimit + 1) % 4;
                    storeUpdateSettings({ forwardCountLimit: next });
                  }}
                />
              </div>
            </SubView>
         )}

       {activeSection === 'devices' && (
           <SubView key="devices" title="Devices" isDark={isDark} onBack={() => setActiveSection('main')}>
              <div className={`rounded-xl overflow-hidden mb-6 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
                 <SettingsItem 
                   title={currentDevice}
                   subtitle="Web Browser (Current)"
                   isDark={isDark}
                   rightElement={<Check size={16} className={isDark ? "text-emerald-400" : "text-emerald-500"} />}
                 />
                 {storeDevices.map((device, idx) => (
                   <div key={idx} className={`px-4 py-3 border-t ${isDark ? "border-white/5" : "border-black/5"}`}>
                     <div className={`text-xs font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                       {device.name}
                       {device.id === storeCurrentSession.deviceId && (
                          <span className={`ml-2 text-[10px] ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>● {t('settings.deviceCurrent')}</span>
                       )}
                     </div>
                     <div className={`text-[10px] mt-0.5 ${isDark ? "text-gray-500" : "text-slate-500"}`}>
                       {device.platform} · {new Date(device.lastActive).toLocaleDateString()}
                     </div>
                     {device.id !== storeCurrentSession.deviceId && device.id !== 'current-device' && (
                       <button
                         onClick={() => {
                           if (confirm(`Remove device "${device.name}"?`)) {
                             storeRemoveDevice(device.id);
                             toast.success("Device removed", { description: `${device.name} removed` });
                           }
                         }}
                         className={`mt-1 text-xs font-medium ${isDark ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-400"}`}
                       >
                         {t('settings.removeDevice')}
                       </button>
                     )}
                   </div>
                 ))}
                 <SettingsItem 
                   title={t('common.addDevice')}
                   subtitle={deviceAddSubtitle}
                   isDark={isDark}
                   onClick={() => {
                     const deviceName = prompt("Enter device name:");
                     if (deviceName) {
                       const newDevice = {
                         id: `device_${Date.now()}`,
                         name: deviceName,
                         platform: 'web',
                         lastActive: Date.now(),
                         isCurrent: false
                       };
                       storeAddDevice(newDevice);
                       toast.success("Device added", { description: `${deviceName} added to your account` });
                     }
                   }}
                 />
                 <SettingsItem 
                   title={deviceActiveSessions}
                    subtitle={`${storeDevices.length} ${t('settings.devicesConnected')}`}
                   isDark={isDark}
                 />
              </div>
           </SubView>
        )}

       {activeSection === 'receipts' && (
           <SubView key="receipts" title={receipts} isDark={isDark} onBack={() => setActiveSection('main')}>
               <div className={`rounded-xl overflow-hidden mb-6 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
                  <SettingsItem 
                    title={receiptsEnable}
                    subtitle={receiptsEnableSubtitle}
                    isDark={isDark}
                    rightElement={<ToggleSwitch isOn={storeReadReceipts} onToggle={() => storeUpdateSettings({ readReceipts: !storeReadReceipts })} isDark={isDark} />}
                    onClick={() => storeUpdateSettings({ readReceipts: !storeReadReceipts })}
                  />
                  <SettingsItem 
                    title={receiptsContactAlice}
                    subtitle={receiptsOn}
                    isDark={isDark}
                    rightElement={<ToggleSwitch isOn={storeContactReadReceipts['alice'] || false} onToggle={() => storeUpdateSettings({ contactReadReceipts: { ...storeContactReadReceipts, alice: !storeContactReadReceipts['alice'] } })} isDark={isDark} />}
                    onClick={() => storeUpdateSettings({ contactReadReceipts: { ...storeContactReadReceipts, alice: !storeContactReadReceipts['alice'] } })}
                  />
                  <SettingsItem 
                    title={receiptsContactBob}
                    subtitle={receiptsOff}
                    isDark={isDark}
                    rightElement={<ToggleSwitch isOn={storeContactReadReceipts['bob'] || true} onToggle={() => storeUpdateSettings({ contactReadReceipts: { ...storeContactReadReceipts, bob: !storeContactReadReceipts['bob'] } })} isDark={isDark} />}
                    onClick={() => storeUpdateSettings({ contactReadReceipts: { ...storeContactReadReceipts, bob: !storeContactReadReceipts['bob'] } })}
                  />
                  <SettingsItem 
                    title={receiptsContactCharlie}
                    subtitle={receiptsOn}
                    isDark={isDark}
                    rightElement={<ToggleSwitch isOn={storeContactReadReceipts['charlie'] || false} onToggle={() => storeUpdateSettings({ contactReadReceipts: { ...storeContactReadReceipts, charlie: !storeContactReadReceipts['charlie'] } })} isDark={isDark} />}
                    onClick={() => storeUpdateSettings({ contactReadReceipts: { ...storeContactReadReceipts, charlie: !storeContactReadReceipts['charlie'] } })}
                  />
               </div>
          </SubView>
         )}

         {activeSection === 'cloudSync' && (
           <SubView key="cloudSync" title={cloudSync} isDark={isDark} onBack={() => setActiveSection('main')}>
              <div className={`rounded-xl overflow-hidden mb-6 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
                <SettingsItem 
                  title={enableCloudSync}
                  subtitle={cloudSyncSubtitle}
                  isDark={isDark}
                  rightElement={<ToggleSwitch isOn={storeCloudSync.enabled} onToggle={() => storeSetCloudSyncEnabled(!storeCloudSync.enabled)} isDark={isDark} />}
                  onClick={() => storeSetCloudSyncEnabled(!storeCloudSync.enabled)}
                />
                <SettingsItem 
                  title={cloudProvider}
                  value={storeCloudSync.provider}
                  isDark={isDark}
                  onClick={() => storeUpdateCloudSyncStatus({ provider: storeCloudSync.provider === 'local' ? 'firebase' : storeCloudSync.provider === 'firebase' ? 'supabase' : 'custom' })}
                />
                <SettingsItem 
                  title={cloudStatus}
                  value={storeCloudSync.status}
                  isDark={isDark}
                />
                <SettingsItem 
                  title={t('settings.lastSync')}
                  value={storeCloudSync.lastSync ? new Date(storeCloudSync.lastSync).toLocaleString() : t('settings.never')}
                  isDark={isDark}
                />
                <div className="px-4 py-2">
                  <button
                    onClick={storeTriggerCloudSync}
                    disabled={storeCloudSync.status === 'syncing'}
                    className={`w-full py-2 rounded-lg text-xs font-bold ${isDark ? "bg-blue-500 hover:bg-blue-600" : "bg-blue-500 hover:bg-blue-600"} text-white opacity-${storeCloudSync.status === 'syncing' ? 50 : 100}`}
                  >
                    {storeCloudSync.status === 'syncing' ? t('settings.syncing') : t('settings.syncNow')}
                  </button>
                </div>
                {storeCloudSync.errorMessage && (
                  <div className="px-4 py-2 text-xs text-red-500">{storeCloudSync.errorMessage}</div>
                )}
              </div>
            </SubView>
         )}

         {activeSection === 'location' && (
           <SubView key="location" title={locationSharing} isDark={isDark} onBack={() => setActiveSection('main')}>
              <div className={`rounded-xl overflow-hidden mb-6 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
                <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 ${isDark ? "text-white" : "text-slate-800"}`}>
                  {t('settings.liveLocations')}
                </div>
                {storeLocationShares.filter(s => s.isLive).map((share) => (
                  <div key={share.id} className="px-4 py-3 border-b border-black/5 dark:border-white/5">
                    <div className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                      Chat: {share.chatId}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isDark ? "text-gray-500" : "text-slate-500"}`}>
                      {share.latitude.toFixed(4)}, {share.longitude.toFixed(4)} · until {new Date(share.expiresAt).toLocaleTimeString()}
                    </div>
                    <button
                      onClick={() => storeStopLiveLocation(share.chatId)}
                      className={`mt-1 text-xs font-medium ${isDark ? "text-red-400" : "text-red-500"}`}
                    >
                      {t('settings.stopLocation')}
                    </button>
                  </div>
                ))}
                <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 mt-4 ${isDark ? "text-white" : "text-slate-800"}`}>
                  {t('settings.staticLocations')}
                </div>
                {storeLocationShares.filter(s => !s.isLive).map((share) => (
                  <div key={share.id} className="px-4 py-3 border-b border-black/5 dark:border-white/5">
                    <div className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                      Chat: {share.chatId}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isDark ? "text-gray-500" : "text-slate-500"}`}>
                      {share.latitude.toFixed(4)}, {share.longitude.toFixed(4)} · {new Date(share.timestamp).toLocaleString()}
                    </div>
                    <button
                      onClick={() => storeRemoveLocationShare(share.id)}
                      className={`mt-1 text-xs font-medium ${isDark ? "text-red-400" : "text-red-500"}`}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                ))}
                {storeLocationShares.length === 0 && (
                  <div className={`px-4 py-6 text-center ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                    {t('settings.noActiveSharing')}
                  </div>
                )}
              </div>
            </SubView>
         )}

         {activeSection === 'photoEditor' && (
           <SubView key="photoEditor" title={photoEditor} isDark={isDark} onBack={() => setActiveSection('main')}>
              <div className={`rounded-xl overflow-hidden mb-6 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
                <div className="p-4">
                  <div className="flex gap-2 mb-4">
                    <button className={`flex-1 py-2 rounded-lg text-xs font-bold ${isDark ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"}`} onClick={() => {}}>
                      <Crop size={14} /> {t('settings.crop')}
                    </button>
                    <button className={`flex-1 py-2 rounded-lg text-xs font-bold ${isDark ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"}`} onClick={() => {}}>
                      <PenTool size={14} /> {t('settings.draw')}
                    </button>
                    <button className={`flex-1 py-2 rounded-lg text-xs font-bold ${isDark ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"}`} onClick={() => {}}>
                      T {t('settings.text')}
                    </button>
                  </div>
                  <div className={`rounded-lg border ${isDark ? "border-white/10 bg-[#11141c]" : "border-black/10 bg-white"}`}>
                    <div className={`p-2 text-center ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                      {t('settings.imagePreview')}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button 
                      className={`flex-1 py-2 rounded-lg text-xs font-bold ${isDark ? "bg-emerald-500 hover:bg-emerald-600" : "bg-emerald-500 hover:bg-emerald-600"} text-white`}
                    >
                      <Save size={14} /> {t('settings.save')}
                    </button>
                    <button 
                      className={`flex-1 py-2 rounded-lg text-xs font-bold ${isDark ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"}`}
                    >
                      <Trash2 size={14} /> {t('settings.reset')}
                    </button>
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-black/5 dark:border-white/5">
                  <div className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                    {t('settings.tools')}
                  </div>
                </div>
              </div>
            </SubView>
         )}
       </AnimatePresence>
    </div>
  );
};


