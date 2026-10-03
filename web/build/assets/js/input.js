/* lib.inputDialog — formulaire façon RageUI.
 * Les listes déroulantes, calendriers et sélecteurs de couleur natifs ne s'affichent pas dans la NUI
 * de FiveM : tout est donc dessiné en HTML. */
(() => {
  'use strict';
  const esc = RUI.esc;
  const layer = RUI.layer('rui-layer--modal');
  const zoom = RUI.el('<div class="rui-zoom"></div>');
  const P = RUI.buildPanel('rui-dialog rui-anim');
  P.el.hidden = true;
  P.nav.remove();
  P.stats.remove();
  const actions = RUI.el(`
    <div class="rui-actions">
      <div class="rui-item rui-action" data-act="confirm" tabindex="0"><div class="rui-item__label"></div><div class="rui-item__right">${RUI.keycap('↵')}</div></div>
      <div class="rui-item rui-action" data-act="cancel" tabindex="0"><div class="rui-item__label"></div><div class="rui-item__right">${RUI.keycap('Esc')}</div></div>
    </div>`);
  P.list.after(actions);
  zoom.appendChild(P.el);
  layer.appendChild(zoom);

  const SIZES = { xs: 431, sm: 480, md: 540, lg: 660, xl: 800 };
  let open = false;
  let data = null;
  let fields = [];
  let active = -1;
  let hovered = -1;
  let closeTimer = null;
  let pop = null;

  const startOfDay = (v) => {
    const d = new Date(v);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const decimals = (n) => {
    const s = String(n);
    return s.includes('.') ? s.split('.')[1].length : 0;
  };

  /* --------------------------- Popovers --------------------------- */
  const closePop = () => {
    if (!pop) return;
    const p = pop;
    pop = null;
    p.el.remove();
    p.owner.classList.remove('has-pop');
    if (p.onClose) p.onClose();
  };

  const openPop = (owner, el, onKey) => {
    closePop();
    el.classList.add('rui-pop');
    el.tabIndex = -1;
    P.el.appendChild(el);
    const below = P.list.offsetTop + owner.offsetTop - P.list.scrollTop + owner.offsetHeight;
    el.style.top = below + 'px';
    const r1 = owner.getBoundingClientRect();
    const r2 = el.getBoundingClientRect();
    if (r1.bottom + r2.height > window.innerHeight - 8 && r1.top - r2.height > 8) {
      el.style.top = below - owner.offsetHeight - el.offsetHeight + 'px';
    }
    owner.classList.add('has-pop');
    pop = { el, owner, onKey };
  };

  document.addEventListener('mousedown', (e) => {
    if (pop && !pop.el.contains(e.target) && !pop.owner.contains(e.target)) closePop();
  });
  P.list.addEventListener('scroll', () => closePop());

  // Liste déroulante (select / multi-select)
  const listPop = (owner, { options, multi, searchable, isSelected, onPick }) => {
    const el = RUI.el(`
      <div class="rui-pop--list">
        ${searchable ? '<input class="rui-pop__search" spellcheck="false" placeholder="Rechercher…">' : ''}
        <div class="rui-pop__items"></div>
      </div>`);
    const box = el.querySelector('.rui-pop__items');
    const search = el.querySelector('.rui-pop__search');
    let filtered = options;
    let hl = Math.max(0, options.findIndex((o) => isSelected(o.value)));

    const draw = () => {
      box.innerHTML = filtered.length
        ? filtered
            .map((o, i) => {
              const on = isSelected(o.value);
              const cls = ['rui-item', i === hl ? 'is-hl' : '', o.disabled ? 'is-disabled' : ''].filter(Boolean).join(' ');
              const right = !multi && on ? `<div class="rui-item__right">${RUI.icon('check')}</div>` : '';
              return `<div class="${cls}" data-i="${i}">${multi ? `<div class="rui-item__left">${RUI.checkbox(on)}</div>` : ''}<div class="rui-item__label">${RUI.gta(o.label)}</div>${right}</div>`;
            })
            .join('')
        : '<div class="rui-pop__empty">—</div>';
      RUI.keepVisible(box, box.querySelector('.is-hl'));
    };
    const setHl = (i) => {
      if (!filtered.length) return;
      hl = Math.min(Math.max(i, 0), filtered.length - 1);
      box.querySelectorAll('.is-hl').forEach((n) => n.classList.remove('is-hl'));
      const n = box.querySelector(`[data-i="${hl}"]`);
      if (n) n.classList.add('is-hl');
      RUI.keepVisible(box, n);
    };
    const pick = (i) => {
      const o = filtered[i];
      if (!o || o.disabled) return;
      onPick(o.value);
      if (multi && pop) draw();
    };

    if (search)
      search.addEventListener('input', () => {
        const q = search.value.toLowerCase();
        filtered = options.filter((o) => String(o.label).toLowerCase().includes(q));
        hl = 0;
        draw();
      });
    box.addEventListener('mousedown', (e) => e.preventDefault());
    box.addEventListener('mousemove', (e) => {
      const r = e.target.closest('[data-i]');
      if (r && +r.dataset.i !== hl) setHl(+r.dataset.i);
    });
    box.addEventListener('click', (e) => {
      const r = e.target.closest('[data-i]');
      if (r) pick(+r.dataset.i);
    });

    draw();
    openPop(owner, el, (e) => {
      if (e.key === 'ArrowDown') setHl(hl + 1);
      else if (e.key === 'ArrowUp') setHl(hl - 1);
      else if (e.key === 'Enter') pick(hl);
      else return false;
      e.preventDefault();
      return true;
    });
    (search || el).focus();
  };

  // Calendrier (date / date-range)
  const calendarPop = (owner, { range, value, min, max, onPick }) => {
    const el = RUI.el(`
      <div class="rui-pop--cal">
        <div class="rui-cal__head">
          <button type="button" class="rui-step" data-nav="-1">${RUI.icon('chevron-left', { fw: false })}</button>
          <span class="rui-cal__title"></span>
          <button type="button" class="rui-step" data-nav="1">${RUI.icon('chevron-right', { fw: false })}</button>
        </div>
        <div class="rui-cal__grid"></div>
      </div>`);
    const grid = el.querySelector('.rui-cal__grid');
    const title = el.querySelector('.rui-cal__title');
    const minD = min ? startOfDay(min) : null;
    const maxD = max ? startOfDay(max) : null;
    let sel = range ? (Array.isArray(value) ? value.slice() : [null, null]) : value;
    const view = new Date((range ? sel[0] : sel) || Date.now());
    view.setDate(1);
    view.setHours(0, 0, 0, 0);
    const today = startOfDay(Date.now());

    const draw = () => {
      const m = view.getMonth();
      title.textContent = `${RUI.monthName(m)} ${view.getFullYear()}`;
      const first = new Date(view);
      first.setDate(1 - ((first.getDay() + 6) % 7));
      let html = '';
      for (let i = 0; i < 7; i++) html += `<span class="rui-cal__wd">${esc(RUI.dayName(i, 'short').replace('.', ''))}</span>`;
      const a = range ? sel[0] && startOfDay(sel[0]) : sel && startOfDay(sel);
      const b = range ? sel[1] && startOfDay(sel[1]) : null;
      for (let i = 0; i < 42; i++) {
        const d = new Date(first);
        d.setDate(first.getDate() + i);
        const t = d.getTime();
        const cls = ['rui-cal__day'];
        if (d.getMonth() !== m) cls.push('is-out');
        if (t === today) cls.push('is-today');
        if (t === a || t === b) cls.push('is-sel');
        if (a && b && t > a && t < b) cls.push('is-range');
        const off = (minD && t < minD) || (maxD && t > maxD);
        if (off) cls.push('is-disabled');
        html += `<button type="button" class="${cls.join(' ')}" data-t="${t}"${off ? ' disabled' : ''}>${d.getDate()}</button>`;
      }
      grid.innerHTML = html;
    };

    el.addEventListener('mousedown', (e) => e.preventDefault());
    el.addEventListener('click', (e) => {
      const nav = e.target.closest('[data-nav]');
      if (nav) {
        view.setMonth(view.getMonth() + +nav.dataset.nav);
        draw();
        return;
      }
      const day = e.target.closest('[data-t]');
      if (!day || day.disabled) return;
      const t = +day.dataset.t;
      if (!range) {
        onPick(t);
        closePop();
        return;
      }
      if (!sel[0] || sel[1]) {
        sel = [t, null];
        onPick(sel.slice());
        draw();
      } else {
        sel[1] = t;
        if (sel[1] < sel[0]) sel.reverse();
        onPick(sel.slice());
        closePop();
      }
    });
    draw();
    openPop(owner, el, (e) => {
      if (e.key === 'PageUp' || e.key === 'ArrowLeft') view.setMonth(view.getMonth() - 1);
      else if (e.key === 'PageDown' || e.key === 'ArrowRight') view.setMonth(view.getMonth() + 1);
      else return false;
      draw();
      e.preventDefault();
      return true;
    });
    el.focus();
  };

  // Heure
  const timePop = (owner, { value, h12, onPick }) => {
    const d = new Date(value || Date.now());
    if (!value) d.setSeconds(0, 0);
    const el = RUI.el(`
      <div class="rui-pop--time">
        <div class="rui-spin" data-u="h"><button type="button" class="rui-step" data-d="1">${RUI.icon('chevron-up', { fw: false })}</button><span class="rui-spin__v"></span><button type="button" class="rui-step" data-d="-1">${RUI.icon('chevron-down', { fw: false })}</button></div>
        <span class="rui-spin__sep">:</span>
        <div class="rui-spin" data-u="m"><button type="button" class="rui-step" data-d="1">${RUI.icon('chevron-up', { fw: false })}</button><span class="rui-spin__v"></span><button type="button" class="rui-step" data-d="-1">${RUI.icon('chevron-down', { fw: false })}</button></div>
        ${h12 ? '<button type="button" class="rui-spin__ampm"></button>' : ''}
      </div>`);
    const draw = () => {
      const H = d.getHours();
      el.querySelector('[data-u="h"] .rui-spin__v').textContent = String(h12 ? H % 12 || 12 : H).padStart(2, '0');
      el.querySelector('[data-u="m"] .rui-spin__v').textContent = String(d.getMinutes()).padStart(2, '0');
      const ap = el.querySelector('.rui-spin__ampm');
      if (ap) ap.textContent = H < 12 ? 'AM' : 'PM';
    };
    const bump = (unit, delta) => {
      if (unit === 'h') d.setHours((d.getHours() + delta + 24) % 24);
      else d.setMinutes((d.getMinutes() + delta + 60) % 60);
      draw();
      onPick(d.getTime());
    };
    el.addEventListener('mousedown', (e) => e.preventDefault());
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.classList.contains('rui-spin__ampm')) return bump('h', 12);
      bump(b.closest('.rui-spin').dataset.u, +b.dataset.d);
    });
    el.addEventListener('wheel', (e) => {
      const s = e.target.closest('.rui-spin');
      if (!s) return;
      e.preventDefault();
      bump(s.dataset.u, e.deltaY < 0 ? 1 : -1);
    });
    draw();
    if (!value) onPick(d.getTime()); // affiche tout de suite l'heure proposée
    openPop(owner, el);
    el.focus();
  };

  // Sélecteur de couleur
  const rgbToHsv = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), dd = max - min;
    let h = 0;
    if (dd) {
      if (max === r) h = ((g - b) / dd) % 6;
      else if (max === g) h = (b - r) / dd + 2;
      else h = (r - g) / dd + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return [h, max ? dd / max : 0, max];
  };
  const hsvToRgb = (h, s, v) => {
    const f = (n) => {
      const k = (n + h / 60) % 6;
      return Math.round((v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)) * 255);
    };
    return [f(5), f(3), f(1)];
  };
  const hex2 = (n) => Math.round(n).toString(16).padStart(2, '0');
  const formatColor = ([r, g, b, a], format) => {
    const aa = Math.round(a * 100) / 100;
    const hsl = () => {
      const R = r / 255, G = g / 255, B = b / 255;
      const max = Math.max(R, G, B), min = Math.min(R, G, B);
      const l = (max + min) / 2;
      const dd = max - min;
      const s = dd ? dd / (1 - Math.abs(2 * l - 1)) : 0;
      const h = rgbToHsv(r, g, b)[0];
      return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
    };
    switch (format) {
      case 'hexa': return `#${hex2(r)}${hex2(g)}${hex2(b)}${hex2(a * 255)}`;
      case 'rgb': return `rgb(${r}, ${g}, ${b})`;
      case 'rgba': return `rgba(${r}, ${g}, ${b}, ${aa})`;
      case 'hsl': { const [h, s, l] = hsl(); return `hsl(${h}, ${s}%, ${l}%)`; }
      case 'hsla': { const [h, s, l] = hsl(); return `hsla(${h}, ${s}%, ${l}%, ${aa})`; }
      default: return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
    }
  };

  const colorPop = (owner, { value, format, onPick }) => {
    const alpha = /a$/.test(format || '');
    const start = RUI.rgba(value) || [255, 255, 255, 1];
    let [h, s, v] = rgbToHsv(start[0], start[1], start[2]);
    let a = start[3];
    const el = RUI.el(`
      <div class="rui-pop--color">
        <div class="rui-cp__sv"><i class="rui-cp__knob"></i></div>
        <div class="rui-cp__bar rui-cp__hue"><i class="rui-cp__thumb"></i></div>
        ${alpha ? '<div class="rui-cp__bar rui-cp__alpha"><span></span><i class="rui-cp__thumb"></i></div>' : ''}
        <input class="rui-cp__text" spellcheck="false">
      </div>`);
    const sv = el.querySelector('.rui-cp__sv');
    const hue = el.querySelector('.rui-cp__hue');
    const alp = el.querySelector('.rui-cp__alpha');
    const text = el.querySelector('.rui-cp__text');

    const current = () => [...hsvToRgb(h, s, v), a];
    const draw = (fromText) => {
      const [r, g, b] = current();
      sv.style.backgroundColor = `hsl(${h}, 100%, 50%)`;
      sv.firstElementChild.style.left = s * 100 + '%';
      sv.firstElementChild.style.top = (1 - v) * 100 + '%';
      hue.firstElementChild.style.left = (h / 360) * 100 + '%';
      if (alp) {
        alp.querySelector('span').style.background = `linear-gradient(90deg, rgba(${r},${g},${b},0), rgb(${r},${g},${b}))`;
        alp.querySelector('i').style.left = a * 100 + '%';
      }
      if (!fromText) text.value = formatColor(current(), format);
    };
    const commit = () => onPick(formatColor(current(), format));
    const drag = (target, fn) => {
      target.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const move = (ev) => {
          const r = target.getBoundingClientRect();
          fn(Math.min(Math.max((ev.clientX - r.left) / r.width, 0), 1), Math.min(Math.max((ev.clientY - r.top) / r.height, 0), 1));
          draw();
          commit();
        };
        const up = () => {
          window.removeEventListener('mousemove', move);
          window.removeEventListener('mouseup', up);
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        move(e);
      });
    };
    drag(sv, (x, y) => { s = x; v = 1 - y; });
    drag(hue, (x) => { h = Math.min(x * 360, 359.9); });
    if (alp) drag(alp, (x) => { a = Math.round(x * 100) / 100; });
    text.addEventListener('input', () => {
      const c = RUI.rgba(text.value);
      if (!c || !/^(#|rgb|hsl|[a-z]+$)/i.test(text.value.trim())) return;
      [h, s, v] = rgbToHsv(c[0], c[1], c[2]);
      a = c[3];
      draw(true);
      commit();
    });
    draw();
    openPop(owner, el);
  };

  /* --------------------------- Champs --------------------------- */
  const rowEl = (row, control, extra = '') =>
    RUI.el(`
      <div class="rui-item rui-field ${extra}${row.disabled ? ' is-disabled' : ''}">
        ${row.icon ? `<div class="rui-item__left">${RUI.icon(row.icon, { color: row.iconColor })}</div>` : ''}
        <div class="rui-item__label">${RUI.gta(row.label || '')}${row.required ? '<span class="rui-req">*</span>' : ''}</div>
        <div class="rui-field__control">${control}</div>
      </div>`);

  const stepBtns = (inner) =>
    `<button type="button" class="rui-step" data-d="-1" tabindex="-1">${RUI.icon('chevron-left', { fw: false })}</button>${inner}<button type="button" class="rui-step" data-d="1" tabindex="-1">${RUI.icon('chevron-right', { fw: false })}</button>`;

  const clearBtn = () => `<button type="button" class="rui-iconbtn rui-clear" tabindex="-1">${RUI.icon('xmark')}</button>`;

  const F = {};

  F.input = (row) => {
    const pw = !!row.password;
    const el = rowEl(
      row,
      `<input class="rui-input" type="${pw ? 'password' : 'text'}" spellcheck="false"${row.placeholder ? ` placeholder="${esc(row.placeholder)}"` : ''}${row.max ? ` maxlength="${+row.max}"` : ''}${row.disabled ? ' disabled' : ''}>${pw ? `<button type="button" class="rui-iconbtn rui-eye" tabindex="-1">${RUI.icon('eye')}</button>` : ''}`
    );
    const inp = el.querySelector('input');
    inp.value = row.default != null ? String(row.default) : '';
    const eye = el.querySelector('.rui-eye');
    if (eye)
      eye.addEventListener('click', () => {
        const show = inp.type === 'password';
        inp.type = show ? 'text' : 'password';
        eye.innerHTML = RUI.icon(show ? 'eye-slash' : 'eye');
      });
    return {
      el,
      focus: () => inp.focus(),
      value: () => inp.value,
      valid: () => !(row.required && inp.value === '') && !(row.min && inp.value !== '' && inp.value.length < row.min),
    };
  };

  F.textarea = (row) => {
    const el = rowEl(
      row,
      `<textarea class="rui-textarea" spellcheck="false"${row.placeholder ? ` placeholder="${esc(row.placeholder)}"` : ''}${row.maxLength ? ` maxlength="${+row.maxLength}"` : ''}${row.disabled ? ' disabled' : ''}></textarea>`,
      'rui-field--block'
    );
    const ta = el.querySelector('textarea');
    ta.value = row.default != null ? String(row.default) : '';
    const LINE = 20;
    const minRows = row.min || (row.autosize ? 1 : 3);
    const maxRows = row.max || (row.autosize ? 8 : minRows);
    ta.rows = 1;
    const size = () => {
      ta.style.height = '0px';
      const lines = Math.min(Math.max(Math.ceil((ta.scrollHeight - 12) / LINE), minRows), maxRows);
      ta.style.height = lines * LINE + 14 + 'px';
    };
    ta.addEventListener('input', size);
    requestAnimationFrame(size);
    return {
      el,
      focus: () => ta.focus(),
      value: () => ta.value,
      valid: () => !(row.required && ta.value === '') && !(row.minLength && ta.value !== '' && ta.value.length < row.minLength),
    };
  };

  F.number = (row) => {
    const el = rowEl(row, stepBtns(`<input class="rui-input rui-input--num" inputmode="decimal" spellcheck="false"${row.disabled ? ' disabled' : ''}>`));
    const inp = el.querySelector('input');
    const step = +row.step || 1;
    const precision = row.precision != null ? +row.precision : decimals(step);
    const round = (n) => +n.toFixed(precision);
    const clamp = (n) => {
      if (row.min != null) n = Math.max(+row.min, n);
      if (row.max != null) n = Math.min(+row.max, n);
      return n;
    };
    let val = row.default != null && row.default !== '' && !isNaN(+row.default) ? round(+row.default) : null;
    const paint = () => (inp.value = val == null ? '' : val.toFixed(precision));
    const bump = (d) => {
      if (row.disabled) return;
      val = clamp(round((val == null ? (row.min != null ? +row.min - (d > 0 ? step : 0) : 0) : val) + d * step));
      paint();
    };
    inp.addEventListener('input', () => {
      const t = inp.value.replace(',', '.').trim();
      val = t === '' || t === '-' || isNaN(+t) ? null : +t;
    });
    inp.addEventListener('blur', () => {
      if (val != null) val = clamp(round(val));
      paint();
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        bump(e.key === 'ArrowUp' ? 1 : -1);
      }
    });
    el.querySelectorAll('.rui-step').forEach((b) => b.addEventListener('click', () => bump(+b.dataset.d)));
    paint();
    return {
      el,
      focus: () => inp.focus(),
      value: () => (val == null ? null : clamp(round(val))),
      valid: () => {
        if (val == null) return !row.required;
        return !(row.min != null && val < +row.min) && !(row.max != null && val > +row.max);
      },
    };
  };

  F.checkbox = (row) => {
    let v = !!row.checked;
    const el = rowEl(row, RUI.checkbox(v), 'rui-field--check');
    el.tabIndex = row.disabled ? -1 : 0;
    const paint = () => el.querySelector('.rui-check').classList.toggle('is-on', v);
    const toggle = () => {
      if (row.disabled) return;
      v = !v;
      paint();
    };
    el.addEventListener('click', toggle);
    el.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      }
    });
    return { el, focus: () => el.focus(), value: () => v, valid: () => !row.required || v };
  };

  const selectField = (row, multi) => {
    const options = (row.options || []).map((o) => (o && typeof o === 'object' ? (o.label != null ? o : Object.assign({}, o, { label: o.value })) : { value: o, label: o }));
    let val = multi ? (row.default == null ? null : Array.isArray(row.default) ? row.default.slice() : [row.default]) : row.default != null ? row.default : null;
    const el = rowEl(
      row,
      `${multi ? '' : stepBtns('')}${row.clearable ? clearBtn() : ''}`,
      multi ? 'rui-field--multi' : 'rui-field--select'
    );
    const ctrl = el.querySelector('.rui-field__control');
    const btn = RUI.el(`<button type="button" class="rui-select__value"${row.disabled ? ' disabled' : ''}></button>`);
    if (multi) ctrl.prepend(btn);
    else ctrl.querySelector('[data-d="1"]').before(btn);
    const clear = el.querySelector('.rui-clear');
    const labelOf = (v) => {
      const o = options.find((x) => x.value === v);
      return o ? o.label : v;
    };
    const paint = () => {
      let txt;
      if (multi) {
        const n = val ? val.length : 0;
        txt = n === 0 ? '—' : n <= 2 ? val.map(labelOf).join(', ') : `${labelOf(val[0])}, +${n - 1}`;
        btn.classList.toggle('is-empty', n === 0);
      } else {
        txt = val == null ? '—' : labelOf(val);
        btn.classList.toggle('is-empty', val == null);
      }
      btn.innerHTML = RUI.gta(txt);
      if (clear) clear.hidden = multi ? !(val && val.length) : val == null;
    };
    const cycle = (d) => {
      if (row.disabled || !options.length) return;
      const enabled = options.filter((o) => !o.disabled);
      if (!enabled.length) return;
      let i = enabled.findIndex((o) => o.value === val);
      i = i < 0 ? (d > 0 ? 0 : enabled.length - 1) : (i + d + enabled.length) % enabled.length;
      val = enabled[i].value;
      paint();
    };
    const openList = () => {
      if (row.disabled) return;
      if (pop && pop.owner === el) return closePop();
      listPop(el, {
        options,
        multi,
        searchable: !!row.searchable,
        isSelected: (v) => (multi ? !!val && val.includes(v) : v === val),
        onPick: (v) => {
          if (!multi) {
            val = v;
            paint();
            closePop();
            btn.focus();
            return;
          }
          val = val ? val.slice() : [];
          const i = val.indexOf(v);
          if (i >= 0) val.splice(i, 1);
          else if (!row.maxSelectedValues || val.length < row.maxSelectedValues) val.push(v);
          paint();
        },
      });
    };
    btn.addEventListener('click', openList);
    el.querySelectorAll('.rui-step').forEach((b) => b.addEventListener('click', () => cycle(+b.dataset.d)));
    if (clear)
      clear.addEventListener('click', () => {
        val = multi ? [] : null;
        paint();
      });
    btn.addEventListener('keydown', (e) => {
      if (!multi && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        cycle(e.key === 'ArrowRight' ? 1 : -1);
      } else if (e.key === 'ArrowDown' && !pop) {
        e.preventDefault();
        openList();
      }
    });
    paint();
    return {
      el,
      focus: () => btn.focus(),
      rowClick: openList,
      value: () => val,
      valid: () => !row.required || (multi ? !!val && val.length > 0 : val != null && val !== ''),
    };
  };
  F.select = (row) => selectField(row, false);
  F['multi-select'] = (row) => selectField(row, true);

  F.slider = (row) => {
    const min = row.min != null ? +row.min : 0;
    const max = row.max != null ? +row.max : 100;
    const step = row.step != null ? +row.step : 1;
    let v = row.default != null ? +row.default : min;
    const el = rowEl(
      row,
      `<span class="rui-slider__val"></span><input type="range" class="rui-range" min="${min}" max="${max}" step="${step}"${row.disabled ? ' disabled' : ''}>`,
      'rui-field--slider'
    );
    const inp = el.querySelector('input');
    const out = el.querySelector('.rui-slider__val');
    inp.value = v;
    const paint = () => {
      v = +inp.value;
      out.textContent = v;
      inp.style.setProperty('--p', ((v - min) / (max - min || 1)) * 100 + '%');
    };
    inp.addEventListener('input', paint);
    paint();
    return { el, focus: () => inp.focus(), value: () => v, valid: () => true };
  };

  F.color = (row) => {
    let val = row.default || null;
    const el = rowEl(row, `<span class="rui-swatch"></span><button type="button" class="rui-select__value"${row.disabled ? ' disabled' : ''}></button>`, 'rui-field--color');
    const btn = el.querySelector('.rui-select__value');
    const sw = el.querySelector('.rui-swatch');
    const paint = () => {
      btn.textContent = val || '—';
      btn.classList.toggle('is-empty', !val);
      sw.style.background = val || 'transparent';
      sw.classList.toggle('is-empty', !val);
    };
    const openPicker = () => {
      if (row.disabled) return;
      if (pop && pop.owner === el) return closePop();
      colorPop(el, { value: val, format: row.format || 'hex', onPick: (c) => { val = c; paint(); } });
    };
    btn.addEventListener('click', openPicker);
    paint();
    return { el, focus: () => btn.focus(), rowClick: openPicker, value: () => val, valid: () => !row.required || !!val };
  };

  const dateField = (row, range) => {
    let val = row._default != null ? row._default : null;
    const fmt = row.format || 'DD/MM/YYYY';
    const el = rowEl(row, `<button type="button" class="rui-select__value"${row.disabled ? ' disabled' : ''}></button>${row.clearable ? clearBtn() : ''}`, 'rui-field--date');
    const btn = el.querySelector('.rui-select__value');
    const clear = el.querySelector('.rui-clear');
    const paint = () => {
      let txt;
      if (range) txt = val && (val[0] || val[1]) ? `${RUI.formatDate(val[0], fmt) || '…'} – ${RUI.formatDate(val[1], fmt) || '…'}` : row.format || '—';
      else txt = val != null ? RUI.formatDate(val, fmt) : row.format || '—';
      btn.textContent = txt;
      const empty = range ? !(val && (val[0] || val[1])) : val == null;
      btn.classList.toggle('is-empty', empty);
      if (clear) clear.hidden = empty;
    };
    const openCal = () => {
      if (row.disabled) return;
      if (pop && pop.owner === el) return closePop();
      calendarPop(el, { range, value: val, min: row.min, max: row.max, onPick: (v) => { val = v; paint(); } });
    };
    btn.addEventListener('click', openCal);
    if (clear) clear.addEventListener('click', () => { val = null; paint(); });
    paint();
    return {
      el,
      focus: () => btn.focus(),
      rowClick: openCal,
      value: () => {
        if (!row.returnString || val == null) return val;
        return range ? val.map((t) => (t == null ? null : RUI.formatDate(t, fmt))) : RUI.formatDate(val, fmt);
      },
      valid: () => !row.required || (range ? !!(val && val[0] && val[1]) : val != null),
    };
  };
  F.date = (row) => dateField(row, false);
  F['date-range'] = (row) => dateField(row, true);

  F.time = (row) => {
    let val = row._default != null ? row._default : null;
    const h12 = (row.format || '12') === '12';
    const el = rowEl(row, `<button type="button" class="rui-select__value"${row.disabled ? ' disabled' : ''}></button>${row.clearable ? clearBtn() : ''}`, 'rui-field--time');
    const btn = el.querySelector('.rui-select__value');
    const clear = el.querySelector('.rui-clear');
    const paint = () => {
      btn.textContent = val != null ? RUI.formatDate(val, h12 ? 'hh:mm A' : 'HH:mm') : h12 ? '--:-- --' : '--:--';
      btn.classList.toggle('is-empty', val == null);
      if (clear) clear.hidden = val == null;
    };
    const openTime = () => {
      if (row.disabled) return;
      if (pop && pop.owner === el) return closePop();
      timePop(el, { value: val, h12, onPick: (t) => { val = t; paint(); } });
    };
    btn.addEventListener('click', openTime);
    if (clear) clear.addEventListener('click', () => { val = null; paint(); });
    paint();
    return { el, focus: () => btn.focus(), rowClick: openTime, value: () => val, valid: () => !row.required || val != null };
  };

  /* --------------------------- Dialogue --------------------------- */
  const setActive = (i) => {
    if (active === i) return;
    if (fields[active]) fields[active].el.classList.remove('is-active');
    active = i;
    if (fields[active]) fields[active].el.classList.add('is-active');
    updateMeta();
  };

  const updateMeta = () => {
    const f = fields[hovered >= 0 ? hovered : active];
    const desc = f && f.row.description;
    P.desc.hidden = !desc;
    P.desc.innerHTML = desc ? RUI.md(desc) : '';
    P.count.textContent = fields.length ? RUI.counter(Math.max(active, 0) + 1, fields.length) : '';
  };

  const prepareDefault = (row) => {
    if (row.type !== 'date' && row.type !== 'date-range' && row.type !== 'time') return;
    const d = row.default;
    row._default = d === true ? Date.now() : Array.isArray(d) ? d.map((p) => new Date(p).getTime()) : d ? new Date(d).getTime() : null;
    if (row.type === 'date' && row._default != null && d !== true) row._default = startOfDay(row._default);
  };

  const build = () => {
    closePop();
    const opts = data.options || {};
    P.el.style.width = (SIZES[opts.size] || SIZES.xs) + 'px';
    RUI.setHeader(P, { title: data.heading || '' });
    P.list.innerHTML = '';
    fields = [];
    active = -1;
    hovered = -1;
    (data.rows || []).forEach((raw, i) => {
      const row = Object.assign({}, raw);
      prepareDefault(row);
      const make = F[row.type] || F.input;
      const f = make(row);
      f.row = row;
      f.el.dataset.i = i;
      f.el.addEventListener('focusin', () => setActive(i));
      f.el.addEventListener('mousedown', (e) => {
        if (row.disabled || e.target.closest('input, textarea, button, .rui-check')) return;
        e.preventDefault();
        f.focus();
        setActive(i);
        if (f.rowClick) f.rowClick();
      });
      fields.push(f);
      P.list.appendChild(f.el);
    });
    actions.querySelector('[data-act="confirm"] .rui-item__label').textContent = RUI.t('confirm');
    const cancel = actions.querySelector('[data-act="cancel"]');
    cancel.querySelector('.rui-item__label').textContent = RUI.t('cancel');
    cancel.classList.toggle('is-disabled', opts.allowCancel === false);
    updateMeta();
  };

  const hide = () => {
    open = false;
    closePop();
    layer.classList.remove('is-open');
    RUI.hide(P.el, 150);
  };

  const finish = (payload, silent) => {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      closeTimer = null;
      if (!silent) RUI.nui('inputData', payload);
    }, 200);
  };

  const cancel = (silent) => {
    if (!data) return;
    hide();
    finish(undefined, silent);
  };

  const submit = () => {
    closePop();
    const bad = fields.filter((f) => !f.valid());
    fields.forEach((f) => f.el.classList.remove('is-invalid'));
    if (bad.length) {
      bad.forEach((f) => {
        f.el.classList.remove('is-shake');
        void f.el.offsetWidth;
        f.el.classList.add('is-invalid', 'is-shake');
      });
      bad[0].focus();
      return;
    }
    const values = fields.map((f) => {
      const v = f.value();
      return v === undefined ? null : v;
    });
    hide();
    finish(values);
  };

  P.list.addEventListener('mouseover', (e) => {
    const r = e.target.closest('.rui-field');
    const i = r ? +r.dataset.i : -1;
    if (i !== hovered) {
      hovered = i;
      updateMeta();
    }
  });
  P.list.addEventListener('mouseleave', () => {
    hovered = -1;
    updateMeta();
  });
  P.list.addEventListener('input', (e) => {
    const r = e.target.closest('.rui-field');
    if (r) r.classList.remove('is-invalid');
  });
  P.list.addEventListener('click', (e) => {
    const r = e.target.closest('.rui-field');
    if (r) r.classList.remove('is-invalid');
  });
  actions.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]');
    if (!a) return;
    if (a.dataset.act === 'confirm') submit();
    else if (!(data.options && data.options.allowCancel === false)) cancel(false);
  });

  RUI.on('openDialog', (d) => {
    if (!d) return;
    clearTimeout(closeTimer);
    closeTimer = null;
    data = d;
    build();
    open = true;
    layer.classList.add('is-open');
    RUI.show(P.el);
    RUI.fitTitle(P, 46, 22);
    const first = fields.find((f) => !f.row.disabled);
    if (first) setTimeout(() => first.focus(), 60);
  });

  RUI.on('closeInputDialog', () => cancel(true));

  window.addEventListener('keydown', (e) => {
    if (!open) return;
    if (pop && pop.onKey && pop.onKey(e)) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (pop) return closePop();
      if (!(data.options && data.options.allowCancel === false)) cancel(false);
      return;
    }
    if (e.key === 'Enter' && !e.repeat && e.target.tagName !== 'TEXTAREA') {
      if (pop) return;
      e.preventDefault();
      submit();
    }
  });
})();
