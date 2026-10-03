/* lib.alertDialog — fenêtre de confirmation façon RageUI */
(() => {
  'use strict';
  const layer = RUI.layer('rui-layer--modal rui-layer--alert');
  const zoom = RUI.el('<div class="rui-zoom"></div>');
  const P = RUI.buildPanel('rui-dialog rui-alert rui-anim');
  P.el.hidden = true;
  P.nav.remove();
  P.stats.remove();
  P.desc.remove();
  P.list.classList.add('rui-alert__content');
  const actions = RUI.el('<div class="rui-actions"></div>');
  P.list.after(actions);
  zoom.appendChild(P.el);
  layer.appendChild(zoom);

  // Tailles Mantine (xs → xl), RageUI = 431 px minimum
  const SIZES = { xs: 380, sm: 431, md: 431, lg: 620, xl: 780 };
  let open = false;
  let data = null;
  let sel = 0;
  let buttons = [];

  const paintSel = () => {
    actions.querySelectorAll('.rui-action').forEach((b, i) => b.classList.toggle('is-selected', i === sel));
    P.count.textContent = buttons.length > 1 ? RUI.counter(sel + 1, buttons.length) : '';
  };

  const hide = () => {
    open = false;
    layer.classList.remove('is-open');
    RUI.hide(P.el, 150);
  };

  const answer = (result) => {
    if (!open) return;
    hide();
    RUI.nui('closeAlert', result);
  };

  RUI.on('sendAlert', (d) => {
    if (!d) return;
    data = d;
    P.el.style.width = (SIZES[d.size] || SIZES.md) + 'px';
    RUI.setHeader(P, { title: d.header || '', mdTitle: true });
    P.list.innerHTML = `<div class="rui-alert__md">${RUI.md(d.content || '')}</div>`;
    P.list.scrollTop = 0;
    P.el.classList.toggle('is-overflow', !!d.overflow);
    layer.classList.toggle('is-centered', !!d.centered);

    const labels = d.labels || {};
    buttons = [{ act: 'confirm', label: labels.confirm || RUI.t('confirm'), key: '↵' }];
    if (d.cancel) buttons.push({ act: 'cancel', label: labels.cancel || RUI.t('cancel'), key: 'Esc' });
    actions.innerHTML = buttons
      .map(
        (b) =>
          `<div class="rui-item rui-action" data-act="${b.act}"><div class="rui-item__label">${RUI.gta(b.label)}</div><div class="rui-item__right">${RUI.keycap(b.key)}</div></div>`
      )
      .join('');
    sel = 0;
    paintSel();

    open = true;
    layer.classList.add('is-open');
    RUI.show(P.el);
    RUI.fitTitle(P, 46, 22);
  });

  RUI.on('closeAlertDialog', () => {
    if (open) hide();
  });

  actions.addEventListener('mouseover', (e) => {
    const b = e.target.closest('.rui-action');
    if (!b) return;
    const i = buttons.findIndex((x) => x.act === b.dataset.act);
    if (i >= 0 && i !== sel) {
      sel = i;
      paintSel();
    }
  });
  actions.addEventListener('click', (e) => {
    const b = e.target.closest('.rui-action');
    if (b) answer(b.dataset.act);
  });

  window.addEventListener('keydown', (e) => {
    if (!open) return;
    switch (e.code) {
      case 'Escape':
      case 'Backspace':
        answer('cancel');
        break;
      case 'Enter':
      case 'NumpadEnter':
        if (!e.repeat) answer(buttons[sel] ? buttons[sel].act : 'confirm');
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        sel = (sel + 1) % buttons.length;
        paintSel();
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        sel = (sel - 1 + buttons.length) % buttons.length;
        paintSel();
        break;
      default:
        return;
    }
    e.preventDefault();
  });
})();
