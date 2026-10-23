import { Trash2, Eraser } from "lucide-react";
import { ConfirmDialog } from "../ui/ConfirmDialog";

type Translate = (key: string, options?: any) => string;

interface ChatListConfirmDialogProps {
  deleteConfirm: { kind: "single" | "bulk" | "clear"; chat?: any } | null;
  selectedCount: number;
  theme: "light" | "dark";
  t: Translate;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ChatListConfirmDialog = ({
  deleteConfirm,
  selectedCount,
  theme,
  t,
  onConfirm,
  onCancel,
}: ChatListConfirmDialogProps) => {
  return (
    <ConfirmDialog
      isOpen={deleteConfirm !== null}
      title={
        deleteConfirm?.kind === "bulk"
          ? t("chat.bulkDeleteConfirm", { count: selectedCount })
          : deleteConfirm?.kind === "clear"
            ? t("chat.clearHistory")
            : t("chat.deleteChat")
      }
      message={
        deleteConfirm?.kind === "bulk"
          ? ""
          : deleteConfirm?.kind === "clear"
            ? t("chat.clearHistoryConfirm")
            : t("chat.deleteConfirm")
      }
      variant="danger"
      theme={theme}
      confirmLabel={deleteConfirm?.kind === "clear" ? t("chat.clearHistory") : t("chat.delete")}
      cancelLabel={t("common.cancel")}
      confirmIcon={deleteConfirm?.kind === "clear" ? <Eraser size={18} /> : <Trash2 size={18} />}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};