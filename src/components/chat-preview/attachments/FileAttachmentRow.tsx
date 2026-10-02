import {
  FileText, FileSpreadsheet, FileArchive, FileCode, Download,
  Image as ImageIcon, Music, Film,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "../../../lib/i18n";
import { formatSize } from "../../../utils/formatSize";
import { getFileKind, type FileKind } from "../../../utils/fileType";

const FILE_KIND_STYLE: Record<FileKind, { Icon: LucideIcon; tint: string }> = {
  pdf: { Icon: FileText, tint: "bg-rose-500/15 text-rose-500" },
  doc: { Icon: FileText, tint: "bg-sky-500/15 text-sky-500" },
  sheet: { Icon: FileSpreadsheet, tint: "bg-emerald-500/15 text-emerald-500" },
  image: { Icon: ImageIcon, tint: "bg-violet-500/15 text-violet-500" },
  audio: { Icon: Music, tint: "bg-amber-500/15 text-amber-500" },
  video: { Icon: Film, tint: "bg-fuchsia-500/15 text-fuchsia-500" },
  archive: { Icon: FileArchive, tint: "bg-orange-500/15 text-orange-500" },
  code: { Icon: FileCode, tint: "bg-cyan-500/15 text-cyan-500" },
  other: { Icon: FileText, tint: "bg-slate-500/15 text-slate-400" },
};

interface FileAttachmentRowProps {
  msg: any;
  isDark: boolean;
  hasTransfer: boolean;
  pending: boolean;
  ready: boolean;
  url: string | null;
}

/** Document row: kind icon, name/size, transfer state and the download action. */
export function FileAttachmentRow({ msg, isDark, hasTransfer, pending, ready, url }: FileAttachmentRowProps) {
  const { t } = useI18n();
  const size = typeof msg.fileSize === "number" && msg.fileSize > 0 ? formatSize(msg.fileSize) : null;
  const sub = [msg.text, size].filter(Boolean).join("  ·  ");
  const unavailable = hasTransfer && !ready && !pending;
  const { Icon: KindIcon, tint: kindTint } = FILE_KIND_STYLE[getFileKind(msg.fileName, msg.mime)];
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 mb-2 ${isDark ? "bg-white/5 border-[var(--border-color)]" : "bg-slate-100 border-[var(--border-color)]"}`}>
      <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${kindTint}`}>
        <KindIcon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{msg.fileName || t("chat.file")}</div>
        {sub && <div className={`text-xs truncate ${isDark ? "text-gray-400" : "text-slate-500"}`}>{sub}</div>}
        {(!msg.attachment || unavailable) && (
          <div className={`text-xs truncate ${isDark ? "text-rose-400" : "text-rose-500"}`}>{t("chat.attachmentUnavailable", "Attachment unavailable")}</div>
        )}
      </div>
      {pending ? (
        <span aria-hidden="true" className={`shrink-0 w-5 h-5 border-2 rounded-full animate-spin border-t-transparent ${isDark ? "border-gray-400" : "border-slate-400"}`} />
      ) : ready ? (
        <a
          href={url || undefined}
          download={msg.fileName || undefined}
          aria-label={t("media.downloadDoc", "Download")}
          className={`min-h-11 min-w-11 shrink-0 flex items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--ink-on-saturate)]`}
        >
          <Download size={16} />
        </a>
      ) : null}
    </div>
  );
}
