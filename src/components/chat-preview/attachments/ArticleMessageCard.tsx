import { Link2 } from "lucide-react";

interface ArticleMessageCardProps {
  msg: any;
}

export function ArticleMessageCard({ msg }: ArticleMessageCardProps) {
  const url = typeof msg.url === "string" ? msg.url : "";
  if (!url) return null;
  let host = "";
  try {
    host = new URL(url).host;
  } catch {
    host = url;
  }
  const title = typeof msg.title === "string" && msg.title.trim() ? msg.title.trim() : host;
  return (
    <div className="rounded-xl border mb-2 overflow-hidden">
      <a href={url} target="_blank" rel="noopener noreferrer" className="block p-3 hover:opacity-90">
        <div className="text-sm font-semibold break-words mb-1">{title}</div>
        <div className="text-xs break-all flex items-center gap-1 opacity-70">
          <Link2 size={12} className="flex-shrink-0" /> {host}
        </div>
        {msg.text && (
          <div className="mt-1 text-xs break-words opacity-80">{String(msg.text)}</div>
        )}
      </a>
    </div>
  );
}
