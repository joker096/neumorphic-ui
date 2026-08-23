import { useI18n } from "../../lib/i18n";

interface ChannelCommentsRowProps {
  msg: any;
  isDark: boolean;
  onSetActivePostId: (id: number | null) => void;
  onSetShowComments: (show: boolean) => void;
}

export function ChannelCommentsRow({
  msg, isDark, onSetActivePostId, onSetShowComments,
}: ChannelCommentsRowProps) {
  const { t } = useI18n();
  return (
    <div
      className={`flex items-center gap-1 mt-2 -mb-1 px-1 py-1 rounded-lg cursor-pointer ${isDark ? "hover:bg-white/5 text-gray-400 hover:text-[var(--text-primary)]" : "hover:bg-black/5 text-slate-500 hover:text-slate-800"} transition-colors max-w-full`}
      onClick={() => { onSetActivePostId(msg.id); onSetShowComments(true); }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
      <span className="text-xs font-medium tracking-wide">
        {msg.id === 402 ? t('channelComments.replies', { count: 45 }) : t('channelComments.leaveAComment')}
      </span>
    </div>
  );
}
