import {
  Activity, Bot, CreditCard, Crown, FolderTree, Globe, HelpCircle, Lock,
  Monitor, Network, Palette, Phone, Radar, Receipt, Shield,
} from "lucide-react";
import type { NavItemDef } from "./SettingsMenuParts";

interface SettingsMenuItemsArgs {
  t: (key: string, options?: any) => string;
  language: string;
  setActiveSection: (section: string) => void;
  setSubView: (view: string | null) => void;
  premiumActive: boolean;
}

export function buildSettingsMenuItems({
  t, language, setActiveSection, setSubView, premiumActive,
}: SettingsMenuItemsArgs) {
  const appearanceItems: NavItemDef[] = [
    {
      icon: <Palette size={18} className={"text-emerald-600 dark:text-emerald-400"} />,
      iconBg: "bg-emerald-100 dark:bg-emerald-500/undefined",
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
      icon: <Shield size={18} className={"text-rose-600 dark:text-rose-400"} />,
      iconBg: "bg-rose-100 dark:bg-rose-500/undefined",
      title: t('settings.security'),
      subtitle: t('settings.securitySubtitle'),
      onClick: () => setActiveSection('security'),
    },
    {
      icon: <Lock size={18} className={"text-indigo-600 dark:text-indigo-400"} />,
      iconBg: "bg-indigo-100 dark:bg-indigo-500/undefined",
      title: t('settings.privacy'),
      subtitle: t('settings.privacySubtitle'),
      onClick: () => setActiveSection('privacy'),
    },
    {
      icon: <Monitor size={18} className={"text-sky-600 dark:text-sky-400"} />,
      iconBg: "bg-sky-100 dark:bg-sky-500/undefined",
      title: t('settings.devices', 'Devices'),
      subtitle: t('settings.devicesSubtitle', 'Sessions and connected devices'),
      onClick: () => setActiveSection('devices'),
    },
  ];

  const chatsItems: NavItemDef[] = [
    {
      icon: <FolderTree size={16} className={"text-[var(--accent)]"} />,
      iconBg: "bg-[var(--accent-soft)]",
      title: t('settings.folders'),
      subtitle: t('settings.foldersSubtitle', 'Organize chats into filters'),
      onClick: () => setActiveSection('folders'),
    },
  ];

  const callsItems: NavItemDef[] = [
    {
      icon: <Phone size={16} className={"text-sky-600 dark:text-sky-400"} />,
      iconBg: "bg-sky-100 dark:bg-sky-500/undefined",
      title: t('call.callsSettings', 'Call settings'),
      subtitle: t('call.callsSettingsSubtitle', 'Recording, history and call tools'),
      onClick: () => setActiveSection('calls'),
    },
  ];

  const servicesItems: NavItemDef[] = [
    {
      icon: <Crown size={16} className={"text-amber-600 dark:text-amber-400"} />,
      iconBg: "bg-amber-100 dark:bg-amber-500/undefined",
      title: t('premium.title', 'Premium'),
      subtitle: premiumActive ? t('premium.active', 'Active') : t('premium.menuSubtitle', 'Unlock premium features'),
      onClick: () => setActiveSection('premium'),
    },
    {
      icon: <Bot size={16} className={"text-fuchsia-600 dark:text-fuchsia-400"} />,
      iconBg: "bg-fuchsia-100 dark:bg-fuchsia-500/undefined",
      title: t('settings.bots'),
      subtitle: t('settings.botsSubtitle'),
      onClick: () => setActiveSection('bots'),
    },
    {
      icon: <Radar size={16} className={"text-cyan-600 dark:text-cyan-400"} />,
      iconBg: "bg-cyan-100 dark:bg-cyan-500/undefined",
      title: t('nav.radar'),
      subtitle: t('hub.radarSubtitle'),
      onClick: () => setSubView?.('radar'),
    },
    {
      icon: <CreditCard size={16} className={"text-emerald-600 dark:text-emerald-400"} />,
      iconBg: "bg-emerald-100 dark:bg-emerald-500/undefined",
      title: t('settings.payments'),
      subtitle: t('settings.paymentsSubtitle', 'Wallet, transfers and receipts'),
      onClick: () => setActiveSection('payments'),
    },
    {
      icon: <Receipt size={16} className={"text-violet-600 dark:text-violet-400"} />,
      iconBg: "bg-violet-100 dark:bg-violet-500/undefined",
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
      icon: <Activity size={16} className={"text-emerald-600 dark:text-emerald-400"} />,
      iconBg: "bg-emerald-100 dark:bg-emerald-500/undefined",
      title: t('settings.systemStatus'),
      subtitle: t('settings.systemStatusSubtitle'),
      onClick: () => setActiveSection('systemStatus'),
    },
    {
      icon: <Radar size={16} className={"text-teal-600 dark:text-teal-400"} />,
      iconBg: "bg-teal-100 dark:bg-teal-500/undefined",
      title: t('mesh.title', 'LAN Mesh'),
      subtitle: t('mesh.menuSubtitle', 'Serverless pairing via QR'),
      onClick: () => setActiveSection('mesh'),
    },
    {
      icon: <HelpCircle size={16} className={"text-amber-600 dark:text-amber-400"} />,
      iconBg: "bg-amber-100 dark:bg-amber-500/undefined",
      title: t('settings.helpSupport'),
      subtitle: t('settings.helpSupportSubtitle', 'FAQ, guides and contact'),
      onClick: () => setActiveSection('help'),
    },
  ];

  return { appearanceItems, privacyItems, chatsItems, callsItems, servicesItems, advancedItems };
}
