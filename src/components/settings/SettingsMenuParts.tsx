import React from "react";
import { ChevronRight } from "lucide-react";
import { SettingsSectionTitle } from "../ui/SettingsRow";
import { SettingsCard, SettingsDivider, SettingsNavItem } from "./SettingsMenuPrimitives";

export interface NavItemDef {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  onClick: () => void;
}

type Tone = "emerald" | "amber" | "purple";

function gradientFor(tone: Tone, isDark: boolean): string {
  if (isDark) {
    const map: Record<Tone, string> = {
      emerald: "bg-gradient-to-br from-emerald-500/10 to-transparent border border-[var(--border-color)] hover:bg-white/[0.04]",
      amber: "bg-gradient-to-br from-amber-500/10 to-transparent border border-[var(--border-color)] hover:bg-white/[0.04]",
      purple: "bg-gradient-to-br from-purple-500/10 to-transparent border border-[var(--border-color)] hover:bg-white/[0.04]",
    };
    return map[tone];
  }
  const map: Record<Tone, string> = {
    emerald: "bg-gradient-to-br from-emerald-50 to-transparent border border-emerald-100 hover:bg-emerald-50/60 shadow-sm",
    amber: "bg-gradient-to-br from-amber-50 to-transparent border border-amber-100 hover:bg-amber-50/60 shadow-sm",
    purple: "bg-gradient-to-br from-purple-50 to-transparent border border-purple-100 hover:bg-purple-50/60 shadow-sm",
  };
  return map[tone];
}

export function BigMenuButton({
  isDark, tone, icon, iconBg, title, subtitle, onClick,
}: {
  isDark: boolean;
  tone: Tone;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={`w-full rounded-xl p-4 text-left transition-all active:scale-[0.99] ${gradientFor(tone, isDark)}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{title}</div>
          <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{subtitle}</div>
        </div>
        <ChevronRight size={16} className={`shrink-0 opacity-40 ${isDark ? "text-gray-400" : "text-slate-500"}`} />
      </div>
    </button>
  );
}

export function NavGroup({ isDark, title, items }: { isDark: boolean; title: string; items: NavItemDef[] }) {
  return (
    <div className="w-full">
      <SettingsSectionTitle title={title} isDark={isDark} />
      <SettingsCard isDark={isDark}>
        {items.map((it, i) => (
          <React.Fragment key={i}>
            {i > 0 && <SettingsDivider isDark={isDark} />}
            <SettingsNavItem
              icon={it.icon}
              iconBg={it.iconBg}
              title={it.title}
              subtitle={it.subtitle}
              isDark={isDark}
              onClick={it.onClick}
            />
          </React.Fragment>
        ))}
      </SettingsCard>
    </div>
  );
}
