/* lib.notify — notifications façon fil d'actualité GTA */
(() => {
  'use strict';
  const POSITIONS = ['top-left', 'top-center', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'];
  const layer = RUI.layer('rui-layer--notify');
  const stacks = {};
  POSITIONS.forEach((p) => {
    const anchor = RUI.el(`<div class="rui-toasts-anchor" data-pos="${p}"><div class="rui-zoom rui-toasts" data-pos="${p}"></div></div>`);
    layer.appendChild(anchor);
    stacks[p] = anchor.firstElementChild;
  });

  // Couleurs HUD de GTA V
  const TYPES = {
    error: { icon: 'circle-xmark', color: '#e03232' },
    success: { icon: 'circle-check', color: '#72cc72' },
    warning: { icon: 'circle-exclamation', color: '#f0c850' },
    info: { icon: 'circle-info', color: '#f0f0f0' },
  };
  TYPES.inform = TYPES.info; // type par défaut d'ox_lib
  RUI.notifyTypes = TYPES; // couleurs modifiables via les convars ox_ui:notify_*

  const live = new Map(); // id -> { el, timer }

  const dismiss = (el) => {
    if (!el.isConnected || el.classList.contains('is-leaving')) return;
    el.classList.add('is-leaving');
    setTimeout(() => {
      const gap = 8;
      el.style.transition = 'margin .15s ease';
      const h = el.offsetHeight + gap;
      if (el.parentElement && el.parentElement.dataset.pos.startsWith('bottom')) el.style.marginTop = `-${h}px`;
      else el.style.marginBottom = `-${h}px`;
      setTimeout(() => el.remove(), 160);
    }, 380);
  };

  RUI.on('notify', (n) => {
    if (!n || (!n.title && !n.description)) return;
    const id = n.id != null ? String(n.id) : null;
    const duration = n.duration || 3000;
    const showDuration = n.showDuration !== undefined ? n.showDuration : true;
    let pos = n.position || 'top-right';
    if (pos === 'top') pos = 'top-center';
    else if (pos === 'bottom') pos = 'bottom-center';
    if (!stacks[pos]) pos = 'top-right';

    const type = TYPES[n.type] || TYPES.info;
    const tile = n.iconColor ? RUI.color(n.iconColor) : type.color;
    const ink = RUI.isLight(tile) ? '#0a0a0a' : '#ffffff';
    const align = !n.alignIcon || n.alignIcon === 'center' ? 'center' : 'flex-start';

    const el = RUI.el(`
      <div class="rui-toast" style="--c:${RUI.esc(tile)};--ci:${ink}">
        <div class="rui-toast__icon" style="align-self:${align}">${RUI.icon(n.icon || type.icon, { anim: n.iconAnimation })}</div>
        <div class="rui-toast__body">
          ${n.title ? `<div class="rui-toast__title">${RUI.md(n.title, { inline: true, keys: true })}</div>` : ''}
          ${n.description ? `<div class="rui-toast__desc description${n.title ? '' : ' is-only'}">${RUI.md(n.description, { keys: true })}</div>` : ''}
        </div>
        ${showDuration ? `<div class="rui-toast__timer" style="animation-duration:${duration}ms"></div>` : ''}
      </div>`);
    RUI.applyStyle(el, n.style);

    const prev = id && live.get(id);
    if (prev && prev.el.isConnected && !prev.el.classList.contains('is-leaving')) {
      clearTimeout(prev.timer);
      el.classList.add('is-update');
      prev.el.replaceWith(el);
    } else {
      const stack = stacks[pos];
      if (pos.startsWith('top')) stack.prepend(el);
      else stack.append(el);
    }

    const timer = setTimeout(() => {
      dismiss(el);
      if (id && live.get(id) && live.get(id).el === el) live.delete(id);
    }, duration);
    if (id) live.set(id, { el, timer });
  });
})();
