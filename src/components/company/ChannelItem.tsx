import { Briefcase } from 'lucide-react';
import { motion } from 'motion/react';
import type { CompanyChannel } from '../../lib/company/types';

type ChannelItemProps = {
  channel: CompanyChannel;
  isDark: boolean;
  index: number;
  gradient: string;
  t: (key: string, args?: Record<string, string | number>) => string;
};

export const ChannelItem = ({ channel, isDark, index, gradient, t }: ChannelItemProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className={`w-full flex items-center gap-3 p-3 md:p-3 rounded-2xl cursor-pointer transition-all active:scale-95 min-h-[56px] ${isDark ? "hover:bg-[#1a1d24]" : "hover:bg-white shadow-sm"}`}
  >
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white shrink-0`}>
      <Briefcase size={18} />
    </div>
    <div className="flex-1 min-w-0">
      <div className={`font-bold truncate text-sm ${isDark ? "text-gray-100" : "text-slate-800"}`}>{channel.name}</div>
      <div className={`text-[10px] truncate ${isDark ? "text-gray-400" : "text-slate-500"}`}>
        {channel.description || t('company.memberCount', { count: channel.memberCount })}
      </div>
    </div>
    {channel.unread > 0 && (
      <div className={`min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-500/10 text-orange-600"}`}>
        {channel.unread}
      </div>
    )}
  </motion.div>
);
