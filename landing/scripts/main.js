// ════════════════════════════════════════════════════
// LANDING PAGE — main.js
// ════════════════════════════════════════════════════

const T = {};
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

// ── Safe HTML helper ──
function safeInsertHtml(el, html) {
  if (!html) { el.textContent = ''; return; }
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('script, iframe, object, embed, form, input, button, style').forEach(n => n.remove());
  div.querySelectorAll('*').forEach(node => {
    [...node.attributes].forEach(attr => {
      if (attr.name.startsWith('on') || attr.name === 'href' && attr.value.startsWith('javascript:')) {
        node.removeAttribute(attr.name);
      }
    });
  });
  el.innerHTML = div.innerHTML;
}

// ── Fetch with timeout ──
async function fetchWithTimeout(url, ms = 8000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const resp = await fetch(url, { signal: ctrl.signal });
    clearTimeout(id);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

// ── Translations ──
async function loadLang(lang) {
  if (T[lang]) return T[lang];
  try {
    const data = await fetchWithTimeout('/lang/' + lang + '.json');
    T[lang] = data;
  } catch(e) {
    console.warn('Failed to load translations:', lang, e);
  }
  return T[lang];
}

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

function applyLang(lang) {
  if (!LANGS[lang]) return;
  curLang = lang;
  localStorage.setItem('ma_lang', lang);
  document.documentElement.lang = LANGS[lang].htmlLang;
  const langCurrent = document.getElementById('langCurrent');
  if (langCurrent) langCurrent.textContent = LANGS[lang].label;

  document.querySelectorAll('.lang-opt').forEach(el => {
    el.classList.toggle('active', el.dataset.lang === lang);
  });

  loadLang(lang).then(dict => {
    if (!dict) return;
    document.querySelectorAll('[data-i18n], [data-i18n-key]').forEach(el => {
      if (el.querySelector('[data-i18n], [data-i18n-key]')) return;
      const key = el.dataset.i18n || el.dataset.i18nKey;
      if (!dict[key]) return;
      const val = dict[key];
      if (val.includes('<') || val.includes('\n')) {
        safeInsertHtml(el, val.replace(/\n/g, '<br>'));
      } else {
        el.textContent = val;
      }
    });

    buildTicker(lang);
    buildMarquee(lang);

    document.body.classList.remove('lang-fade');
    void document.body.offsetWidth;
    document.body.classList.add('lang-fade');
  });
}

// ── Theme ──
(function(){
  const root = document.documentElement;
  const icon = document.getElementById('themeIcon');
  const btn = document.getElementById('themeToggle');
  const tc = document.getElementById('themeColor');
  const saved = localStorage.getItem('ma_theme');
  if(saved) {
    root.setAttribute('data-theme', saved);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    root.setAttribute('data-theme', 'light');
  }
  btn.addEventListener('click', () => {
    const cur = root.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('ma_theme', next);
    if(icon) icon.textContent = next === 'dark' ? '☀️' : '🌙';
    if(tc) tc.setAttribute('content', next === 'dark' ? '#070707' : '#f2f2ec');
  });
  if(root.getAttribute('data-theme') === 'light' && icon) icon.textContent = '🌙';
})();

// ── Init ──
(function(){
  const saved = localStorage.getItem('ma_lang');
  if (saved && !SUPPORTED.includes(saved)) localStorage.removeItem('ma_lang');
})();

let curLang = detectLang();
loadLang(curLang).then(() => applyLang(curLang));

// ── Lang switcher ──
const switcher = document.getElementById('langSwitcher');
const langBtn  = document.getElementById('langBtn');
if (langBtn && switcher) {
  langBtn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = switcher.classList.toggle('open');
    langBtn.setAttribute('aria-expanded', String(isOpen));
  });
  document.addEventListener('click', () => {
    switcher.classList.remove('open');
    langBtn.setAttribute('aria-expanded', 'false');
  });
  document.querySelectorAll('.lang-opt').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      applyLang(el.dataset.lang);
      switcher.classList.remove('open');
      langBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

// ── Nav scroll ──
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => nav.classList.toggle('s', scrollY > 60), {passive:true});
}

// ── Ticker ──
let _tickCache = {};
function buildTicker(lang) {
  const tk = document.getElementById('tk');
  if (!tk) return;
  if (!_tickCache[lang]) {
    fetchWithTimeout('/data/ticker.json')
      .then(data => {
        _tickCache[lang] = data[lang] || data.ru;
        const skeleton = tk.querySelector('.ticker-skeleton');
        if (skeleton) skeleton.style.display = 'none';
        renderTickerItems(tk, _tickCache[lang]);
      })
      .catch(() => {
        const skeleton = tk.querySelector('.ticker-skeleton');
        if (skeleton) skeleton.style.display = 'none';
        renderTickerItems(tk, ['Mess&Anger']);
      });
  } else {
    const skeleton = tk.querySelector('.ticker-skeleton');
    if (skeleton) skeleton.style.display = 'none';
    renderTickerItems(tk, _tickCache[lang]);
  }
}

function renderTickerItems(container, items) {
  if (!container) return;
  container.innerHTML = '';
  const frag = document.createDocumentFragment();
  const text = items.length > 0 ? items : ['Mess&Anger'];
  for (let i = 0; i < 3; i++) {
    text.forEach(t => {
      const div = document.createElement('div');
      div.className = 'ti';
      div.textContent = t;
      frag.appendChild(div);
    });
  }
  container.appendChild(frag);
}

// ── Marquee ──
let _mq1Cache = {};
let _mq2Cache = {};
function buildMarquee(lang) {
  const mq1 = document.getElementById('mq1');
  const mq2 = document.getElementById('mq2');
  if (!mq1 && !mq2) return;
  if (!_mq1Cache[lang]) {
    fetchWithTimeout('/data/marquee.json')
      .then(data => {
        _mq1Cache[lang] = data[lang] || data.ru;
        _mq2Cache[lang] = (data[lang] || data.ru)[1] || [];
        renderMarqueeItems(mq1, _mq1Cache[lang], 'mq-i');
        renderMarqueeItems(mq2, _mq2Cache[lang], 'mq-i');
      })
      .catch(() => {
        renderMarqueeItems(mq1, ['Mess&Anger'], 'mq-i');
        renderMarqueeItems(mq2, ['P2P · Mesh · E2EE'], 'mq-i');
      });
  } else {
    renderMarqueeItems(mq1, _mq1Cache[lang], 'mq-i');
    renderMarqueeItems(mq2, _mq2Cache[lang], 'mq-i');
  }
}

function renderMarqueeItems(container, items, className) {
  if (!container) return;
  container.innerHTML = '';
  const frag = document.createDocumentFragment();
  const text = items.length > 0 ? items : ['Mess&Anger'];
  for (let i = 0; i < 3; i++) {
    text.forEach(t => {
      const div = document.createElement('div');
      div.className = className;
      div.textContent = t;
      frag.appendChild(div);
    });
  }
  container.appendChild(frag);
}

// ── Counters ──
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

// ── Reveal ──
document.querySelectorAll('.r').forEach(el => {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('v'); });
  }, {threshold:0.08});
  observer.observe(el);
});

// ── Smooth anchor scroll ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    const id = href.slice(1);
    if (!id) { e.preventDefault(); window.scrollTo({top:0, behavior:'smooth'}); return; }
    const el = document.getElementById(id);
    if (el) { e.preventDefault(); el.scrollIntoView({behavior:'smooth', block:'start'}); }
  });
});

// ── Scroll progress ──
const progressBar = document.getElementById('scroll-progress');
if (progressBar) {
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = total > 0 ? (window.scrollY / total * 100) : 0;
    progressBar.style.width = pct + '%';
  }, {passive:true});
}

// ── 3D Parallax ──
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
      const g = card.querySelector('.gl');
      if(g){ g.style.background = `radial-gradient(ellipse at ${gx}% ${gy}%, rgba(255,255,255,0.15), transparent 60%)`; g.style.opacity = '1'; }
    });
  }
  function resetTilt(card) {
    schedule(card, () => {
      const isMid = card.classList.contains('mid');
      const sc = isMid ? SCALE_M : SCALE_N;
      card.style.transform = `perspective(900px) rotateX(2deg) rotateY(0deg) scale(${sc})`;
      card.style.boxShadow = '';
      const g = card.querySelector('.gl');
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

// ── Score bars ──
(function(){
  const fills = document.querySelectorAll('.score-bar-fill[data-width]');
  if(!fills.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        const w = parseFloat(e.target.dataset.width);
        e.target.style.transform = 'scaleX(' + w + ')';
        e.target.classList.add('active');
        io.unobserve(e.target);
      }
    });
  }, {threshold: 0.3});
  fills.forEach(f => io.observe(f));
})();

// ── Mesh Radar Canvas ──
(function(){
  const canvas = document.getElementById('meshCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 240, H = 240, CX = W/2, CY = H/2, R = 110;
  const GREEN = '#2bca74';
  const nodes = [
    { a: -0.8,  d: 0.35, c: GREEN,    pulse: true,  label: 'DHT-node-1' },
    { a:  0.6,  d: 0.62, c: '#5b9bd5', pulse: true, label: 'DHT-node-2' },
    { a:  1.8,  d: 0.82, c: '#c9a96e', pulse: false, label: 'DHT-node-3' },
    { a:  2.7,  d: 0.45, c: '#e87b3d', pulse: false, label: 'relay-1' },
    { a:  4.1,  d: 0.70, c: '#d94a4a', pulse: false, label: 'relay-2' },
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

// ── Offline banner ──
(function(){
  const banner = document.getElementById('offline-banner');
  if (!banner) return;
  const update = () => {
    banner.style.display = navigator.onLine ? 'none' : 'flex';
  };
  update();
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
})();

// ── Mobile menu ──
const mobileNav = document.getElementById('mobileNav');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
if (mobileNav && mobileMenuBtn) {
  const open = () => {
    mobileNav.classList.add('open');
    mobileNav.setAttribute('aria-hidden', 'false');
    mobileMenuBtn.setAttribute('aria-expanded', 'true');
    mobileMenuBtn.setAttribute('aria-label', 'Close menu');
  };
  const close = () => {
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    mobileMenuBtn.setAttribute('aria-label', 'Open menu');
  };
  mobileMenuBtn.addEventListener('click', () => {
    mobileNav.classList.contains('open') ? close() : open();
  });
  const mobileNavClose = document.getElementById('mobileNavClose');
  if (mobileNavClose) mobileNavClose.addEventListener('click', close);
  mobileNav.querySelector('.mobile-nav-backdrop').addEventListener('click', close);
  mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      close();
    });
  });
}

// ── Keyboard: Escape closes dropdowns/menus ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.lang-switcher.open').forEach(el => {
      el.classList.remove('open');
      const btn = el.querySelector('.lang-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
    const mobileNav = document.getElementById('mobileNav');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileNav && mobileNav.classList.contains('open')) {
      mobileNav.classList.remove('open');
      mobileNav.setAttribute('aria-hidden', 'true');
      if (mobileMenuBtn) {
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.setAttribute('aria-label', 'Open menu');
      }
    }
  }
});

// ── FAQ accordion ──
document.querySelectorAll('.faq dt').forEach(dt => {
  const dd = dt.nextElementSibling;
  if (!dd || dd.tagName !== 'DD') return;

  const toggle = () => {
    const expanded = dt.getAttribute('aria-expanded') === 'true';
    dt.setAttribute('aria-expanded', String(!expanded));
    dd.style.display = expanded ? 'none' : 'block';
  };

  dt.addEventListener('click', toggle);
  dt.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });
});

// ── Lang switcher aria ──
const langSwitcher = document.getElementById('langSwitcher');
if (langSwitcher && langBtn) {
  langSwitcher.addEventListener('click', e => {
    if (e.target === langSwitcher) {
      langSwitcher.classList.remove('open');
      langBtn.setAttribute('aria-expanded', 'false');
    }
  });
}
