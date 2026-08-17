const cache = new Map<string, HTMLImageElement>();
let activePromise: Promise<void> | null = null;
const CONCURRENCY = 8;
const RESULTS = { loaded: 0, failed: 0 };

function getSkin(theme: 'light' | 'dark'): string {
  return theme === 'dark' ? 'hd_dark_skin' : 'hd_light_skin';
}

function preloadPool(ids: string[], skin: string): Promise<void> {
  let index = 0;
  let running = 0;

  function next() {
    while (index < ids.length && running < CONCURRENCY) {
      const id = ids[index++];
      running++;
      const img = new Image();
      img.onload = () => { RESULTS.loaded++; cache.set(id, img); running--; next(); };
      img.onerror = () => { RESULTS.failed++; running--; next(); };
      img.src = `/ICQ/${skin}/${id}.gif`;
    }
  }

  next();
  return new Promise((resolve) => {
    const check = () => {
      if (index >= ids.length && running === 0) resolve();
      else setTimeout(check, 50);
    };
    check();
  });
}

export function preloadICQTheme(theme: 'light' | 'dark'): Promise<void> {
  if (activePromise) return activePromise;
  const skin = getSkin(theme);
  const ids = [
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
  activePromise = preloadPool(ids, skin).then(() => {}).catch(() => {
    activePromise = null;
  });
  return activePromise;
}

export function getCachedEmoji(id: string): HTMLImageElement | undefined {
  return cache.get(id);
}

export function isEmojiCached(id: string): boolean {
  return cache.has(id);
}
