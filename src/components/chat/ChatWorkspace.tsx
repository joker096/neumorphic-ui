import { ActiveChatWorkspace } from "./ActiveChatWorkspace";
import { ChatListWorkspace } from "./ChatListWorkspace";

type ChatWorkspaceProps = {
  hasActiveChat: boolean;
  listProps: any;
  activeProps: any;
};

export const ChatWorkspace = ({ hasActiveChat, listProps, activeProps }: ChatWorkspaceProps) =>
  hasActiveChat ? <ActiveChatWorkspace {...activeProps} /> : <ChatListWorkspace {...listProps} />;
