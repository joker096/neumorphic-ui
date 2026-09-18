export type FileKind =
  | "pdf"
  | "image"
  | "audio"
  | "video"
  | "archive"
  | "doc"
  | "sheet"
  | "code"
  | "other";

const EXTENSION_KINDS: Record<string, FileKind> = {
  pdf: "pdf",

  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  bmp: "image",
  svg: "image",
  heic: "image",
  heif: "image",
  avif: "image",

  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  oga: "audio",
  m4a: "audio",
  aac: "audio",
  flac: "audio",
  opus: "audio",

  mp4: "video",
  mov: "video",
  webm: "video",
  mkv: "video",
  avi: "video",
  m4v: "video",

  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
  bz2: "archive",

  doc: "doc",
  docx: "doc",
  txt: "doc",
  rtf: "doc",
  md: "doc",
  odt: "doc",
  pages: "doc",

  xls: "sheet",
  xlsx: "sheet",
  csv: "sheet",
  ods: "sheet",
  numbers: "sheet",

  json: "code",
  xml: "code",
  js: "code",
  mjs: "code",
  cjs: "code",
  ts: "code",
  tsx: "code",
  jsx: "code",
  html: "code",
  htm: "code",
  css: "code",
  yml: "code",
  yaml: "code",
};

const MIME_KINDS: Array<[string, FileKind]> = [
  ["application/pdf", "pdf"],
  ["image/", "image"],
  ["audio/", "audio"],
  ["video/", "video"],
  ["application/zip", "archive"],
  ["application/x-rar", "archive"],
  ["application/x-7z", "archive"],
  ["application/x-tar", "archive"],
  ["application/gzip", "archive"],
  ["application/msword", "doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml", "doc"],
  ["application/vnd.oasis.opendocument.text", "doc"],
  ["text/", "doc"],
  ["application/vnd.ms-excel", "sheet"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml", "sheet"],
  ["application/vnd.oasis.opendocument.spreadsheet", "sheet"],
  ["application/json", "code"],
  ["application/xml", "code"],
  ["application/javascript", "code"],
];

/** Lowercase extension without the dot; empty string when the name has none. */
export function getFileExtension(fileName?: string): string {
  if (!fileName) return "";
  const dot = fileName.lastIndexOf(".");
  if (dot < 0 || dot === fileName.length - 1) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

/**
 * Classifies a file by extension first (most reliable for chat attachments),
 * falling back to the MIME prefix when the name carries no useful extension.
 */
export function getFileKind(fileName?: string, mime?: string): FileKind {
  const byExt = EXTENSION_KINDS[getFileExtension(fileName)];
  if (byExt) return byExt;

  if (mime) {
    const lower = mime.toLowerCase();
    for (const [prefix, kind] of MIME_KINDS) {
      if (lower.startsWith(prefix)) return kind;
    }
  }
  return "other";
}
