import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { ChatPickerModal } from "../payments/ChatPickerModal";

interface ChatPreviewDialogsProps {
  chat: any;
  theme: "light" | "dark";
  t: (key: string, arg?: any) => string;
  /** `useChatPreviewInteractions` delete-confirm state machine. */
  interactions: any;
  /** `useMessageForward` state. */
  forwardOpen: boolean;
  closeForward: () => void;
  forwardTo: (chatId: string | number) => void;
}

/** Modal layer of the chat preview: delete confirmation and the forward picker. */
export const ChatPreviewDialogs = ({
  chat,
  theme,
  t,
  interactions,
  forwardOpen,
  closeForward,
  forwardTo,
}: ChatPreviewDialogsProps) => {
  const { deleteConfirm, selectedCount, confirmDelete, cancelDelete } = interactions;

  return (
    <>
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title={
          deleteConfirm?.kind === "bulk"
            ? t("chat.bulkDeleteMessageConfirm", { count: selectedCount })
            : t("chat.deleteMessageConfirm", "Delete this message?")
        }
        message={deleteConfirm?.kind === "bulk" ? "" : undefined}
        variant="danger"
        theme={theme}
        confirmLabel={t("chat.delete")}
        cancelLabel={t("common.cancel")}
        confirmIcon={<Trash2 size={18} />}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <ChatPickerModal
        open={forwardOpen}
        onClose={closeForward}
        onPick={forwardTo}
        title={t("chat.forward", "Forward")}
        excludeChatId={chat.id}
      />
    </>
  );
};