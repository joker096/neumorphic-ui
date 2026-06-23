import { toast } from 'sonner';

export async function exportBackup(
  encrypted: boolean,
  showPasswordInput: boolean,
  backupPassword: string,
  chats: unknown[],
  channels: unknown[],
  bots: unknown[],
  archivedChats: unknown[],
  theme: 'light' | 'dark',
  language: string,
  notificationsEnabled: boolean,
  soundEnabled: boolean,
  twoFactorEnabled: boolean,
  proxyEnabled: boolean,
  spamFilterEnabled: boolean,
  showPwaBanner: boolean,
  deadMansSwitch: string,
  mediaAutoLoad: string,
  selfDestructDefault: string,
  obfuscationMode: string,
  visNumber: string,
  visActivity: string,
  uiAnimations: boolean,
  fontSize: string,
  dndEnabled: boolean,
  dndFrom: string,
  dndTo: string,
  priorityContacts: string,
  t: (key: string) => string
) {
  if (encrypted) {
    const password = backupPassword || window.prompt("Enter backup password:");
    if (!password) {
      toast.error(t('toast.encryptionFailed'), { description: t('toast.noPasswordProvided') });
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
    
    try {
      const keyMaterial = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
      const key = await window.crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
      const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
      
      const encryptedData = {
        version: 2,
        exportedAt: Date.now(),
        encrypted: true,
        salt: Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join(""),
        iv: Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join(""),
        ciphertext: Array.from(new Uint8Array(ciphertext)).map(b => b.toString(16).padStart(2, "0")).join(""),
        data: null
      };
      
      downloadJson(encryptedData, `mess-anger-backup-encrypted-${new Date().toISOString().slice(0, 10)}.json`);
      toast.success(t('toast.encryptedBackupCreated'), { description: t('toast.backupEncryptedWithPassword') });
    } catch {
      toast.error(t('toast.encryptionError'), { description: t('toast.couldNotEncryptBackup') });
    }
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

  downloadJson(backupData, `mess-anger-backup-${new Date().toISOString().slice(0, 10)}.json`);
  toast.success(t('toast.backupCreated'), { description: t('toast.backupReady') });
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportBackupHtml(
  chats: unknown[],
  channels: unknown[],
  bots: unknown[],
  archivedChats: unknown[],
  theme: 'light' | 'dark',
  language: string,
  notificationsEnabled: boolean,
  dndEnabled: boolean,
  priorityContacts: string
) {
  const rows = (label: string, value: unknown) => 
    `<tr><td style="padding:8px 12px;border-bottom:1px solid #ddd;font-weight:600;">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #ddd;">${typeof value === 'string' ? value : JSON.stringify(value)}</td></tr>`;
  
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
}