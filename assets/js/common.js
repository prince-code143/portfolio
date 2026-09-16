/* =========================================================
   Prince Sukhwal Portfolio — shared runtime
   ========================================================= */
(function () {
  'use strict';
  const PS = (window.PS = window.PS || {});
  const qs = new URLSearchParams(location.search);
  PS.draft = qs.get('draft') === '1';
  PS.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  PS.fine = matchMedia('(pointer:fine)').matches;
  const objectUrls = {};

  /* ---------- tiny IndexedDB store (shared with admin) ---------- */
  PS.db = (function () {
    let p;
    function open() {
      if (p) return p;
      p = new Promise((res, rej) => {
        const r = indexedDB.open('ps-admin', 1);
        r.onupgradeneeded = () => {
          r.result.createObjectStore('kv');
          r.result.createObjectStore('files');
        };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      return p;
    }
    function tx(store, mode, fn) {
      return open().then(db => new Promise((res, rej) => {
        const t = db.transaction(store, mode), s = t.objectStore(store);
        const out = fn(s);
        t.oncomplete = () => res(out && 'result' in out ? out.result : out);
        t.onerror = () => rej(t.error);
      }));
    }
    return {
      get: (store, k) => tx(store, 'readonly', s => s.get(k)),
      set: (store, k, v) => tx(store, 'readwrite', s => s.put(v, k)),
      del: (store, k) => tx(store, 'readwrite', s => s.delete(k)),
      keys: (store) => tx(store, 'readonly', s => s.getAllKeys()),
      clear: (store) => tx(store, 'readwrite', s => s.clear())
    };
  })();

  /* ---------- content loading ---------- */
  PS.ready = function (cb) {
    if (!PS.draft) { PS.c = window.SITE_CONTENT; cb(PS.c); return; }
    document.documentElement.style.visibility = 'hidden';
    Promise.all([PS.db.get('kv', 'draft'), PS.db.keys('files')])
      .then(async ([d, keys]) => {
        for (const k of keys || []) {
          const f = await PS.db.get('files', k);
          if (f && f.blob) objectUrls[k] = URL.createObjectURL(f.blob);
        }
        PS.c = (d && d.content) || window.SITE_CONTENT;
      })
      .catch(() => { PS.c = window.SITE_CONTENT; })
      .then(() => {
        document.documentElement.style.visibility = '';
        const b = document.createElement('div');
        b.className = 'draft-badge';
        b.textContent = 'Draft preview — not published yet';
        document.body.append(b);
        cb(PS.c);
      });
  };

  /* ---------- helpers ---------- */
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  PS.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ESC[m]);
  PS.br = s => PS.esc(s).replace(/\n/g, '<br>');
  PS.src = p => (p && objectUrls[p]) || p || '';
  PS.href = u => {
    u = String(u || '').trim();
    if (!u) return '#';
    if (/^(javascript|data):/i.test(u)) return '#';
    return u;
  };
  PS.url = (page, params) => {
    const sp = new URLSearchParams(params || {});
    if (PS.draft) sp.set('draft', '1');
    const s = sp.toString();
    return page + (s ? '?' + s : '');
  };
  PS.isExternal = u => /^https?:\/\//i.test(u || '');
  PS.ext = u => PS.isExternal(u) ? ' target="_blank" rel="noopener"' : '';

  /* icon: raw svg markup, or an image path/url */
  PS.icon = (v, size) => {
    v = String(v || '').trim();
    if (!v) return '';
    if (v.startsWith('<svg')) return v;
    const s = size || 24;
    return `<img src="${PS.esc(PS.src(v))}" alt="" width="${s}" height="${s}" style="width:${s}px;height:${s}px;object-fit:contain" loading="lazy" decoding="async">`;
  };

  /* project cover: image or built-in animated illustration */
  PS.cover = (p, eager) => {
    const c = String(p.cover || '');
    if (c.startsWith('illustration:')) {
      const svg = (PS.c.illustrations || {})[c.slice(13)];
      if (svg) return svg;
    }
    if (!c) return `<div class="im-empty">${PS.esc((p.title || '?').slice(0, 1))}</div>`;
    return `<img src="${PS.esc(PS.src(c))}" alt="${PS.esc(p.title)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  };

  PS.youtubeId = url => {
    url = String(url || '').trim();
    if (/^[\w-]{11}$/.test(url)) return url;
    const m = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/);
    return m ? m[1] : '';
  };

  /* YouTube lite facade: thumbnail first, iframe only on click (keeps the page fast) */
  PS.ytFacade = (v, i) => {
    const id = PS.youtubeId(v.url);
    if (!id) return '';
    const short = /shorts\//.test(v.url);
    return `<figure class="yt${short ? ' yt-short' : ''}" data-yt="${id}" data-title="${PS.esc(v.title || '')}">
      <button type="button" class="yt-btn" aria-label="Play video${v.title ? ': ' + PS.esc(v.title) : ''}">
        <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" decoding="async" onerror="this.style.visibility='hidden'">
        <span class="yt-play"><svg width="68" height="48" viewBox="0 0 68 48"><path d="M66.5 7.7a8.5 8.5 0 0 0-6-6C55.2.3 34 .3 34 .3s-21.2 0-26.5 1.4a8.5 8.5 0 0 0-6 6A89 89 0 0 0 .1 24a89 89 0 0 0 1.4 16.3 8.5 8.5 0 0 0 6 6C12.8 47.7 34 47.7 34 47.7s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6A89 89 0 0 0 67.9 24a89 89 0 0 0-1.4-16.3Z" fill="#f00"/><path d="m27 34 18-10-18-10Z" fill="#fff"/></svg></span>
      </button>
      ${v.title ? `<figcaption>${PS.esc(v.title)}</figcaption>` : ''}
    </figure>`;
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('.yt-btn');
    if (!b) return;
    const f = b.closest('.yt'), id = f.dataset.yt;
    const ifr = document.createElement('iframe');
    ifr.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    ifr.title = f.dataset.title || 'YouTube video';
    ifr.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    ifr.allowFullscreen = true;
    b.replaceWith(ifr);
  });

  /* minimal, safe markdown for project write-ups */
  PS.md = src => {
    const inline = t => PS.esc(t)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, a, h) => `<a href="${PS.esc(PS.href(h.replace(/&amp;/g, '&')))}"${PS.ext(h)}>${a}</a>`);
    const lines = String(src || '').replace(/\r/g, '').split('\n');
    let html = '', list = null, para = [];
    const flushP = () => { if (para.length) { html += '<p>' + para.map(inline).join('<br>') + '</p>'; para = []; } };
    const flushL = () => { if (list) { html += `</${list}>`; list = null; } };
    for (const raw of lines) {
      const l = raw.trimEnd();
      let m;
      if (!l.trim()) { flushP(); flushL(); continue; }
      if ((m = l.match(/^(#{2,4})\s+(.*)/))) { flushP(); flushL(); const n = Math.min(m[1].length + 1, 5); html += `<h${n}>${inline(m[2])}</h${n}>`; continue; }
      if ((m = l.match(/^\s*[-*]\s+(.*)/))) { flushP(); if (list !== 'ul') { flushL(); html += '<ul>'; list = 'ul'; } html += `<li>${inline(m[1])}</li>`; continue; }
      if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { flushP(); if (list !== 'ol') { flushL(); html += '<ol>'; list = 'ol'; } html += `<li>${inline(m[1])}</li>`; continue; }
      if ((m = l.match(/^>\s?(.*)/))) { flushP(); flushL(); html += `<blockquote>${inline(m[1])}</blockquote>`; continue; }
      flushL(); para.push(l);
    }
    flushP(); flushL();
    return html;
  };

  /* ---------- shared svgs ---------- */
  const SV = PS.svg = {
    arrow: s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${s < 13 ? 2.8 : 2.6}" stroke-linecap="round"><path d="M5 12h13m-5-6 6 6-6 6"/></svg>`,
    diag: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg>`,
    pin: c => `<svg width="14" height="14" viewBox="0 0 24 24" fill="${c}"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>`,
    mail: `<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1.4 2L12 12.6 19.6 7Z"/>`,
    li: `<path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.76-2.05 4.02 0 4.76 2.6 4.76 6V21h-4v-5.3c0-1.27-.02-2.9-1.8-2.9-1.8 0-2.08 1.37-2.08 2.8V21h-4z"/>`,
    cal: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v2H5.5A2.5 2.5 0 0 0 3 6.5v12A2.5 2.5 0 0 0 5.5 21h13a2.5 2.5 0 0 0 2.5-2.5v-12A2.5 2.5 0 0 0 18.5 4H17V2h-2v2H9V2Zm12 8v8.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V10Z"/></svg>`
  };
  const SOCIAL = {
    linkedin: ['s-li', 'LinkedIn', `<svg width="15" height="15" viewBox="0 0 24 24" fill="#fff">${SV.li}</svg>`],
    youtube: ['s-yt', 'YouTube', `<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3Z"/></svg>`],
    instagram: ['s-ig', 'Instagram', `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1.1" fill="#fff" stroke="none"/></svg>`],
    github: ['s-gh', 'GitHub', `<svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.35 4.68-4.58 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>`]
  };
  PS.socials = (cls) => {
    const s = PS.c.socials || {};
    return `<div class="soc ${cls || ''}">` + Object.keys(SOCIAL).filter(k => s[k]).map(k =>
      `<a class="${SOCIAL[k][0]}" href="${PS.esc(PS.href(s[k]))}"${PS.ext(s[k])} aria-label="${SOCIAL[k][1]}">${SOCIAL[k][2]}</a>`).join('') + '</div>';
  };

  /* ---------- nav + footer ---------- */
  const NAV = [['home', 'Home'], ['about', 'About'], ['projects', 'Projects'], ['categories', 'Categories'], ['experience', 'Experience'], ['contact', 'Contact']];
  PS.logo = () => `<span class="ps">${PS.esc(PS.c.site.logoFirst)}<span>${PS.esc(PS.c.site.logoSecond)}</span></span>
      <span><b>${PS.esc(PS.c.site.name)}</b><i>${PS.esc(PS.c.site.tagline)}</i></span>`;
  PS.renderChrome = (page) => {
    const home = page === 'home';
    const h = id => home ? '#' + id : PS.url('index.html') + '#' + id;
    const nav = document.getElementById('nav');
    if (nav) nav.innerHTML = `<div class="nav-in">
    <a href="${home ? '#home' : PS.url('index.html')}" class="logo">${PS.logo()}</a>
    <div class="menu" id="menu">
      ${NAV.map(([id, l]) => {
        const act = (home && id === 'home') || (!home && id === 'projects');
        const href = (!home && id === 'projects') ? PS.url('projects.html') : h(id);
        return `<a href="${href}"${act ? ' class="active"' : ''}>${l}</a>`;
      }).join('\n      ')}
    </div>
    <a href="${h('contact')}" class="pill">${PS.esc(PS.c.site.ctaLabel || "Let's Connect")}
      ${SV.diag}</a>
    <button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><i></i></button>
  </div>`;
    const ft = document.querySelector('footer');
    if (ft) {
      const txt = PS.esc(PS.c.site.footerText || '').replace('❤', '<span class="heart">❤</span>');
      ft.innerHTML = `<div class="f-in">
    <a href="${home ? '#home' : PS.url('index.html')}" class="logo">${PS.logo()}</a>
    <div class="f-links">
      ${NAV.map(([id, l]) => `<a href="${home ? '#' + id : (id === 'projects' ? PS.url('projects.html') : h(id))}">${l}</a>`).join('<em>|</em>')}
    </div>
    <div class="f-tag">${txt}</div>
  </div>`;
    }
  };

  /* ---------- behaviours from the original template ---------- */
  PS.navBehaviour = (spy) => {
    const nav = document.getElementById('nav'), bar = document.getElementById('progress'), top = document.getElementById('top');
    const links = [...document.querySelectorAll('#menu a')];
    const secs = spy ? links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean) : [];
    let ticking = false;
    function on() {
      ticking = false;
      const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
      nav.classList.toggle('stuck', y > 6);
      if (top) top.classList.toggle('on', y > 500);
      if (bar) bar.style.width = (h > 0 ? y / h * 100 : 0) + '%';
      if (spy && secs.length) {
        let cur = secs[0];
        secs.forEach(s => { if (s.getBoundingClientRect().top <= 130) cur = s; });
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur.id));
      }
    }
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(on); } }, { passive: true });
    on();
    if (top) top.onclick = () => scrollTo({ top: 0, behavior: PS.reduce ? 'auto' : 'smooth' });
    const b = document.getElementById('burger'), m = document.getElementById('menu');
    b.onclick = () => { const o = m.classList.toggle('open'); b.classList.toggle('on', o); b.setAttribute('aria-expanded', o); };
    links.forEach(a => a.addEventListener('click', () => { m.classList.remove('open'); b.classList.remove('on'); b.setAttribute('aria-expanded', false); }));
  };

  PS.reveal = (root) => {
    const els = (root || document).querySelectorAll('.rv:not(.in)');
    if (PS.reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(en => {
      en.forEach(e => {
        if (!e.isIntersecting) return;
        const sibs = [...e.target.parentElement.children].filter(n => n.classList.contains('rv'));
        e.target.style.transitionDelay = Math.min(Math.max(sibs.indexOf(e.target), 0) * 65, 390) + 'ms';
        e.target.classList.add('in'); io.unobserve(e.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -30px 0px' });
    els.forEach(e => {
      io.observe(e);
      e.addEventListener('transitionend', ev => { if (ev.propertyName === 'transform') e.style.transitionDelay = ''; });
    });
  };

  PS.tilt = (root) => {
    if (PS.reduce || !PS.fine) return;
    (root || document).querySelectorAll('.pj,.sk,.ct,.st,.ex').forEach(c => {
      if (c.dataset.tilt) return; c.dataset.tilt = 1;
      c.classList.add('tilt');
      const max = c.classList.contains('sk') ? 10 : 6, lift = c.classList.contains('pj') ? -6 : -4;
      let raf = 0, ev;
      c.addEventListener('pointerenter', () => { c.style.transition = 'transform .15s ease-out,box-shadow .3s,opacity .75s,filter .75s'; });
      c.addEventListener('pointermove', e => {
        ev = e; if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const r = c.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
          c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
          c.style.transform = `perspective(700px) translateY(${lift}px) rotateX(${(.5 - y) * max}deg) rotateY(${(x - .5) * max}deg)`;
        });
      });
      c.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); raf = 0; c.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1),box-shadow .3s'; c.style.transform = ''; });
    });
  };

  PS.buttons = (root) => {
    const r0 = root || document;
    r0.querySelectorAll('.pill').forEach(b => {
      if (b.dataset.rip) return; b.dataset.rip = 1;
      b.addEventListener('pointerdown', e => {
        if (PS.reduce) return; const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height), s = document.createElement('span');
        s.className = 'rip'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
        b.append(s); setTimeout(() => s.remove(), 700);
      });
    });
    if (PS.reduce || !PS.fine) return;
    r0.querySelectorAll('.pill,.ghost,.soc a').forEach(b => {
      if (b.dataset.mag) return; b.dataset.mag = 1;
      const k = b.matches('.soc a') ? .35 : .22;
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * k}px,${(e.clientY - r.top - r.height / 2) * k}px)`;
      });
      b.addEventListener('pointerleave', () => b.style.transform = '');
    });
  };

  PS.card = (p, n) => `<article class="pj rv" data-href="${PS.esc(PS.url('project.html', { id: p.id }))}"><div class="im">${PS.cover(p)}</div>
        <div class="bd"><h5>${n ? n + '. ' : ''}${PS.esc(p.title)}</h5><p class="tg">${PS.esc(p.tags)}</p>
        <a class="vw" href="${PS.esc(PS.url('project.html', { id: p.id }))}">View Project ${SV.arrow(12)}</a></div></article>`;
  document.addEventListener('click', e => {
    const card = e.target.closest('.pj[data-href]');
    if (!card || e.target.closest('a,button')) return;
    location.href = card.dataset.href;
  });

  PS.shead = (icon, s, extra) => `<div class="shead rv">
      <span class="bi">${icon}</span>
      ${extra && extra.stack ? `<div class="stack"><h2>${PS.esc(s.title)}</h2><p>${PS.esc(s.subtitle)}</p></div>` : `<h2>${PS.esc(s.title)}</h2>
      ${s.subtitle ? `<p>${PS.esc(s.subtitle)}</p>` : ''}`}
      ${extra && extra.link ? `<a href="${PS.esc(extra.link)}" class="link">${PS.esc(s.linkLabel)}
        ${SV.arrow(14)}</a>` : ''}
    </div>`;

  PS.finish = (page) => {
    PS.navBehaviour(page === 'home');
    PS.reveal(); PS.tilt(); PS.buttons();
  };

  /* service worker: repeat visits load instantly */
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !PS.draft) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
