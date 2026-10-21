import { Briefcase } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ChannelItem } from './ChannelItem';
import type { CompanyChannel } from '../../lib/company/types';
import { CHANNEL_GRADIENTS, DEFAULT_CHANNEL_GRADIENT } from '../../constants/companyConstants';
import { DataState } from '../ui/DataState';
import { COMPANY_SECTION_LABEL_CLASS } from "./companyClasses";

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
      <div className={COMPANY_SECTION_LABEL_CLASS}>
        <Briefcase size={14} />
        <span className="truncate">{channelsLabel}</span>
      </div>

      {channels.length === 0 && (
        <DataState status="empty" title={t('company.noChannels')} />
      )}
      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {channels.map((channel, i) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
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

