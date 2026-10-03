/* lib.progressBar / lib.progressCircle — barres façon slider RageUI */
(() => {
  'use strict';

  /* ---------------------------- Barre ---------------------------- */
  const layerBar = RUI.layer('rui-layer--progress');
  const zBar = RUI.el(`
    <div class="rui-zoom">
      <div class="rui-progress rui-anim" hidden>
        <div class="rui-progress__head">
          <span class="rui-progress__label"></span>
          <span class="rui-progress__pct">0%</span>
        </div>
        <div class="rui-progress__track"><div class="rui-progress__fill"></div></div>
      </div>
    </div>`);
  layerBar.appendChild(zBar);
  const bar = zBar.querySelector('.rui-progress');
  const barLabel = bar.querySelector('.rui-progress__label');
  const barPct = bar.querySelector('.rui-progress__pct');
  const barFill = bar.querySelector('.rui-progress__fill');
  let barOpen = false;
  let barRaf = null;

  const stopBarTicker = () => {
    cancelAnimationFrame(barRaf);
    barRaf = null;
  };
  const hideBar = () => {
    barOpen = false;
    stopBarTicker();
    RUI.hide(bar, 120, () => RUI.nui('progressComplete'));
  };

  RUI.on('progress', (d) => {
    if (!d) return;
    const duration = Math.max(+d.duration || 0, 1);
    barLabel.innerHTML = RUI.gta(d.label || '');
    barPct.textContent = '0%';
    barFill.style.animation = 'none';
    void barFill.offsetWidth;
    barFill.style.animation = `rui-grow ${duration}ms linear forwards`;
    barOpen = true;
    RUI.show(bar);
    const start = performance.now();
    stopBarTicker();
    const tick = (now) => {
      barPct.textContent = `${Math.min(100, Math.floor(((now - start) / duration) * 100))}%`;
      if (barOpen) barRaf = requestAnimationFrame(tick);
    };
    barRaf = requestAnimationFrame(tick);
  });
  barFill.addEventListener('animationend', () => {
    if (!barOpen) return;
    barPct.textContent = '100%';
    hideBar();
  });

  /* ---------------------------- Cercle ---------------------------- */
  const R = 33.5;
  const C = 2 * Math.PI * R;
  const layerCircle = RUI.layer('rui-layer--circle pos-middle');
  const zCircle = RUI.el(`
    <div class="rui-zoom">
      <div class="rui-circle rui-anim" hidden>
        <div class="rui-circle__ring">
          <svg viewBox="0 0 90 90" aria-hidden="true">
            <circle class="rui-circle__disc" cx="45" cy="45" r="30"/>
            <circle class="rui-circle__track" cx="45" cy="45" r="${R}"/>
            <circle class="rui-circle__fill" cx="45" cy="45" r="${R}" style="stroke-dasharray:${C};stroke-dashoffset:${C}"/>
          </svg>
          <span class="rui-circle__pct">0%</span>
        </div>
        <div class="rui-circle__label"></div>
      </div>
    </div>`);
  layerCircle.appendChild(zCircle);
  const circle = zCircle.querySelector('.rui-circle');
  const cFill = circle.querySelector('.rui-circle__fill');
  const cPct = circle.querySelector('.rui-circle__pct');
  const cLabel = circle.querySelector('.rui-circle__label');
  let circleOpen = false;
  let circleTimer = null;

  const hideCircle = () => {
    circleOpen = false;
    clearInterval(circleTimer);
    RUI.hide(circle, 120, () => RUI.nui('progressComplete'));
  };

  RUI.on('circleProgress', (d) => {
    if (!d || circleOpen) return;
    const duration = Math.max(+d.duration || 0, 1);
    layerCircle.className = `rui-layer rui-layer--circle pos-${d.position === 'bottom' ? 'bottom' : 'middle'}`;
    cLabel.innerHTML = RUI.gta(d.label || '');
    cLabel.hidden = !d.label;
    cPct.textContent = '0%';
    cFill.style.animation = 'none';
    void cFill.offsetWidth;
    cFill.style.setProperty('--c', C);
    cFill.style.animation = `rui-ring ${duration}ms linear forwards`;
    circleOpen = true;
    RUI.show(circle);
    let pct = 0;
    clearInterval(circleTimer);
    circleTimer = setInterval(() => {
      pct += 1;
      cPct.textContent = `${Math.min(pct, 100)}%`;
      if (pct >= 100) clearInterval(circleTimer);
    }, duration * 0.01);
  });
  cFill.addEventListener('animationend', () => {
    if (circleOpen) hideCircle();
  });

  /* ---------------------------- Annulation ---------------------------- */
  RUI.on('progressCancel', () => {
    if (barOpen) hideBar();
    if (circleOpen) {
      cPct.textContent = '99%';
      hideCircle();
    }
  });
})();
