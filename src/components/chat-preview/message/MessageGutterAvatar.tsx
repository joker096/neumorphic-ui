import { Avatar } from "../../ui/Avatar";
import { useAppStore } from "../../../store";

interface MessageGutterAvatarProps {
  isMe: boolean;
  displayName: string;
  chat: any;
}

/** Leading gutter avatar for non-channel messages; reads the stored avatar itself. */
export function MessageGutterAvatar({ isMe, displayName, chat }: MessageGutterAvatarProps) {
  const avatarSrc = useAppStore((s) =>
    isMe ? s.userProfile?.avatar : displayName ? s.contactAvatars?.[displayName] : undefined,
  );
  const ownName = useAppStore((s) => (isMe ? s.userProfile?.name : undefined));

  return (
    <Avatar
      name={displayName || (isMe ? ownName || "Me" : "?")}
      src={avatarSrc}
      color={isMe ? undefined : chat?.color}
      size="sm"
      className="msg-gutter-avatar"
    />
  );
}
