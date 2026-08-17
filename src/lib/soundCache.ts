const cache = new Map<string, HTMLAudioElement>();
let activePromise: Promise<void> | null = null;
const CONCURRENCY = 8;
const RESULTS = { loaded: 0, failed: 0 };

function preloadPool(entries: Array<{ event: string; url: string }>): Promise<void> {
  let index = 0;
  let running = 0;

  function next() {
    while (index < entries.length && running < CONCURRENCY) {
      const entry = entries[index++];
      running++;
      const audio = new Audio();
      audio.preload = 'auto';
      let settled = false;
      audio.oncanplaythrough = () => {
        if (settled) return;
        settled = true;
        RESULTS.loaded++;
        cache.set(entry.event, audio);
        running--;
        next();
      };
      audio.onerror = () => {
        if (settled) return;
        settled = true;
        RESULTS.failed++;
        running--;
        next();
      };
      audio.src = entry.url;
    }
  }

  next();
  return new Promise((resolve) => {
    const check = () => {
      if (index >= entries.length && running === 0) resolve();
      else setTimeout(check, 50);
    };
    check();
  });
}

export function preloadICQSounds(): Promise<void> {
  if (activePromise) return activePromise;
  const entries = [
    { event: 'incoming-call', url: '/ICQ/sound/zvuk-icq-incoming-call.mp3' },
    { event: 'call-ringing', url: '/ICQ/sound/zvuk-icq-call-ringing.mp3' },
    { event: 'call-busy', url: '/ICQ/sound/zvuk-icq-call-busy.mp3' },
    { event: 'call-hang-up', url: '/ICQ/sound/zvuk-icq-call-hang-up.mp3' },
    { event: 'call-waiting', url: '/ICQ/sound/zvuk-icq-call-waiting.mp3' },
    { event: 'incoming-chat', url: '/ICQ/sound/zvuk-icq-novoe-soobshchenie.mp3' },
    { event: 'incoming-sms', url: '/ICQ/sound/zvuk-icq-incoming-sms.mp3' },
    { event: 'incoming-file', url: '/ICQ/sound/zvuk-icq-incoming-file.mp3' },
    { event: 'incoming-contact', url: '/ICQ/sound/zvuk-icq-you-added-someone-to-your-list.mp3' },
    { event: 'outgoing-message', url: '/ICQ/sound/zvuk-icq-outgoing-im_.mp3' },
    { event: 'typing-indicator', url: '/ICQ/sound/zvuk-icq-typing-im.wav' },
    { event: 'error', url: '/ICQ/sound/zvuk-icq-error-oshibka.wav' },
    { event: 'contact-signs-in', url: '/ICQ/sound/zvuk-icq-contact-signs-in.wav' },
    { event: 'sign-out', url: '/ICQ/sound/zvuk-icq-i-sign-out.mp3' },
    { event: 'file-transfer-done', url: '/ICQ/sound/zvuk-icq-file-transfer-done.mp3' },
    { event: 'birthday-reminder', url: '/ICQ/sound/zvuk-icq-birthday-reminder.mp3' },
    { event: 'flip-window', url: '/ICQ/sound/zvuk-icq-flip-window-flipped.mp3' },
  ];
  activePromise = preloadPool(entries).then(() => {}).catch(() => {
    activePromise = null;
  });
  return activePromise;
}

export function getCachedSound(event: string): HTMLAudioElement | undefined {
  return cache.get(event);
}

export function isSoundCached(event: string): boolean {
  return cache.has(event);
}
