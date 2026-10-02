import { Ban, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "../ui/ConfirmDialog";

type Translate = (key: string, options?: any) => string;

export type ContactConfirmAction = "delete" | "block";

interface ContactConfirmDialogsProps {
  action: ContactConfirmAction | null;
  contactName: string;
  theme: "light" | "dark";
  t: Translate;
  onConfirmDelete: () => void;
  onConfirmBlock: () => void;
  onCancel: () => void;
}

/** Destructive-action confirmations for the contact profile (delete, block). */
export function ContactConfirmDialogs({ action, contactName, theme, t, onConfirmDelete, onConfirmBlock, onCancel }: ContactConfirmDialogsProps) {
  return (
    <>
      <ConfirmDialog
        key="delete"
        isOpen={action === "delete"}
        title={t("contacts.deleteContact")}
        message={t("contacts.confirmDeleteMessage", { name: contactName })}
        confirmLabel={t("contacts.deleteContact")}
        cancelLabel={t("contacts.close")}
        confirmIcon={<Trash2 />}
        cancelIcon={<X />}
        variant="danger"
        theme={theme}
        onConfirm={onConfirmDelete}
        onCancel={onCancel}
      />
      <ConfirmDialog
        key="block"
        isOpen={action === "block"}
        title={t("contacts.blockSpammer")}
        message={t("contacts.confirmBlockMessage", { name: contactName })}
        confirmLabel={t("contacts.blockSpammer")}
        cancelLabel={t("contacts.close")}
        confirmIcon={<Ban />}
        cancelIcon={<X />}
        variant="danger"
        theme={theme}
        onConfirm={onConfirmBlock}
        onCancel={onCancel}
      />
    </>
  );
}
