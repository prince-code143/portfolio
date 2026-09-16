/* =========================================================
   Site editor — edits data/content.js and publishes to GitHub
   ========================================================= */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const e = PS.esc;
  const clone = o => JSON.parse(JSON.stringify(o));
  const serialize = c => 'window.SITE_CONTENT = ' + JSON.stringify(c, null, 1) + ';\n';
  const parseContentJs = t => JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
  const slugify = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'item';

  const st = {
    c: clone(window.SITE_CONTENT),
    base: JSON.stringify(window.SITE_CONTENT),   // last published content (as JSON)
    tab: 'projects',
    sel: 0,
    gh: JSON.parse(localStorage.getItem('ps-gh') || sessionStorage.getItem('ps-gh') || '{}')
  };
  const pending = new Map(); // path -> objectURL for images not yet published
  PS.c = st.c;
  PS.src = p => pending.get(p) || p || '';

  /* ---------- icons ---------- */
  const I = {
    proj: '<path d="m12 2 10 5-10 5L2 7Z"/><path d="m2 12 10 5 10-5M2 16.6l10 5 10-5"/>',
    hero: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 15l5-5 4 4 3-3 6 6"/>',
    about: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    skills: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3.5"/>',
    cats: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2l1.6 2h8.2A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z"/>',
    exp: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
    stats: '<path d="M5 20V12M12 20V6M19 20V3"/>',
    contact: '<path d="M4 5h16v14H4Z"/><path d="m4 6 8 7 8-7"/>',
    site: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    gh: '<path d="M9 19c-4 1.5-4-2-6-2.5m12 5v-3.5a3 3 0 0 0-.9-2.4c3-.3 6-1.5 6-6.5a5 5 0 0 0-1.4-3.5 4.7 4.7 0 0 0-.1-3.5s-1.1-.3-3.6 1.4a12.4 12.4 0 0 0-6.5 0C6 2.8 4.9 3.1 4.9 3.1a4.7 4.7 0 0 0-.1 3.5A5 5 0 0 0 3.4 10c0 5 3 6.2 6 6.5a3 3 0 0 0-.9 2.4V22"/>',
    backup: '<path d="M12 3v12m-5-5 5 5 5-5M4 21h16"/>',
    up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
    del: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    car: '<path d="m9 6 6 6-6 6"/>', star: '<path d="m12 2.8 2.8 6 6.6.7-4.9 4.4 1.4 6.5L12 17.1l-5.9 3.3 1.4-6.5L2.6 9.5l6.6-.7Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', left: '<path d="m15 6-6 6 6 6"/>', right: '<path d="m9 6 6 6-6 6"/>', cover: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 9"/>'
  };
  const svg = (k, s, fill) => `<svg width="${s || 16}" height="${s || 16}" viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="${fill ? 'none' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${I[k]}</svg>`;

  /* ---------- toast / modal ---------- */
  function toast(msg, kind) {
    const t = document.createElement('div');
    t.className = 'toast ' + (kind || ''); t.textContent = msg;
    $('#toasts').append(t); setTimeout(() => t.remove(), kind === 'err' ? 6500 : 3200);
  }
  const modal = {
    open(html) { $('#modal-box').innerHTML = html; $('#modal').hidden = false; const f = $('#modal-box input,#modal-box button.pri,#modal-box button'); if (f) f.focus(); },
    close() { $('#modal').hidden = true; }
  };
  $('#modal').addEventListener('click', ev => { if (ev.target.id === 'modal' || ev.target.closest('[data-close]')) modal.close(); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !$('#modal').hidden && !$('#modal-box .busy')) modal.close(); });
  function confirmBox(title, text, okLabel, danger) {
    return new Promise(res => {
      modal.open(`<h3>${e(title)}</h3><p>${text}</p><div class="acts"><button class="btn" data-close>Cancel</button><button class="btn ${danger ? 'danger' : 'pri'}" id="ok">${e(okLabel)}</button></div>`);
      $('#ok').onclick = () => { modal.close(); res(true); };
      $('#modal').addEventListener('click', function h(ev) { if (ev.target.id === 'modal' || ev.target.closest('[data-close]')) { res(false); $('#modal').removeEventListener('click', h); } });
    });
  }

  /* ---------- draft persistence ---------- */
  let saveT;
  function touch() {
    clearTimeout(saveT);
    saveT = setTimeout(saveDraft, 350);
    updateState();
  }
  function saveDraft() {
    clearTimeout(saveT);
    return PS.db.set('kv', 'draft', { content: st.c, base: st.base, savedAt: Date.now() }).catch(err => toast('Could not save draft: ' + err.message, 'err'));
  }
  function referencedPending() {
    const json = JSON.stringify(st.c);
    return [...pending.keys()].filter(p => json.includes(JSON.stringify(p)));
  }
  function isDirty() { return JSON.stringify(st.c) !== st.base || referencedPending().length > 0; }
  function updateState() {
    const d = isDirty();
    $('#state').classList.toggle('dirty', d);
    const n = referencedPending().length;
    $('#state-t').textContent = d ? `Unpublished changes${n ? ` · ${n} new file${n > 1 ? 's' : ''}` : ''}` : 'Everything is published';
  }

  /* ---------- image + file handling ---------- */
  const canWebp = (() => { try { const c = document.createElement('canvas'); c.width = c.height = 1; return c.toDataURL('image/webp').startsWith('data:image/webp'); } catch (x) { return false; } })();
  const PRESET = {
    bg: { maxW: 1920, q: .8 }, photo: { maxW: 900, q: .86, alpha: true }, cover: { maxW: 800, q: .82 },
    gallery: { maxW: 1600, q: .82, thumb: 360 }, logo: { maxW: 400, q: .9, alpha: true }, icon: { maxW: 128, q: .9, alpha: true }
  };
  async function loadBitmap(file) {
    if (window.createImageBitmap) { try { return await createImageBitmap(file); } catch (x) { /* fall back */ } }
    return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('This file is not a readable image.')); im.src = URL.createObjectURL(file); });
  }
  async function encode(bmp, w, q, alpha) {
    const s = Math.min(1, w / bmp.width), cw = Math.round(bmp.width * s), ch = Math.round(bmp.height * s);
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const x = cv.getContext('2d'); x.imageSmoothingQuality = 'high';
    if (!alpha && !canWebp) { x.fillStyle = '#fff'; x.fillRect(0, 0, cw, ch); }
    x.drawImage(bmp, 0, 0, cw, ch);
    const type = canWebp ? 'image/webp' : (alpha ? 'image/png' : 'image/jpeg');
    const blob = await new Promise(r => cv.toBlob(r, type, q));
    return { blob, ext: type.split('/')[1].replace('jpeg', 'jpg') };
  }
  const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  async function putFile(path, blob) {
    await PS.db.set('files', path, { blob, type: blob.type });
    if (pending.has(path)) URL.revokeObjectURL(pending.get(path));
    pending.set(path, URL.createObjectURL(blob));
  }
  async function processImage(file, preset, name) {
    const P = PRESET[preset] || PRESET.cover, base = `assets/uploads/${slugify(name || file.name.replace(/\.\w+$/, ''))}-${stamp()}`;
    if (/svg|gif/.test(file.type)) {
      if (file.size > 8e6) throw new Error('File is over 8 MB. Use a smaller file.');
      const path = base + (file.type.includes('svg') ? '.svg' : '.gif');
      await putFile(path, file); return { src: path };
    }
    if (!/^image\//.test(file.type)) throw new Error(`${file.name} is not an image.`);
    const bmp = await loadBitmap(file);
    const main = await encode(bmp, P.maxW, P.q, P.alpha);
    const out = { src: `${base}.${main.ext}` };
    await putFile(out.src, main.blob);
    if (P.thumb) {
      const t = await encode(bmp, P.thumb, .78, false);
      out.thumb = `${base}-t.${t.ext}`;
      await putFile(out.thumb, t.blob);
    }
    if (bmp.close) bmp.close();
    return out;
  }
  function pickFiles(accept, multiple) {
    return new Promise(res => {
      const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = !!multiple;
      i.onchange = () => res([...i.files]); i.click();
    });
  }
  const kb = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB';

  /* ---------- generic field renderer ---------- */
  function fields(root, obj, defs, onChange) {
    const changed = () => { touch(); if (onChange) onChange(); };
    defs.forEach(d => {
      if (d.if && !d.if(obj)) return;
      const box = document.createElement('div');
      box.className = 'f' + (d.wide ? ' wide' : '');
      if (d.t === 'row') { box.className = 'grid2'; fields(box, obj, d.f, onChange); root.append(box); return; }
      const label = d.l ? `<label>${e(d.l)}</label>` : '';
      const hint = d.h ? `<div class="hint">${d.h}</div>` : '';
      const val = obj[d.k];
      switch (d.t || 'text') {
        case 'text': case 'url': case 'number': {
          box.innerHTML = `${label}<input type="${d.t === 'number' ? 'number' : 'text'}" value="${e(val == null ? '' : val)}" placeholder="${e(d.ph || '')}">${hint}`;
          const inp = $('input', box);
          inp.addEventListener('input', () => { obj[d.k] = d.t === 'number' ? (inp.value === '' ? '' : +inp.value) : inp.value; if (d.onInput) d.onInput(inp.value, box); changed(); });
          if (d.onBlur) inp.addEventListener('blur', () => d.onBlur(inp, box));
          break;
        }
        case 'area': {
          box.innerHTML = `${label}<textarea rows="${d.rows || 3}" class="${d.code ? 'code' : ''}" placeholder="${e(d.ph || '')}" spellcheck="${d.code ? 'false' : 'true'}">${e(val || '')}</textarea>${hint}`;
          const ta = $('textarea', box);
          ta.addEventListener('input', () => { obj[d.k] = ta.value; changed(); });
          break;
        }
        case 'lines': {
          box.innerHTML = `${label}<textarea rows="${d.rows || 4}" placeholder="${e(d.ph || '')}">${e((val || []).join('\n'))}</textarea>${hint}`;
          const ta = $('textarea', box);
          ta.addEventListener('input', () => { obj[d.k] = ta.value.split('\n').map(s => s.trim()).filter(Boolean); changed(); });
          break;
        }
        case 'toggle': {
          box.innerHTML = `<label class="tog"><input type="checkbox" ${val ? 'checked' : ''}>${e(d.l)}</label>${hint}`;
          $('input', box).addEventListener('change', ev => { obj[d.k] = ev.target.checked; changed(); });
          break;
        }
        case 'checks': {
          const opts = d.o();
          box.innerHTML = `${label}<div class="checks">${opts.map(([v, l]) => `<label><input type="checkbox" value="${e(v)}" ${(val || []).includes(v) ? 'checked' : ''}>${e(l)}</label>`).join('') || '<span class="hint">Add a category first.</span>'}</div>${hint}`;
          $$('input', box).forEach(c => c.addEventListener('change', () => { obj[d.k] = $$('input:checked', box).map(x => x.value); changed(); }));
          break;
        }
        case 'image': case 'file': case 'cover':
          mediaField(box, obj, d, changed); break;
        case 'icon':
          iconField(box, obj, d, changed); break;
        case 'list':
          listField(box, obj, d, onChange); break;
      }
      root.append(box);
    });
  }

  function mediaField(box, obj, d, changed) {
    const isFile = d.t === 'file';
    function draw() {
      const v = obj[d.k] || '';
      const ill = String(v).startsWith('illustration:') ? (st.c.illustrations || {})[v.slice(13)] : '';
      const pv = isFile ? (v ? `<span>${e(v.split('/').pop())}</span>` : '<span>No file</span>')
        : ill ? ill : v ? `<img src="${e(PS.src(v))}" alt="">` : '<span>Drop image<br>or click Upload</span>';
      const illOpts = d.t === 'cover' ? Object.keys(st.c.illustrations || {}) : [];
      box.innerHTML = `<div class="lbl">${e(d.l)}</div>
        <div class="imgf"><div class="pv" tabindex="-1">${pv}</div>
          <div class="ctl">
            <div class="row">
              <button type="button" class="btn sm pri" data-a="up">${svg('backup', 13)}${v ? 'Replace' : 'Upload'}</button>
              <button type="button" class="btn sm" data-a="url">Use link</button>
              ${v ? '<button type="button" class="btn sm danger" data-a="rm">Remove</button>' : ''}
            </div>
            ${illOpts.length ? `<select aria-label="Animated illustration" data-a="ill" style="max-width:260px;border:1px solid var(--line);border-radius:8px;padding:5px 8px;font-size:12.5px;background:#fafcff"><option value="">…or use an animated illustration</option>${illOpts.map(k => `<option value="${e(k)}" ${v === 'illustration:' + k ? 'selected' : ''}>${e(k.replace(/-/g, ' '))}</option>`).join('')}</select>` : ''}
            <div class="path">${v && !ill ? e(v) + (pending.has(v) ? '<span class="pending">not published</span>' : '') : ''}</div>
            ${d.h ? `<div class="hint">${d.h}</div>` : ''}
          </div></div>`;
      const pvEl = $('.pv', box);
      const take = async file => {
        if (!file) return;
        const btn = $('[data-a=up]', box); btn.disabled = true; btn.textContent = 'Processing…';
        try {
          if (isFile) {
            if (file.size > 20e6) throw new Error('File is over 20 MB.');
            const path = `assets/uploads/${slugify(file.name.replace(/\.\w+$/, ''))}-${stamp()}.${(file.name.split('.').pop() || 'bin').toLowerCase()}`;
            await putFile(path, file); obj[d.k] = path;
          } else {
            const r = await processImage(file, d.preset || (d.t === 'cover' ? 'cover' : 'photo'), d.name ? d.name() : '');
            obj[d.k] = r.src;
            toast(`Image ready (${kb(file.size)} → ${kb((await PS.db.get('files', r.src)).blob.size)})`, 'ok');
          }
          changed(); draw();
        } catch (err) { toast(err.message, 'err'); draw(); }
      };
      box.onclick = async ev => {
        const a = ev.target.closest('[data-a]'); if (!a || a.tagName === 'SELECT') return;
        if (a.dataset.a === 'up') { const [f] = await pickFiles(isFile ? (d.accept || '*/*') : 'image/*'); take(f); }
        if (a.dataset.a === 'url') {
          const u = prompt('Paste an image link or a path inside the site (for example assets/img/photo.webp)', obj[d.k] || '');
          if (u !== null) { obj[d.k] = u.trim(); changed(); draw(); }
        }
        if (a.dataset.a === 'rm') { obj[d.k] = ''; changed(); draw(); }
      };
      const sel = $('select[data-a=ill]', box);
      if (sel) sel.onchange = () => { if (sel.value) { obj[d.k] = 'illustration:' + sel.value; changed(); draw(); } };
      ['dragenter', 'dragover'].forEach(n => pvEl.addEventListener(n, ev => { ev.preventDefault(); pvEl.classList.add('drag'); }));
      ['dragleave', 'drop'].forEach(n => pvEl.addEventListener(n, () => pvEl.classList.remove('drag')));
      pvEl.addEventListener('drop', ev => { ev.preventDefault(); take(ev.dataTransfer.files[0]); });
    }
    draw();
  }

  function knownIcons() {
    const set = new Set();
    const add = v => { if (v && String(v).startsWith('<svg')) set.add(v); };
    (st.c.skills || []).forEach(s => add(s.icon)); (st.c.categories || []).forEach(s => add(s.icon));
    (st.c.stats || []).forEach(s => add(s.icon)); (st.c.hero.rail || []).forEach(s => add(s.icon));
    ((st.c.contact || {}).topics || []).forEach(s => add(s.icon)); Object.values(st.c.heads || {}).forEach(add);
    return [...set];
  }
  function iconField(box, obj, d, changed) {
    function draw(showPicker, showCode) {
      const v = obj[d.k] || '';
      box.innerHTML = `<div class="lbl">${e(d.l)}</div>
        <div class="icof"><div class="pv">${PS.icon(v, 32) || '—'}</div>
        <div style="flex:1;min-width:0">
          <div class="imgf"><div class="row" style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="btn sm" data-a="pick">Choose icon</button>
            <button type="button" class="btn sm" data-a="up">Upload image</button>
            <button type="button" class="btn sm" data-a="code">Paste SVG</button>
          </div></div>
          ${showPicker ? `<div class="picker">${knownIcons().map((s, i) => `<button type="button" data-i="${i}" aria-label="Icon ${i + 1}">${s}</button>`).join('')}</div>` : ''}
          ${showCode ? `<div class="f" style="margin-top:8px"><textarea class="code" rows="4" spellcheck="false" placeholder="<svg ...>...</svg>">${e(v.startsWith('<svg') ? v : '')}</textarea><div class="hint">Free icons: <a href="https://lucide.dev/icons" target="_blank" rel="noopener">lucide.dev</a> — copy SVG and paste here.</div></div>` : ''}
        </div></div>`;
      box.onclick = async ev => {
        const b = ev.target.closest('button'); if (!b) return;
        if (b.dataset.i != null) { obj[d.k] = knownIcons()[+b.dataset.i]; changed(); draw(); return; }
        if (b.dataset.a === 'pick') draw(true);
        if (b.dataset.a === 'code') draw(false, true);
        if (b.dataset.a === 'up') {
          const [f] = await pickFiles('image/*'); if (!f) return;
          try { const r = await processImage(f, 'icon', 'icon'); obj[d.k] = r.src; changed(); draw(); } catch (err) { toast(err.message, 'err'); }
        }
      };
      const ta = $('textarea', box);
      if (ta) ta.addEventListener('input', () => {
        const t = ta.value.trim();
        if (!t || /^<svg[\s\S]*<\/svg>$/i.test(t)) { obj[d.k] = t.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+="[^"]*"/gi, ''); $('.pv', box).innerHTML = PS.icon(obj[d.k], 32) || '—'; changed(); }
      });
    }
    draw();
  }

  function listField(box, obj, d, onChange) {
    obj[d.k] = obj[d.k] || [];
    const arr = obj[d.k];
    const openSet = new Set();
    function draw() {
      box.innerHTML = `${d.l ? `<div class="lbl">${e(d.l)}</div>` : ''}${d.h ? `<div class="hint" style="margin:-2px 0 8px">${d.h}</div>` : ''}<div class="list"></div>
        <button type="button" class="btn sm add">${svg('plus', 13)}${e(d.add || 'Add item')}</button>`;
      const list = $('.list', box);
      arr.forEach((it, i) => {
        const el = document.createElement('div');
        el.className = 'item' + (openSet.has(it) ? ' open' : '');
        el.innerHTML = `<div class="item-h" role="button" tabindex="0" aria-expanded="${openSet.has(it)}">
            <span class="car">${svg('car', 14)}</span>
            <span class="t">${d.icon ? `<span class="mini">${d.icon(it) || ''}</span>` : ''}<span class="tt"></span></span>
            <button type="button" class="ib" data-a="up" aria-label="Move up" ${i ? '' : 'disabled'}>${svg('up', 15)}</button>
            <button type="button" class="ib" data-a="down" aria-label="Move down" ${i < arr.length - 1 ? '' : 'disabled'}>${svg('down', 15)}</button>
            <button type="button" class="ib del" data-a="del" aria-label="Delete">${svg('del', 15)}</button>
          </div><div class="item-b"></div>`;
        const tt = $('.tt', el);
        const title = () => { tt.textContent = (d.title(it) || '').replace(/\n/g, ' ') || '(untitled)'; const m = $('.mini', el); if (m && d.icon) m.innerHTML = d.icon(it) || ''; };
        title();
        const body = $('.item-b', el);
        let built = false;
        const build = () => { if (built) return; built = true; fields(body, it, d.item, () => { title(); if (onChange) onChange(); }); };
        if (openSet.has(it)) build();
        const toggle = () => { const o = el.classList.toggle('open'); o ? openSet.add(it) : openSet.delete(it); $('.item-h', el).setAttribute('aria-expanded', o); build(); };
        $('.item-h', el).addEventListener('click', async ev => {
          const a = ev.target.closest('[data-a]');
          if (!a) return toggle();
          ev.stopPropagation();
          if (a.dataset.a === 'up' || a.dataset.a === 'down') {
            const j = i + (a.dataset.a === 'up' ? -1 : 1);
            [arr[i], arr[j]] = [arr[j], arr[i]]; touch(); if (onChange) onChange(); draw();
          }
          if (a.dataset.a === 'del') {
            if (d.beforeDelete && !(await d.beforeDelete(it))) return;
            if (!(await confirmBox('Delete this item?', `“${e((d.title(it) || 'Untitled').replace(/\n/g, ' '))}” will be removed from the site after you publish.`, 'Delete', true))) return;
            arr.splice(i, 1); touch(); if (onChange) onChange(); draw();
          }
        });
        $('.item-h', el).addEventListener('keydown', ev => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target === ev.currentTarget) { ev.preventDefault(); toggle(); } });
        list.append(el);
      });
      $('.add', box).onclick = () => { const n = d.make(); arr.push(n); openSet.add(n); touch(); if (onChange) onChange(); draw(); const last = $$('.item', box).pop(); if (last) { const inp = $('input,textarea', last); if (inp) inp.focus(); } };
    }
    draw();
  }

  /* ---------- tabs ---------- */
  const TABS = [
    ['projects', 'Projects', 'proj'], ['hero', 'Home header', 'hero'], ['about', 'About & skills', 'about'],
    ['categories', 'Categories', 'cats'], ['experience', 'Experience', 'exp'], ['stats', 'Stats', 'stats'],
    ['contact', 'Contact & social', 'contact'], ['site', 'Site settings', 'site'], null,
    ['github', 'Publishing (GitHub)', 'gh'], ['backup', 'Backup & restore', 'backup']
  ];
  function drawSide() {
    $('#side').innerHTML = TABS.map(t => t ? `<button type="button" data-tab="${t[0]}" aria-current="${st.tab === t[0]}">${svg(t[2], 17)}${t[1]}</button>` : '<hr>').join('');
  }
  $('#side').addEventListener('click', ev => {
    const b = ev.target.closest('[data-tab]'); if (!b) return;
    st.tab = b.dataset.tab; drawSide(); render(); $('#side').classList.remove('open'); scrollTo(0, 0);
  });
  $('#menu-t').onclick = () => $('#side').classList.toggle('open');

  const head = (title, sub, acts) => `<div class="ph"><div><h1>${e(title)}</h1><p>${sub}</p></div>${acts ? `<div class="acts">${acts}</div>` : ''}</div>`;
  const card = (title, fill) => { const c = document.createElement('div'); c.className = 'card'; if (title) c.innerHTML = `<h2>${e(title)}</h2>`; fill(c); return c; };

  function render() {
    const m = $('#main'); m.innerHTML = '';
    if (st.banner) m.insertAdjacentHTML('beforeend', st.banner);
    ({ projects: tabProjects, hero: tabHero, about: tabAbout, categories: tabCategories, experience: tabExperience, stats: tabStats, contact: tabContact, site: tabSite, github: tabGithub, backup: tabBackup })[st.tab](m);
    const bb = $('#banner-discard', m); if (bb) bb.onclick = discardDraft;
    const bc = $('#banner-close', m); if (bc) bc.onclick = () => { st.banner = ''; render(); };
  }

  /* ---- Projects ---- */
  function newProject() {
    return { id: 'new-project-' + stamp().slice(-4), title: 'New project', categories: [], tags: '', featured: false, cover: '', summary: '', date: '', role: '', description: '', highlights: [], tech: [], gallery: [], videos: [], links: [], _new: true };
  }
  function tabProjects(m) {
    const P = st.c.projects, sec = st.c.sections.projects;
    if (st.sel >= P.length) st.sel = Math.max(0, P.length - 1);
    m.insertAdjacentHTML('beforeend', head('Projects', `${P.length} projects. Starred projects appear on the home page (first ${sec.featuredCount || 6}). Drag to reorder.`,
      `<button class="btn" id="p-sec">Section text</button><button class="btn pri" id="p-add">${svg('plus', 14)}New project</button>`));
    const grid = document.createElement('div'); grid.className = 'pgrid'; m.append(grid);
    grid.innerHTML = `<div class="card plist"><div class="f"><input type="search" id="p-q" placeholder="Find a project" aria-label="Find a project"></div><ol id="p-ol"></ol></div><div id="p-ed"></div>`;
    const ol = $('#p-ol'), q = $('#p-q');
    const thumb = p => { const c = String(p.cover || ''); if (c.startsWith('illustration:')) return (st.c.illustrations || {})[c.slice(13)] || ''; return c ? `<img src="${e(PS.src(c))}" alt="" loading="lazy">` : e((p.title || '?')[0]); };
    function drawList() {
      const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
      ol.innerHTML = P.map((p, i) => ({ p, i })).filter(({ p }) => words.every(w => (p.title + ' ' + p.tags).toLowerCase().includes(w))).map(({ p, i }) =>
        `<li draggable="${words.length ? 'false' : 'true'}" data-i="${i}" aria-current="${i === st.sel}"><span class="grip" aria-hidden="true">⋮⋮</span><span class="th">${thumb(p)}</span><span class="nm"><b>${i + 1}. ${e(p.title)}</b><span>${e(p.tags || 'No tags')}</span></span><button type="button" class="ib star ${p.featured ? 'on' : ''}" data-star="${i}" aria-label="${p.featured ? 'Remove from' : 'Show on'} home page" title="Show on home page">${svg('star', 16, true)}</button></li>`).join('')
        || '<li style="cursor:default;color:var(--grey)">No match</li>';
    }
    ol.addEventListener('click', ev => {
      const s = ev.target.closest('[data-star]');
      if (s) { const p = P[+s.dataset.star]; p.featured = !p.featured; touch(); drawList(); if (+s.dataset.star === st.sel) drawEditor(); return; }
      const li = ev.target.closest('li[data-i]'); if (!li) return;
      st.sel = +li.dataset.i; drawList(); drawEditor();
      if (innerWidth < 1000) $('#p-ed').scrollIntoView({ behavior: 'smooth' });
    });
    let dragI = null;
    ol.addEventListener('dragstart', ev => { const li = ev.target.closest('li[data-i]'); if (!li) return; dragI = +li.dataset.i; li.classList.add('dragging'); ev.dataTransfer.effectAllowed = 'move'; });
    ol.addEventListener('dragover', ev => { ev.preventDefault(); $$('li.over', ol).forEach(x => x.classList.remove('over')); const li = ev.target.closest('li[data-i]'); if (li) li.classList.add('over'); });
    ol.addEventListener('dragend', () => { $$('li', ol).forEach(x => x.classList.remove('over', 'dragging')); });
    ol.addEventListener('drop', ev => {
      ev.preventDefault(); const li = ev.target.closest('li[data-i]'); if (!li || dragI === null) return;
      const to = +li.dataset.i; if (to === dragI) return;
      const cur = P[st.sel]; const [it] = P.splice(dragI, 1); P.splice(to, 0, it); st.sel = P.indexOf(cur); dragI = null;
      touch(); drawList(); drawEditor();
    });
    q.addEventListener('input', drawList);
    $('#p-add').onclick = () => { P.unshift(newProject()); st.sel = 0; touch(); drawList(); drawEditor(); const t = $('#p-ed input'); if (t) { t.focus(); t.select(); } };
    $('#p-sec').onclick = () => {
      modal.open(`<h3>Featured projects section</h3><div id="sec-f"></div><div class="acts"><button class="btn pri" data-close>Done</button></div>`);
      fields($('#sec-f'), sec, [{ k: 'title', l: 'Heading' }, { k: 'subtitle', l: 'Line under heading' }, { k: 'linkLabel', l: 'Link text' }, { k: 'featuredCount', t: 'number', l: 'How many starred projects on home page', h: 'The home grid fits 6 per row on desktop.' }]);
    };

    function drawEditor() {
      const ed = $('#p-ed'); ed.innerHTML = '';
      const p = P[st.sel];
      if (!p) { ed.innerHTML = `<div class="card empty"><b>No projects yet</b>Create your first project to show it on the site.</div>`; return; }
      p.categories = p.categories || []; p.gallery = p.gallery || []; p.videos = p.videos || []; p.links = p.links || [];
      const bar = document.createElement('div'); bar.className = 'ph';
      bar.innerHTML = `<div><h1 style="font-size:18px">${e(p.title || 'Untitled')}</h1><p>project.html?id=${e(p.id)}</p></div><div class="acts">
        <button class="ib" data-a="up" aria-label="Move up" title="Move up" ${st.sel ? '' : 'disabled'}>${svg('up', 16)}</button>
        <button class="ib" data-a="down" aria-label="Move down" title="Move down" ${st.sel < P.length - 1 ? '' : 'disabled'}>${svg('down', 16)}</button>
        <button class="btn sm" data-a="dup">${svg('copy', 13)}Duplicate</button>
        <button class="btn sm" data-a="view">Preview</button>
        <button class="btn sm danger" data-a="del">${svg('del', 13)}Delete</button></div>`;
      ed.append(bar);
      bar.onclick = async ev => {
        const a = ev.target.closest('[data-a]'); if (!a) return;
        const act = a.dataset.a;
        if (act === 'up' || act === 'down') { const j = st.sel + (act === 'up' ? -1 : 1); [P[st.sel], P[j]] = [P[j], P[st.sel]]; st.sel = j; touch(); drawList(); drawEditor(); }
        if (act === 'dup') { const c = clone(p); c.id = uniqueId(p.id + '-copy'); c.title = p.title + ' (copy)'; P.splice(st.sel + 1, 0, c); st.sel++; touch(); drawList(); drawEditor(); toast('Project duplicated'); }
        if (act === 'view') { await saveDraft(); window.open(`project.html?id=${encodeURIComponent(p.id)}&draft=1`, '_blank'); }
        if (act === 'del') { if (await confirmBox('Delete project?', `“${e(p.title)}” and its photo list will be removed from the site after you publish.`, 'Delete project', true)) { P.splice(st.sel, 1); st.sel = Math.max(0, st.sel - 1); touch(); drawList(); drawEditor(); } }
      };
      const titleEl = $('h1', bar), urlEl = $('p', bar);
      ed.append(card('Basics', c => fields(c, p, [
        { k: 'title', l: 'Project title', onInput: v => { titleEl.textContent = v || 'Untitled'; if (p._new) { p.id = uniqueId(slugify(v), p); urlEl.textContent = 'project.html?id=' + p.id; const idIn = $$('#p-ed input')[1]; if (idIn) idIn.value = p.id; } drawListSoon(); } },
        { k: 'id', l: 'Link name (URL)', h: 'Lowercase words with dashes. Changing it breaks old shared links.', onInput: (v, b) => { delete p._new; urlEl.textContent = 'project.html?id=' + v; }, onBlur: (inp) => { const s = uniqueId(slugify(inp.value), p); if (s !== p.id || inp.value !== s) { p.id = s; inp.value = s; urlEl.textContent = 'project.html?id=' + s; touch(); } } },
        { t: 'toggle', k: 'featured', l: 'Show on home page', h: 'Starred projects fill the Featured Projects grid in list order.' },
        { t: 'checks', k: 'categories', l: 'Categories', o: () => st.c.categories.map(x => [x.id, x.name]) },
        { k: 'tags', l: 'Short tags (shown on card)', ph: 'AI | Robotics | Sensors', h: 'Separate with a | bar.', onInput: drawListSoon },
        { t: 'area', k: 'summary', l: 'One-line summary', rows: 2, h: 'Shown at the top of the project page and used for search.' },
        { t: 'row', f: [{ k: 'date', l: 'Date or year', ph: '2025' }, { k: 'role', l: 'My role', ph: 'Design, wiring and code' }] }
      ])));
      ed.append(card('Cover image', c => fields(c, p, [
        { t: 'cover', k: 'cover', l: 'Card image', preset: 'cover', name: () => p.id + '-cover', h: 'Shown on project cards. Square-ish photos work best. Resized to 800px automatically.' }
      ], () => drawListSoon())));
      ed.append(card('Photo gallery', c => galleryEditor(c, p)));
      ed.append(card('YouTube videos', c => videoEditor(c, p)));
      ed.append(card('Write-up', c => {
        fields(c, p, [
          { t: 'area', k: 'description', l: 'Full description', rows: 10, h: 'Formatting: <code>## Heading</code>, <code>**bold**</code>, <code>- list item</code>, <code>1. step</code>, <code>[link text](https://…)</code>. Leave a blank line between paragraphs.' },
          { t: 'lines', k: 'highlights', l: 'Key features', rows: 4, ph: 'One feature per line' },
          { t: 'lines', k: 'tech', l: 'Built with', rows: 3, ph: 'ESP32\nArduino IDE\nMIT App Inventor', h: 'One per line.' },
          { t: 'list', k: 'links', l: 'Buttons / links', add: 'Add link', title: x => x.label || x.url, make: () => ({ label: 'GitHub code', url: '' }), item: [{ k: 'label', l: 'Button text' }, { k: 'url', l: 'Link', ph: 'https://' }] }
        ]);
      }));
    }
    let lt; function drawListSoon() { clearTimeout(lt); lt = setTimeout(drawList, 150); }
    drawList(); drawEditor();
  }
  function uniqueId(s, self) {
    let id = s || 'project', n = 2;
    while (st.c.projects.some(p => p !== self && p.id === id)) id = `${s}-${n++}`;
    return id;
  }

  function galleryEditor(c, p) {
    c.innerHTML = `<h2>Photo gallery <span class="hint" style="font-weight:400;margin-left:auto">${p.gallery.length} photo${p.gallery.length === 1 ? '' : 's'}</span></h2>
      <div class="drop" tabindex="0" role="button"><b>Drop photos here or click to choose</b>JPG, PNG or WebP. Big photos are resized to 1600px and a small preview is made for fast loading.</div>
      <div class="prog"><i></i></div><div class="gal"></div>`;
    const drop = $('.drop', c), gal = $('.gal', c), prog = $('.prog', c);
    function draw() {
      $('h2 .hint', c).textContent = `${p.gallery.length} photo${p.gallery.length === 1 ? '' : 's'}`;
      gal.innerHTML = p.gallery.map((g, i) => `<div class="gi" draggable="true" data-i="${i}"><div class="im"><img src="${e(PS.src(g.thumb || g.src))}" alt="" loading="lazy"></div>
        <span class="no">${i + 1}${pending.has(g.src) ? ' · new' : ''}</span>
        <div class="tools"><button type="button" data-a="cover" title="Use as cover" aria-label="Use as cover">${svg('cover', 13)}</button><button type="button" data-a="l" aria-label="Move left" title="Move left">${svg('left', 13)}</button><button type="button" data-a="r" aria-label="Move right" title="Move right">${svg('right', 13)}</button><button type="button" class="del" data-a="del" aria-label="Remove photo" title="Remove">${svg('del', 13)}</button></div>
        <input type="text" value="${e(g.caption || '')}" placeholder="Caption (optional)" aria-label="Caption for photo ${i + 1}"></div>`).join('');
    }
    async function add(files) {
      files = files.filter(f => /^image\//.test(f.type));
      if (!files.length) return;
      prog.classList.add('on');
      let done = 0;
      for (const f of files) {
        try { const r = await processImage(f, 'gallery', p.id); p.gallery.push({ src: r.src, thumb: r.thumb, caption: '' }); }
        catch (err) { toast(`${f.name}: ${err.message}`, 'err'); }
        done++; $('i', prog).style.width = (done / files.length * 100) + '%';
      }
      if (!p.cover && p.gallery[0]) { p.cover = p.gallery[0].thumb || p.gallery[0].src; }
      setTimeout(() => { prog.classList.remove('on'); $('i', prog).style.width = 0; }, 400);
      touch(); draw(); toast(`${done} photo${done > 1 ? 's' : ''} added`, 'ok');
    }
    drop.onclick = async () => add(await pickFiles('image/*', true));
    drop.onkeydown = async ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); add(await pickFiles('image/*', true)); } };
    ['dragenter', 'dragover'].forEach(n => drop.addEventListener(n, ev => { ev.preventDefault(); drop.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(n => drop.addEventListener(n, () => drop.classList.remove('drag')));
    drop.addEventListener('drop', ev => { ev.preventDefault(); add([...ev.dataTransfer.files]); });
    gal.addEventListener('click', ev => {
      const a = ev.target.closest('[data-a]'); if (!a) return;
      const i = +a.closest('.gi').dataset.i, G = p.gallery;
      if (a.dataset.a === 'del') { G.splice(i, 1); }
      if (a.dataset.a === 'l' && i > 0) [G[i - 1], G[i]] = [G[i], G[i - 1]];
      if (a.dataset.a === 'r' && i < G.length - 1) [G[i + 1], G[i]] = [G[i], G[i + 1]];
      if (a.dataset.a === 'cover') { p.cover = G[i].src; toast('Cover image updated'); }
      touch(); draw();
    });
    gal.addEventListener('input', ev => { const gi = ev.target.closest('.gi'); if (gi) { p.gallery[+gi.dataset.i].caption = ev.target.value; touch(); } });
    let from = null;
    gal.addEventListener('dragstart', ev => { const gi = ev.target.closest('.gi'); if (!gi) return; from = +gi.dataset.i; gi.classList.add('dragging'); });
    gal.addEventListener('dragover', ev => { if (from === null) return; ev.preventDefault(); $$('.over', gal).forEach(x => x.classList.remove('over')); const gi = ev.target.closest('.gi'); if (gi) gi.classList.add('over'); });
    gal.addEventListener('dragend', () => { from = null; $$('.gi', gal).forEach(x => x.classList.remove('over', 'dragging')); });
    gal.addEventListener('drop', ev => { if (from === null) return; ev.preventDefault(); ev.stopPropagation(); const gi = ev.target.closest('.gi'); if (!gi) return; const to = +gi.dataset.i; const [x] = p.gallery.splice(from, 1); p.gallery.splice(to, 0, x); from = null; touch(); draw(); });
    draw();
  }

  function videoEditor(c, p) {
    c.innerHTML = `<h2>YouTube videos</h2><div class="hint" style="margin:-6px 0 10px">Upload the video to YouTube (Public or Unlisted), then paste its link. Normal, youtu.be and Shorts links all work. Videos load only when a visitor taps play, so the page stays fast.</div><div class="vids"></div><button type="button" class="btn sm add">${svg('plus', 13)}Add video</button>`;
    const box = $('.vids', c);
    function draw() {
      box.innerHTML = p.videos.map((v, i) => {
        const id = PS.youtubeId(v.url);
        return `<div class="vid" data-i="${i}"><div class="yth ${v.url && !id ? 'bad' : ''}" style="${id ? `background-image:url(https://i.ytimg.com/vi/${id}/mqdefault.jpg)` : ''}">${id ? '' : v.url ? 'Link not recognised' : 'Paste link'}</div>
          <div class="fs"><input type="url" data-k="url" value="${e(v.url || '')}" placeholder="https://youtu.be/…" aria-label="YouTube link"><input type="text" data-k="title" value="${e(v.title || '')}" placeholder="Video title (optional)" aria-label="Video title"></div>
          <div class="btns"><button type="button" class="ib" data-a="up" aria-label="Move up" ${i ? '' : 'disabled'}>${svg('up', 15)}</button><button type="button" class="ib" data-a="down" aria-label="Move down" ${i < p.videos.length - 1 ? '' : 'disabled'}>${svg('down', 15)}</button><button type="button" class="ib del" data-a="del" aria-label="Remove video">${svg('del', 15)}</button></div></div>`;
      }).join('') || '<div class="hint">No videos yet.</div>';
    }
    box.addEventListener('input', ev => {
      const row = ev.target.closest('.vid'); if (!row) return;
      const v = p.videos[+row.dataset.i]; v[ev.target.dataset.k] = ev.target.value; touch();
      if (ev.target.dataset.k === 'url') {
        const id = PS.youtubeId(v.url), th = $('.yth', row);
        th.classList.toggle('bad', !!v.url && !id);
        th.style.backgroundImage = id ? `url(https://i.ytimg.com/vi/${id}/mqdefault.jpg)` : '';
        th.textContent = id ? '' : v.url ? 'Link not recognised' : 'Paste link';
      }
    });
    box.addEventListener('click', ev => {
      const a = ev.target.closest('[data-a]'); if (!a) return;
      const i = +a.closest('.vid').dataset.i, V = p.videos;
      if (a.dataset.a === 'del') V.splice(i, 1);
      if (a.dataset.a === 'up') [V[i - 1], V[i]] = [V[i], V[i - 1]];
      if (a.dataset.a === 'down') [V[i + 1], V[i]] = [V[i], V[i + 1]];
      touch(); draw();
    });
    $('.add', c).onclick = () => { p.videos.push({ url: '', title: '' }); touch(); draw(); const ins = $$('input[data-k=url]', box); ins[ins.length - 1].focus(); };
    draw();
  }

  /* ---- Home header ---- */
  function tabHero(m) {
    const H = st.c.hero;
    m.insertAdjacentHTML('beforeend', head('Home header', 'The big banner at the top of the home page.', `<button class="btn" data-prev>Preview home</button>`));
    m.append(card('Text', c => fields(c, H, [
      { t: 'row', f: [{ k: 'greeting', l: 'Small greeting' }, { k: 'firstName', l: 'First name (white)' }] },
      { t: 'row', f: [{ k: 'lastName', l: 'Last name (blue)' }, { k: 'primaryLabel', l: 'Main button text' }] },
      { t: 'area', k: 'roles', l: 'Roles', rows: 2, h: 'Press Enter for a new line.' },
      { t: 'area', k: 'intro', l: 'Intro lines', rows: 2 },
      { t: 'row', f: [{ k: 'location', l: 'Location' }, { k: 'email', l: 'Email' }] },
      { t: 'row', f: [{ k: 'linkedinLabel', l: 'LinkedIn text' }, { k: 'linkedinUrl', l: 'LinkedIn link', ph: 'https://linkedin.com/in/…' }] },
      { t: 'area', k: 'quote', l: 'Quote (right side)', rows: 2 }
    ])));
    m.append(card('Images', c => fields(c, H, [
      { t: 'image', k: 'photo', l: 'Your photo', preset: 'photo', name: () => 'hero-photo', h: 'Use a PNG/WebP with a transparent background for the cut-out look. Resized to 900px.' },
      { t: 'image', k: 'background', l: 'Background image', preset: 'bg', name: () => 'hero-bg', h: 'Wide image, at least 1440px. The left side is darkened so text stays readable.' }
    ])));
    m.append(card('Resume', c => fields(c, H, [
      { k: 'resumeLabel', l: 'Button text' },
      { t: 'file', k: 'resumeUrl', l: 'Resume file (PDF)', accept: '.pdf,application/pdf', h: 'Used by “Download Resume” and “View Full Resume”. Without a file the buttons scroll to Contact.' }
    ])));
    m.append(card('Right side labels', c => fields(c, H, [
      { t: 'list', k: 'rail', add: 'Add label', title: x => x.label, icon: x => PS.icon(x.icon, 22), make: () => ({ label: 'New label', icon: knownIcons()[0] || '' }), item: [{ t: 'area', k: 'label', l: 'Label', rows: 2 }, { t: 'icon', k: 'icon', l: 'Icon' }], h: 'Up to 5 fit well. Hidden on tablets and phones.' }
    ])));
  }

  /* ---- About ---- */
  function tabAbout(m) {
    const A = st.c.about, SK = st.c.skillsSection;
    m.insertAdjacentHTML('beforeend', head('About & skills', 'The two cards below the header.', `<button class="btn" data-prev>Preview home</button>`));
    m.append(card('About card', c => fields(c, A, [
      { t: 'row', f: [{ k: 'title', l: 'Small title' }, { k: 'heading', l: 'Heading' }] },
      { t: 'area', k: 'text', l: 'Text', rows: 5 },
      { t: 'image', k: 'photo', l: 'Photo', preset: 'photo', name: () => 'about-photo', h: 'Portrait photo, cropped to fit.' }
    ])));
    m.append(card('Skills', c => {
      fields(c, SK, [{ t: 'row', f: [{ k: 'title', l: 'Heading' }, { k: 'linkLabel', l: 'Link text' }] }]);
      fields(c, st.c, [{ t: 'list', k: 'skills', add: 'Add skill', title: x => x.name, icon: x => PS.icon(x.icon, 22), make: () => ({ name: 'New skill', icon: knownIcons()[0] || '' }), item: [{ t: 'area', k: 'name', l: 'Name', rows: 2, h: 'Enter makes a second line.' }, { t: 'icon', k: 'icon', l: 'Icon' }], h: 'The grid shows 4 per row.' }]);
    }));
  }

  /* ---- Categories ---- */
  function tabCategories(m) {
    const S = st.c.sections.categories;
    m.insertAdjacentHTML('beforeend', head('Categories', 'Group projects so visitors can filter them.'));
    m.append(card('Section text', c => fields(c, S, [{ t: 'row', f: [{ k: 'title', l: 'Heading' }, { k: 'subtitle', l: 'Line under heading' }] }, { k: 'linkLabel', l: 'Link text' }])));
    const count = id => st.c.projects.filter(p => (p.categories || []).includes(id)).length;
    m.append(card('Categories', c => fields(c, st.c, [{
      t: 'list', k: 'categories', add: 'Add category', title: x => `${x.name}  (${count(x.id)} projects)`, icon: x => PS.icon(x.icon, 22),
      make: () => ({ id: 'category-' + stamp().slice(-4), name: 'New category', subtitle: '', icon: knownIcons()[0] || '' }),
      beforeDelete: async x => { const n = count(x.id); if (n) { st.c.projects.forEach(p => p.categories = (p.categories || []).filter(y => y !== x.id)); toast(`Removed from ${n} project${n > 1 ? 's' : ''}`); } return true; },
      item: [
        { k: 'name', l: 'Name' },
        { k: 'subtitle', l: 'Small text', ph: 'Leave empty to show the project count', h: 'Empty = automatic count like “12 Projects”.' },
        { k: 'id', l: 'Link name', h: 'Lowercase words with dashes. Used in projects.html?cat=…', onBlur: inp => { inp.value = slugify(inp.value); } },
        { t: 'icon', k: 'icon', l: 'Icon' }
      ]
    }])));
    /* keep project references in sync when a category link name changes */
    const ids = st.c.categories.map(x => x.id);
    m.addEventListener('focusin', () => { ids.length = 0; st.c.categories.forEach(x => ids.push(x.id)); });
    m.addEventListener('focusout', () => {
      st.c.categories.forEach((x, i) => {
        const clean = slugify(x.id);
        if (clean !== x.id) x.id = clean;
        const old = ids[i];
        if (old && old !== x.id) st.c.projects.forEach(p => { p.categories = (p.categories || []).map(y => y === old ? x.id : y); });
      });
      touch();
    });
  }

  /* ---- Experience ---- */
  function tabExperience(m) {
    m.insertAdjacentHTML('beforeend', head('Experience', 'Jobs and roles, newest first.'));
    m.append(card('Section text', c => fields(c, st.c.sections.experience, [{ t: 'row', f: [{ k: 'title', l: 'Heading' }, { k: 'subtitle', l: 'Line under heading' }] }, { k: 'linkLabel', l: 'Link text' }])));
    m.append(card('Roles', c => fields(c, st.c, [{
      t: 'list', k: 'experience', add: 'Add role', title: x => `${x.company} — ${x.role}`, icon: x => x.logo ? `<img src="${e(PS.src(x.logo))}" alt="">` : '',
      make: () => ({ company: 'Company name', role: 'Role', current: false, period: '', location: '', logo: '' }),
      item: [
        { t: 'row', f: [{ k: 'company', l: 'Company' }, { k: 'role', l: 'Role' }] },
        { t: 'row', f: [{ k: 'period', l: 'Period', ph: 'May 2024 - Present (2 years)' }, { k: 'location', l: 'Location' }] },
        { t: 'toggle', k: 'current', l: 'I work here now (green dot)' },
        { t: 'image', k: 'logo', l: 'Logo', preset: 'logo', name: () => 'logo' }
      ]
    }])));
  }

  /* ---- Stats ---- */
  function tabStats(m) {
    m.insertAdjacentHTML('beforeend', head('Stats', 'Numbers count up when visitors scroll to them. Text values (like “Multiple”) show as-is.'));
    m.append(card('Section text', c => fields(c, st.c.sections.stats, [{ t: 'row', f: [{ k: 'title', l: 'Heading' }, { k: 'subtitle', l: 'Line under heading' }] }])));
    m.append(card('Stats', c => fields(c, st.c, [{
      t: 'list', k: 'stats', add: 'Add stat', title: x => `${x.value}${x.suffix || ''} ${x.label}`, icon: x => PS.icon(x.icon, 22),
      make: () => ({ value: '10', suffix: '+', label: 'Label', sub: '', icon: knownIcons()[0] || '' }),
      item: [
        { t: 'row', f: [{ k: 'value', l: 'Number or word' }, { k: 'suffix', l: 'After number', ph: '+' }] },
        { t: 'row', f: [{ k: 'label', l: 'Label' }, { k: 'sub', l: 'Small text' }] },
        { t: 'icon', k: 'icon', l: 'Icon' }
      ]
    }])));
  }

  /* ---- Contact ---- */
  function tabContact(m) {
    const K = st.c.contact;
    m.insertAdjacentHTML('beforeend', head('Contact & social', 'Contact form, details and social icons.'));
    m.append(card('Section text', c => fields(c, st.c.sections.contact, [{ t: 'row', f: [{ k: 'title', l: 'Heading' }, { k: 'topicLabel', l: 'Topic question' }] }, { k: 'subtitle', l: 'Line under heading' }])));
    m.append(card('Details', c => fields(c, K, [
      { t: 'row', f: [{ k: 'email', l: 'Email' }, { k: 'location', l: 'Location' }] },
      { k: 'formEndpoint', l: 'Form service link (optional)', ph: 'https://formspree.io/f/xxxxxxx', h: 'Empty: the form opens the visitor’s email app. With a free <a href="https://formspree.io" target="_blank" rel="noopener">Formspree</a> link, messages arrive in your inbox directly.' }
    ])));
    m.append(card('Social icons', c => {
      fields(c, st.c.socials, [
        { t: 'row', f: [{ k: 'linkedin', l: 'LinkedIn', ph: 'https://' }, { k: 'youtube', l: 'YouTube channel', ph: 'https://youtube.com/@…' }] },
        { t: 'row', f: [{ k: 'instagram', l: 'Instagram', ph: 'https://instagram.com/…' }, { k: 'github', l: 'GitHub', ph: 'https://github.com/…' }] }
      ]);
      c.insertAdjacentHTML('beforeend', '<div class="hint">Leave a box empty to hide that icon.</div>');
    }));
    m.append(card('Form topics', c => fields(c, K, [{
      t: 'list', k: 'topics', add: 'Add topic', title: x => x.label, icon: x => PS.icon(x.icon, 18),
      make: () => ({ label: 'New topic', icon: knownIcons()[0] || '' }), item: [{ k: 'label', l: 'Label' }, { t: 'icon', k: 'icon', l: 'Icon' }]
    }])));
  }

  /* ---- Site ---- */
  function tabSite(m) {
    const S = st.c.site;
    m.insertAdjacentHTML('beforeend', head('Site settings', 'Name, logo text and search engine details.'));
    m.append(card('Brand', c => fields(c, S, [
      { t: 'row', f: [{ k: 'name', l: 'Name in logo' }, { k: 'tagline', l: 'Tagline under name' }] },
      { t: 'row', f: [{ k: 'logoFirst', l: 'Logo letter 1 (dark)' }, { k: 'logoSecond', l: 'Logo letter 2 (blue)' }] },
      { t: 'row', f: [{ k: 'ctaLabel', l: 'Top-right button' }, { k: 'footerText', l: 'Footer text', h: 'A ❤ becomes the beating heart.' }] }
    ])));
    m.append(card('Search engines & sharing', c => fields(c, S, [
      { k: 'title', l: 'Browser tab title' },
      { t: 'area', k: 'description', l: 'Description', rows: 3, h: 'About 150 characters. Google may show this under your name.' }
    ])));
  }

  /* ---- GitHub ---- */
  function guessRepo() {
    const h = location.hostname, parts = location.pathname.split('/').filter(Boolean);
    if (h.endsWith('.github.io')) {
      const owner = h.replace('.github.io', '');
      const repo = parts.length && !parts[0].includes('.') ? parts[0] : h;
      return { owner, repo };
    }
    return {};
  }
  function saveGh(remember) {
    const s = JSON.stringify(st.gh);
    localStorage.removeItem('ps-gh'); sessionStorage.removeItem('ps-gh');
    (remember ? localStorage : sessionStorage).setItem('ps-gh', s);
  }
  function tabGithub(m) {
    const g = st.gh, guess = guessRepo();
    if (!g.owner && guess.owner) { g.owner = guess.owner; g.repo = guess.repo; }
    if (!g.branch) g.branch = 'main';
    m.insertAdjacentHTML('beforeend', head('Publishing (GitHub)', 'Connect once. After that the Publish button updates the live site in about a minute.'));
    m.append(card('How to get a token (one time)', c => c.insertAdjacentHTML('beforeend', `<ol style="padding-left:1.2em;color:#3f576f;display:grid;gap:4px">
      <li>Open <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub → Fine-grained token</a>.</li>
      <li>Token name: <b>portfolio editor</b>. Expiration: 1 year.</li>
      <li>Repository access: <b>Only select repositories</b> → choose your site repository.</li>
      <li>Permissions → Repository permissions → <b>Contents: Read and write</b>.</li>
      <li>Click Generate token, copy it and paste it below.</li></ol>
      <p class="hint" style="margin-top:8px">The token stays in this browser only. It is never written into the website files. Do not share it.</p>`)));
    m.append(card('Repository', c => {
      fields(c, g, [
        { t: 'row', f: [{ k: 'owner', l: 'GitHub username', ph: 'princesukhwal' }, { k: 'repo', l: 'Repository name', ph: 'princesukhwal.github.io' }] },
        { t: 'row', f: [{ k: 'branch', l: 'Branch', ph: 'main' }, { k: 'dir', l: 'Site folder in repo', ph: 'leave empty for root', h: 'Only if your site lives in a folder such as docs.' }] }
      ]);
      c.insertAdjacentHTML('beforeend', `<div class="f"><label>Access token</label><input type="password" id="gh-t" value="${e(g.token || '')}" placeholder="github_pat_…" autocomplete="off"></div>
        <label class="tog" style="margin-bottom:12px"><input type="checkbox" id="gh-rem" ${localStorage.getItem('ps-gh') ? 'checked' : ''}>Remember on this device</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" id="gh-test">Save & test connection</button><button class="btn" id="gh-pull">Load published content from GitHub</button><button class="btn danger" id="gh-forget">Forget token</button></div>
        <div id="gh-out" class="hint" style="margin-top:10px"></div>`);
      $('#gh-t', c).addEventListener('input', ev => { g.token = ev.target.value.trim(); });
      $('#gh-test', c).onclick = async () => {
        saveGh($('#gh-rem').checked);
        const out = $('#gh-out'); out.textContent = 'Checking…';
        try {
          const r = await gh(`/repos/${g.owner}/${g.repo}`);
          if (!r.permissions || !r.permissions.push) throw new Error('Token can read but not write. Set Contents: Read and write.');
          await gh(`/repos/${g.owner}/${g.repo}/git/ref/heads/${g.branch}`);
          out.innerHTML = `<span style="color:var(--green);font-weight:600">Connected to ${e(r.full_name)} (${e(g.branch)}).</span> Publish is ready.`;
          toast('GitHub connected', 'ok');
        } catch (err) { out.innerHTML = `<span style="color:var(--red)">${e(friendly(err))}</span>`; }
      };
      $('#gh-pull', c).onclick = pullRemote;
      $('#gh-forget', c).onclick = () => { g.token = ''; localStorage.removeItem('ps-gh'); sessionStorage.removeItem('ps-gh'); render(); toast('Token removed from this browser'); };
      c.addEventListener('input', () => saveGh($('#gh-rem') ? $('#gh-rem').checked : false));
    }));
  }
  const ghReady = () => st.gh.owner && st.gh.repo && st.gh.token;
  const repoPath = p => ((st.gh.dir || '').replace(/^\/+|\/+$/g, '') ? st.gh.dir.replace(/^\/+|\/+$/g, '') + '/' : '') + p;
  async function gh(path, opt) {
    opt = opt || {};
    const r = await fetch('https://api.github.com' + path, {
      method: opt.method || 'GET', cache: 'no-store',
      headers: Object.assign({ Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + st.gh.token, 'X-GitHub-Api-Version': '2022-11-28' }, opt.body ? { 'Content-Type': 'application/json' } : {}),
      body: opt.body ? JSON.stringify(opt.body) : undefined
    });
    if (!r.ok) { let msg = ''; try { msg = (await r.json()).message; } catch (x) { } const er = new Error(msg || r.statusText); er.status = r.status; throw er; }
    return r.status === 204 ? null : r.json();
  }
  function friendly(err) {
    if (err.status === 401) return 'The token is wrong or expired. Create a new one.';
    if (err.status === 403) return 'GitHub refused access. Check the token has Contents: Read and write for this repository. (' + err.message + ')';
    if (err.status === 404) return 'Repository or branch not found. Check the username, repository name, branch and that the token includes this repository.';
    if (err.status === 409) return 'The repository is empty. Upload the website files once first (see README).';
    if (err.status === 422) return 'GitHub rejected the update: ' + err.message;
    if (err instanceof TypeError) return 'No internet connection, or GitHub could not be reached.';
    return err.message;
  }
  function b64utf8(b64) { const bin = atob(b64.replace(/\n/g, '')); return new TextDecoder().decode(Uint8Array.from(bin, ch => ch.charCodeAt(0))); }
  async function remoteContent() {
    const f = await gh(`/repos/${st.gh.owner}/${st.gh.repo}/contents/${repoPath('data/content.js')}?ref=${encodeURIComponent(st.gh.branch)}`);
    let text;
    if (f.content) text = b64utf8(f.content);
    else { const b = await gh(`/repos/${st.gh.owner}/${st.gh.repo}/git/blobs/${f.sha}`); text = b64utf8(b.content); }
    return parseContentJs(text);
  }
  async function pullRemote() {
    if (!ghReady()) return toast('Add your GitHub details first.', 'err');
    if (isDirty() && !(await confirmBox('Replace your draft?', 'Your unpublished edits on this device will be replaced by the version that is live on GitHub.', 'Load published version', true))) return;
    try {
      const c = await remoteContent();
      st.c = c; PS.c = c; st.base = JSON.stringify(c); st.sel = 0; st.banner = '';
      await saveDraft(); drawSide(); render(); updateState(); toast('Loaded the published version', 'ok');
    } catch (err) { toast(friendly(err), 'err'); }
  }
  function blobToB64(blob) {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
  }

  function validate() {
    const problems = [], ids = new Set();
    st.c.projects.forEach((p, i) => {
      if (!p.title) problems.push(`Project ${i + 1} has no title.`);
      if (!p.id) problems.push(`“${p.title}” has no link name.`);
      else if (ids.has(p.id)) problems.push(`Two projects use the link name “${p.id}”.`);
      ids.add(p.id);
      (p.videos || []).forEach(v => { if (v.url && !PS.youtubeId(v.url)) problems.push(`“${p.title}” has a YouTube link that is not recognised.`); });
    });
    return problems;
  }

  async function publish() {
    if (!ghReady()) {
      modal.open(`<h3>Connect GitHub first</h3><p>Publishing needs your GitHub username, repository and an access token. It takes about two minutes, one time.</p><p class="hint">Without GitHub you can still use <b>Backup & restore → Download update package</b> and upload the files on github.com by hand.</p><div class="acts"><button class="btn" data-close>Not now</button><button class="btn pri" id="go-gh">Set up publishing</button></div>`);
      $('#go-gh').onclick = () => { modal.close(); st.tab = 'github'; drawSide(); render(); };
      return;
    }
    const problems = validate();
    if (problems.length) {
      modal.open(`<h3>Fix these before publishing</h3><ol>${problems.map(x => `<li>${e(x)}</li>`).join('')}</ol><div class="acts"><button class="btn pri" data-close>OK</button></div>`);
      return;
    }
    const files = referencedPending();
    if (!isDirty()) { toast('Nothing new to publish.'); return; }
    let totalSize = 0;
    for (const f of files) { const r = await PS.db.get('files', f); totalSize += r ? r.blob.size : 0; }
    modal.open(`<h3>Publish to the live site</h3>
      <p>This saves your changes to <b>${e(st.gh.owner)}/${e(st.gh.repo)}</b>${files.length ? ` and uploads <b>${files.length} file${files.length > 1 ? 's' : ''}</b> (${kb(totalSize)})` : ''}. The site updates in about 1–2 minutes.</p>
      <div class="f"><label>Note for this update</label><input type="text" id="msg" value="Update portfolio content"></div>
      <div class="log" id="log" hidden></div>
      <div class="acts"><button class="btn" data-close id="cancel">Cancel</button><button class="btn pri" id="go">Publish now</button></div>`);
    $('#go').onclick = async () => {
      const log = $('#log'), go = $('#go'), msg = $('#msg').value.trim() || 'Update portfolio content';
      const say = t => { log.hidden = false; log.textContent += t + '\n'; log.scrollTop = log.scrollHeight; };
      go.disabled = true; $('#cancel').disabled = true; $('#modal-box').classList.add('busy');
      const O = st.gh.owner, R = st.gh.repo, B = st.gh.branch, base = `/repos/${O}/${R}`;
      try {
        say('Checking the live version…');
        let remote = null;
        try { remote = JSON.stringify(await remoteContent()); } catch (err) { if (err.status !== 404) throw err; }
        if (remote && remote !== st.base && remote !== JSON.stringify(st.c)) {
          $('#modal-box').classList.remove('busy');
          const ok = await new Promise(res => {
            say('The live site was changed from another device since you started editing.');
            const b = document.createElement('div'); b.className = 'acts';
            b.innerHTML = `<button class="btn" id="c-no">Stop</button><button class="btn danger" id="c-yes">Overwrite with my version</button>`;
            $('#modal-box').append(b);
            $('#c-no').onclick = () => { b.remove(); res(false); }; $('#c-yes').onclick = () => { b.remove(); res(true); };
          });
          $('#modal-box').classList.add('busy');
          if (!ok) throw new Error('Stopped. Use “Load published content from GitHub” to get the newer version.');
        }
        const ref = await gh(`${base}/git/ref/heads/${encodeURIComponent(B)}`);
        const headSha = ref.object.sha;
        const commit = await gh(`${base}/git/commits/${headSha}`);
        const tree = [];
        let i = 0;
        for (const path of files) {
          i++; say(`Uploading ${i}/${files.length}: ${path.split('/').pop()}`);
          const rec = await PS.db.get('files', path);
          if (!rec) continue;
          const blob = await gh(`${base}/git/blobs`, { method: 'POST', body: { content: await blobToB64(rec.blob), encoding: 'base64' } });
          tree.push({ path: repoPath(path), mode: '100644', type: 'blob', sha: blob.sha });
        }
        say('Saving content…');
        const clean = clone(st.c); clean.projects.forEach(p => delete p._new);
        const cb = await gh(`${base}/git/blobs`, { method: 'POST', body: { content: serialize(clean), encoding: 'utf-8' } });
        tree.push({ path: repoPath('data/content.js'), mode: '100644', type: 'blob', sha: cb.sha });
        const nt = await gh(`${base}/git/trees`, { method: 'POST', body: { base_tree: commit.tree.sha, tree } });
        const nc = await gh(`${base}/git/commits`, { method: 'POST', body: { message: msg, tree: nt.sha, parents: [headSha] } });
        await gh(`${base}/git/refs/heads/${encodeURIComponent(B)}`, { method: 'PATCH', body: { sha: nc.sha, force: false } });
        say('Done.');
        for (const p of files) await PS.db.del('files', p);
        files.forEach(p => pending.delete(p)); // object URLs stay valid until reload
        st.c.projects.forEach(p => delete p._new);
        st.base = JSON.stringify(st.c);
        await saveDraft(); updateState();
        $('#modal-box').classList.remove('busy');
        const live = O.toLowerCase() + '.github.io' + (R.toLowerCase() === O.toLowerCase() + '.github.io' ? '' : '/' + R);
        $('#modal-box').innerHTML = `<h3>Published</h3><p>Your changes are saved on GitHub. The live site refreshes in about 1–2 minutes. If you still see the old version, reload the page with <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>.</p><div class="acts"><button class="btn" data-close>Keep editing</button><a class="btn pri" href="https://${e(live)}/" target="_blank" rel="noopener">Open live site</a></div>`;
        render();
      } catch (err) {
        $('#modal-box').classList.remove('busy');
        say('Failed: ' + friendly(err));
        go.disabled = false; $('#cancel').disabled = false; go.textContent = 'Try again';
      }
    };
  }

  /* ---- Backup ---- */
  function tabBackup(m) {
    m.insertAdjacentHTML('beforeend', head('Backup & restore', 'Keep a copy of your content, or update the site by hand without a token.'));
    m.append(card('Backup', c => {
      c.insertAdjacentHTML('beforeend', `<p class="hint" style="margin-bottom:10px">Downloads all text and settings as one file. Photos already on the site are referenced by path.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" id="b-exp">Download backup (.json)</button><button class="btn" id="b-imp">Restore from backup</button></div>`);
      $('#b-exp', c).onclick = () => download(new Blob([JSON.stringify(st.c, null, 1)], { type: 'application/json' }), `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`);
      $('#b-imp', c).onclick = async () => {
        const [f] = await pickFiles('.json,.js,application/json'); if (!f) return;
        try {
          const t = await f.text(); const data = t.trim().startsWith('{') ? JSON.parse(t) : parseContentJs(t);
          if (!data.projects || !data.hero) throw new Error('This is not a portfolio backup file.');
          if (!(await confirmBox('Restore this backup?', 'Your current draft will be replaced. Nothing changes on the live site until you publish.', 'Restore'))) return;
          st.c = data; PS.c = data; st.sel = 0; touch(); render(); toast('Backup restored as draft', 'ok');
        } catch (err) { toast(err.message, 'err'); }
      };
    }));
    m.append(card('Update by hand (no token)', c => {
      c.insertAdjacentHTML('beforeend', `<ol style="padding-left:1.2em;color:#3f576f;display:grid;gap:4px;margin-bottom:12px">
        <li>Download the update package below and unzip it.</li>
        <li>On github.com open your repository → <b>Add file → Upload files</b>.</li>
        <li>Drag the <b>data</b> and <b>assets</b> folders from the unzipped package in and click <b>Commit changes</b>.</li></ol>
        <button class="btn pri" id="b-zip">Download update package (.zip)</button>`);
      $('#b-zip', c).onclick = async ev => {
        const b = ev.currentTarget; b.disabled = true; b.textContent = 'Preparing…';
        try {
          if (!window.JSZip) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'; s.onload = res; s.onerror = () => rej(new Error('Could not load the zip tool. Check your internet.')); document.head.append(s); });
          const zip = new JSZip();
          zip.file('data/content.js', serialize(st.c));
          for (const p of referencedPending()) { const r = await PS.db.get('files', p); if (r) zip.file(p, r.blob); }
          download(await zip.generateAsync({ type: 'blob' }), `portfolio-update-${new Date().toISOString().slice(0, 10)}.zip`);
        } catch (err) { toast(err.message, 'err'); }
        b.disabled = false; b.textContent = 'Download update package (.zip)';
      };
    }));
    m.append(card('Start over', c => {
      c.insertAdjacentHTML('beforeend', `<p class="hint" style="margin-bottom:10px">Throws away the draft on this device and reloads the content the website currently serves.</p><button class="btn danger" id="b-reset">Discard draft</button>`);
      $('#b-reset', c).onclick = discardDraft;
    }));
  }
  function download(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  async function discardDraft() {
    if (!(await confirmBox('Discard the draft?', 'All unpublished edits and uploaded photos on this device will be removed.', 'Discard draft', true))) return;
    await PS.db.del('kv', 'draft'); await PS.db.clear('files');
    pending.forEach(u => URL.revokeObjectURL(u)); pending.clear();
    if (ghReady()) { try { st.c = await remoteContent(); } catch (x) { st.c = clone(window.SITE_CONTENT); } }
    else st.c = clone(window.SITE_CONTENT);
    PS.c = st.c; st.base = JSON.stringify(st.c); st.sel = 0; st.banner = '';
    render(); updateState(); toast('Draft discarded');
  }

  /* ---------- global actions ---------- */
  $('#publish').onclick = publish;
  $('#preview').onclick = async () => {
    await saveDraft();
    const p = st.tab === 'projects' && st.c.projects[st.sel];
    window.open(p ? `project.html?id=${encodeURIComponent(p.id)}&draft=1` : 'index.html?draft=1', '_blank');
  };
  document.addEventListener('click', async ev => { if (ev.target.closest('[data-prev]')) { await saveDraft(); window.open('index.html?draft=1', '_blank'); } });
  document.addEventListener('keydown', ev => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); saveDraft().then(() => toast('Draft saved')); }
  });

  /* ---------- boot ---------- */
  (async function boot() {
    drawSide();
    try {
      const [draft, keys] = await Promise.all([PS.db.get('kv', 'draft'), PS.db.keys('files')]);
      for (const k of keys || []) { const r = await PS.db.get('files', k); if (r) pending.set(k, URL.createObjectURL(r.blob)); }
      if (draft && draft.content) {
        st.c = draft.content; PS.c = st.c; st.base = draft.base || st.base;
        if (JSON.stringify(st.c) !== st.base) {
          st.banner = `<div class="banner info">Continuing your draft from ${new Date(draft.savedAt).toLocaleString()}. It is not on the live site yet.<button class="btn sm" id="banner-discard">Discard draft</button><button class="ib" id="banner-close" aria-label="Hide">✕</button></div>`;
        }
      } else if (ghReady()) {
        try { const c = await remoteContent(); st.c = c; PS.c = c; st.base = JSON.stringify(c); } catch (err) { toast('Could not read GitHub: ' + friendly(err), 'err'); }
      }
    } catch (err) {
      st.banner = `<div class="banner">This browser blocks local storage (private mode?). Edits will not be kept after closing the tab — download a backup before leaving.</div>`;
    }
    ['projects', 'categories', 'experience', 'stats', 'skills'].forEach(k => { st.c[k] = st.c[k] || []; });
    render(); updateState();
  })();
  addEventListener('pagehide', () => { saveDraft(); });
})();
