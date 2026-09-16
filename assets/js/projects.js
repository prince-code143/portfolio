/* All projects page */
PS.ready(function (C) {
  'use strict';
  const e = PS.esc;
  PS.renderChrome('projects');
  document.title = 'All Projects — ' + C.site.name;

  const params = new URLSearchParams(location.search);
  let cat = params.get('cat') || 'all';
  let q = params.get('q') || '';
  if (cat !== 'all' && !C.categories.some(c => c.id === cat)) cat = 'all';

  const head = document.getElementById('phero');
  if (C.hero.background) head.style.backgroundImage = `url('${PS.src(C.hero.background)}')`;
  head.innerHTML = `<div class="phero-in">
    <nav class="crumb" aria-label="Breadcrumb"><a href="${PS.url('index.html')}">Home</a>${PS.svg.arrow(10)}<span>Projects</span></nav>
    <h1 class="up a1">All Projects</h1>
    <p class="lead up a2">${e(C.sections.projects.subtitle)}</p>
  </div>`;

  const count = id => C.projects.filter(p => (p.categories || []).includes(id)).length;
  const wrap = document.getElementById('all-wrap');
  wrap.innerHTML = `
    <div class="card toolbar rv">
      <div class="fchips" role="group" aria-label="Filter by category">
        <button type="button" class="fchip" data-cat="all" aria-pressed="false">All <i>${C.projects.length}</i></button>
        ${C.categories.map(c => `<button type="button" class="fchip" data-cat="${e(c.id)}" aria-pressed="false">${e(c.name)} <i>${count(c.id)}</i></button>`).join('')}
      </div>
      <div class="fld"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input id="q" type="search" placeholder="Search projects, tags, tech" aria-label="Search projects" value="${e(q)}"></div>
    </div>
    <p class="count-note" id="note" aria-live="polite"></p>
    <div class="p-grid all" id="grid"></div>`;

  const grid = document.getElementById('grid'), note = document.getElementById('note'), input = document.getElementById('q');
  const chips = [...wrap.querySelectorAll('.fchip')];
  const norm = s => String(s || '').toLowerCase();
  const hay = p => norm([p.title, p.tags, p.summary, (p.tech || []).join(' '), (p.categories || []).map(id => (C.categories.find(c => c.id === id) || {}).name).join(' ')].join(' '));
  const index = C.projects.map(p => [p, hay(p)]);

  function sync() {
    const sp = new URLSearchParams();
    if (cat !== 'all') sp.set('cat', cat);
    if (q) sp.set('q', q);
    if (PS.draft) sp.set('draft', '1');
    history.replaceState(null, '', location.pathname + (sp.toString() ? '?' + sp : ''));
  }

  function render(first) {
    chips.forEach(c => c.setAttribute('aria-pressed', c.dataset.cat === cat));
    const words = norm(q).split(/\s+/).filter(Boolean);
    const list = index.filter(([p, h]) => (cat === 'all' || (p.categories || []).includes(cat)) && words.every(w => h.includes(w))).map(x => x[0]);
    const catName = cat === 'all' ? '' : (C.categories.find(c => c.id === cat) || {}).name;
    note.textContent = `${list.length} project${list.length === 1 ? '' : 's'}${catName ? ' in ' + catName : ''}${q ? ` matching “${q}”` : ''}`;
    grid.innerHTML = list.length
      ? list.map(p => PS.card(p, C.projects.indexOf(p) + 1)).join('')
      : `<div class="empty"><b>No projects match</b>Try another word or show every category.<br><button type="button" class="pill" id="reset">Show all projects</button></div>`;
    if (!first) grid.querySelectorAll('.rv').forEach(x => x.classList.add('in'));
    PS.reveal(grid); PS.tilt(grid); PS.buttons(grid);
    const r = document.getElementById('reset');
    if (r) r.onclick = () => { cat = 'all'; q = ''; input.value = ''; sync(); render(); };
  }

  chips.forEach(c => c.addEventListener('click', () => { cat = c.dataset.cat; sync(); render(); }));
  let t;
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { q = input.value.trim(); sync(); render(); }, 120); });

  PS.finish('projects');
  render(true);
});
