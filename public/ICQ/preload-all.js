(function () {
  const EMOJI_IDS = [
    'acute','aggressive','air_kiss','angel','bad','bb','beach','beee','big_boss',
    'biggrin','blum2','blush','boast','bomb','boredom','bye','clapping','cray',
    'crazy','curtsey','dance4','dash1','dirol','drinks','feminist','flirt','focus',
    'fool','friends','gamer4','girl_cray2','girl_crazy','girl_drink4','girl_haha',
    'girl_hospital','girl_impossible','girl_in_love','girl_sigh','give_heart2',
    'give_rose','good','heart','help','hi','hunter','hysteric','i-m_so_happy',
    'ireful1','king','kiss2','kiss3','lazy','lol','mail1','mamba','mega_shock',
    'mocking','moil','music','nea','new_russian','ok','paint2','pardon','party2',
    'pleasantry','popcorn1','prankster2','preved','punish','rofl','sad','sarcastic',
    'scare','scratch_one-s_head','search','secret','shock','shout','slow','smile',
    'smoke','sorry2','spiteful','spruce_up','stop','tease','tender','thank_you2',
    'this','training1','unknown','vampire','vava','victory','wacko2','wink',
    'wizard','yahoo','yes3','yess',
  ];

  const CONCURRENCY = 10;
  const RESULTS = { loaded: 0, failed: 0 };

  function fetchEmoji(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { RESULTS.loaded++; resolve(); };
      img.onerror = () => { RESULTS.failed++; resolve(); };
      img.src = src;
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

  function preloadEmojis(skin) {
    const tasks = EMOJI_IDS.map((id) => () =>
      fetchEmoji('/ICQ/' + skin + '/' + id + '.gif')
    );
    return runPool(tasks, CONCURRENCY);
  }

  function preloadAll() {
    return Promise.all([
      preloadEmojis('hd_light_skin'),
      preloadEmojis('hd_dark_skin'),
    ]).then(() => {
      console.log('[ICQ] All themes preload: ' + RESULTS.loaded + ' loaded, ' + RESULTS.failed + ' failed');
    });
  }

  function preloadActiveTheme() {
    const isDark = document.documentElement.classList.contains('dark') ||
      (localStorage.getItem('theme') === 'dark');
    const skin = isDark ? 'hd_dark_skin' : 'hd_light_skin';
    return preloadEmojis(skin).then(() => {
      console.log('[ICQ] Active theme preload: ' + RESULTS.loaded + ' loaded, ' + RESULTS.failed + ' failed');
    });
  }

  if (typeof window !== 'undefined') {
    window.__ICQEmojis = { preloadAll, preloadActiveTheme };
  }
})();
