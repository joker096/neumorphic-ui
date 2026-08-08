(function () {
  const ALL_SOUNDS = [
    'zvuk-icq-birthday-reminder.mp3',
    'zvuk-icq-call-busy.mp3',
    'zvuk-icq-call-hang-up.mp3',
    'zvuk-icq-call-ringing.mp3',
    'zvuk-icq-call-waiting.mp3',
    'zvuk-icq-contact-signs-in.wav',
    'zvuk-icq-error-oshibka.wav',
    'zvuk-icq-file-transfer-done.mp3',
    'zvuk-icq-flip-window-flipped.mp3',
    'zvuk-icq-i-sign-out.mp3',
    'zvuk-icq-incoming-call.mp3',
    'zvuk-icq-incoming-chat.mp3',
    'zvuk-icq-incoming-file.mp3',
    'zvuk-icq-incoming-sms.mp3',
    'zvuk-icq-novoe-soobshchenie.mp3',
    'zvuk-icq-outgoing-im_.mp3',
    'zvuk-icq-typing-im.wav',
    'zvuk-icq-you-added-someone-to-your-list.mp3',
  ];

  const CRITICAL_SOUNDS = [
    'zvuk-icq-incoming-chat.mp3',
    'zvuk-icq-incoming-sms.mp3',
    'zvuk-icq-typing-im.wav',
  ];

  const CONCURRENCY = 10;

  function fetchSound(src) {
    return new Promise((resolve) => {
      const audio = new Audio();
      let settled = false;
      audio.oncanplay = () => {
        if (settled) return;
        settled = true;
        resolve(true);
      };
      audio.onerror = () => {
        if (settled) return;
        settled = true;
        resolve(false);
      };
      audio.src = src;
    });
  }

  function runPool(tasks, concurrency) {
    let index = 0;
    let running = 0;

    function next() {
      while (index < tasks.length && running < concurrency) {
        const task = tasks[index++];
        running++;
        task().finally(() => { running--; next(); });
      }
    }

    next();
    return new Promise((resolve) => {
      const check = () => {
        if (index >= tasks.length && running === 0) resolve();
        else setTimeout(check, 50);
      };
      check();
    });
  }

  function preloadSounds(soundList) {
    const loaded = { value: 0 };
    const failed = { value: 0 };
    const tasks = soundList.map((name) => () =>
      fetchSound('/ICQ/sound/' + name).then((ok) => {
        if (ok) loaded.value++;
        else failed.value++;
      })
    );
    return runPool(tasks, CONCURRENCY).then(() => {
      return { loaded: loaded.value, failed: failed.value };
    });
  }

  function preloadAll() {
    return preloadSounds(ALL_SOUNDS).then((results) => {
      console.log('[ICQ Sounds] Preload: ' + results.loaded + ' loaded, ' + results.failed + ' failed');
    });
  }

  function preloadCritical() {
    return preloadSounds(CRITICAL_SOUNDS).then((results) => {
      console.log('[ICQ Sounds] Critical preload: ' + results.loaded + ' loaded, ' + results.failed + ' failed');
    });
  }

  if (typeof window !== 'undefined') {
    window.__ICQSounds = { preloadAll, preloadCritical };
  }
})();
