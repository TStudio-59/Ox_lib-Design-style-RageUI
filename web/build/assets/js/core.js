/*
 * ox_lib · thème RageUI — noyau partagé
 * Remplace l'interface React/Mantine d'origine par une interface native (sans build).
 * Le protocole NUI (actions + callbacks) est identique à ox_lib.
 */
(() => {
  'use strict';

  const CFG = Object.assign(
    {
      scale: 'auto',
      maxVisibleItems: 10,
      submenuArrow: '>>',
      theme: 'studio',
      accentColor: '#a01616',
      menuArrow: '>>',
      bannerColor: 'noir',
      bannerImage: null,
      useOxColor: true,
      contextPosition: { top: '15vh', right: '22vw' },
    },
    window.RUI_CONFIG || {}
  );

  const RUI = (window.RUI = { cfg: CFG });
  RUI.isBrowser = !window.invokeNative;

  // Thème : 'studio' (cartes arrondies, accent rouge) ou 'rageui' (menus natifs GTA)
  RUI.theme = CFG.theme === 'rageui' ? 'rageui' : 'studio';
  document.documentElement.classList.add('theme-' + RUI.theme);
  RUI.counter = (a, b) => (RUI.theme === 'studio' ? `${a} / ${b}` : `${a}/${b}`);

  const resourceName = window.GetParentResourceName ? window.GetParentResourceName() : 'ox_lib';
  const root = document.documentElement;
  const css = (k, v) => root.style.setProperty(k, v);

  /* ------------------------------------------------------------------ */
  /* Événements NUI                                                      */
  /* ------------------------------------------------------------------ */
  const handlers = {};
  RUI.on = (action, fn) => {
    (handlers[action] = handlers[action] || []).push(fn);
  };
  RUI.emit = (action, data) => {
    (handlers[action] || []).forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.error(`[ox_lib/rageui] ${action}`, err);
      }
    });
  };
  window.addEventListener('message', (e) => {
    const d = e.data;
    if (d && typeof d === 'object' && d.action) RUI.emit(d.action, d.data);
  });

  const nativeFetch = window.fetch.bind(window);
  RUI.nui = async (event, data) => {
    if (RUI.isBrowser) return RUI.mock ? RUI.mock(event, data) : 1;
    try {
      const res = await nativeFetch(`https://${resourceName}/${event}`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  };

  /* ------------------------------------------------------------------ */
  /* Échelle (1080p = 1)                                                 */
  /* ------------------------------------------------------------------ */
  const updateScale = () => {
    let s = typeof CFG.scale === 'number' ? CFG.scale : window.innerHeight / 1080;
    s = Math.min(Math.max(s, 0.5), 3);
    css('--rui-scale', s.toFixed(4));
  };
  updateScale();
  window.addEventListener('resize', updateScale);
  css('--rui-rows', String(CFG.maxVisibleItems || 10));
  if (CFG.bannerImage) css('--rui-banner-img', `url("${String(CFG.bannerImage).replace(/"/g, '%22')}")`);

  /* ------------------------------------------------------------------ */
  /* Couleurs (palette Mantine pour colorScheme / ox:primaryColor)       */
  /* ------------------------------------------------------------------ */
  const PALETTE = {
    dark: ['#C1C2C5', '#A6A7AB', '#909296', '#5c5f66', '#373A40', '#2C2E33', '#25262b', '#1A1B1E', '#141517', '#101113'],
    gray: ['#f8f9fa', '#f1f3f5', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#868e96', '#495057', '#343a40', '#212529'],
    red: ['#fff5f5', '#ffe3e3', '#ffc9c9', '#ffa8a8', '#ff8787', '#ff6b6b', '#fa5252', '#f03e3e', '#e03131', '#c92a2a'],
    pink: ['#fff0f6', '#ffdeeb', '#fcc2d7', '#faa2c1', '#f783ac', '#f06595', '#e64980', '#d6336c', '#c2255c', '#a61e4d'],
    grape: ['#f8f0fc', '#f3d9fa', '#eebefa', '#e599f7', '#da77f2', '#cc5de8', '#be4bdb', '#ae3ec9', '#9c36b5', '#862e9c'],
    violet: ['#f3f0ff', '#e5dbff', '#d0bfff', '#b197fc', '#9775fa', '#845ef7', '#7950f2', '#7048e8', '#6741d9', '#5f3dc4'],
    indigo: ['#edf2ff', '#dbe4ff', '#bac8ff', '#91a7ff', '#748ffc', '#5c7cfa', '#4c6ef5', '#4263eb', '#3b5bdb', '#364fc7'],
    blue: ['#e7f5ff', '#d0ebff', '#a5d8ff', '#74c0fc', '#4dabf7', '#339af0', '#228be6', '#1c7ed6', '#1971c2', '#1864ab'],
    cyan: ['#e3fafc', '#c5f6fa', '#99e9f2', '#66d9e8', '#3bc9db', '#22b8cf', '#15aabf', '#1098ad', '#0c8599', '#0b7285'],
    teal: ['#e6fcf5', '#c3fae8', '#96f2d7', '#63e6be', '#38d9a9', '#20c997', '#12b886', '#0ca678', '#099268', '#087f5b'],
    green: ['#ebfbee', '#d3f9d8', '#b2f2bb', '#8ce99a', '#69db7c', '#51cf66', '#40c057', '#37b24d', '#2f9e44', '#2b8a3e'],
    lime: ['#f4fce3', '#e9fac8', '#d8f5a2', '#c0eb75', '#a9e34b', '#94d82d', '#82c91e', '#74b816', '#66a80f', '#5c940d'],
    yellow: ['#fff9db', '#fff3bf', '#ffec99', '#ffe066', '#ffd43b', '#fcc419', '#fab005', '#f59f00', '#f08c00', '#e67700'],
    orange: ['#fff4e6', '#ffe8cc', '#ffd8a8', '#ffc078', '#ffa94d', '#ff922b', '#fd7e14', '#f76707', '#e8590c', '#d9480f'],
  };
  RUI.palette = PALETTE;

  // 'green' | 'green.4' | '#hex' | 'rgb(...)' -> couleur CSS
  RUI.color = (c, defShade = 6) => {
    if (c == null || c === '') return null;
    const m = String(c).match(/^([a-z]+)(?:\.(\d))?$/);
    if (m && PALETTE[m[1]]) return PALETTE[m[1]][m[2] !== undefined ? +m[2] : defShade];
    return String(c);
  };

  // Normalise n'importe quelle couleur CSS en [r, g, b, a]
  const probe = document.createElement('canvas').getContext('2d');
  RUI.rgba = (c) => {
    if (!c) return null;
    probe.fillStyle = '#000';
    probe.fillStyle = String(c);
    const v = probe.fillStyle;
    if (v[0] === '#') return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16), 1];
    const n = v.match(/[\d.]+/g);
    return n ? [+n[0], +n[1], +n[2], n[3] !== undefined ? +n[3] : 1] : null;
  };
  RUI.isLight = (c) => {
    const v = RUI.rgba(c);
    if (!v) return false;
    return (0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]) / 255 > 0.62;
  };
  const mix = (a, b, t) => {
    const x = RUI.rgba(a), y = RUI.rgba(b);
    const ch = (i) => Math.round(x[i] * (1 - t) + y[i] * t);
    return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`;
  };

  // Préréglages de bannière (config.js → bannerColor)
  const BANNERS = {
    noir: ['#3c3c3c', '#060606'],
    rouge: ['#c8302c', '#3a0505'],
    vert: ['#3d9a48', '#0a2b10'],
    orange: ['#e07b1f', '#431a02'],
    violet: ['#7d4bc6', '#1d0a3a'],
    bleu: ['#3a8ad6', '#0b3563'],
  };
  const applyBanner = (c) => {
    if (!c) return;
    const preset = BANNERS[String(c).toLowerCase()];
    if (preset) {
      css('--rui-banner-a', preset[0]);
      css('--rui-banner-b', preset[1]);
    } else if (RUI.rgba(c)) {
      css('--rui-banner-a', c);
      css('--rui-banner-b', mix(c, '#000', 0.8));
    }
  };
  applyBanner(CFG.bannerColor);
  // Couleur d'accent du thème studio (stockée en "r, g, b" pour pouvoir jouer sur la transparence)
  const setAccent = (c) => {
    const v = RUI.rgba(c);
    if (v) css('--st-accent', `${v[0]}, ${v[1]}, ${v[2]}`);
  };
  setAccent(CFG.accentColor);
  RUI.setAccent = setAccent;
  RUI.setBanner = applyBanner;

  // Changement de thème à chaud ('studio' | 'rageui')
  RUI.setTheme = (name) => {
    const t = name === 'rageui' ? 'rageui' : 'studio';
    root.classList.remove('theme-studio', 'theme-rageui');
    root.classList.add('theme-' + t);
    RUI.theme = t;
  };

  /* ------------------------------------------------------------------ */
  /* Personnalisation via les convars ox_ui:* (server.cfg, avec setr)    */
  /* ------------------------------------------------------------------ */
  const isColor = (v) => {
    if (typeof v !== 'string' || !v.trim()) return false;
    return window.CSS && CSS.supports ? CSS.supports('color', v) : !!RUI.rgba(v);
  };
  const BUNDLED_FONTS = ['poppins', 'roboto', 'roboto mono'];
  const loadedFonts = {};
  const loadFont = (family, url) => {
    const href = url || (BUNDLED_FONTS.includes(family.toLowerCase()) ? null :
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@400;500;600;700&display=swap`);
    if (!href || loadedFonts[href]) return;
    loadedFonts[href] = true;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  };
  const fontStack = (family) => `'${family.replace(/['"\\;]/g, '')}', 'Segoe UI', 'Roboto', Arial, sans-serif`;

  // convar (sans le préfixe ox_ui:) → variables CSS
  const COLOR_VARS = {
    header: ['--st-header'],
    subtitle_background: ['--st-subbar', '--rui-subtitle-bg'],
    title: ['--rui-title-color'],
    subtitle: ['--rui-subtitle-text'],
    info: ['--rui-info-color'],
    background: ['--st-bg'],
    item: ['--st-item', '--rui-row-bg'],
    item_border: ['--st-border'],
    selected: ['--rui-sel-bg'],
    selected_text: ['--rui-sel-text'],
    text: ['--rui-text'],
    text_disabled: ['--rui-muted'],
    description: ['--rui-desc-text'],
    bar: ['--rui-fill'],
    bar_background: ['--rui-track'],
    key: ['--rui-key-bg'],
    key_text: ['--rui-key-text'],
    notify_background: ['--rui-toast-bg'],
    overlay: ['--rui-overlay'],
  };

  RUI.applyUi = (ui) => {
    if (!ui || typeof ui !== 'object') return;
    const get = (k) => (ui[k] == null ? '' : String(ui[k]).trim());

    if (get('theme')) RUI.setTheme(get('theme').toLowerCase());

    if (get('font')) {
      loadFont(get('font'), get('font_url') || null);
      css('--rui-font', fontStack(get('font')));
    } else if (get('font_url')) loadFont('', get('font_url'));
    if (get('title_font')) {
      loadFont(get('title_font'), null);
      css('--rui-title-font', fontStack(get('title_font')));
    }

    // L'accent d'abord : les autres couleurs peuvent ensuite le remplacer
    if (isColor(get('accent'))) {
      setAccent(get('accent'));
      if (RUI.theme === 'rageui') {
        css('--rui-fill', get('accent'));
        css('--rui-accent', get('accent'));
      }
    }
    if (isColor(get('header'))) applyBanner(get('header')); // bannière du thème rageui

    Object.keys(COLOR_VARS).forEach((k) => {
      const v = get(k);
      if (isColor(v)) COLOR_VARS[k].forEach((name) => css(name, v));
      else if (v) console.warn(`[ox_lib] convar ox_ui:${k} : couleur invalide "${v}"`);
    });

    const px = (k, name, min, max) => {
      const n = parseFloat(get(k));
      if (!isNaN(n)) css(name, Math.min(Math.max(n, min), max) + 'px');
    };
    px('radius', '--st-radius', 0, 30);
    px('gap', '--st-gap', 0, 30);
    px('width', '--rui-width', 260, 800);
    const rows = parseInt(get('rows'), 10);
    if (rows > 0) {
      CFG.maxVisibleItems = Math.min(rows, 30);
      css('--rui-rows', String(CFG.maxVisibleItems));
    }

    const scale = get('scale').toLowerCase();
    if (scale === 'auto') CFG.scale = 'auto';
    else if (!isNaN(parseFloat(scale))) CFG.scale = parseFloat(scale);
    updateScale();

    if (get('arrow')) {
      const arrow = get('arrow').toLowerCase() === 'none' ? '' : get('arrow');
      CFG.menuArrow = arrow || false;
      CFG.submenuArrow = arrow;
    }

    const img = get('banner_image');
    if (img) css('--rui-banner-img', img.toLowerCase() === 'none' ? 'none' : `url("${img.replace(/"/g, '%22')}")`);

    const types = RUI.notifyTypes || {};
    ['success', 'error', 'warning', 'inform'].forEach((t) => {
      const v = get('notify_' + t);
      if (types[t] && isColor(v)) types[t].color = v;
    });
  };

  // ox:primaryColor (convar d'ox_lib) puis ox_ui:* (prioritaires)
  const applyPrimary = (conf) => {
    if (!CFG.useOxColor || !conf) return;
    if (conf.ui && conf.ui.accent) return; // ox_ui:accent est prioritaire sur ox:primaryColor
    const name = conf.primaryColor;
    if (!name || name === 'blue' || !PALETTE[name]) return; // bleu = ignoré
    const p = PALETTE[name];
    const shade = Math.min(Math.max(+conf.primaryShade || 8, 2), 9);
    if (RUI.theme === 'studio') setAccent(p[Math.min(shade + 2, 9)]);
    if (String(CFG.bannerColor).toLowerCase() === 'auto') {
      css('--rui-banner-a', p[Math.min(Math.max(shade - 1, 4), 7)]);
      css('--rui-banner-b', mix(p[9], '#000', 0.25));
    }
    css('--rui-fill', p[Math.min(shade, 7)]);
    css('--rui-fill-sel', p[Math.min(shade + 1, 9)]);
  };
  RUI.on('setUiConfig', (ui) => RUI.applyUi(ui));
  RUI.applyTheme = (conf) => {
    if (conf && conf.ui && conf.ui.theme) RUI.setTheme(String(conf.ui.theme).toLowerCase());
    applyPrimary(conf);
    if (conf && conf.ui) RUI.applyUi(conf.ui);
  };


  /* ------------------------------------------------------------------ */
  /* Locale                                                              */
  /* ------------------------------------------------------------------ */
  const LANGS = {
    English: 'en', Français: 'fr', Deutsch: 'de', Español: 'es', Italiano: 'it', Português: 'pt', Nederlands: 'nl',
    Polski: 'pl', Русский: 'ru', Türkçe: 'tr', Čeština: 'cs', Dansk: 'da', Eesti: 'et', Suomi: 'fi', Hrvatski: 'hr',
    Magyar: 'hu', Indonesian: 'id', '日本語': 'ja', Lietuvių: 'lt', Norsk: 'no', Română: 'ro', Slovenčina: 'sk',
    Slovenski: 'sl', Svenska: 'sv', 'ไทย': 'th', '简体中文': 'zh-CN', '繁體中文': 'zh-TW', 'العربية': 'ar', 'עברית': 'he',
    'Ελληνικά': 'el', Shqip: 'sq', 'ქართული': 'ka',
  };
  RUI.locale = { language: '', ui: { cancel: 'Cancel', close: 'Close', confirm: 'Confirm', more: 'More...' } };
  RUI.lang = navigator.language || 'en';
  RUI.on('setLocale', (data) => {
    if (!data) return;
    RUI.locale = Object.assign({}, data, { ui: Object.assign({}, RUI.locale.ui, data.ui || {}) });
    if (LANGS[data.language]) RUI.lang = LANGS[data.language];
    root.lang = RUI.lang;
  });
  RUI.t = (key) => (RUI.locale.ui && RUI.locale.ui[key]) || key;

  /* ------------------------------------------------------------------ */
  /* DOM                                                                 */
  /* ------------------------------------------------------------------ */
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
  RUI.esc = esc;

  RUI.el = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  const appRoot = document.getElementById('rui-root');
  // Calque plein écran (non zoomé) qui gère le placement ; le contenu zoomé va dedans.
  RUI.layer = (cls) => {
    const l = RUI.el(`<div class="rui-layer ${cls || ''}"></div>`);
    appRoot.appendChild(l);
    return l;
  };

  RUI.show = (el) => {
    clearTimeout(el._ruiT);
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add('is-open');
  };
  RUI.hide = (el, ms = 150, done) => {
    el.classList.remove('is-open');
    clearTimeout(el._ruiT);
    el._ruiT = setTimeout(() => {
      el.hidden = true;
      if (done) done();
    }, ms);
  };
  RUI.wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // Applique un objet style (format React/emotion) : { backgroundColor: '#000', '.description': { color: 'red' } }
  const UNITLESS = /^(opacity|zIndex|fontWeight|lineHeight|flex|flexGrow|flexShrink|order|zoom)$/;
  RUI.applyStyle = (el, style) => {
    if (!style) return;
    if (typeof style === 'string') {
      el.style.cssText += ';' + style;
      return;
    }
    Object.entries(style).forEach(([k, v]) => {
      if (v && typeof v === 'object') {
        const sel = k.replace(/^&\s*/, '');
        el.querySelectorAll(sel).forEach((child) => RUI.applyStyle(child, v));
        return;
      }
      if (typeof v === 'number' && !UNITLESS.test(k)) v = v + 'px';
      if (k.startsWith('--')) el.style.setProperty(k, v);
      else el.style[k] = v;
    });
  };

  /* ------------------------------------------------------------------ */
  /* Icônes (Font Awesome Free 6.7.2, extraites du build d'origine)       */
  /* ------------------------------------------------------------------ */
  const ICONS = window.RUI_ICONS || { fas: {}, far: {}, fab: {} };
  const PREFIX = {
    fas: 'fas', 'fa-solid': 'fas', solid: 'fas', far: 'far', 'fa-regular': 'far', regular: 'far',
    fab: 'fab', 'fa-brands': 'fab', brands: 'fab', fal: 'fas', 'fa-light': 'fas', fat: 'fas', 'fa-thin': 'fas',
    fad: 'fas', 'fa-duotone': 'fas', fass: 'fas', 'fa-sharp': 'fas', fak: 'fas',
  };
  const lookup = (prefix, name) => {
    const order = prefix === 'fab' ? ['fab', 'fas', 'far'] : prefix === 'far' ? ['far', 'fas', 'fab'] : ['fas', 'far', 'fab'];
    for (const p of order) {
      let d = ICONS[p][name];
      if (typeof d === 'string') d = ICONS[p][d];
      if (d) return d;
    }
    return null;
  };
  RUI.iconData = (icon) => {
    if (!icon) return null;
    if (Array.isArray(icon)) return lookup(PREFIX[icon[0]] || 'fas', String(icon[1]).replace(/^fa-/, ''));
    if (typeof icon === 'object' && icon.iconName) return lookup(PREFIX[icon.prefix] || 'fas', icon.iconName);
    const parts = String(icon).trim().split(/\s+/);
    let prefix = 'fas';
    const names = [];
    parts.forEach((p) => {
      if (PREFIX[p]) prefix = PREFIX[p];
      else names.push(p.replace(/^fa-/, ''));
    });
    for (const n of names) {
      const d = lookup(prefix, n);
      if (d) return d;
    }
    return null;
  };
  RUI.isImage = (s) => typeof s === 'string' && /(:\/\/|\.png|\.webp|\.jpe?g|\.gif|\.svg)/i.test(s);

  // opts : { color, anim, cls, fw (largeur fixe, défaut true) }
  RUI.icon = (icon, opts = {}) => {
    if (!icon) return '';
    if (RUI.isImage(icon)) return `<img class="rui-ico rui-ico--img ${opts.cls || ''}" src="${esc(icon)}" alt="">`;
    const d = RUI.iconData(icon);
    if (!d) return '';
    const cls = ['rui-ico', opts.fw === false ? '' : 'rui-ico--fw', opts.anim ? `rui-anim-${opts.anim}` : '', opts.cls || '']
      .filter(Boolean)
      .join(' ');
    const style = opts.color ? ` style="color:${esc(RUI.color(opts.color))}"` : '';
    return `<svg class="${cls}"${style} viewBox="0 0 ${d[0]} ${d[1]}" aria-hidden="true"><path fill="currentColor" d="${d[2]}"/></svg>`;
  };

  /* ------------------------------------------------------------------ */
  /* Texte : Markdown léger + codes couleur GTA (~r~ ~b~ ~h~ ~n~ ...)     */
  /* ------------------------------------------------------------------ */
  const GTA = {
    r: '#e03232', b: '#5db6e5', g: '#72cc72', y: '#f0c850', p: '#8466e2', q: '#ff73a6', o: '#ff8555',
    c: '#9b9b9b', m: '#6b6b6b', u: '#000000', l: '#000000', w: '#ffffff',
  };
  const INPUTS = {
    INPUT_CONTEXT: 'E', INPUT_PICKUP: 'E', INPUT_TALK: 'E', INPUT_VEH_HORN: 'E', INPUT_DETONATE: 'G',
    INPUT_VEH_HEADLIGHT: 'H', INPUT_ENTER: 'F', INPUT_VEH_EXIT: 'F', INPUT_INTERACTION_MENU: 'M',
    INPUT_SPRINT: 'SHIFT', INPUT_JUMP: 'SPACE', INPUT_DUCK: 'CTRL', INPUT_RELOAD: 'R', INPUT_COVER: 'Q',
    INPUT_ATTACK: 'LMB', INPUT_AIM: 'RMB', INPUT_FRONTEND_ACCEPT: 'ENTER', INPUT_FRONTEND_RDOWN: 'ENTER',
    INPUT_FRONTEND_CANCEL: 'BACKSPACE', INPUT_FRONTEND_RRIGHT: 'BACKSPACE', INPUT_CELLPHONE_CANCEL: 'BACKSPACE',
    INPUT_SELECT_WEAPON: 'TAB', INPUT_MULTIPLAYER_INFO: 'Z', INPUT_VEH_DUCK: 'X', INPUT_CHARACTER_WHEEL: 'ALT',
    INPUT_FRONTEND_PAUSE: 'ESC', INPUT_REPLAY_START_STOP_RECORDING: 'F1', INPUT_SELECT_CHARACTER_MICHAEL: 'F5',
  };
  const KEY_NAME = /^(?:[a-z0-9]{1,3}|f\d{1,2}|enter|entrée|entree|space|espace|shift|maj|ctrl|alt|tab|esc|échap|echap|backspace|retour|suppr|del|insert|home|end|pgup|pgdn|lmb|rmb|mmb|↑|↓|←|→|↵)$/i;
  const keycap = (k) => `<kbd class="rui-key">${String(k).toUpperCase()}</kbd>`;
  RUI.keycap = (k) => keycap(esc(k));

  const gtaCodes = (s) => {
    if (s.indexOf('~') === -1) return s;
    let open = false, bold = false, italic = false;
    s = s.replace(/~(n|h|bold|italic|[rbgypqocmulws])~/g, (m, c) => {
      if (c === 'n') return '<br>';
      if (c === 'h' || c === 'bold') return (bold = !bold) ? '<strong>' : '</strong>';
      if (c === 'italic') return (italic = !italic) ? '<em>' : '</em>';
      let out = open ? '</span>' : '';
      open = false;
      if (c !== 's') {
        out += `<span style="color:${GTA[c]}">`;
        open = true;
      }
      return out;
    });
    if (open) s += '</span>';
    if (bold) s += '</strong>';
    if (italic) s += '</em>';
    return s;
  };

  const safeUrl = (u) => /^(https?:|nui:|data:image\/|\.{0,2}\/)/i.test(u);

  const inline = (src, opts) => {
    let s = esc(src);
    const stash = [];
    const put = (html) => `\u0000${stash.push(html) - 1}\u0000`;
    s = s.replace(/`([^`]+)`/g, (_, c) => put(`<code class="md-code">${c}</code>`));
    s = s.replace(/~(INPUT_[A-Z0-9_]+)~/g, (_, k) => put(keycap(INPUTS[k] || k.replace(/^INPUT_/, '').replace(/_/g, ' '))));
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, url) => (safeUrl(url) ? put(`<img class="md-img" src="${url}" alt="${alt}">`) : m));
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t) => put(`<span class="md-link">${t}</span>`));
    if (opts.keys) s = s.replace(/\[([^\[\]\s]{1,10})\]/g, (m, k) => (KEY_NAME.test(k) ? put(keycap(k)) : m));
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/__(.+?)__/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?![*\w])/g, '$1<em>$2</em>');
    s = s.replace(/(^|[^\w])_(?!\s)(.+?)_(?![\w])/g, '$1<em>$2</em>');
    s = s.replace(/~~(.+?)~~/g, '<del>$1</del>');
    s = gtaCodes(s);
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => stash[+i]);
  };

  // Texte simple (labels de menu) : échappement + codes GTA
  RUI.gta = (text) => (text == null ? '' : gtaCodes(esc(text)));

  // Markdown. opts : { inline: true } (une seule ligne), { keys: true } (convertit [E] en touche)
  RUI.md = (text, opts = {}) => {
    if (text == null || text === '') return '';
    const src = String(text).replace(/\r\n?/g, '\n');
    if (opts.inline) return inline(src.replace(/\n+/g, ' '), opts);
    const out = [];
    let para = [];
    const flush = () => {
      if (para.length) out.push(`<div class="md-p">${para.join('<br>')}</div>`);
      para = [];
    };
    src.split('\n').forEach((line) => {
      let m;
      if (!line.trim()) {
        flush();
        out.push('<div class="md-gap"></div>');
      } else if ((m = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/))) {
        flush();
        out.push(`<div class="md-h md-h${m[1].length}">${inline(m[2], opts)}</div>`);
      } else if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) {
        flush();
        out.push('<hr class="md-hr">');
      } else if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) {
        flush();
        out.push(`<div class="md-li"><span class="md-bullet"></span><span>${inline(m[1], opts)}</span></div>`);
      } else if ((m = line.match(/^\s*(\d+)[.)]\s+(.*)$/))) {
        flush();
        out.push(`<div class="md-li"><span class="md-num">${m[1]}.</span><span>${inline(m[2], opts)}</span></div>`);
      } else if ((m = line.match(/^\s*>\s?(.*)$/))) {
        flush();
        out.push(`<div class="md-quote">${inline(m[1], opts)}</div>`);
      } else {
        para.push(inline(line, opts));
      }
    });
    flush();
    return out.join('').replace(/^(<div class="md-gap"><\/div>)+|(<div class="md-gap"><\/div>)+$/g, '');
  };

  /* ------------------------------------------------------------------ */
  /* Pièces RageUI réutilisables                                         */
  /* ------------------------------------------------------------------ */
  RUI.checkbox = (on) =>
    `<span class="rui-check${on ? ' is-on' : ''}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="square"/></svg></span>`;

  RUI.bar = (value, scheme, cls = '') => {
    const v = Math.min(Math.max(+value || 0, 0), 100);
    const c = RUI.color(scheme);
    return `<span class="rui-bar ${cls}"><i style="width:${v}%${c ? `;background:${esc(c)}` : ''}"></i></span>`;
  };

  // Construit un panneau RageUI : bannière + sous-titre + liste + navigation + description + stats
  RUI.buildPanel = (cls = '') => {
    const el = RUI.el(`
      <div class="rui-panel ${cls}">
        <div class="rui-banner"><span class="rui-banner__title"></span></div>
        <div class="rui-subtitle">
          <div class="rui-subtitle__lead"></div>
          <div class="rui-subtitle__text"></div>
          <div class="rui-subtitle__count"></div>
          <div class="rui-subtitle__tail"></div>
        </div>
        <div class="rui-body">
          <div class="rui-info" hidden></div>
          <div class="rui-list"></div>
          <div class="rui-nav" hidden>${RUI.icon('sort', { fw: false })}</div>
        </div>
        <div class="rui-desc" hidden></div>
        <div class="rui-stats" hidden></div>
      </div>`);
    const q = (s) => el.querySelector(s);
    return {
      el,
      banner: q('.rui-banner'),
      title: q('.rui-banner__title'),
      lead: q('.rui-subtitle__lead'),
      sub: q('.rui-subtitle__text'),
      count: q('.rui-subtitle__count'),
      tail: q('.rui-subtitle__tail'),
      body: q('.rui-body'),
      info: q('.rui-info'),
      list: q('.rui-list'),
      nav: q('.rui-nav'),
      desc: q('.rui-desc'),
      stats: q('.rui-stats'),
    };
  };

  // Titre de bannière (police script) + image optionnelle
  RUI.setHeader = (P, { title, subtitle, banner, info, mdTitle }) => {
    P.info.hidden = info == null || info === '';
    P.info.innerHTML = P.info.hidden ? '' : RUI.md(info, { inline: true, keys: true });
    P.title.innerHTML = mdTitle ? RUI.md(title, { inline: true }) : RUI.gta(title);
    P.sub.innerHTML = subtitle != null ? RUI.gta(subtitle) : P.title.innerHTML;
    if (banner) {
      P.banner.style.backgroundImage = `url("${String(banner).replace(/"/g, '%22')}")`;
      P.banner.classList.add('has-image');
    } else {
      P.banner.style.backgroundImage = '';
      P.banner.classList.remove('has-image');
    }
  };

  // Réduit la taille du titre jusqu'à ce qu'il tienne dans la bannière
  RUI.fitTitle = (P, max = 54, min = 24) => {
    const t = P.title;
    // Le thème peut imposer sa taille de titre (--rui-title-max, en px à 1080p)
    const cssMax = parseFloat(getComputedStyle(P.el).getPropertyValue('--rui-title-max'));
    if (cssMax) {
      max = Math.round(cssMax * (max / 54));
      min = Math.min(min, max);
    }
    const fit = () => {
      const avail = P.banner.clientWidth - 28;
      if (avail <= 0) return;
      let size = max;
      t.style.whiteSpace = 'nowrap';
      t.style.maxWidth = '';
      t.style.fontSize = size + 'px';
      while (t.offsetWidth > avail && size > min) {
        size -= 2;
        t.style.fontSize = size + 'px';
      }
      if (t.offsetWidth > avail) {
        t.style.whiteSpace = 'normal';
        t.style.maxWidth = avail + 'px';
      }
    };
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  };

  // Garde la ligne sélectionnée visible dans une liste qui défile
  RUI.keepVisible = (list, row) => {
    if (!row) return;
    const top = row.offsetTop, h = row.offsetHeight, view = list.clientHeight, st = list.scrollTop;
    if (top < st) list.scrollTop = top;
    else if (top + h > st + view) list.scrollTop = top + h - view;
  };

  /* ------------------------------------------------------------------ */
  /* Dates (format façon dayjs)                                          */
  /* ------------------------------------------------------------------ */
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  RUI.monthName = (m, style = 'long') => {
    try {
      return new Date(2000, m, 1).toLocaleDateString(RUI.lang, { month: style });
    } catch (e) {
      return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m];
    }
  };
  RUI.dayName = (d, style = 'short') => {
    try {
      return new Date(2024, 0, 1 + d).toLocaleDateString(RUI.lang, { weekday: style }); // 2024-01-01 = lundi
    } catch (e) {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d];
    }
  };
  RUI.formatDate = (ts, fmt = 'DD/MM/YYYY') => {
    if (ts == null) return '';
    const d = new Date(ts);
    if (isNaN(d)) return '';
    const H = d.getHours(), h = H % 12 || 12, wd = (d.getDay() + 6) % 7;
    const map = {
      YYYY: d.getFullYear(), YY: pad(d.getFullYear() % 100), MMMM: RUI.monthName(d.getMonth()), MMM: RUI.monthName(d.getMonth(), 'short'),
      MM: pad(d.getMonth() + 1), M: d.getMonth() + 1, DD: pad(d.getDate()), D: d.getDate(), dddd: RUI.dayName(wd, 'long'),
      ddd: RUI.dayName(wd, 'short'), HH: pad(H), H, hh: pad(h), h, mm: pad(d.getMinutes()), m: d.getMinutes(),
      ss: pad(d.getSeconds()), s: d.getSeconds(), A: H < 12 ? 'AM' : 'PM', a: H < 12 ? 'am' : 'pm',
    };
    return String(fmt).replace(/\[([^\]]*)\]|YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|H|hh|h|mm|m|ss|s|A|a/g, (tok, lit) =>
      lit !== undefined ? lit : map[tok]
    );
  };

  /* ------------------------------------------------------------------ */
  /* Presse-papiers + config ox_lib                                      */
  /* ------------------------------------------------------------------ */
  RUI.on('setClipboard', (value) => {
    const t = document.createElement('textarea');
    t.value = value;
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    document.body.removeChild(t);
  });

  RUI.boot = () => {
    RUI.nui('getConfig').then((conf) => RUI.applyTheme(conf));
    RUI.nui('init');
  };
})();
