import {
  Activity, Bot, CreditCard, Crown, FolderTree, Globe, HelpCircle, Lock,
  Monitor, Network, Palette, Phone, Radar, Receipt, Shield,
} from "lucide-react";
import type { NavItemDef } from "./SettingsMenuParts";

interface SettingsMenuItemsArgs {
  isDark: boolean;
  t: (key: string, options?: any) => string;
  language: string;
  setActiveSection: (section: string) => void;
  setSubView: (view: string | null) => void;
  premiumActive: boolean;
}

export function buildSettingsMenuItems({
  isDark, t, language, setActiveSection, setSubView, premiumActive,
}: SettingsMenuItemsArgs) {
  const appearanceItems: NavItemDef[] = [
    {
      icon: <Palette size={18} className={isDark ? "text-emerald-400" : "text-emerald-600"} />,
      iconBg: isDark ? "bg-emerald-500/20" : "bg-emerald-100",
      title: t('settings.theme'),
      subtitle: t('settings.appearanceTheme'),
      onClick: () => setActiveSection('appearance'),
    },
    {
      icon: <Globe size={16} className="t-accent" />,
      iconBg: "t-accent-bg",
      title: t('settings.language'),
      subtitle: language,
      onClick: () => setActiveSection('language'),
    },
  ];

  const privacyItems: NavItemDef[] = [
    {
      icon: <Shield size={18} className={isDark ? "text-rose-400" : "text-rose-600"} />,
      iconBg: isDark ? "bg-rose-500/20" : "bg-rose-100",
      title: t('settings.security'),
      subtitle: t('settings.securitySubtitle'),
      onClick: () => setActiveSection('security'),
    },
    {
      icon: <Lock size={18} className={isDark ? "text-indigo-400" : "text-indigo-600"} />,
      iconBg: isDark ? "bg-indigo-500/20" : "bg-indigo-100",
      title: t('settings.privacy'),
      subtitle: t('settings.privacySubtitle'),
      onClick: () => setActiveSection('privacy'),
    },
    {
      icon: <Monitor size={18} className={isDark ? "text-sky-400" : "text-sky-600"} />,
      iconBg: isDark ? "bg-sky-500/20" : "bg-sky-100",
      title: t('settings.devices', 'Devices'),
      subtitle: t('settings.devicesSubtitle', 'Sessions and connected devices'),
      onClick: () => setActiveSection('devices'),
    },
  ];

  const chatsItems: NavItemDef[] = [
    {
      icon: <FolderTree size={16} className={"text-[var(--accent)]"} />,
      iconBg: isDark ? "bg-[var(--accent-soft)]" : "bg-[var(--accent)]/10",
      title: t('settings.folders'),
      subtitle: t('settings.foldersSubtitle', 'Organize chats into filters'),
      onClick: () => setActiveSection('folders'),
    },
  ];

  const callsItems: NavItemDef[] = [
    {
      icon: <Phone size={16} className={isDark ? "text-sky-400" : "text-sky-600"} />,
      iconBg: isDark ? "bg-sky-500/10" : "bg-sky-100",
      title: t('call.callsSettings', 'Call settings'),
      subtitle: t('call.callsSettingsSubtitle', 'Recording, history and call tools'),
      onClick: () => setActiveSection('calls'),
    },
  ];

  const servicesItems: NavItemDef[] = [
    {
      icon: <Crown size={16} className={isDark ? "text-amber-400" : "text-amber-600"} />,
      iconBg: isDark ? "bg-amber-500/10" : "bg-amber-100",
      title: t('premium.title', 'Premium'),
      subtitle: premiumActive ? t('premium.active', 'Active') : t('premium.menuSubtitle', 'Unlock premium features'),
      onClick: () => setActiveSection('premium'),
    },
    {
      icon: <Bot size={16} className={isDark ? "text-fuchsia-400" : "text-fuchsia-600"} />,
      iconBg: isDark ? "bg-fuchsia-500/10" : "bg-fuchsia-100",
      title: t('settings.bots'),
      subtitle: t('settings.botsSubtitle'),
      onClick: () => setActiveSection('bots'),
    },
    {
      icon: <Radar size={16} className={isDark ? "text-cyan-400" : "text-cyan-600"} />,
      iconBg: isDark ? "bg-cyan-500/10" : "bg-cyan-100",
      title: t('nav.radar'),
      subtitle: t('hub.radarSubtitle'),
      onClick: () => setSubView?.('radar'),
    },
    {
      icon: <CreditCard size={16} className={isDark ? "text-emerald-400" : "text-emerald-600"} />,
      iconBg: isDark ? "bg-emerald-500/10" : "bg-emerald-100",
      title: t('settings.payments'),
      subtitle: t('settings.paymentsSubtitle', 'Wallet, transfers and receipts'),
      onClick: () => setActiveSection('payments'),
    },
    {
      icon: <Receipt size={16} className={isDark ? "text-violet-400" : "text-violet-600"} />,
      iconBg: isDark ? "bg-violet-500/10" : "bg-violet-100",
      title: t('payRequests.menuTitle', 'Payment Requests'),
      subtitle: t('payRequests.menuSubtitle', 'Create & track crypto payments'),
      onClick: () => setActiveSection('paymentRequests'),
    },
  ];

  const advancedItems: NavItemDef[] = [
    {
      icon: <Network size={16} className="t-accent" />,
      iconBg: "t-accent-bg",
      title: t('settings.network'),
      subtitle: t('settings.networkSubtitle', 'Relay, transport and connection'),
      onClick: () => setActiveSection('network'),
    },
    {
      icon: <Activity size={16} className={isDark ? "text-emerald-400" : "text-emerald-600"} />,
      iconBg: isDark ? "bg-emerald-500/10" : "bg-emerald-100",
      title: t('settings.systemStatus'),
      subtitle: t('settings.systemStatusSubtitle'),
      onClick: () => setActiveSection('systemStatus'),
    },
    {
      icon: <Radar size={16} className={isDark ? "text-teal-400" : "text-teal-600"} />,
      iconBg: isDark ? "bg-teal-500/10" : "bg-teal-100",
      title: t('mesh.title', 'LAN Mesh'),
      subtitle: t('mesh.menuSubtitle', 'Serverless pairing via QR'),
      onClick: () => setActiveSection('mesh'),
    },
    {
      icon: <HelpCircle size={16} className={isDark ? "text-amber-400" : "text-amber-600"} />,
      iconBg: isDark ? "bg-amber-500/10" : "bg-amber-100",
      title: t('settings.helpSupport'),
      subtitle: t('settings.helpSupportSubtitle', 'FAQ, guides and contact'),
      onClick: () => setActiveSection('help'),
    },
  ];

  return { appearanceItems, privacyItems, chatsItems, callsItems, servicesItems, advancedItems };
}
