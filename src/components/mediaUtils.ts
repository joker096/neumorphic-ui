import React from 'react';
import { Film, FileText, Music, Image as ImageIcon } from 'lucide-react';
import { toast } from './ui/Toast';

type TranslateFn = (key: string, fallback?: string | Record<string, string | number>) => string;

export type MediaKind = 'photo' | 'video' | 'document' | 'audio';

export interface MediaItem {
  type: MediaKind;
  url?: string;
  name?: string;
  caption?: string;
  size?: string;
}

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-matroska': 'mkv',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/webm': 'weba',
  'audio/aac': 'aac',
  'audio/opus': 'opus',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/json': 'json',
};

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  avif: 'image/avif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  weba: 'audio/webm',
  aac: 'audio/aac',
  pdf: 'application/pdf',
  zip: 'application/zip',
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
};

export const extForMime = (mime: string): string => {
  const base = String(mime || '').split(';')[0].trim().toLowerCase();
  return MIME_EXT[base] || '';
};

export const mimeFromName = (name?: string): string => {
  const dot = String(name || '').lastIndexOf('.');
  if (dot <= 0) return '';
  return EXT_MIME[String(name).slice(dot + 1).toLowerCase()] || '';
};

/** Filename that always carries a recogniseable extension (fixes "save as .txt"). */
export const buildFileName = (name: string | undefined, mime: string | undefined): string => {
  const base = String(name || '').trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_') || 'media';
  if (/\.[a-z0-9]{1,6}$/i.test(base)) return base;
  const ext = extForMime(mime || '') || mimeFromName(name) || (mime ? extForMime(mime) : '');
  return `${base}${ext ? `.${ext}` : ''}`;
};

export const meta = (m: MediaItem): { icon: React.ReactNode } => {
  switch (m.type) {
    case 'video': return { icon: React.createElement(Film, { size: 18 }) };
    case 'document': return { icon: React.createElement(FileText, { size: 18 }) };
    case 'audio': return { icon: React.createElement(Music, { size: 18 }) };
    default: return { icon: React.createElement(ImageIcon, { size: 18 }) };
  }
};

export const formatTime = (s: number): string => {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
};

export const downloadMedia = async (item: MediaItem, t: TranslateFn, message?: any) => {
  const url = item.url;
  if (!url) {
    toast(t("media.downloadFailed", "Download failed"), "error");
    return;
  }
  const preferredName = buildFileName(item.name || message?.fileName, message?.mime || mimeFromName(item.name));
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    const mime = blob.type || message?.mime || mimeFromName(preferredName) || "application/octet-stream";
    const objUrl = URL.createObjectURL(new Blob([blob], { type: mime }));
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = buildFileName(preferredName, mime);
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(objUrl), 0);
  } catch {
    // Cross-origin / non-fetchable URL (e.g. external photo): plain anchor fallback.
    const a = document.createElement("a");
    a.href = url;
    a.download = preferredName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
};

export const shareMedia = async (item: MediaItem, t: TranslateFn, message?: any) => {
  const url = item.url;
  if (!url) {
    toast(t("media.downloadFailed", "Download failed"), "error");
    return;
  }
  const name = buildFileName(item.name || message?.fileName, message?.mime || mimeFromName(item.name));
  if (typeof navigator.share !== "function") {
    // No Web Share API (unsupported/desktop in dev): export instead of pretending.
    if (/^https?:/i.test(url)) {
      try {
        await navigator.clipboard.writeText(url);
        toast(t("media.shareCopied", "Link copied"), "success");
      } catch {
        await downloadMedia(item, t, message);
      }
    } else {
      await downloadMedia(item, t, message);
    }
    return;
  }
  try {
    let files: File[] | undefined;
    if (typeof navigator.canShare === "function") {
      try {
        const blob = await (await fetch(url)).blob();
        const mime = blob.type || message?.mime || mimeFromName(name) || "application/octet-stream";
        const file = new File([blob], name || "media", { type: mime });
        if (navigator.canShare({ files: [file] })) files = [file];
      } catch {
        /* fetch failed — fall back to text share below */
      }
    }
    if (files && files.length > 0) {
      await navigator.share({ files, title: name || t("media.photo") });
    } else {
      await navigator.share({
        title: name || item.caption || t("media.photo"),
        text: item.caption || "",
        url: /^https?:/i.test(url) ? url : undefined,
      });
    }
    toast(t("media.shared", "Shared"), "success");
  } catch (e) {
    if ((e as any)?.name === "AbortError" || (e as any)?.name === "NotAllowedError") return;
    toast(t("media.shareFailed", "Share failed"), "error");
  }
};