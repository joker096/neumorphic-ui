import { MessageCircle } from "lucide-react";
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
      className={`flex items-center gap-1 mt-2 -mb-1 px-1 py-1 rounded-lg cursor-pointer ${isDark ? "hover:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" : "hover:bg-black/5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"} transition-colors max-w-full`}
      onClick={() => { onSetActivePostId(msg.id); onSetShowComments(true); }}
    >
      <MessageCircle size={14} />
      <span className="text-xs font-medium tracking-wide">
        {msg.id === 402 ? t('channelComments.replies', { count: 45 }) : t('channelComments.leaveAComment')}
      </span>
    </div>
  );
}
