import { ChevronRight } from "lucide-react";

interface AppHeaderProps {
  isDark: boolean;
  view: string;
  activeChat: any;
  onBack: () => void;
  t: (key: string) => string;
}

export const AppHeader = ({ isDark, view, activeChat, onBack, t }: AppHeaderProps) => {
  const viewName = activeChat
    ? activeChat.name
    : view === 'saved'
      ? t('chat.saved')
      : t(`hub.${view === 'pulse' ? 'metropulse' : view}`);

  return (
    <div className="flex items-center gap-4 px-8 py-4 mb-4">
      <div
        onClick={onBack}
        title={t('chat.goBack')}
        className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 ${isDark ? "bg-[#1a1d24] border border-white/10 hover:bg-white/10" : "bg-[#f4f7f9] border border-black/10 hover:bg-white shadow-md"}`}
      >
        <ChevronRight size={24} className="rotate-180" />
      </div>
      <h2 className="text-2xl font-sans tracking-wide capitalize">{viewName}</h2>
    </div>
  );
};
