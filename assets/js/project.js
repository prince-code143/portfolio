/* Single project page */
PS.ready(function (C) {
  'use strict';
  const e = PS.esc, SV = PS.svg;
  PS.renderChrome('project');
  const id = new URLSearchParams(location.search).get('id');
  const idx = C.projects.findIndex(p => p.id === id);
  const p = C.projects[idx];
  const head = document.getElementById('phero'), root = document.getElementById('pd');
  if (C.hero.background) head.style.backgroundImage = `url('${PS.src(C.hero.background)}')`;
  const crumb = extra => `<nav class="crumb" aria-label="Breadcrumb"><a href="${PS.url('index.html')}">Home</a>${SV.arrow(10)}<a href="${PS.url('projects.html')}">Projects</a>${extra ? SV.arrow(10) + '<span>' + e(extra) + '</span>' : ''}</nav>`;

  if (!p) {
    head.innerHTML = `<div class="phero-in">${crumb()}<h1>Project not found</h1><p class="lead">This link may be old or the project was renamed.</p></div>`;
    root.innerHTML = `<section><div class="wrap"><div class="card empty"><b>Nothing to show here</b>Browse every project instead.<br><a class="pill" href="${PS.url('projects.html')}">View all projects ${SV.arrow(15)}</a></div></div></section>`;
    PS.finish('project');
    return;
  }

  document.title = `${p.title} — ${C.site.name}`;
  const md = document.querySelector('meta[name=description]');
  if (md) md.content = p.summary || p.tags || '';

  const cats = (p.categories || []).map(cid => C.categories.find(c => c.id === cid)).filter(Boolean);
  const tags = String(p.tags || '').split('|').map(s => s.trim()).filter(Boolean);
  const gallery = (p.gallery || []).filter(g => g && g.src);
  const isIll = String(p.cover || '').startsWith('illustration:');
  const media = gallery.length ? gallery : (p.cover && !isIll ? [{ src: p.cover, caption: '' }] : []);
  const videos = (p.videos || []).filter(v => PS.youtubeId(v.url));
  const links = (p.links || []).filter(l => l && l.url);

  /* ---------- header ---------- */
  head.innerHTML = `<div class="phero-in">
    ${crumb(p.title)}
    <h1 class="up a1">${e(p.title)}</h1>
    ${p.summary ? `<p class="lead up a2">${e(p.summary)}</p>` : ''}
    ${tags.length ? `<div class="ptags up a3">${tags.map(t => `<span class="ptag">${e(t)}</span>`).join('')}</div>` : ''}
  </div>`;

  /* ---------- body ---------- */
  const chevron = d => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="${d}"/></svg>`;
  const check = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;
  const related = C.projects.filter(x => x !== p && (x.categories || []).some(c => (p.categories || []).includes(c)))
    .concat(C.projects.filter(x => x !== p && !(x.categories || []).some(c => (p.categories || []).includes(c)))).slice(0, 6);
  const prev = C.projects[idx - 1], next = C.projects[idx + 1];

  root.innerHTML = `
<section><div class="wrap pd-grid">
  <div class="card viewer rv">
    <div class="stage${media.length ? ' zoomable' : ''}" id="stage">
      ${media.length ? `<img id="stage-img" src="${e(PS.src(media[0].src))}" alt="${e(media[0].caption || p.title)}" fetchpriority="high" decoding="async">` : PS.cover(p, true)}
      ${media.length > 1 ? `<button type="button" class="nav-b prev" aria-label="Previous photo">${chevron('m15 6-6 6 6 6')}</button><button type="button" class="nav-b next" aria-label="Next photo">${chevron('m9 6 6 6-6 6')}</button>` : ''}
      ${media.length ? `<span class="zoom"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg><span id="stage-n">1 / ${media.length}</span></span>` : ''}
    </div>
    ${media.length > 1 ? `<div class="thumbs" id="thumbs">${media.map((m, i) => `<button type="button" aria-label="Photo ${i + 1}" aria-current="${i === 0}"><img src="${e(PS.src(m.thumb || m.src))}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div>` : ''}
    ${media.length ? `<p class="stage-cap" id="stage-cap">${e(media[0].caption || '')}</p>` : ''}
  </div>

  <aside class="card side rv">
    <h3>Overview</h3>
    ${p.summary ? `<p>${e(p.summary)}</p>` : ''}
    <dl class="meta">
      ${cats.length ? `<div><dt>Category</dt><dd>${cats.map(c => `<a href="${e(PS.url('projects.html', { cat: c.id }))}">${e(c.name)}</a>`).join(', ')}</dd></div>` : ''}
      ${p.date ? `<div><dt>Date</dt><dd>${e(p.date)}</dd></div>` : ''}
      ${p.role ? `<div><dt>My role</dt><dd>${e(p.role)}</dd></div>` : ''}
      ${media.length ? `<div><dt>Media</dt><dd>${media.length} photo${media.length > 1 ? 's' : ''}${videos.length ? `, ${videos.length} video${videos.length > 1 ? 's' : ''}` : ''}</dd></div>` : (videos.length ? `<div><dt>Media</dt><dd>${videos.length} video${videos.length > 1 ? 's' : ''}</dd></div>` : '')}
      ${(p.tech || []).length ? `<div><dt>Built with</dt><dd class="tech">${p.tech.map(t => `<span>${e(t)}</span>`).join('')}</dd></div>` : ''}
    </dl>
    <div class="acts">
      ${links.map((l, i) => `<a class="${i ? 'btn-o' : 'pill'}" href="${e(PS.href(l.url))}"${PS.ext(l.url)}>${e(l.label || 'Open link')} ${i ? '' : SV.diag}</a>`).join('')}
      ${videos.length ? `<a class="${links.length ? 'btn-o' : 'pill'}" href="#videos">Watch video${videos.length > 1 ? 's' : ''}</a>` : ''}
      <button type="button" class="btn-o" id="share"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>Share</button>
    </div>
  </aside>
</div></section>

${p.description ? `<section><div class="wrap">
  ${PS.shead(`<svg width="26" height="26" viewBox="0 0 24 24" fill="#1a7fe0"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V8h4.5ZM8 12v1.6h8V12Zm0 4v1.6h6V16Z"/></svg>`, { title: 'About this project' })}
  <div class="card prose rv">${PS.md(p.description)}</div>
</div></section>` : ''}

${(p.highlights || []).filter(Boolean).length ? `<section><div class="wrap">
  ${PS.shead(`<svg width="26" height="26" viewBox="0 0 24 24" fill="#f5a623"><path d="m12 2 2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7Z"/></svg>`, { title: 'Key features' })}
  <div class="card hl-list rv">${p.highlights.filter(Boolean).map(h => `<div>${check}<span>${e(h)}</span></div>`).join('')}</div>
</div></section>` : ''}

${videos.length ? `<section id="videos"><div class="wrap">
  ${PS.shead(`<svg width="28" height="28" viewBox="0 0 24 24" fill="#ff0000"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3Z"/></svg>`, { title: 'Videos', subtitle: 'Tap a video to play it here.' })}
  <div class="yt-grid">${videos.map(PS.ytFacade).join('')}</div>
</div></section>` : ''}

${related.length ? `<section><div class="wrap">
  ${PS.shead(C.heads.projects, { title: 'More projects', linkLabel: 'View All Projects' }, { link: PS.url('projects.html') })}
  <div class="p-grid">${related.map(x => PS.card(x, C.projects.indexOf(x) + 1)).join('')}</div>
</div></section>` : ''}

<section><div class="wrap pn">
  ${prev ? `<a class="card rv" href="${e(PS.url('project.html', { id: prev.id }))}"><span>← Previous project</span><b>${e(prev.title)}</b></a>` : '<span class="ph"></span>'}
  ${next ? `<a class="card nx rv" href="${e(PS.url('project.html', { id: next.id }))}"><span>Next project →</span><b>${e(next.title)}</b></a>` : ''}
</div></section>

<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Photo viewer">
  <div class="lb-top"><span id="lb-n"></span><button type="button" class="lb-x" aria-label="Close">${chevron('M6 6l12 12M18 6 6 18')}</button></div>
  <div class="lb-mid">
    <img id="lb-img" alt="">
    ${media.length > 1 ? `<button type="button" class="lb-b lb-p" aria-label="Previous photo">${chevron('m15 6-6 6 6 6')}</button><button type="button" class="lb-b lb-n" aria-label="Next photo">${chevron('m9 6 6 6-6 6')}</button>` : ''}
  </div>
  <p class="lb-cap" id="lb-cap"></p>
</div>`;

  PS.finish('project');

  /* ---------- gallery ---------- */
  if (media.length) {
    let cur = 0;
    const img = document.getElementById('stage-img'), n = document.getElementById('stage-n'), cap = document.getElementById('stage-cap');
    const thumbs = [...document.querySelectorAll('#thumbs button')];
    const lb = document.getElementById('lb'), lbImg = document.getElementById('lb-img'), lbN = document.getElementById('lb-n'), lbCap = document.getElementById('lb-cap');
    const preload = i => { const m = media[(i + media.length) % media.length]; if (m) { const im = new Image(); im.decoding = 'async'; im.src = PS.src(m.src); } };
    let lastFocus;
    function show(i) {
      cur = (i + media.length) % media.length;
      const m = media[cur];
      img.src = PS.src(m.src); img.alt = m.caption || p.title;
      n.textContent = `${cur + 1} / ${media.length}`;
      cap.textContent = m.caption || '';
      thumbs.forEach((t, k) => t.setAttribute('aria-current', k === cur));
      if (thumbs[cur]) thumbs[cur].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: PS.reduce ? 'auto' : 'smooth' });
      if (lb.classList.contains('on')) { lbImg.src = PS.src(m.src); lbImg.alt = m.caption || p.title; lbN.textContent = n.textContent; lbCap.textContent = m.caption || ''; }
      preload(cur + 1); preload(cur - 1);
    }
    function open() {
      lastFocus = document.activeElement;
      lb.classList.add('on'); document.body.classList.add('lock'); show(cur);
      lb.querySelector('.lb-x').focus();
    }
    function close() { lb.classList.remove('on'); document.body.classList.remove('lock'); if (lastFocus) lastFocus.focus(); }
    document.getElementById('stage').addEventListener('click', ev => {
      if (ev.target.closest('.prev')) return show(cur - 1);
      if (ev.target.closest('.next')) return show(cur + 1);
      open();
    });
    thumbs.forEach((t, k) => t.addEventListener('click', () => show(k)));
    lb.addEventListener('click', ev => {
      if (ev.target.closest('.lb-x') || ev.target === lb || ev.target.classList.contains('lb-mid')) return close();
      if (ev.target.closest('.lb-p')) return show(cur - 1);
      if (ev.target.closest('.lb-n')) return show(cur + 1);
    });
    document.addEventListener('keydown', ev => {
      if (!lb.classList.contains('on')) return;
      if (ev.key === 'Escape') close();
      else if (ev.key === 'ArrowLeft') show(cur - 1);
      else if (ev.key === 'ArrowRight') show(cur + 1);
      else if (ev.key === 'Tab') {
        const f = [...lb.querySelectorAll('button')];
        const i = f.indexOf(document.activeElement);
        ev.preventDefault(); f[(i + (ev.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    /* swipe */
    const swipe = el => {
      let x0 = null, y0 = 0;
      el.addEventListener('touchstart', ev => { x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; }, { passive: true });
      el.addEventListener('touchend', ev => {
        if (x0 === null) return;
        const dx = ev.changedTouches[0].clientX - x0, dy = ev.changedTouches[0].clientY - y0; x0 = null;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { ev.preventDefault(); show(cur + (dx < 0 ? 1 : -1)); }
      });
    };
    swipe(document.getElementById('stage')); swipe(lb.querySelector('.lb-mid'));
  }

  /* ---------- share ---------- */
  document.getElementById('share').addEventListener('click', async ev => {
    const url = location.href.replace(/[?&]draft=1/, '');
    const b = ev.currentTarget, old = b.innerHTML;
    try {
      if (navigator.share) { await navigator.share({ title: p.title, url }); return; }
      await navigator.clipboard.writeText(url);
      b.textContent = 'Link copied';
    } catch (err) { if (err && err.name === 'AbortError') return; b.textContent = 'Copy failed'; }
    setTimeout(() => b.innerHTML = old, 1800);
  });
});
