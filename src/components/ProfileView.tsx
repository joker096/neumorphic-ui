import { lazy, Suspense } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useI18n } from "../lib/i18n";
import type { ComponentType } from "react";
import { DataState } from "./ui/DataState";

const ProfileSection = lazy(
  () => import("./settings/ProfileSection").then((m) => ({ default: m.ProfileSection })),
);

function Loader() {
  return <DataState status="loading" />;
}

export interface ProfileViewProps {
  isDark?: boolean;
  onBack?: () => void;
  t?: (key: string, fallback?: string) => string;
  setView?: (view: string) => void;
}

export const ProfileView: ComponentType<ProfileViewProps> = ({
  isDark: isDarkProp,
  onBack,
  t: tProp,
  setView,
}) => {
  const { theme } = useTheme();
  const { t } = useI18n();
  const isDark = isDarkProp ?? theme === "dark";
  const tFn = tProp ?? t;
  const handleBack = onBack ?? (() => setView?.("chats"));

  return (
    <div
      className={`w-full max-w-none md:max-w-[640px] flex-1 flex flex-col p-4 sm:p-6 mb-8 h-full min-h-0 pb-28 sm:pb-8 rounded-2xl ${
        isDark
          ? "bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
          : "bg-white border border-[var(--border-color)] shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
      }`}
    >
      <Suspense fallback={<Loader />}>
        <ProfileSection isDark={isDark} onBack={handleBack} t={tFn} />
      </Suspense>
    </div>
  );
};
