import React from 'react';
import { Link2, Bookmark, Trash2, Flag } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { toast } from '../ui/Toast';
import { MessageContextMenu } from '../chat-preview/MessageContextMenu';

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

  const actions = [
    {
      key: 'copy',
      label: t('story.copyLink', 'Copy link'),
      icon: <Link2 size={18} />,
      onClick: onCopyLink,
    },
    ...(savable
      ? [
          {
            key: 'save',
            label: t('story.saveStory', 'Save story'),
            icon: <Bookmark size={18} />,
            onClick: onSave,
          },
        ]
      : []),
    isMe
      ? {
          key: 'delete',
          label: t('story.deleteStory', 'Delete story'),
          icon: <Trash2 size={18} />,
          danger: true,
          onClick: onDelete,
        }
      : {
          key: 'report',
          label: t('story.reportStory', 'Report'),
          icon: <Flag size={18} />,
          danger: true,
          onClick: () => toast(t('story.reported', 'Reported'), 'success'),
        },
  ];

  return (
    <MessageContextMenu
      open={open}
      onClose={onClose}
      title={t('story.moreTitle', 'Story options')}
      isDark
      actions={actions}
    />
  );
};
