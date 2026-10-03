/*
 * ox_lib · thème RageUI / Studio — configuration
 * Modifie ces valeurs puis redémarre la ressource (restart ox_lib).
 * Les convars ox_ui:* du server.cfg (voir ox_ui_exemple.cfg) sont prioritaires sur ce fichier.
 * Les couleurs fines se règlent dans assets/rageui.css (RageUI) et assets/theme-studio.css (Studio).
 */
window.RUI_CONFIG = {
  // 'studio' = panneaux arrondis semi-transparents, accent rouge (défaut)
  // 'rageui' = menus natifs GTA V (bannière, lignes noires, sélection blanche)
  theme: 'studio',

  // Couleur d'accent du thème studio (en-tête, option sélectionnée, barres)
  accentColor: '#a01616',

  // 'auto' = s'adapte à la hauteur de l'écran (1080p = 1). Ou un nombre fixe, ex : 1.15
  scale: 'auto',

  // Nombre de lignes visibles dans un menu avant de défiler
  maxVisibleItems: 10,

  // Texte à droite des options de lib.showMenu sans valeur (false pour le masquer)
  menuArrow: '>>',

  // Texte à droite d'une option qui ouvre un sous-menu (context menu)
  submenuArrow: '>>',

  // Thème rageui uniquement — couleur de la bannière : 'noir', 'rouge', 'vert', 'orange', 'violet', 'bleu',
  // une couleur hexadécimale (ex : '#c8302c'), ou 'auto' pour suivre la convar ox:primaryColor
  bannerColor: 'noir',

  // Image de bannière par défaut (URL ou chemin nui://), pour les deux thèmes. null = bannière dessinée en CSS
  // Exemple : 'nui://mon_script/html/banner.png'
  bannerImage: null,

  // true = la convar ox:primaryColor (ex : setr ox:primaryColor green) remplace la couleur d'accent
  // 'blue' (valeur par défaut d'ox_lib) est ignoré
  useOxColor: true,

  // Position du context menu (lib.showContext)
  contextPosition: { top: '15vh', right: '22vw' },
};
