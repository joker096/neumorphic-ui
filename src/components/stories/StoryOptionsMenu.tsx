import React from 'react';
import { Link2, Bookmark, Trash2 } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { StoryActionMenu, type StoryMenuAction } from './StoryActionMenu';

interface StoryOptionsMenuProps {
  open: boolean;
  onClose: () => void;
  isMe: boolean;
  savable: boolean;
  onCopyLink: () => void;
  onDelete: () => void;
  onSave: () => void;
}

export const StoryOptionsMenu: React.FC<StoryOptionsMenuProps> = ({ open, onClose, isMe, savable, onCopyLink, onDelete, onSave }) => {
  const { t } = useI18n();

  const actions: StoryMenuAction[] = [
    {
      key: 'copy',
      label: t('story.copyLink', 'Copy link'),
      icon: <Link2 size={18} aria-hidden="true" />,
      onClick: onCopyLink,
    },
    ...(savable
      ? [
          {
            key: 'save',
            label: t('story.saveStory', 'Save story'),
            icon: <Bookmark size={18} aria-hidden="true" />,
            onClick: onSave,
          },
        ]
      : []),
    ...(isMe
      ? [
          {
            key: 'delete',
            label: t('story.deleteStory', 'Delete story'),
            icon: <Trash2 size={18} aria-hidden="true" />,
            danger: true,
            onClick: onDelete,
          },
        ]
      : []),
  ];

  return (
    <StoryActionMenu
      open={open}
      onClose={onClose}
      title={t('story.moreTitle', 'Story options')}
      actions={actions}
    />
  );
};
