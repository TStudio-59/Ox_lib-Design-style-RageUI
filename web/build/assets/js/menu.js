/* lib.showMenu — menu au clavier, façon RageUI (↑ ↓ ← → Entrée, Échap/Retour) */
(() => {
  'use strict';
  const layer = RUI.layer('rui-layer--menu pos-top-left');
  const zoom = RUI.el('<div class="rui-zoom"></div>');
  const P = RUI.buildPanel('rui-menu rui-anim');
  P.el.hidden = true;
  zoom.appendChild(P.el);
  layer.appendChild(zoom);

  let data = null;
  let items = [];
  let open = false;
  let sel = 0;
  let scroll = {};
  let checks = {};
  const timers = {};
  const debounce = (key, fn) => {
    clearTimeout(timers[key]);
    timers[key] = setTimeout(fn, 100);
  };

  const valueOf = (it, i) => {
    const v = it.values[scroll[i]];
    return v !== null && typeof v === 'object' ? v.label : v;
  };

  const rowHTML = (it, i) => {
    if (!it || !it.label) return '';
    const left = it.icon
      ? `<div class="rui-item__left">${RUI.icon(it.icon, { color: it.iconColor, anim: it.iconAnimation })}</div>`
      : '';
    let right = '';
    if (Array.isArray(it.values)) {
      right = `<span class="rui-listval"><span class="rui-arrow">${RUI.icon('chevron-left', { fw: false })}</span><span class="rui-listval__text">${RUI.gta(valueOf(it, i))}</span><span class="rui-arrow">${RUI.icon('chevron-right', { fw: false })}</span></span>`;
    } else if (it.checked !== undefined) {
      right = RUI.checkbox(checks[i]);
    } else if (it.progress !== undefined) {
      right = RUI.bar(it.progress, it.colorScheme);
    } else if (RUI.cfg.menuArrow) {
      right = `<span class="rui-rlabel">${RUI.esc(RUI.cfg.menuArrow)}</span>`;
    }
    return `<div class="rui-item${i === sel ? ' is-selected' : ''}" data-i="${i}">${left}<div class="rui-item__label">${RUI.gta(it.label)}</div>${right ? `<div class="rui-item__right">${right}</div>` : ''}</div>`;
  };

  const rowEl = (i) => P.list.querySelector(`[data-i="${i}"]`);
  const updateRow = (i) => {
    const el = rowEl(i);
    if (el) el.outerHTML = rowHTML(items[i], i);
  };

  const updateMeta = () => {
    const labelled = items.reduce((acc, it, i) => (it && it.label ? acc.concat(i) : acc), []);
    P.count.textContent = labelled.length ? RUI.counter(Math.max(labelled.indexOf(sel), 0) + 1, labelled.length) : '';
    P.nav.hidden = labelled.length <= (RUI.cfg.maxVisibleItems || 10);

    const it = items[sel];
    let desc = it && it.description;
    if (it && Array.isArray(it.values)) {
      const v = it.values[scroll[sel]];
      if (v !== null && typeof v === 'object') desc = v.description;
    }
    P.desc.hidden = !desc;
    P.desc.innerHTML = desc ? RUI.md(desc) : '';
    RUI.keepVisible(P.list, rowEl(sel));
  };

  const notifySelected = () => {
    const c = sel;
    const it = items[c];
    if (!it) return;
    const payload = [
      c,
      it.values ? scroll[c] : it.checked ? checks[c] : null,
      it.values ? 'isScroll' : it.checked ? 'isCheck' : null,
    ];
    debounce('sel', () => RUI.nui('changeSelected', payload));
  };

  const setSel = (i) => {
    if (i === sel) return;
    const old = rowEl(sel);
    if (old) old.classList.remove('is-selected');
    sel = i;
    const now = rowEl(sel);
    if (now) now.classList.add('is-selected');
    updateMeta();
    notifySelected();
  };

  const move = (dir) => {
    const n = items.length;
    if (!n) return;
    let i = sel;
    for (let k = 0; k < n; k++) {
      i = (i + dir + n) % n;
      if (items[i] && items[i].label) break;
    }
    setSel(i);
  };

  const side = (dir) => {
    const it = items[sel];
    if (!it || !Array.isArray(it.values) || !it.values.length) return;
    const len = it.values.length;
    scroll[sel] = ((scroll[sel] || 0) + dir + len) % len;
    updateRow(sel);
    updateMeta();
    const c = sel, v = scroll[sel];
    debounce('idx', () => RUI.nui('changeIndex', [c, v]));
  };

  const confirm = () => {
    const it = items[sel];
    if (!it) return;
    if (it.checked !== undefined && !it.values) {
      checks[sel] = !checks[sel];
      updateRow(sel);
      const c = sel, v = checks[sel];
      debounce('chk', () => RUI.nui('changeChecked', [c, v]));
      return;
    }
    RUI.nui('confirmSelected', [sel, scroll[sel]]);
    if (it.close === undefined || it.close) hide();
  };

  const hide = () => {
    open = false;
    RUI.hide(P.el, 120);
  };

  // fromLua : fermeture demandée par lib.hideMenu (pas de callback)
  const close = (key, fromLua) => {
    if (!data) return;
    if (data.canClose === false && !fromLua) return;
    hide();
    if (!fromLua) RUI.nui('closeMenu', key);
  };

  RUI.on('setMenu', (d) => {
    if (!d) return;
    const list = Array.isArray(d.items) ? d.items : Object.values(d.items || {});
    let start = d.startItemIndex;
    if (!start || start < 0) start = 0;
    else if (start >= list.length) start = list.length - 1;

    data = d;
    items = list;
    sel = start;
    if (items[sel] && !items[sel].label) {
      const first = items.findIndex((it) => it && it.label);
      if (first >= 0) sel = first;
    }
    scroll = {};
    checks = {};
    items.forEach((it, i) => {
      if (!it) return;
      if (Array.isArray(it.values)) scroll[i] = (it.defaultIndex || 1) - 1;
      else if (it.checked !== undefined) checks[i] = it.checked || false;
    });

    layer.className = `rui-layer rui-layer--menu pos-${d.position || 'top-left'}`;
    RUI.setHeader(P, { title: d.title, subtitle: d.subtitle, banner: d.banner, info: d.info });
    P.list.innerHTML = items.map(rowHTML).join('');
    P.list.scrollTop = 0;
    open = true;
    RUI.show(P.el);
    RUI.fitTitle(P);
    updateMeta();
    notifySelected();
  });

  RUI.on('closeMenu', () => close(undefined, true));

  window.addEventListener('keydown', (e) => {
    if (!open) return;
    switch (e.code) {
      case 'ArrowDown':
        move(1);
        break;
      case 'ArrowUp':
        move(-1);
        break;
      case 'ArrowRight':
        side(1);
        break;
      case 'ArrowLeft':
        side(-1);
        break;
      case 'Enter':
      case 'NumpadEnter':
        if (!e.repeat) confirm();
        break;
      case 'Escape':
      case 'Backspace':
        close(e.code);
        break;
      default:
        return;
    }
    e.preventDefault();
  });
})();
