import React, { type ButtonHTMLAttributes } from "react";
import { X } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { IconButton } from "./IconButton";

export type CloseButtonSize = "sm" | "md" | "lg";

export interface CloseButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  onClick: () => void;
  size?: CloseButtonSize;
  isDark?: boolean;
}

export const CloseButton = ({
  onClick,
  className = "",
  size = "md",
  isDark,
  ...rest
}: CloseButtonProps) => {
  const { t } = useI18n();
  return (
    <IconButton
      icon={<X />}
      size={size}
      variant="ghost"
      isDark={isDark}
      onClick={onClick}
      className={className}
      aria-label={rest["aria-label"] ?? t("common.close")}
      {...rest}
    />
  );
};
