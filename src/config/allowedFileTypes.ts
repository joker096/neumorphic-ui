// Security allowlist for chat file attachments (master plan §29: File validation / MIME validation).
// Only these MIME types are accepted; everything else is rejected at attach time.
export const ALLOWED_FILE_MIME = new Set<string>([
  // images
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp', 'image/heic', 'image/heif',
  // video
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/ogg',
  // audio
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm',
  'audio/aac', 'audio/x-m4a', 'audio/flac',
  // documents
  'application/pdf', 'text/plain', 'text/csv', 'application/json',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/gzip',
])

export function isAllowedFileType(file: File): boolean {
  if (!file.type) return false
  return ALLOWED_FILE_MIME.has(file.type)
}
