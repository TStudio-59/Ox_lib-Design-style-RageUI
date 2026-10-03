/* lib.addRadialItem / lib.registerRadial — roue façon sélecteur d'armes de GTA V */
(() => {
  'use strict';
  const esc = RUI.esc;
  const PER_PAGE = 6; // identique à ox_lib (5 éléments + « Plus... » quand ça déborde)
  const SIZE = 460; // diamètre (px à 1080p)
  const C = SIZE / 2;
  const RO = 214; // rayon extérieur des secteurs
  const RI = 84; // rayon intérieur des secteurs
  const HUB = 72; // rayon du moyeu central
  const GAP = 3; // espace entre secteurs (px)

  const layer = RUI.layer('rui-layer--radial');
  const zoom = RUI.el('<div class="rui-zoom"></div>');
  const wheel = RUI.el(`
    <div class="rui-radial rui-anim" hidden>
      <svg class="rui-radial__svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" aria-hidden="true">
        <circle class="rui-radial__bg" cx="${C}" cy="${C}" r="${RO + 6}"/>
        <g class="rui-radial__sectors"></g>
        <path class="rui-radial__accent" d=""/>
        <circle class="rui-radial__hub" cx="${C}" cy="${C}" r="${HUB}"/>
      </svg>
      <div class="rui-radial__center">
        <div class="rui-radial__icon"></div>
        <div class="rui-radial__label"></div>
        <div class="rui-radial__page"></div>
      </div>
    </div>`);
  zoom.appendChild(wheel);
  layer.appendChild(zoom);

  const svg = wheel.querySelector('svg');
  const gSectors = svg.querySelector('.rui-radial__sectors');
  const accent = svg.querySelector('.rui-radial__accent');
  const hub = svg.querySelector('.rui-radial__hub');
  const cIcon = wheel.querySelector('.rui-radial__icon');
  const cLabel = wheel.querySelector('.rui-radial__label');
  const cPage = wheel.querySelector('.rui-radial__page');

  let state = { items: [], sub: false, page: 1 };
  let shown = []; // éléments affichés sur la page courante
  let visible = false;
  let busy = false;
  let hover = null; // index de secteur | 'hub' | null

  const BACK = { fr: 'Retour', de: 'Zurück', es: 'Volver', it: 'Indietro', pt: 'Voltar', nl: 'Terug', pl: 'Wstecz' };
  const backLabel = () => BACK[String(RUI.lang).slice(0, 2)] || 'Back';

  const rad = (deg) => (deg * Math.PI) / 180;
  const pt = (r, deg) => [C + r * Math.cos(rad(deg)), C + r * Math.sin(rad(deg))];
  const f = (n) => n.toFixed(2);

  // Secteur annulaire de a0 à a1 (degrés, 0 = droite, sens horaire)
  const sectorPath = (a0, a1, ro, ri, gap) => {
    const go = (gap / 2 / ro) * (180 / Math.PI);
    const gi = (gap / 2 / ri) * (180 / Math.PI);
    const large = a1 - a0 - 2 * go > 180 ? 1 : 0;
    const [x1, y1] = pt(ro, a0 + go);
    const [x2, y2] = pt(ro, a1 - go);
    const [x3, y3] = pt(ri, a1 - gi);
    const [x4, y4] = pt(ri, a0 + gi);
    return `M${f(x1)},${f(y1)} A${ro},${ro} 0 ${large} 1 ${f(x2)},${f(y2)} L${f(x3)},${f(y3)} A${ri},${ri} 0 ${large} 0 ${f(x4)},${f(y4)} Z`;
  };

  // Découpe identique à ox_lib (Po) : lignes de 15 caractères max
  const wrap = (label, max = 15) => {
    const words = String(label == null ? '' : label).split(' ');
    const lines = [];
    let cur = words[0];
    for (let i = 1; i < words.length; i++) {
      if (cur.length + words[i].length + 1 <= max) cur += ' ' + words[i];
      else {
        lines.push(cur);
        cur = words[i];
      }
    }
    lines.push(cur);
    return lines;
  };
  const fontSize = (label) => (label.length > 20 ? 12 : label.length > 15 ? 13 : 14);

  const pageCount = () => (state.items.length <= PER_PAGE ? 1 : Math.ceil((state.items.length - 1) / (PER_PAGE - 1)));

  const computeShown = () => {
    const items = state.items;
    if (items.length <= PER_PAGE) return items.slice();
    const p = state.page;
    const start = PER_PAGE * (p - 1) - (p - 1);
    const end = PER_PAGE * p - p + 1;
    const list = items.slice(start, end);
    if (end < items.length) list[list.length - 1] = { icon: 'ellipsis-h', label: RUI.t('more'), isMore: true };
    return list;
  };

  const iconSVG = (item, x, y) => {
    const icon = item.icon;
    if (typeof icon === 'string' && RUI.isImage(icon)) {
      const w = Math.min(Math.max(item.iconWidth || 50, 0), 100);
      const h = Math.min(Math.max(item.iconHeight || 50, 0), 100);
      return `<image href="${esc(icon)}" width="${w}" height="${h}" x="${f(x - w / 2)}" y="${f(y - h / 2)}" preserveAspectRatio="xMidYMid meet"/>`;
    }
    const d = RUI.iconData(icon);
    if (!d) return '';
    const s = 30;
    return `<svg class="rui-radial__glyph" x="${f(x - s / 2)}" y="${f(y - s / 2)}" width="${s}" height="${s}" viewBox="0 0 ${d[0]} ${d[1]}"><path d="${d[2]}"/></svg>`;
  };

  const render = () => {
    shown = computeShown();
    const n = Math.max(shown.length, 3);
    const step = 360 / n;
    let html = '';
    shown.forEach((item, u) => {
      const mid = -90 + u * step;
      const a0 = mid - step / 2;
      const a1 = mid + step / 2;
      const lines = wrap(item.label);
      const r = (RO + RI) / 2 + 2;
      const [cx, cy] = pt(r, mid);
      const hasIcon = !!item.icon;
      const lineH = fontSize(item.label) * 1.15;
      const textH = lines.length * lineH;
      const iconY = cy - (hasIcon ? textH / 2 + 4 : 0);
      const textY = hasIcon ? iconY + 22 + lineH * 0.8 : cy - textH / 2 + lineH * 0.8;
      const tspans = lines
        .map((l, i) => `<tspan x="${f(cx)}" ${i === 0 ? `y="${f(textY)}"` : `dy="${f(lineH)}"`}>${esc(l)}</tspan>`)
        .join('');
      html += `
        <g class="rui-radial__sector${item.isMore ? ' is-more' : ''}" data-u="${u}">
          <path class="rui-radial__shape" d="${sectorPath(a0, a1, RO, RI, GAP)}"/>
          <g class="rui-radial__content">
            ${hasIcon ? iconSVG(item, cx, iconY) : ''}
            <text class="rui-radial__text" text-anchor="middle" font-size="${fontSize(item.label)}">${tspans}</text>
          </g>
        </g>`;
    });
    gSectors.innerHTML = html;
    setHover(null, true);
  };

  const centerAction = () => (state.page > 1 ? 'prev' : state.sub ? 'back' : 'close');

  const paintCenter = () => {
    const pages = pageCount();
    cPage.textContent = pages > 1 ? `${state.page} / ${pages}` : '';
    if (typeof hover === 'number' && shown[hover]) {
      const item = shown[hover];
      cIcon.innerHTML = '';
      cLabel.innerHTML = RUI.gta(item.label);
      wheel.classList.remove('is-hub');
      return;
    }
    const act = centerAction();
    cIcon.innerHTML = RUI.icon(act === 'close' ? 'xmark' : 'arrow-rotate-left');
    cLabel.textContent = act === 'close' ? RUI.t('close') : backLabel();
    wheel.classList.toggle('is-hub', hover === 'hub');
  };

  const setHover = (h, force) => {
    if (h === hover && !force) return;
    hover = h;
    gSectors.querySelectorAll('.is-hover').forEach((g) => g.classList.remove('is-hover'));
    if (typeof h === 'number') {
      const g = gSectors.querySelector(`[data-u="${h}"]`);
      if (g) g.classList.add('is-hover');
      const n = Math.max(shown.length, 3);
      const step = 360 / n;
      const mid = -90 + h * step;
      accent.setAttribute('d', sectorPath(mid - step / 2, mid + step / 2, RO + 9, RO + 4, GAP));
    } else {
      accent.setAttribute('d', '');
    }
    hub.classList.toggle('is-hover', h === 'hub');
    paintCenter();
  };

  // Sélection par direction, comme la roue des armes
  const pick = (e) => {
    const r = svg.getBoundingClientRect();
    if (!r.width) return null;
    const k = r.width / SIZE;
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy) / k;
    if (dist <= HUB + 4) return 'hub';
    if (dist > RO + 60 || !shown.length) return null;
    const n = Math.max(shown.length, 3);
    const step = 360 / n;
    let ang = (Math.atan2(dy, dx) * 180) / Math.PI + 90 + step / 2;
    ang = ((ang % 360) + 360) % 360;
    const u = Math.floor(ang / step);
    return u < shown.length ? u : null;
  };

  const show = () => {
    visible = true;
    layer.classList.add('is-open');
    RUI.show(wheel);
  };
  const hide = (ms = 100) => {
    visible = false;
    layer.classList.remove('is-open');
    RUI.hide(wheel, ms);
  };

  // Changement de page (attend radialTransition comme l'original)
  const changePage = async (next) => {
    if (busy) return;
    busy = true;
    hide();
    const ok = await RUI.nui('radialTransition');
    busy = false;
    if (!ok) return;
    state = Object.assign({}, state, { page: next ? state.page + 1 : state.page - 1 });
    render();
    show();
  };

  const clickSector = (u) => {
    const item = shown[u];
    if (!item) return;
    if (item.isMore) return changePage(true);
    const index = state.page === 1 ? u : PER_PAGE * (state.page - 1) - (state.page - 1) + u;
    RUI.nui('radialClick', index);
  };

  const clickCenter = () => {
    const act = centerAction();
    if (act === 'prev') return changePage(false);
    if (act === 'back') return RUI.nui('radialBack');
    hide();
    RUI.nui('radialClose');
  };

  const goBack = () => {
    if (state.page > 1) return changePage(false);
    if (state.sub) RUI.nui('radialBack');
  };

  RUI.on('openRadialMenu', (d) => {
    if (!d) {
      busy = false;
      return hide();
    }
    let page = 1;
    const items = Array.isArray(d.items) ? d.items : Object.values(d.items || {});
    if (d.option) {
      const i = items.findIndex((it) => it && it.menu == d.option); // eslint-disable-line eqeqeq
      if (i >= 0) page = Math.floor(i / PER_PAGE) + 1;
    }
    state = { items, sub: !!d.sub, page };
    if (page > pageCount()) state.page = pageCount();
    render();
    show();
  });

  RUI.on('refreshItems', (items) => {
    state = Object.assign({}, state, { items: Array.isArray(items) ? items : Object.values(items || {}) });
    if (state.page > pageCount()) state.page = pageCount();
    render();
  });

  layer.addEventListener('mousemove', (e) => {
    if (visible && !busy) setHover(pick(e));
  });
  layer.addEventListener('mouseleave', () => setHover(null));
  layer.addEventListener('click', (e) => {
    if (!visible || busy || e.button !== 0) return;
    const h = pick(e);
    if (h === 'hub') clickCenter();
    else if (typeof h === 'number') clickSector(h);
  });
  layer.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (visible && !busy) goBack();
  });
  window.addEventListener('keydown', (e) => {
    if (!visible || busy) return;
    if (e.code === 'Escape') {
      hide();
      RUI.nui('radialClose');
    } else if (e.code === 'Backspace') {
      goBack();
    } else return;
    e.preventDefault();
  });
})();
