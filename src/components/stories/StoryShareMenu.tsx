import React from 'react';
import { Forward, Link2 } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { StoryActionMenu, type StoryMenuAction } from './StoryActionMenu';

interface StoryShareMenuProps {
  open: boolean;
  onClose: () => void;
  onForward: () => void;
  onCopyLink: () => void;
}

export const StoryShareMenu: React.FC<StoryShareMenuProps> = ({ open, onClose, onForward, onCopyLink }) => {
  const { t } = useI18n();

  const actions: StoryMenuAction[] = [
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
    <StoryActionMenu
      open={open}
      onClose={onClose}
      title={t('story.shareSheet', 'Share story')}
      actions={actions}
    />
  );
};
