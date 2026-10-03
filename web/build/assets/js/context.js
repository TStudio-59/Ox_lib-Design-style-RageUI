/* lib.showContext — menu contextuel à la souris (+ clavier), façon RageUI */
(() => {
  'use strict';
  const layer = RUI.layer('rui-layer--context');
  const pos = RUI.cfg.contextPosition || {};
  layer.style.paddingTop = pos.top || '15vh';
  layer.style.paddingRight = pos.right || '22vw';

  const zoom = RUI.el('<div class="rui-zoom"></div>');
  const P = RUI.buildPanel('rui-context rui-anim');
  P.el.hidden = true;
  zoom.appendChild(P.el);
  layer.appendChild(zoom);

  let data = null;
  let entries = [];
  let open = false;
  let sel = 0;

  const isInert = (o) => !!(o.disabled || o.readOnly);

  const rowHTML = ([key, o], i) => {
    o = o || {};
    const hasTitle = o.title || isNaN(+key);
    const label = hasTitle
      ? RUI.md(o.title || key, { inline: true })
      : o.description
        ? `<span class="rui-muted">${RUI.md(o.description, { inline: true })}</span>`
        : '';
    const left = o.icon
      ? `<div class="rui-item__left">${RUI.icon(o.icon, { color: o.iconColor, anim: o.iconAnimation })}</div>`
      : '';
    let right = '';
    if (o.progress !== undefined) right += RUI.bar(o.progress, o.colorScheme, 'rui-bar--sm');
    if ((o.menu || o.arrow) && o.arrow !== false) right += `<span class="rui-rlabel">${RUI.esc(RUI.cfg.submenuArrow)}</span>`;
    const cls = ['rui-item', i === sel ? 'is-selected' : '', o.disabled ? 'is-disabled' : '', isInert(o) ? 'is-inert' : 'is-action']
      .filter(Boolean)
      .join(' ');
    return `<div class="${cls}" data-i="${i}">${left}<div class="rui-item__label">${label}</div>${right ? `<div class="rui-item__right">${right}</div>` : ''}</div>`;
  };

  const statsHTML = (o) => {
    let h = '';
    if (o.image) h += `<img class="rui-stats__img" src="${RUI.esc(o.image)}" alt="">`;
    const md = o.metadata;
    const stat = (l, v, bar) =>
      `<div class="rui-stat"><span class="rui-stat__l">${RUI.gta(l)}</span>${v != null && v !== '' ? `<span class="rui-stat__v">${RUI.gta(v)}</span>` : ''}${bar || ''}</div>`;
    if (Array.isArray(md)) {
      md.forEach((m) => {
        if (m == null) return;
        if (typeof m !== 'object') h += stat(m);
        else h += stat(m.label, m.value, m.progress !== undefined ? RUI.bar(m.progress, m.colorScheme || o.colorScheme, 'rui-bar--seg') : '');
      });
    } else if (md && typeof md === 'object') {
      Object.entries(md).forEach(([k, v]) => (h += stat(k, v)));
    } else if (md != null && md !== '') {
      h += stat(md);
    }
    return h;
  };

  const rowEl = (i) => P.list.querySelector(`[data-i="${i}"]`);

  const updateMeta = () => {
    const entry = entries[sel];
    const o = (entry && entry[1]) || {};
    P.count.textContent = entries.length ? RUI.counter(sel + 1, entries.length) : '';
    P.nav.hidden = entries.length <= (RUI.cfg.maxVisibleItems || 10);
    const hasTitle = entry && (o.title || isNaN(+entry[0]));
    const desc = hasTitle ? o.description : null;
    P.desc.hidden = !desc;
    P.desc.innerHTML = desc ? RUI.md(desc) : '';
    const stats = !o.disabled && (o.metadata || o.image) ? statsHTML(o) : '';
    P.stats.hidden = !stats;
    P.stats.innerHTML = stats;
  };

  const setSel = (i, scrollIntoView) => {
    if (!(i >= 0 && i < entries.length)) return;
    if (i !== sel) {
      const old = rowEl(sel);
      if (old) old.classList.remove('is-selected');
      sel = i;
      const now = rowEl(sel);
      if (now) now.classList.add('is-selected');
      updateMeta();
    }
    if (scrollIntoView) RUI.keepVisible(P.list, rowEl(sel));
  };

  const activate = (i) => {
    const entry = entries[i];
    if (!entry) return;
    const [key, o] = entry;
    if (!o || isInert(o)) return;
    if (o.menu) RUI.nui('openContext', { id: o.menu, back: false });
    else RUI.nui('clickContext', key);
  };

  const back = () => {
    if (data && data.menu) RUI.nui('openContext', { id: data.menu, back: true });
  };

  const close = () => {
    if (!data || data.canClose === false) return;
    hide();
    RUI.nui('closeContext');
  };

  const hide = () => {
    open = false;
    RUI.hide(P.el, 100);
  };

  const render = () => {
    RUI.setHeader(P, { title: data.title, subtitle: data.subtitle, banner: data.banner, info: data.info, mdTitle: true });
    P.lead.innerHTML = data.menu
      ? `<button class="rui-iconbtn" data-act="back" title="Retour">${RUI.icon('chevron-left')}</button>`
      : '';
    P.tail.innerHTML = `<button class="rui-iconbtn" data-act="close"${data.canClose === false ? ' disabled' : ''}>${RUI.icon('xmark')}</button>`;
    P.list.innerHTML = entries.map(rowHTML).join('');
    P.list.scrollTop = 0;
    updateMeta();
  };

  RUI.on('hideContext', () => hide());

  RUI.on('showContext', async (d) => {
    if (open) {
      hide();
      await RUI.wait(100);
    }
    data = d || {};
    const opts = data.options || {};
    entries = Object.entries(opts);
    sel = 0;
    render();
    open = true;
    RUI.show(P.el);
    RUI.fitTitle(P);
  });

  P.list.addEventListener('mouseover', (e) => {
    const row = e.target.closest('.rui-item');
    if (row) setSel(+row.dataset.i, false);
  });
  P.list.addEventListener('click', (e) => {
    const row = e.target.closest('.rui-item');
    if (row) activate(+row.dataset.i);
  });
  P.el.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    if (btn.dataset.act === 'back') back();
    else if (btn.dataset.act === 'close') close();
  });

  window.addEventListener('keydown', (e) => {
    if (!open) return;
    switch (e.code) {
      case 'ArrowDown':
        setSel((sel + 1) % entries.length, true);
        break;
      case 'ArrowUp':
        setSel((sel - 1 + entries.length) % entries.length, true);
        break;
      case 'Enter':
      case 'NumpadEnter':
        if (!e.repeat) activate(sel);
        break;
      case 'Escape':
        close();
        break;
      case 'Backspace':
        if (data && data.menu) back();
        else close();
        break;
      default:
        return;
    }
    e.preventDefault();
  });
})();
