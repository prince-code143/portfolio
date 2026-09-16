/* Home page: renders the original template from data/content.js */
PS.ready(function (C) {
  'use strict';
  const e = PS.esc, br = PS.br, SV = PS.svg, reduce = PS.reduce;
  const H = C.hero, S = C.sections;
  document.title = C.site.title || document.title;
  const md = document.querySelector('meta[name=description]');
  if (md && C.site.description) md.content = C.site.description;

  PS.renderChrome('home');

  /* ---------- HERO ---------- */
  const hero = document.getElementById('home');
  if (H.background) hero.style.backgroundImage = `url('${PS.src(H.background)}')`;
  const resume = H.resumeUrl ? `href="${e(PS.src(H.resumeUrl))}" download` : 'href="#contact"';
  hero.innerHTML = `
  <canvas class="hero-fx" aria-hidden="true"></canvas>
  <div class="hero-in">
    <div class="hero-txt">
      <p class="hi up a1">${e(H.greeting)}</p>
      <h1 class="big up a1">${e(H.firstName)} <span>${e(H.lastName)}</span></h1>
      <p class="sub up a2">${br(H.roles)}</p>
      <p class="sub2 up a3">${br(H.intro)}</p>
      <div class="cinfo up a4">
        ${H.location ? `<div>${SV.pin('#fff')}${e(H.location)}</div>` : ''}
        ${H.email ? `<div><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M3 5h18v14H3z" opacity=".25"/>${SV.mail}</svg><a href="mailto:${e(H.email)}">${e(H.email)}</a></div>` : ''}
        ${H.linkedinLabel ? `<div><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">${SV.li}</svg><a href="${e(PS.href(H.linkedinUrl))}" target="_blank" rel="noopener">${e(H.linkedinLabel)}</a></div>` : ''}
      </div>
      <div class="hbtns up a5">
        <a href="#projects" class="pill">${e(H.primaryLabel)}
          ${SV.arrow(15)}</a>
        <a ${resume} class="ghost">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 4v10m-4-4 4 4 4-4M5 19h14"/></svg>${e(H.resumeLabel)}</a>
      </div>
      ${PS.socials('up a6')}
    </div>
  </div>
  <div class="hero-layer"></div>
  <div class="person fade"><span class="orbit"><i></i></span><img src="${e(PS.src(H.photo))}" alt="${e(C.site.name)}" fetchpriority="high" decoding="async"></div>
  <div class="rail">
    ${(H.rail || []).map((r, i) => `<div class="r up a${Math.min(i + 3, 7)}">${r.icon}<span>${br(r.label)}</span></div>`).join('\n    ')}
  </div>
  ${H.quote ? `<p class="rq fade">${e(H.quote)}</p>` : ''}`;

  /* ---------- ABOUT + SKILLS ---------- */
  const A = C.about, SK = C.skillsSection || {};
  document.getElementById('about').innerHTML = `
  <div class="wrap row-about">
    <div class="card about rv">
      <div class="pic"><img src="${e(PS.src(A.photo))}" alt="${e(C.site.name)}" loading="lazy" decoding="async"></div>
      <div>
        <h3>${e(A.title)}</h3>
        <h4>${e(A.heading)}</h4>
        <p>${br(A.text)}</p>
      </div>
      <div class="ci">
        ${C.contact.location ? `<div>${SV.pin('currentColor')}${e(C.contact.location)}</div>` : ''}
        ${C.contact.email ? `<div><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">${SV.mail}</svg><a href="mailto:${e(C.contact.email)}">${e(C.contact.email)}</a></div>` : ''}
        ${H.linkedinLabel ? `<div><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">${SV.li}</svg><a href="${e(PS.href(H.linkedinUrl))}" target="_blank" rel="noopener">${e(H.linkedinLabel)}</a></div>` : ''}
      </div>
    </div>

    <div class="card skills rv">
      <div class="sk-top">
        ${(C.heads || {}).skills || ''}
        <h3>${e(SK.title)}</h3>
        ${SK.linkLabel ? `<a href="${e(PS.href(SK.linkUrl))}" class="link">${e(SK.linkLabel)}
          ${SV.arrow(14)}</a>` : ''}
      </div>
      <div class="sk-grid">
        ${(C.skills || []).map((s, i) => `<div class="sk" style="--i:${i}">${PS.icon(s.icon)}${br(s.name)}</div>`).join('\n        ')}
      </div>
    </div>
  </div>`;

  /* ---------- PROJECTS ---------- */
  const featured = C.projects.filter(p => p.featured).slice(0, S.projects.featuredCount || 6);
  document.getElementById('projects').innerHTML = `
  <div class="wrap">
    ${PS.shead(C.heads.projects, S.projects, { link: PS.url('projects.html') })}
    <div class="p-grid">
      ${featured.map((p, i) => PS.card(p, i + 1)).join('\n      ')}
    </div>
  </div>`;

  /* ---------- CATEGORIES ---------- */
  const count = id => C.projects.filter(p => (p.categories || []).includes(id)).length;
  document.getElementById('categories').innerHTML = `
  <div class="wrap">
    ${PS.shead(C.heads.categories, S.categories, { stack: true, link: PS.url('projects.html') })}
    <div class="c-grid">
      ${C.categories.map(c => `<a href="${e(PS.url('projects.html', { cat: c.id }))}" class="ct rv"><span class="ic">${PS.icon(c.icon, 30)}</span><span><b>${e(c.name)}</b><span>${e(c.subtitle || (count(c.id) + ' Projects'))}</span></span></a>`).join('\n      ')}
    </div>
  </div>`;

  /* ---------- EXPERIENCE ---------- */
  document.getElementById('experience').innerHTML = `
  <div class="wrap">
    ${PS.shead(C.heads.experience, S.experience, { link: H.resumeUrl ? PS.src(H.resumeUrl) : '#contact' })}
    <div class="e-wrap">
      ${C.experience.map(x => `<div class="ex rv">
        <div class="lg">${x.logo ? `<img src="${e(PS.src(x.logo))}" alt="${e(x.company)}" loading="lazy" decoding="async">` : ''}</div>
        <div class="bd">
          <b>${e(x.company)}</b>
          <div class="role">${e(x.role)}${x.current ? '<span class="live" title="Current"></span>' : ''}</div>
          ${x.period ? `<div class="ln">${SV.cal}${e(x.period)}</div>` : ''}
          ${x.location ? `<div class="ln"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>${e(x.location)}</div>` : ''}
        </div>
      </div>`).join('\n      ')}
    </div>
  </div>`;

  /* ---------- STATS ---------- */
  document.getElementById('stats').innerHTML = `
  <div class="wrap">
    ${PS.shead(C.heads.stats, S.stats)}
    <div class="st-grid">
      ${C.stats.map(s => {
        const num = /^\d+$/.test(String(s.value).trim());
        const n = num ? `<div class="n" data-count="${e(s.value)}" data-suffix="${e(s.suffix)}">0</div>`
          : `<div class="n" style="font-size:15.5px">${e(s.value)}${e(s.suffix)}</div>`;
        return `<div class="st rv"><span class="ic">${PS.icon(s.icon, 30)}</span>
        <div>${n}<div class="l">${e(s.label)}</div><div class="s">${e(s.sub)}</div></div></div>`;
      }).join('\n      ')}
    </div>
  </div>`;

  /* ---------- CONTACT ---------- */
  const K = C.contact;
  const chev = d => `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="${d}"/></svg>`;
  document.getElementById('contact').innerHTML = `
  <div class="wrap">
    ${PS.shead(C.heads.contact, S.contact)}
    <div class="card contact rv">
      <div class="cform">
        <div class="f2">
          <div class="fld"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7.5" r="4"/><path d="M4 20.5c0-4 3.6-6.2 8-6.2s8 2.2 8 6.2Z"/></svg>
            <input id="f-name" type="text" placeholder="Your Name" autocomplete="name" aria-label="Your name"></div>
          <div class="fld"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">${SV.mail}</svg>
            <input id="f-mail" type="email" placeholder="Your Email" autocomplete="email" aria-label="Your email"></div>
        </div>
        <div class="fld"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1Z"/></svg>
          <input id="f-phone" type="tel" inputmode="tel" placeholder="Phone Number (optional)" autocomplete="tel" aria-label="Phone number, optional"></div>
        <div class="topic">
          <div class="topic-h">
            <span id="topic-lbl">${e(S.contact.topicLabel)}</span>
            <span class="topic-nav">
              <button type="button" class="tn" data-dir="-1" aria-label="Scroll topics left">${chev('m15 6-6 6 6 6')}</button>
              <button type="button" class="tn" data-dir="1" aria-label="Scroll topics right">${chev('m9 6 6 6-6 6')}</button>
            </span>
          </div>
          <div class="topic-track" id="topics" role="radiogroup" aria-labelledby="topic-lbl">
            <span class="topic-ind" aria-hidden="true"></span>
            ${(K.topics || []).map((t, i) => `<button type="button" class="chip" role="radio" aria-checked="false" tabindex="${i ? -1 : 0}" data-v="${e(t.label)}">${PS.icon(t.icon, 14)}${e(t.label)}</button>`).join('\n            ')}
          </div>
        </div>
        <div class="fld"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 20h4L19.2 8.8a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5Z"/></svg>
          <textarea id="f-msg" placeholder="Your Message" aria-label="Your message"></textarea></div>
        <div class="send-row">
          <button class="pill" id="send">Send Message
            ${SV.arrow(15)}</button>
          <span id="status" role="status"></span>
        </div>
      </div>
      <div class="cinf">
        ${K.email ? `<div><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">${SV.mail}</svg><a href="mailto:${e(K.email)}">${e(K.email)}</a></div>` : ''}
        ${H.linkedinLabel ? `<div><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">${SV.li}</svg><a href="${e(PS.href(H.linkedinUrl))}" target="_blank" rel="noopener">${e(H.linkedinLabel)}</a></div>` : ''}
        ${K.location ? `<div><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>${e(K.location)}</div>` : ''}
        ${PS.socials()}
      </div>
    </div>
  </div>`;

  PS.finish('home');

  /* ---------- counters ---------- */
  (function () {
    const io = new IntersectionObserver(en => {
      en.forEach(x => {
        if (!x.isIntersecting) return;
        const el = x.target, tgt = +el.dataset.count, sfx = el.dataset.suffix || '';
        io.unobserve(el);
        if (reduce) { el.textContent = tgt + sfx; return; }
        const t0 = performance.now();
        (function step(now) {
          const p = Math.min((now - t0) / 1300, 1), e2 = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(tgt * e2) + sfx;
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: .5 });
    document.querySelectorAll('.n[data-count]').forEach(n => io.observe(n));
  })();

  /* ---------- hero: split name, parallax, circuit canvas ---------- */
  (function () {
    const h1 = document.querySelector('.big');
    if (!reduce) {
      let i = 0;
      const walk = node => {
        [...node.childNodes].forEach(c => {
          if (c.nodeType === 3) {
            const f = document.createDocumentFragment();
            [...c.textContent].forEach(ch => {
              if (ch === ' ') { f.append(' '); return; }
              const sp = document.createElement('span'); sp.className = 'ch'; sp.style.setProperty('--i', i++); sp.textContent = ch; f.append(sp);
            });
            c.replaceWith(f);
          } else if (c.nodeType === 1) { c.classList.add('hl'); walk(c); }
        });
      };
      walk(h1); h1.classList.remove('up', 'a1'); h1.classList.add('split');
    }
    const img = document.querySelector('.person img');
    const cv = document.querySelector('.hero-fx'), ctx = cv.getContext('2d');
    let W, H2, traces = [], base, mx = -999, my = -999, run = true, raf;
    if (!reduce && PS.fine) {
      let pe, pr = 0;
      hero.addEventListener('pointermove', ev => {
        pe = ev; if (pr) return;
        pr = requestAnimationFrame(() => {
          pr = 0;
          const r = hero.getBoundingClientRect(), x = (pe.clientX - r.left) / r.width - .5, y = (pe.clientY - r.top) / r.height - .5;
          img.style.transform = `translate(${x * -16}px,${y * -8}px) scale(1.015)`;
          hero.classList.add('bgmove'); hero.style.setProperty('--bgx', 50 + x * 3 + '%'); hero.style.setProperty('--bgy', 50 + y * 4 + '%');
          mx = pe.clientX - r.left; my = pe.clientY - r.top;
        });
      });
      hero.addEventListener('pointerleave', () => { img.style.transform = ''; mx = my = -999; });
    }
    const G = 26, dirs = [[1, 0], [0, 1], [0, -1], [1, 1], [1, -1]];
    function build() {
      const d = Math.min(devicePixelRatio || 1, 2), r = cv.getBoundingClientRect(); W = r.width; H2 = r.height;
      cv.width = W * d; cv.height = H2 * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      traces = []; const n = Math.round(W * H2 / 26000);
      for (let k = 0; k < n; k++) {
        let x = Math.round(Math.random() * W / G) * G, y = Math.round(Math.random() * H2 / G) * G; const pts = [[x, y]]; let len = 0, dir;
        for (let s = 0, m = 3 + Math.random() * 3 | 0; s < m; s++) {
          dir = s % 2 ? dirs[0] : dirs[1 + Math.random() * 4 | 0]; const c = 1 + Math.random() * 4 | 0;
          const nx = x + dir[0] * G * c, ny = y + dir[1] * G * c; len += Math.hypot(nx - x, ny - y); x = nx; y = ny; pts.push([x, y]);
        }
        traces.push({ pts, len, off: Math.random() * len, sp: 40 + Math.random() * 60 });
      }
      base = document.createElement('canvas'); base.width = cv.width; base.height = cv.height; const b = base.getContext('2d'); b.setTransform(d, 0, 0, d, 0, 0);
      b.strokeStyle = 'rgba(94,170,245,.13)'; b.lineWidth = 1;
      traces.forEach(t => {
        b.beginPath(); t.pts.forEach((p, i) => i ? b.lineTo(p[0], p[1]) : b.moveTo(p[0], p[1])); b.stroke();
        [t.pts[0], t.pts[t.pts.length - 1]].forEach(p => { b.beginPath(); b.arc(p[0], p[1], 2.2, 0, 7); b.stroke(); });
      });
    }
    function at(t, dist) {
      let acc = 0;
      for (let i = 1; i < t.pts.length; i++) {
        const a = t.pts[i - 1], b = t.pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (acc + l >= dist) { const f = (dist - acc) / l; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
        acc += l;
      }
      return t.pts[t.pts.length - 1];
    }
    let last = performance.now();
    function frame(now) {
      const dt = Math.min((now - last) / 1000, .05); last = now;
      ctx.clearRect(0, 0, W, H2); ctx.drawImage(base, 0, 0, W, H2);
      traces.forEach(t => {
        t.off = (t.off + t.sp * dt) % (t.len + 60); if (t.off > t.len) return;
        const p = at(t, t.off), q = at(t, Math.max(0, t.off - 22)), near = Math.max(0, 1 - Math.hypot(p[0] - mx, p[1] - my) / 160);
        const g = ctx.createLinearGradient(q[0], q[1], p[0], p[1]); g.addColorStop(0, 'rgba(47,155,245,0)'); g.addColorStop(1, `rgba(124,196,255,${.55 + near * .45})`);
        ctx.strokeStyle = g; ctx.lineWidth = 1.6 + near * 1.2; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
        ctx.fillStyle = `rgba(180,222,255,${.7 + near * .3})`; ctx.beginPath(); ctx.arc(p[0], p[1], 1.7 + near * 1.8, 0, 7); ctx.fill();
      });
      if (mx > 0) { const rg = ctx.createRadialGradient(mx, my, 0, mx, my, 150); rg.addColorStop(0, 'rgba(47,155,245,.10)'); rg.addColorStop(1, 'rgba(47,155,245,0)'); ctx.fillStyle = rg; ctx.fillRect(mx - 150, my - 150, 300, 300); }
      if (run) raf = requestAnimationFrame(frame);
    }
    if (reduce) return;
    const start = () => { build(); raf = requestAnimationFrame(frame); };
    (window.requestIdleCallback || setTimeout)(start, { timeout: 600 });
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
    const resume = () => { last = performance.now(); cancelAnimationFrame(raf); if (run && base) raf = requestAnimationFrame(frame); };
    let vis = true;
    new IntersectionObserver(([x]) => { vis = x.isIntersecting; run = vis && !document.hidden; resume(); }).observe(hero);
    document.addEventListener('visibilitychange', () => { run = vis && !document.hidden; resume(); });
  })();

  /* ---------- topic slider ---------- */
  const topic = (function () {
    const wrap = document.querySelector('.topic'), tr = document.getElementById('topics'), ind = tr.querySelector('.topic-ind'),
      chips = [...tr.querySelectorAll('.chip')], navs = [...wrap.querySelectorAll('.tn')];
    let val = '';
    function place(c) { ind.style.width = c.offsetWidth + 'px'; ind.style.height = c.offsetHeight + 'px'; ind.style.transform = `translateX(${c.offsetLeft}px)`; ind.style.opacity = 1; }
    function pick(c, focus) {
      chips.forEach(x => { x.setAttribute('aria-checked', x === c); x.tabIndex = x === c ? 0 : -1; });
      val = c.dataset.v; place(c); wrap.classList.remove('bad');
      c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
      if (focus) c.focus({ preventScroll: true });
    }
    let moved = false;
    chips.forEach((c, i) => {
      c.addEventListener('click', () => { if (!moved) pick(c); });
      c.addEventListener('keydown', ev => {
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
        if (d) { ev.preventDefault(); pick(chips[(i + d + chips.length) % chips.length], true); }
      });
    });
    function navState() { navs[0].disabled = tr.scrollLeft < 4; navs[1].disabled = tr.scrollLeft + tr.clientWidth >= tr.scrollWidth - 4; }
    navs.forEach(n => n.onclick = () => tr.scrollBy({ left: n.dataset.dir * tr.clientWidth * .6, behavior: reduce ? 'auto' : 'smooth' }));
    tr.addEventListener('scroll', navState, { passive: true });
    addEventListener('resize', () => { navState(); const c = chips.find(x => x.getAttribute('aria-checked') === 'true'); if (c) place(c); });
    let down = false, sx = 0, sl = 0;
    tr.addEventListener('pointerdown', ev => { if (ev.pointerType !== 'mouse') return; down = true; moved = false; sx = ev.clientX; sl = tr.scrollLeft; });
    addEventListener('pointermove', ev => { if (!down) return; const dx = ev.clientX - sx; if (Math.abs(dx) > 4) { moved = true; tr.classList.add('drag'); } tr.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { down = false; tr.classList.remove('drag'); setTimeout(() => moved = false, 0); });
    requestAnimationFrame(navState);
    return { get: () => val, wrap };
  })();

  /* ---------- contact form ---------- */
  (function () {
    const st = document.getElementById('status'), btn = document.getElementById('send');
    const f = id => document.getElementById(id);
    function bad(el, msg) {
      const box = el.closest('.fld') || el; box.classList.remove('bad'); void box.offsetWidth; box.classList.add('bad');
      st.className = 'err'; st.textContent = msg; if (el.focus) el.focus(); return false;
    }
    ['f-name', 'f-mail', 'f-phone', 'f-msg'].forEach(id => f(id).addEventListener('input', () => f(id).closest('.fld').classList.remove('bad')));
    btn.onclick = async () => {
      const n = f('f-name').value.trim(), m = f('f-mail').value.trim(), p = f('f-phone').value.trim(), t = f('f-msg').value.trim(), c = topic.get();
      if (!n) return bad(f('f-name'), 'Enter your name.');
      if (!m) return bad(f('f-mail'), 'Enter your email.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) return bad(f('f-mail'), 'Check the email address.');
      if (p && !/^\+?[\d\s-]{10,15}$/.test(p)) return bad(f('f-phone'), 'Enter a valid phone number, or leave it empty.');
      if (!c) { topic.wrap.classList.remove('bad'); void topic.wrap.offsetWidth; topic.wrap.classList.add('bad'); st.className = 'err'; st.textContent = 'Choose what this is about.'; return; }
      if (!t) return bad(f('f-msg'), 'Write a short message.');
      const endpoint = (K.formEndpoint || '').trim();
      if (endpoint) {
        btn.disabled = true; st.className = ''; st.textContent = 'Sending…';
        try {
          const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ name: n, email: m, phone: p, topic: c, message: t, _subject: c + ' enquiry from ' + n }) });
          if (!r.ok) throw new Error(r.status);
          st.className = 'ok'; st.textContent = 'Message sent. I will reply soon.';
          btn.classList.add('done'); setTimeout(() => btn.classList.remove('done'), 2400);
          ['f-name', 'f-mail', 'f-phone', 'f-msg'].forEach(id => f(id).value = '');
        } catch (err) {
          st.className = 'err'; st.textContent = 'Could not send. Email ' + K.email + ' directly.';
        } finally { btn.disabled = false; }
        return;
      }
      const body = `Name: ${n}\nEmail: ${m}\nPhone: ${p || '-'}\nTopic: ${c}\n\n${t}`;
      st.className = 'ok'; st.textContent = 'Opening your email app to send…';
      btn.classList.add('done'); setTimeout(() => btn.classList.remove('done'), 2400);
      location.href = `mailto:${K.email}?subject=${encodeURIComponent(c + ' enquiry from ' + n)}&body=${encodeURIComponent(body)}`;
    };
  })();

  /* deep link (#contact etc.) after async render */
  if (location.hash.length > 1) {
    const t = document.querySelector(location.hash);
    if (t) requestAnimationFrame(() => t.scrollIntoView());
  }
});
