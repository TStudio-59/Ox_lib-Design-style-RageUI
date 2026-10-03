/* Aperçu dans un navigateur (ouvre web/build/index.html) — inactif en jeu */
(() => {
  'use strict';
  if (!RUI.isBrowser) return;

  const send = (action, data) => window.postMessage({ action, data }, '*');
  const log = (...a) => {
    console.log('[NUI callback]', ...a);
    const out = document.querySelector('.rui-devpanel__log');
    if (out) out.textContent = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ');
  };

  /* ------------------------- Données d'exemple ------------------------- */
  const IMG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 170"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b5876"/><stop offset="1" stop-color="#0b1a2a"/></linearGradient></defs><rect width="400" height="170" fill="url(#g)"/><path d="M70 120 l30-38 h140 l50 30 h40 v20 h-260z" fill="#e8e8e8"/><circle cx="120" cy="124" r="18" fill="#111"/><circle cx="290" cy="124" r="18" fill="#111"/><path d="M110 84 l20-26 h90 l38 26z" fill="#9fc3e0"/></svg>'
    );

  const MENU = {
    title: 'L-Studio',
    info: 'ID : ~r~1~s~ | Métier : ~r~Unemployed~s~',
    position: 'top-left',
    canClose: true,
    items: [
      { label: 'Portefeuille', icon: 'wallet', description: "Argent, banque et transfert d'argent." },
      { label: 'Vêtements', icon: 'shirt', description: 'Retire ou remets tes vêtements.' },
      { label: 'Animations', icon: 'person-walking', values: ['Danser', "S'asseoir", { label: 'Saluer', description: 'Un salut militaire.' }], description: 'Utilise ← → pour choisir.' },
      { label: 'GPS rapide', icon: 'location-dot', description: 'Points importants de la ville.' },
      { label: 'Mode furtif', icon: 'user-secret', checked: false, description: 'Active ou désactive le mode furtif.' },
      { label: 'Santé', icon: 'heart-pulse', progress: 72, colorScheme: 'green' },
      { label: 'Divers', icon: 'ellipsis', description: 'Autres options.' },
    ],
  };

  const CONTEXT = {
    ctx_main: {
      id: 'ctx_main',
      title: 'Garage central',
      info: 'Places libres : ~g~2~s~ / 6',
      canClose: true,
      options: [
        { title: 'Mes véhicules', icon: 'car', menu: 'ctx_sub', description: 'Liste de tes véhicules stockés.', metadata: [{ label: 'Places', value: '4 / 6' }] },
        { title: 'Réparer le véhicule', icon: 'wrench', description: 'Coût : ~g~$250~s~', progress: 60, colorScheme: 'blue' },
        { title: 'Nettoyer', icon: 'spray-can-sparkles', description: 'Lavage complet', iconAnimation: 'beat' },
        { title: 'Option désactivée', icon: 'ban', disabled: true, description: 'Indisponible pour le moment.' },
        { title: 'Information', icon: 'circle-info', readOnly: true, description: 'Les véhicules sont assurés 24 h.' },
      ],
    },
    ctx_sub: {
      id: 'ctx_sub',
      menu: 'ctx_main',
      title: 'Mes véhicules',
      options: [
        {
          title: 'Sultan RS',
          icon: 'car-side',
          image: IMG,
          metadata: [
            { label: 'Moteur', progress: 80 },
            { label: 'Freins', progress: 40 },
            { label: 'Carrosserie', progress: 95, colorScheme: 'green' },
            { label: 'Plaque', value: 'RAGE 001' },
          ],
        },
        { title: 'Faggio', icon: 'motorcycle', metadata: { Plaque: 'SCOOT 42', Essence: '65 %' } },
        { title: 'Benefactor Schafter', icon: 'car', description: 'Fourrière' },
      ],
    },
  };

  const DIALOG = {
    heading: 'Création de facture',
    rows: [
      { type: 'input', label: 'Destinataire', placeholder: 'Prénom Nom', required: true, icon: 'user', description: 'Nom RP du joueur.' },
      { type: 'input', label: 'Code', password: true, icon: 'lock' },
      { type: 'number', label: 'Montant', icon: 'dollar-sign', min: 1, max: 100000, default: 250, step: 50 },
      { type: 'checkbox', label: 'Paiement immédiat', checked: true },
      { type: 'select', label: 'Motif', options: [{ value: 'rep', label: 'Réparation' }, { value: 'fourr', label: 'Fourrière' }, { value: 'amende', label: 'Amende' }], default: 'rep' },
      { type: 'multi-select', label: 'Taxes', options: [{ value: 'tva', label: 'TVA' }, { value: 'eco', label: 'Éco-taxe' }, { value: 'srv', label: 'Service' }], searchable: true },
      { type: 'slider', label: 'Remise (%)', min: 0, max: 50, default: 10 },
      { type: 'color', label: 'Couleur', default: '#c8302c' },
      { type: 'date', label: 'Échéance', default: true, format: 'DD/MM/YYYY' },
      { type: 'date-range', label: 'Période' },
      { type: 'time', label: 'Heure', format: '24' },
      { type: 'textarea', label: 'Note', placeholder: 'Détails…', autosize: true },
    ],
    options: { allowCancel: true, size: 'sm' },
  };

  const RADIAL = [
    { icon: 'car', label: 'Véhicule', menu: 'veh' },
    { icon: 'shirt', label: 'Tenues' },
    { icon: 'id-card', label: "Carte d'identité" },
    { icon: 'handcuffs', label: 'Menotter' },
    { icon: 'kit-medical', label: 'Soigner' },
    { icon: 'phone', label: 'Téléphone' },
    { icon: 'briefcase', label: 'Métier' },
    { icon: 'gear', label: 'Paramètres' },
  ];
  const RADIAL_VEH = [
    { icon: 'door-open', label: 'Portes' },
    { icon: 'key', label: 'Verrouiller' },
    { icon: 'gauge-high', label: 'Limiteur' },
    { icon: 'lightbulb', label: 'Phares' },
  ];
  let radialSub = false;

  /* ------------------------- Callbacks simulés ------------------------- */
  RUI.mock = async (event, data) => {
    log(event, data === undefined ? '' : data);
    switch (event) {
      case 'getConfig':
        return { primaryColor: 'blue', primaryShade: 6 };
      case 'init':
        send('setLocale', { language: 'Français', ui: { cancel: 'Annuler', close: 'Fermer', confirm: 'Confirmer', more: 'Plus...' } });
        return 1;
      case 'openContext':
        if (CONTEXT[data.id]) send('showContext', CONTEXT[data.id]);
        return 1;
      case 'clickContext':
        send('hideContext');
        return 1;
      case 'radialTransition':
        await RUI.wait(100);
        return true;
      case 'radialClick': {
        const items = radialSub ? RADIAL_VEH : RADIAL;
        const it = items[data];
        if (it && it.menu) {
          radialSub = true;
          send('openRadialMenu', false);
          setTimeout(() => send('openRadialMenu', { items: RADIAL_VEH, sub: true }), 100);
        } else {
          radialSub = false;
          send('openRadialMenu', false);
        }
        return 1;
      }
      case 'radialBack':
        radialSub = false;
        send('openRadialMenu', false);
        setTimeout(() => send('openRadialMenu', { items: RADIAL, option: 'veh' }), 100);
        return 1;
      case 'skillCheckOver':
        send('notify', { title: 'Skill check', description: data ? 'Réussi !' : 'Raté…', type: data ? 'success' : 'error' });
        return 1;
      case 'inputData':
        if (data) send('notify', { title: 'Formulaire envoyé', description: '`' + JSON.stringify(data).slice(0, 120) + '`', type: 'success' });
        return 1;
      case 'closeAlert':
        send('notify', { description: `Réponse : **${data}**`, type: data === 'confirm' ? 'success' : 'warning' });
        return 1;
      default:
        return 1;
    }
  };

  /* ------------------------- Panneau ------------------------- */
  const style = document.createElement('style');
  style.textContent = `
    .rui-devpanel{position:fixed;left:12px;bottom:12px;z-index:100;width:250px;padding:10px;background:rgba(10,12,16,.92);color:#ddd;font:12px/1.3 Roboto,Arial,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.5)}
    .rui-devpanel h4{margin:0 0 8px;font-size:13px;color:#5db6e5;text-transform:uppercase;letter-spacing:.5px}
    .rui-devpanel__grid{display:grid;grid-template-columns:1fr 1fr;gap:4px}
    .rui-devpanel button{padding:6px 4px;border:0;background:#22272e;color:#eee;font:500 11.5px Roboto,Arial,sans-serif;cursor:pointer}
    .rui-devpanel button:hover{background:#f0f0f0;color:#000}
    .rui-devpanel select{width:100%;margin-top:6px;padding:4px;background:#22272e;color:#eee;border:0}
    .rui-devpanel__log{margin-top:6px;min-height:28px;max-height:60px;overflow:hidden;color:#8fd18f;font:11px 'Roboto Mono',monospace;word-break:break-all}
  `;
  document.head.appendChild(style);

  const B = {
    Menu: () => send('setMenu', MENU),
    'Context menu': () => send('showContext', CONTEXT.ctx_main),
    'Notif succès': () => send('notify', { title: 'Paiement reçu', description: 'Tu as reçu **$2 500** de ~b~Michael~s~.', type: 'success' }),
    'Notif erreur': () => send('notify', { title: 'Erreur', description: "Tu n'as pas assez d'argent.", type: 'error', position: 'top-right' }),
    'Notif alerte': () => send('notify', { title: 'Attention', description: 'Ton véhicule est presque à sec.', type: 'warning', icon: 'gas-pump', iconAnimation: 'beat' }),
    'Notif info': () => send('notify', { description: 'Appuie sur [F2] pour ouvrir ton téléphone.', type: 'inform', duration: 5000 }),
    'Progress bar': () => send('progress', { label: 'Crochetage en cours', duration: 4000 }),
    'Progress cercle': () => send('circleProgress', { label: 'Réparation', duration: 4000, position: 'middle' }),
    'Annuler progress': () => send('progressCancel'),
    'TextUI': () => send('textUi', { text: '[E] Ouvrir le coffre', position: 'right-center' }),
    'TextUI GTA': () => send('textUi', { text: 'Appuie sur ~INPUT_CONTEXT~ pour parler à ~y~Lamar~s~.', position: 'top-center', icon: 'comment' }),
    'Cacher TextUI': () => send('textUiHide'),
    'Input dialog': () => send('openDialog', DIALOG),
    'Alert dialog': () =>
      send('sendAlert', {
        header: 'Vente du véhicule',
        content: 'Tu es sur le point de **vendre** ta Sultan RS.\n\n- Prix : ~g~$12 000~s~\n- Taxe : 5 %\n\n> Cette action est définitive.',
        centered: true,
        cancel: true,
        labels: { confirm: 'Vendre' },
      }),
    'Radial menu': () => {
      radialSub = false;
      send('openRadialMenu', { items: RADIAL });
    },
    'Skill check': () => send('startSkillCheck', { difficulty: ['easy', 'medium', 'hard'], inputs: ['w', 'a', 's', 'd'] }),
  };

  const panel = document.createElement('div');
  panel.className = 'rui-devpanel';
  panel.innerHTML = `<h4>ox_lib · RageUI — aperçu</h4><div class="rui-devpanel__grid">${Object.keys(B)
    .map((k) => `<button type="button" data-k="${RUI.esc(k)}">${RUI.esc(k)}</button>`)
    .join('')}</div>
    <select class="rui-devpanel__ui" title="theme"><option value="studio">theme : studio</option><option value="rageui">theme : rageui</option></select>
    <select class="rui-devpanel__accent" title="accentColor">${['#a01616', '#1f7a3a', '#1d5fa8', '#7a2fb3', '#c26a12']
      .map((c) => `<option value="${c}">accentColor : ${c}</option>`)
      .join('')}</select>
    <select class="rui-devpanel__banner" title="bannerColor">${['noir', 'rouge', 'vert', 'orange', 'violet', 'bleu']
      .map((c) => `<option value="${c}">bannerColor : ${c}</option>`)
      .join('')}</select>
    <select class="rui-devpanel__theme" title="ox:primaryColor">${['blue', 'red', 'green', 'violet', 'orange', 'teal', 'pink', 'yellow']
      .map((c) => `<option value="${c}">primaryColor : ${c}</option>`)
      .join('')}</select>
    <div class="rui-devpanel__log"></div>`;
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-k]');
    if (b) B[b.dataset.k]();
  });
  const THEME_VARS = ['--rui-fill', '--rui-fill-sel'];
  const banner = panel.querySelector('.rui-devpanel__banner');
  const theme = panel.querySelector('.rui-devpanel__theme');
  const refresh = () => {
    THEME_VARS.forEach((v) => document.documentElement.style.removeProperty(v));
    RUI.setBanner(banner.value);
    RUI.applyTheme({ primaryColor: theme.value, primaryShade: 6 });
  };
  const ui = panel.querySelector('.rui-devpanel__ui');
  ui.value = RUI.theme;
  ui.addEventListener('change', () => {
    document.documentElement.classList.remove('theme-studio', 'theme-rageui');
    document.documentElement.classList.add('theme-' + ui.value);
    RUI.theme = ui.value;
  });
  panel.querySelector('.rui-devpanel__accent').addEventListener('change', (e) => RUI.setAccent(e.target.value));
  banner.value = RUI.cfg.bannerColor || 'noir';
  banner.addEventListener('change', refresh);
  theme.addEventListener('change', refresh);
  // Les clics sur le panneau ne doivent pas fermer les popovers / déclencher le radial
  panel.addEventListener('mousedown', (e) => e.stopPropagation());

  document.body.classList.add('rui-dev');
  document.body.appendChild(panel);
  RUI.dev = { send, MENU, CONTEXT, DIALOG, RADIAL };
})();
