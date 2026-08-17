/**
 * Shared constants for the Profile and Settings sections.
 */

export const AVATAR_COLORS = [
  "from-orange-400 to-red-500",
  "from-blue-400 to-indigo-500",
  "from-green-400 to-emerald-500",
  "from-purple-400 to-pink-500",
  "from-cyan-400 to-blue-500",
  "from-yellow-400 to-orange-500",
] as const;

export const ACCOUNT_COLORS = [
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-indigo-500",
  "from-green-500 to-emerald-500",
  "from-pink-500 to-rose-500",
  "from-yellow-500 to-orange-500",
] as const;

export const DEFAULT_AVATAR_COLOR = AVATAR_COLORS[0];

export interface ProfileFieldTypeOption {
  value: string;
  label: string;
  labelKey: string;
}

export const PROFILE_FIELD_TYPES: readonly ProfileFieldTypeOption[] = [
  { value: "phone", label: "Phone", labelKey: "settings.fieldTypePhone" },
  { value: "email", label: "Email", labelKey: "settings.fieldTypeEmail" },
  { value: "telegram", label: "Telegram", labelKey: "settings.fieldTypeTelegram" },
  { value: "whatsapp", label: "WhatsApp", labelKey: "settings.fieldTypeWhatsApp" },
  { value: "signal", label: "Signal", labelKey: "settings.fieldTypeSignal" },
  { value: "signalv2v", label: "Signal V2V", labelKey: "settings.fieldTypeSignalV2V" },
  { value: "username", label: "Username", labelKey: "settings.fieldTypeUsername" },
  { value: "custom", label: "Custom", labelKey: "settings.fieldTypeCustom" },
];

export const FIELD_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PROFILE_FIELD_TYPES.map((t) => [t.value, t.label]),
);

export function getFieldTypeLabel(type: string): string {
  return FIELD_TYPE_LABELS[type] ?? type;
}

export interface VisibilityOption {
  value: "everyone" | "contactsOnly";
  labelKey: string;
  fallback: string;
}

export const VISIBILITY_OPTIONS: readonly VisibilityOption[] = [
  { value: "everyone", labelKey: "settings.visibility.everyone", fallback: "Visible to everyone" },
  { value: "contactsOnly", labelKey: "settings.visibility.contacts", fallback: "Contacts only" },
];

export const PROFILE_FALLBACK_ID = "nexus://id/fingerprint";
