import { Briefcase } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ChannelItem } from './ChannelItem';
import type { CompanyChannel } from '../../lib/company/types';

type ChannelListProps = {
  isDark: boolean;
  channels: CompanyChannel[];
  channelsLabel: string;
  t: (key: string, args?: Record<string, string | number>) => string;
};

export const ChannelList = ({ isDark, channels, channelsLabel, t }: ChannelListProps) => {
  const gradients: Record<string, string> = {
    'company-all': 'from-blue-400 to-indigo-500',
    'company-dev': 'from-purple-400 to-purple-600',
  };

  return (
    <div className="w-full">
      <div className={`flex items-center gap-2 px-2 mb-3 font-bold text-xs uppercase tracking-widest ${isDark ? "text-blue-400" : "text-blue-600"}`}>
        <Briefcase size={14} />
        <span className="truncate">{channelsLabel}</span>
      </div>
      
      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {channels.map((channel, i) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              isDark={isDark}
              index={i}
              gradient={gradients[channel.id] || "from-teal-400 to-cyan-500"}
              t={t}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
