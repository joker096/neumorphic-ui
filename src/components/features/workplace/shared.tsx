import type { ReactNode } from "react";
import { toast } from "../../ui/Toast";

export function reportServiceError(t: (k: string, fb?: string) => string) {
  toast(t("workplace.actionFailed", "Could not save changes"), "error");
}

export function Panel({ children }: { children: React.ReactNode }) {
  return <div className="max-w-3xl mx-auto flex flex-col gap-3">{children}</div>;
}
