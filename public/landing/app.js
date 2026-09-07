// ════════════════════════════════════════════════════
// TRANSLATIONS (external - fetched from /lang/*.json)
// ════════════════════════════════════════════════════
const T = {}; // will be populated by fetch

const LANGS = {
  ru:{ label:'🇷🇺 RU', htmlLang:'ru' },
  en:{ label:'🇬🇧 EN', htmlLang:'en' },
  de:{ label:'🇩🇪 DE', htmlLang:'de' },
  fr:{ label:'🇫🇷 FR', htmlLang:'fr' },
  es:{ label:'🇪🇸 ES', htmlLang:'es' },
  zh:{ label:'🇨🇳 ZH', htmlLang:'zh' },
  ja:{ label:'🇯🇵 JA', htmlLang:'ja' },
  ko:{ label:'🇰🇷 KO', htmlLang:'ko' }
};
const SUPPORTED = ['ru','en','de','fr','es','zh','ja','ko'];

// Load translations for a language
async function loadLang(lang) {
  if (T[lang]) return T[lang];
  try {
    const resp = await fetch('lang/' + lang + '.json');
    const data = await resp.json();
    T[lang] = data;
  } catch(e) {
    console.warn('Failed to load translations:', lang);
  }
  return T[lang];
}

// Auto-detect language
function detectLang() {
  const saved = localStorage.getItem('ma_lang');
  if (saved && SUPPORTED.includes(saved)) return saved;
  const prefs = Array.from(navigator.languages || [navigator.language || 'en']);
  for (const l of prefs) {
    const code = l.slice(0,2).toLowerCase();
    if (SUPPORTED.includes(code)) return code;
  }
  return (navigator.language || '').startsWith('ru') ? 'ru' : 'en';
}

// Apply translation to all elements
function applyLang(lang) {
  if (!LANGS[lang]) return;
  curLang = lang;
  localStorage.setItem('ma_lang', lang);
  document.documentElement.lang = LANGS[lang].htmlLang;
  document.getElementById('langCurrent').textContent = LANGS[lang].label;

  // Update active state
  document.querySelectorAll('.lang-opt').forEach(el => {
    el.classList.toggle('active', el.dataset.lang === lang);
  });

  loadLang(lang).then(dict => {
    if (!dict) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (!dict[key]) return;
      const val = dict[key];
      if (val.includes('<') || val.includes('\n')) {
        el.innerHTML = val.replace(/\n/g, '<br>');
      } else {
        el.textContent = val;
      }
    });

    // Also update ticker
    buildTicker(lang);

    // Fade animation
    document.body.classList.remove('lang-fade');
    void document.body.offsetWidth;
    document.body.classList.add('lang-fade');
  });
}

// Clear any stale lang
(function(){
  const saved = localStorage.getItem('ma_lang');
  if (saved && !SUPPORTED.includes(saved)) localStorage.removeItem('ma_lang');
})();

let curLang = detectLang();

// Initialize: fetch current language then apply
loadLang(curLang).then(() => applyLang(curLang));

// ════════════════════════════════════════════════════
// LANGUAGE SWITCHER LOGIC
// ════════════════════════════════════════════════════

// Toggle dropdown
const switcher = document.getElementById('langSwitcher');
const langBtn  = document.getElementById('langBtn');
langBtn.addEventListener('click', e => { e.stopPropagation(); switcher.classList.toggle('open'); });
document.addEventListener('click', () => switcher.classList.remove('open'));
document.querySelectorAll('.lang-opt').forEach(el => {
  el.addEventListener('click', e => {
    e.stopPropagation();
    applyLang(el.dataset.lang);
    switcher.classList.remove('open');
  });
});

// ════════════════════════════════════════════════════
// NAV SCROLL
// ════════════════════════════════════════════════════
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('s', scrollY > 60), {passive:true});

// ════════════════════════════════════════════════════
// TICKER (fetched from /data/ticker.json)
// ════════════════════════════════════════════════════
let _tickCache = {};
function tickerHTML(items) {
  return [...items, ...items].map(t => '<div class="ti">'+t+'</div>').join('');
}
function buildTicker(lang) {
  const render = () => {
    document.getElementById('tk').innerHTML = tickerHTML(_tickCache[lang]);
  };
  if (_tickCache[lang]) {
    render();
    return;
  }
  fetch('data/ticker.json')
    .then(r => r.json())
    .then(data => {
      _tickCache[lang] = data[lang] || data.ru || [];
      render();
    })
    .catch(() => {});
}

// ════════════════════════════════════════════════════
// COUNTER: animate numbers
// ════════════════════════════════════════════════════
const ease = t => 1 - Math.pow(1 - t, 3);
document.querySelectorAll('[data-count]').forEach(el => {
  if (el.dataset.display) return;
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const target = +el.dataset.count, suf = el.dataset.suffix || '';
      if (target === 0) { el.textContent = '0' + suf; return; }
      const dur = 1400, t0 = performance.now();
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(ease(p) * target) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, {threshold:.5}).observe(el);
});

// ════════════════════════════════════════════════════
// STAGGER REVEAL (merged)
// ════════════════════════════════════════════════════
document.querySelectorAll('.r').forEach(el => {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('v'); });
  }, {threshold:0.08});
  observer.observe(el);
});

// ════════════════════════════════════════════════════
// SMOOTH ANCHOR SCROLL
// ════════════════════════════════════════════════════
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) { e.preventDefault(); el.scrollIntoView({behavior:'smooth', block:'start'}); }
  });
});

// ════════════════════════════════════════════════════
// 3D PARALLAX (cards tilt on hover)
// ════════════════════════════════════════════════════
(function(){
  const MAX = 12, SCALE_H = 1.02, SCALE_M = 1.02, SCALE_N = 0.97;
  const cards = document.querySelectorAll('[data-tilt]');
  let raf = null;
  let pending = new Map();
  function commit() { raf = null; pending.forEach((fn, card) => fn(card)); pending.clear(); }
  function schedule(card, fn) { pending.set(card, fn); if (!raf) raf = requestAnimationFrame(commit); }
  function applyTilt(card, x, y) {
    schedule(card, () => {
      const rect = card.getBoundingClientRect();
      if (!rect.width) return;
      const dx = (x - rect.left - rect.width / 2) / (rect.width / 2);
      const dy = (y - rect.top - rect.height / 2) / (rect.height / 2);
      const rotY = dx * MAX, rotX = -dy * MAX, sc = SCALE_H;
      const gx = Math.round((x - rect.left) / rect.width * 100);
      const gy = Math.round((y - rect.top) / rect.height * 100);
      card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${sc})`;
      card.style.boxShadow = `${-rotY*2.5}px ${rotX*2.5}px 50px rgba(0,0,0,0.8),0 0 0 1px rgba(255,255,255,0.07),inset 0 1px 0 rgba(255,255,255,0.1),0 0 40px rgba(201,169,110,${Math.abs(rotY)*0.008 + Math.abs(rotX)*0.005})`;
      const g = card.querySelector('.card-glare');
      if(g){ g.style.background = `radial-gradient(ellipse at ${gx}% ${gy}%, rgba(255,255,255,0.15), transparent 60%)`; g.style.opacity = '1'; }
    });
  }
  function resetTilt(card) {
    schedule(card, () => {
      const isMid = card.classList.contains('mid');
      const sc = isMid ? SCALE_M : SCALE_N;
      card.style.transform = `perspective(900px) rotateX(2deg) rotateY(0deg) scale(${sc})`;
      card.style.boxShadow = '';
      const g = card.querySelector('.card-glare');
      if(g){ g.style.opacity='0'; g.style.background=''; }
    });
  }
  cards.forEach(card => {
    card.addEventListener('mousemove', e => applyTilt(card, e.clientX, e.clientY), {passive:true});
    card.addEventListener('mouseleave', () => resetTilt(card));
    card.addEventListener('touchmove', e => { const t = e.touches[0]; applyTilt(card, t.clientX, t.clientY); }, {passive:true});
    card.addEventListener('touchend', () => resetTilt(card));
  });
  const scene = document.getElementById('cardsScene');
  if(scene){
    let ambientRaf = null, ax = 0, ay = 0;
    scene.addEventListener('mousemove', e => {
      const r = scene.getBoundingClientRect();
      ax = (e.clientX - r.left) / r.width - 0.5;
      ay = (e.clientY - r.top) / r.height - 0.5;
      if(!ambientRaf) ambientRaf = requestAnimationFrame(() => {
        ambientRaf = null;
        cards.forEach(card => {
          if(card.matches(':hover')) return;
          card.style.transform = `perspective(900px) rotateX(${(-ay*3)+2}deg) rotateY(${ax*3}deg) scale(${card.classList.contains('mid') ? SCALE_M : SCALE_N})`;
        });
      });
    },{passive:true});
    scene.addEventListener('mouseleave', () => {
      if(ambientRaf){ cancelAnimationFrame(ambientRaf); ambientRaf=null; }
      cards.forEach(c => resetTilt(c));
    });
  }
})();

// ════════════════════════════════════════════════════
// FAQ TOGGLE
// ════════════════════════════════════════════════════
document.querySelectorAll('.faq dt').forEach(dt => {
  dt.setAttribute('tabindex', '0');
  dt.setAttribute('role', 'button');
  dt.setAttribute('aria-expanded', 'false');
  const dd = dt.nextElementSibling;
  const toggle = () => {
    const open = dt.classList.toggle('open');
    if (dd && dd.tagName === 'DD') dd.classList.toggle('open', open);
    dt.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  dt.addEventListener('click', toggle);
  dt.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});

// ════════════════════════════════════════════════════
// MESH RADAR CANVAS
// ════════════════════════════════════════════════════
(function(){
  const canvas = document.getElementById('meshCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 240, H = 240, CX = W/2, CY = H/2, R = 110;
  const GREEN = '#2bca74';
  const nodes = [
    { a: -0.8,  d: 0.35, c: GREEN,    pulse: true,  label: '0.4km' },
    { a:  0.6,  d: 0.62, c: '#5b9bd5', pulse: false, label: '1.2km' },
    { a:  1.8,  d: 0.82, c: '#c9a96e', pulse: false, label: '3.8km' },
  ];
  let sweep = 0, t = 0;

  function draw() {
    ctx.clearRect(0,0,W,H);
    t += 0.016; sweep += 0.018;
    if(sweep > Math.PI*2) sweep -= Math.PI*2;
    ctx.fillStyle = '#090b0a';
    ctx.beginPath(); ctx.arc(CX,CY,R+4,0,Math.PI*2); ctx.fill();
    [0.25,0.5,0.75,1].forEach(f => {
      ctx.beginPath(); ctx.arc(CX,CY,R*f,0,Math.PI*2);
      ctx.strokeStyle = `rgba(43,202,116,${f===1?0.25:0.1})`;
      ctx.lineWidth = f===1 ? 1.5 : 0.7; ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(43,202,116,0.12)'; ctx.lineWidth = 0.7;
    [-Math.PI/2, 0, Math.PI/2, Math.PI].forEach(a => {
      ctx.beginPath(); ctx.moveTo(CX, CY);
      ctx.lineTo(CX + Math.cos(a)*R, CY + Math.sin(a)*R); ctx.stroke();
    });
    ctx.save(); ctx.translate(CX, CY);
    for(let i=0; i<30; i++){
      const angle = sweep - i * 0.05;
      const alpha = (1 - i/30) * 0.25;
      ctx.beginPath(); ctx.moveTo(0,0);
      ctx.arc(0,0,R,angle,angle+0.05); ctx.lineTo(0,0);
      ctx.fillStyle = `rgba(43,202,116,${alpha})`; ctx.fill();
    }
    ctx.beginPath(); ctx.moveTo(0,0);
    ctx.lineTo(Math.cos(sweep)*R, Math.sin(sweep)*R);
    ctx.strokeStyle = 'rgba(43,202,116,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.arc(CX,CY,4,0,Math.PI*2); ctx.fillStyle = GREEN; ctx.fill();
    ctx.beginPath(); ctx.arc(CX,CY,8+(Math.sin(t*2)*2),0,Math.PI*2);
    ctx.strokeStyle='rgba(43,202,116,0.3)'; ctx.lineWidth=1; ctx.stroke();
    nodes.forEach(node => {
      const x = CX + Math.cos(node.a) * node.d * R;
      const y = CY + Math.sin(node.a) * node.d * R;
      ctx.beginPath(); ctx.moveTo(CX,CY); ctx.lineTo(x,y);
      ctx.strokeStyle='rgba(43,202,116,0.06)'; ctx.lineWidth=0.5; ctx.stroke();
      if(node.pulse){
        const pr = 10 + Math.abs(Math.sin(t*2))*8;
        ctx.beginPath(); ctx.arc(x,y,pr,0,Math.PI*2);
        ctx.strokeStyle=`rgba(43,202,116,${0.4*(1-pr/18)})`; ctx.lineWidth=1; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(x,y,4.5,0,Math.PI*2); ctx.fillStyle=node.c; ctx.fill();
      ctx.fillStyle='rgba(43,202,116,0.6)';
      ctx.font='9px DM Mono,monospace'; ctx.textAlign='center';
      ctx.fillText(node.label, x, y-11);
    });
    requestAnimationFrame(draw);
  }
  const io = new IntersectionObserver(entries => {
    if(entries[0].isIntersecting){ draw(); io.disconnect(); }
  }, {threshold:0.3});
  io.observe(canvas);
})();


// ════════════════════════════════════════════════════
// DOWNLOADS — rendered from dist/releases/releases.json
// (so every OS variant is always the LATEST built version)
// ════════════════════════════════════════════════════
(async function () {
  const grid = document.getElementById('dlGrid');
  const ver  = document.getElementById('dlVersion');
  if (!grid) return;
  let manifest;
  try {
    const r = await fetch('../releases/releases.json', { cache: 'no-store' });
    manifest = await r.json();
  } catch (e) {
    grid.innerHTML = '<div class="card"><h3>Downloads</h3><p>Release manifest unavailable.</p></div>';
    return;
  }
  if (ver) ver.textContent = 'Version ' + manifest.version + ' · SHA-256 verified · ' + manifest.files.filter(f => f.present).length + ' builds';
  const LABELS = {
    windows: 'Desktop · Windows', linux: 'Desktop · Linux', macos: 'Desktop · macOS',
    android: 'Mobile · Android', ios: 'Mobile · iOS', web: 'Web · PWA'
  };
  const ORDER = ['windows', 'linux', 'macos', 'android', 'ios', 'web'];
  const files = manifest.files.slice().sort((a, b) => ORDER.indexOf(a.platform) - ORDER.indexOf(b.platform));
  grid.innerHTML = '';
  for (const f of files) {
    const card = document.createElement('div');
    card.className = 'card' + (f.platform === 'windows' ? ' mid' : '');
    let body = '<h3>' + (LABELS[f.platform] || f.platform) + '</h3>';
    if (f.present) {
      const size = (f.size / 1048576).toFixed(2);
      body += '<p>' + f.kind.toUpperCase() + ' · ' + size + ' MB</p>';
      body += '<a class="btn" href="' + f.url + '" download="' + f.file + '">Download ' + f.kind.toUpperCase() + '</a>';
      body += '<p style="margin-top:8px;font-size:10px;opacity:.5;word-break:break-all">SHA-256: ' + f.sha256.slice(0, 16) + '…</p>';
    } else {
      const link = f.url
        ? '<a class="btn" href="' + f.url + '" target="_blank" rel="noopener">Get ' + f.kind.toUpperCase() + '</a>'
        : '<span class="btn" style="opacity:.5">Pending</span>';
      body += '<p>' + (f.note || 'Coming soon.') + '</p>' + link;
    }
    card.innerHTML = body;
    grid.appendChild(card);
  }
})();
