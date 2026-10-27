import { ChevronLeft } from "lucide-react";
import { PersonalSiteChatManager } from "../company/PersonalSiteChatManager";

interface PersonalSiteChatViewProps {
  onBack: () => void;
  onOpenPremium: () => void;
  t: (key: string, options?: any) => string;
}

export function PersonalSiteChatView({ onBack, onOpenPremium, t }: PersonalSiteChatViewProps) {
  return (
    <div className="w-full max-w-[500px] flex flex-col p-5 mb-8 pb-[calc(56px+var(--spacing-16)+env(safe-area-inset-bottom,0px))] sm:pb-8">
      <div className="w-full shrink-0 mb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label={t("common.back")}
          className="min-w-11 min-h-11 rounded-full flex items-center justify-center transition-all duration-200 bg-[var(--bg-primary)] hover:bg-white text-[var(--text-secondary)] shadow-sm dark:bg-[var(--bg-tertiary)] dark:hover:bg-[var(--hover-bg-dark)] dark:shadow-none"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="text-lg font-bold text-[var(--text-primary)]">{t("settings.siteEmbed", "Website Embed")}</div>
        </div>
      </div>
      <div className="overflow-x-hidden pr-1 flex flex-col gap-4">
        <PersonalSiteChatManager onOpenPremium={onOpenPremium} />
      </div>
    </div>
  );
}
