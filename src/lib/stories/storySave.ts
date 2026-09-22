/** Real "Save story" for photo/video stories — downloads the media to the device. */

export function storyFileName(userName: string, storyId: number): string {
  const safe = (userName || 'story').replace(/[^\w\d-_]+/g, '-').toLowerCase();
  return `story-${safe}-${storyId}`;
}

function extensionFor(mime: string): string {
  if (mime.startsWith('video/')) return 'mp4';
  if (mime === 'image/png') return 'png';
  if (mime.startsWith('image/')) return 'jpg';
  return 'bin';
}

/**
 * Download story media (`image` or `video` url) to the device via fetch→blob.
 * Resolves true on success, false when the url is not fetchable (cross-origin blob).
 */
export async function saveStoryMedia(url: string | undefined, baseName: string): Promise<boolean> {
  if (!url) return false;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const mime = blob.type || 'application/octet-stream';
    const objUrl = URL.createObjectURL(new Blob([blob], { type: mime }));
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = `${baseName}.${extensionFor(mime)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(objUrl), 0);
    return true;
  } catch {
    return false;
  }
}