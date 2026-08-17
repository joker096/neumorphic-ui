import { Briefcase } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ChannelItem } from './ChannelItem';
import type { CompanyChannel } from '../../lib/company/types';
import { CHANNEL_GRADIENTS, DEFAULT_CHANNEL_GRADIENT } from '../../constants/companyConstants';

type ChannelListProps = {
  isDark?: boolean;
  channels: CompanyChannel[];
  channelsLabel: string;
  onChannelClick?: (channel: CompanyChannel) => void;
  t: (key: string, args?: Record<string, string | number>) => string;
};

export const ChannelList = ({ isDark = false, channels, channelsLabel, onChannelClick, t }: ChannelListProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 px-2 mb-3 font-bold text-xs uppercase tracking-widest text-[var(--accent)]">
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
              gradient={CHANNEL_GRADIENTS[channel.id] || DEFAULT_CHANNEL_GRADIENT}
              onClick={() => onChannelClick?.(channel)}
              t={t}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

