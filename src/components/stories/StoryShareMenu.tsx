import React from 'react';
import { Forward, Link2 } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { MessageContextMenu, type MessageContextAction } from '../chat-preview/MessageContextMenu';

interface StoryShareMenuProps {
  open: boolean;
  onClose: () => void;
  onForward: () => void;
  onCopyLink: () => void;
}

export const StoryShareMenu: React.FC<StoryShareMenuProps> = ({ open, onClose, onForward, onCopyLink }) => {
  const { t } = useI18n();

  const actions: MessageContextAction[] = [
    {
      key: 'forward',
      label: t('story.forwardToChat', 'Forward'),
      icon: <Forward size={18} aria-hidden="true" />,
      onClick: onForward,
    },
    {
      key: 'copy',
      label: t('story.copyLink', 'Copy link'),
      icon: <Link2 size={18} aria-hidden="true" />,
      onClick: onCopyLink,
    },
  ];

  return (
    <MessageContextMenu
      open={open}
      onClose={onClose}
      title={t('story.shareSheet', 'Share story')}
      isDark
      actions={actions}
    />
  );
};
