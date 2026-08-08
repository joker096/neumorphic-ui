import React, { type ButtonHTMLAttributes } from "react";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { useTheme } from "../../contexts/ThemeContext";

export type BackButtonSize = "sm" | "md" | "lg";

export interface BackButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  onClick?: () => void;
  size?: BackButtonSize;
  label?: string;
  isDark?: boolean;
}

const ICON_SIZE: Record<BackButtonSize, number> = { sm: 16, md: 18, lg: 20 };
const BOX: Record<BackButtonSize, string> = {
  sm: "w-10 h-10 min-w-[44px] min-h-[44px]",
  md: "w-10 h-10 min-w-[44px] min-h-[44px]",
  lg: "w-12 h-12 min-w-[48px] min-h-[48px]",
};

export const BackButton = ({
  onClick,
  className = "",
  label,
  size = "md",
  isDark: isDarkProp,
  ...rest
}: BackButtonProps) => {
  const { t } = useI18n();
  const { isDark: ctxDark } = useTheme();
  const isDark = isDarkProp ?? ctxDark;
  const dims = BOX[size];
  const iconSz = ICON_SIZE[size];
  const circleTheme = isDark
    ? "bg-[var(--bg-secondary)] hover:bg-[var(--hover-bg-dark)]"
    : "bg-[var(--bg-elevated)] hover:bg-white";
  const iconTheme = isDark
    ? "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
    : "text-slate-500 hover:text-slate-800";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ? undefined : t("common.back")}
      className={`flex items-center gap-1.5 text-sm font-medium cursor-pointer transition-colors hover:opacity-80 active:opacity-60 ${className}`}
      {...rest}
    >
      <span className={`${dims} rounded-full flex items-center justify-center transition-colors ${circleTheme}`}>
        <ChevronLeft size={iconSz} className={iconTheme} />
      </span>
      {label && <span>{label}</span>}
    </button>
  );
};
