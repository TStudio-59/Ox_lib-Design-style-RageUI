/* lib.skillCheck — anneau de réflexe façon HUD GTA (même logique de jeu qu'ox_lib) */
(() => {
  'use strict';
  const AREAS = { easy: 50, medium: 40, hard: 25 };
  const SPEED = { easy: 1, medium: 1.5, hard: 1.75 };
  const FULL_TURN = 2000; // ms pour un tour complet à vitesse 1
  const R = 58;
  const CIRC = 2 * Math.PI * R;
  const BOX = 180;
  const M = BOX / 2;

  const layer = RUI.layer('rui-layer--skillcheck');
  const zoom = RUI.el('<div class="rui-zoom"></div>');
  const box = RUI.el(`
    <div class="rui-skill rui-anim" hidden>
      <svg class="rui-skill__svg" viewBox="0 0 ${BOX} ${BOX}" width="${BOX}" height="${BOX}" aria-hidden="true">
        <circle class="rui-skill__disc" cx="${M}" cy="${M}" r="${R - 6}"/>
        <circle class="rui-skill__track" cx="${M}" cy="${M}" r="${R}"/>
        <circle class="rui-skill__area" cx="${M}" cy="${M}" r="${R}" style="stroke-dasharray:${CIRC}"/>
        <circle class="rui-skill__needle" cx="${M}" cy="${M}" r="${R}" style="stroke-dasharray:${CIRC};stroke-dashoffset:${CIRC - 4}"/>
      </svg>
      <kbd class="rui-key rui-skill__key">E</kbd>
      <div class="rui-skill__stages"></div>
    </div>`);
  zoom.appendChild(box);
  layer.appendChild(zoom);

  const area = box.querySelector('.rui-skill__area');
  const needle = box.querySelector('.rui-skill__needle');
  const keyEl = box.querySelector('.rui-skill__key');
  const stagesEl = box.querySelector('.rui-skill__stages');

  const rand = (min, max) => Math.floor(Math.random() * (max - min)) + min;

  let check = null; // données reçues
  let stage = 0;
  let round = null; // { angle, size, key, keys, mult }
  let indicator = -90;
  let startT = null;
  let raf = null;
  let running = false;

  const stopLoop = () => {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
  };

  const paintStages = () => {
    const n = Array.isArray(check.difficulty) ? check.difficulty.length : 1;
    stagesEl.innerHTML = n > 1 ? Array.from({ length: n }, (_, i) => `<i class="${i < stage ? 'is-done' : i === stage ? 'is-now' : ''}"></i>`).join('') : '';
  };

  const newRound = (diff) => {
    const size = typeof diff === 'object' && diff ? +diff.areaSize : AREAS[diff];
    const mult = typeof diff === 'object' && diff ? +diff.speedMultiplier : SPEED[diff];
    const key = check.inputs && check.inputs.length ? check.inputs[Math.floor(Math.random() * check.inputs.length)] : 'e';
    round = {
      size: size || 50,
      mult: Math.max(mult || 0, 0.0001),
      angle: -90 + rand(120, 360 - (size || 50)),
      key: String(key).toLowerCase(),
      keys: check.inputs ? check.inputs.map((k) => String(k).toLowerCase()) : null,
    };
    area.style.strokeDashoffset = CIRC - (Math.PI * R * round.size) / 180;
    area.setAttribute('transform', `rotate(${round.angle} ${M} ${M})`);
    keyEl.textContent = round.key.toUpperCase();
    indicator = -90;
    needle.setAttribute('transform', `rotate(${indicator} ${M} ${M})`);
    startT = null;
    running = true;
    paintStages();
    stopLoop();
    raf = requestAnimationFrame(loop);
  };

  const loop = (now) => {
    if (!running) return;
    if (startT === null) startT = now;
    const turn = FULL_TURN / round.mult;
    indicator = -90 + Math.min((now - startT) / turn, 1) * 360;
    needle.setAttribute('transform', `rotate(${indicator} ${M} ${M})`);
    if (indicator + 90 >= 360) {
      running = false;
      stopLoop();
      complete(false);
      return;
    }
    raf = requestAnimationFrame(loop);
  };

  const finish = (success) => {
    running = false;
    stopLoop();
    box.classList.add(success ? 'is-win' : 'is-fail');
    RUI.hide(box, 220, () => box.classList.remove('is-win', 'is-fail'));
    check = null;
    RUI.nui('skillCheckOver', success);
  };

  const complete = (success) => {
    if (!check) return;
    if (!success || !Array.isArray(check.difficulty) || stage >= check.difficulty.length - 1) return finish(success);
    stage++;
    box.classList.remove('is-pulse');
    void box.offsetWidth;
    box.classList.add('is-pulse');
    newRound(check.difficulty[stage]);
  };

  RUI.on('startSkillCheck', (d) => {
    if (!d) return;
    check = d;
    stage = 0;
    box.classList.remove('is-win', 'is-fail', 'is-pulse');
    newRound(Array.isArray(d.difficulty) ? d.difficulty[0] : d.difficulty);
    RUI.show(box);
  });

  RUI.on('skillCheckCancel', () => {
    running = false;
    stopLoop();
    check = null;
    RUI.hide(box, 150);
    RUI.nui('skillCheckOver', false);
  });

  window.addEventListener('keydown', (e) => {
    if (!running || !check || !e.key) return;
    let k = e.key.toLowerCase();
    // Claviers non latins (grec, cyrillique...) : on se rabat sur la touche physique
    if (e.key.charCodeAt(0) >= 880) {
      if (e.code.indexOf('Key') === 0 && e.code.length === 4) k = e.code.charAt(3).toLowerCase();
      if (e.code.indexOf('Digit') === 0 && e.code.length === 6) k = e.code.charAt(5);
    }
    if (round.keys && !round.keys.includes(k)) return;
    running = false;
    stopLoop();
    const ok = k === round.key && indicator >= round.angle && indicator <= round.angle + round.size;
    complete(ok);
  });
})();
