/* lib.showTextUI — boîte d'aide façon GTA ("Appuyez sur [E] pour ...") */
(() => {
  'use strict';
  const layer = RUI.layer('rui-layer--textui pos-right-center');
  const zoom = RUI.el('<div class="rui-zoom"></div>');
  const box = RUI.el('<div class="rui-textui rui-anim" hidden></div>');
  zoom.appendChild(box);
  layer.appendChild(zoom);

  RUI.on('textUi', (d) => {
    if (!d) return;
    const position = d.position || 'right-center';
    layer.className = `rui-layer rui-layer--textui pos-${position}`;
    const align = !d.alignIcon || d.alignIcon === 'center' ? 'center' : 'flex-start';
    const icon = d.icon
      ? `<span class="rui-textui__icon" style="align-self:${align}">${RUI.icon(d.icon, { color: d.iconColor, anim: d.iconAnimation })}</span>`
      : '';
    box.removeAttribute('style');
    box.innerHTML = `${icon}<div class="rui-textui__text">${RUI.md(d.text, { keys: true })}</div>`;
    RUI.applyStyle(box, d.style);
    RUI.show(box);
  });

  RUI.on('textUiHide', () => RUI.hide(box, 120));
})();
