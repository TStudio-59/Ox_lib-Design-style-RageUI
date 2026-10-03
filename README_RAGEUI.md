# ox_lib — thèmes Studio & RageUI

Cette version d'ox_lib (3.39.0) remplace toute l'interface NUI d'origine (React + Mantine). Deux thèmes sont inclus, au choix dans `web/build/assets/js/config.js` :

- **`theme: 'studio'`** (par défaut) : panneaux sombres semi-transparents aux coins arrondis, en-tête teintée avec titre en gras (Poppins), options en cartes espacées, sélection rouge et `>>` à droite, ligne d'info centrée et description dans un bloc séparé.
- **`theme: 'rageui'`** : menus natifs de GTA V (bannière, lignes noires, sélection blanche), dans des tons neutres.

**Aucun de tes scripts n'est à modifier.** Le protocole NUI (messages et callbacks) est strictement le même qu'avant. `lib.showMenu`, `lib.showContext`, `lib.notify`, `lib.progressBar`, `lib.inputDialog`, `lib.alertDialog`, `lib.showTextUI`, `lib.addRadialItem` et `lib.skillCheck` fonctionnent comme avant, avec le nouveau look.

## Thème Studio

Tous les composants suivent le même style : fond `rgba(14, 14, 18, 0.74)`, coins arrondis, couleur d'accent (rouge par défaut) pour la sélection, les barres, les touches, le radial et le skill check.

```js
// web/build/assets/js/config.js
theme: 'studio',
accentColor: '#a01616', // couleur d'accent (sélection, en-tête, barres)
menuArrow: '>>',        // texte à droite des options de lib.showMenu (false pour le masquer)
submenuArrow: '>>',     // texte à droite des options de context qui ouvrent un sous-menu
```

Les réglages fins (transparence, arrondis, espacement entre les options, taille du titre) sont en haut de `web/build/assets/theme-studio.css`.

La convar `ox:primaryColor` (par exemple `setr ox:primaryColor green`) remplace la couleur d'accent si `useOxColor` vaut `true`. La valeur par défaut, `blue`, est ignorée.

## Personnaliser les couleurs depuis le server.cfg

Tout se règle avec des convars `ox_ui:*`, sans toucher aux fichiers de la ressource. Le fichier **`ox_ui_exemple.cfg`** (à la racine d'ox_lib) contient la liste complète, avec les valeurs par défaut et une explication pour chaque ligne.

Règles à respecter :

- Utilise **`setr`** (et pas `set`), pour que la valeur soit envoyée aux joueurs.
- Place les lignes **avant** `ensure ox_lib`.
- Ne mets que ce que tu veux changer. `ox_ui:accent` suffit à recolorer l'en-tête, la sélection, les barres, les touches, le radial et le skill check.
- Les couleurs peuvent s'écrire `"#1f8a4c"`, `"#1f8a4ccc"` (avec transparence), `"rgba(31, 138, 76, 0.85)"` ou `"green"`. Si une couleur `"#..."` n'est pas prise en compte, écris-la en `rgb(...)`.
- Après une modification, fais `restart ox_lib`. Avec une version récente de FiveM, un `setr` tapé dans la console serveur met aussi l'interface des joueurs à jour directement. Pour revenir à une valeur par défaut, retire la ligne et redémarre ox_lib.

Exemple, un thème vert :

```cfg
setr ox_ui:accent "#1f8a4c"
setr ox_ui:header "rgba(20, 110, 60, 0.65)"
setr ox_ui:background "rgba(8, 18, 12, 0.8)"
setr ox_ui:subtitle "#9ff0c0"
setr ox_ui:radius "10"
setr ox_ui:arrow "›"

ensure ox_lib
```

Ordre de priorité : `config.js`, puis la convar `ox:primaryColor`, puis les convars `ox_ui:*` (qui l'emportent sur les deux autres).

## Thème RageUI

### Composants (thème RageUI)

| Composant | Style |
|---|---|
| Menu (`lib.registerMenu`) | Bannière (noire par défaut, couleur réglable) avec titre script, barre noire de sous-titre en blanc avec compteur `x/y`, ligne sélectionnée blanche. Listes `‹ valeur ›`, cases à cocher et barres RageUI, 10 lignes visibles avec barre ↑↓, boîte de description. |
| Context menu | Même panneau, utilisable à la souris et au clavier. Boutons retour et fermer dans le sous-titre, flèches `→→→` pour les sous-menus. Panneau de statistiques (metadata, barres segmentées, image). |
| Notifications | Fil d'actualité GTA : tuile d'icône colorée (rouge = erreur, vert = succès, jaune = alerte, blanc = info) et barre de temps. Les 8 positions sont gérées. |
| Progress bar / circle | Barre blanche sur fond gris avec pourcentage, anneau HUD blanc. |
| TextUI | Boîte d'aide GTA. `[E]` ou `~INPUT_CONTEXT~` s'affichent comme une touche. |
| Input dialog | Formulaire RageUI : une ligne par champ, la ligne active en blanc, des lignes Confirmer ↵ / Annuler Esc. Listes, calendrier, heure et couleur sont dessinés en HTML, car les sélecteurs natifs ne s'affichent pas dans la NUI. |
| Alert dialog | Panneau RageUI avec contenu Markdown et choix au clavier (↑↓ / Entrée / Échap). |
| Radial menu | Roue façon sélecteur d'armes. La sélection se fait à la direction de la souris, le moyeu central affiche le libellé survolé. Pages « Plus... » et sous-menus comme dans l'original. |
| Skill check | Anneau HUD avec zone cible blanche, aiguille rouge, touche au centre et indicateur d'étapes. |

## Installation

1. Garde une copie de ton ox_lib actuel (sauvegarde).
2. Remplace ton dossier `ox_lib` par celui-ci, ou copie au minimum :
   - `web/build/` (toute l'interface)
   - `resource/interface/client/menu.lua` et `context.lua` (ajout des champs optionnels `subtitle`, `banner` et `info`)
3. `restart ox_lib`, ou redémarre le serveur.

Pas besoin de `pnpm` ni de build : ce sont des fichiers HTML/CSS/JS simples.

## Aperçu dans un navigateur

Ouvre `web/build/index.html` dans Chrome ou Edge. Un panneau « aperçu » apparaît en bas à gauche et permet de déclencher chaque composant avec des données d'exemple. Ce panneau n'existe pas en jeu.

## Réglages

### `web/build/assets/js/config.js`

| Option | Défaut | Rôle |
|---|---|---|
| `scale` | `'auto'` | Échelle de l'interface (1080p = 1). Mets par exemple `1.15` pour forcer une taille. |
| `theme` | `'studio'` | `'studio'` ou `'rageui'`. |
| `accentColor` | `'#a01616'` | Couleur d'accent du thème studio. |
| `maxVisibleItems` | `10` | Nombre de lignes visibles avant défilement. |
| `menuArrow` | `'>>'` | Texte à droite des options de `lib.showMenu` sans valeur (`false` pour le masquer). |
| `submenuArrow` | `'>>'` | Texte à droite des options qui ouvrent un sous-menu (context). |
| `bannerColor` | `'noir'` | Thème rageui : couleur de la bannière : `'noir'`, `'rouge'`, `'vert'`, `'orange'`, `'violet'`, `'bleu'` (RageUI classique), une couleur `'#hex'`, ou `'auto'` pour suivre la convar. |
| `bannerImage` | `null` | Image de bannière par défaut pour tous les menus (`'nui://mon_script/html/banner.png'`). |
| `useOxColor` | `true` | La convar `ox:primaryColor` recolore les barres (et la bannière si `bannerColor = 'auto'`). |
| `contextPosition` | `{ top: '15vh', right: '22vw' }` | Position du context menu. |

### Couleurs : `web/build/assets/rageui.css`

Le bloc `:root` en haut du fichier contient toutes les couleurs :

```css
--rui-banner-a: #3c3c3c;               /* dégradé de la bannière (ou bannerColor dans config.js) */
--rui-banner-b: #060606;
--rui-subtitle-text: #f5f5f5;          /* texte de la barre noire */
--rui-row-bg: rgba(0, 0, 0, 0.66);
--rui-sel-bg: #f0f0f0;                 /* ligne sélectionnée */
--rui-accent: #f0f0f0;                 /* anneaux, bordures actives */
--rui-fill: #f0f0f0;                   /* remplissage des barres */
--rui-track: rgba(255, 255, 255, 0.2); /* fond des barres */
--rui-fill-sel: #111;                  /* barres sur la ligne sélectionnée */
```

### Convar

```cfg
setr ox:primaryColor red   # red, green, violet, orange, teal, pink, yellow... (blue = ignoré, thème neutre)
```

## Nouveaux champs optionnels (menu et context)

```lua
lib.registerMenu({
    id = 'garage',
    title = 'Garage',
    info = 'ID : ~r~1~s~ | Métier : ~r~Chômeur~s~', -- ligne d'info centrée au-dessus des options
    subtitle = 'Mes ~b~véhicules~s~',                -- texte de la barre sous le titre (défaut : le titre)
    banner = 'nui://mon_script/html/banner.png',   -- image de bannière (sinon la bannière CSS)
    options = { ... },
})

lib.registerContext({
    id = 'shop',
    title = 'Ammu-Nation',
    subtitle = 'Armurerie',
    banner = 'https://exemple.com/banner_ammunation.png',
    options = { ... },
})
```

Format conseillé pour une image de bannière : **390 × 96 px** (thème studio) ou **431 × 107 px** (thème rageui).

Le champ `info` est lu à chaque ouverture : pour afficher des valeurs à jour (ID, métier, argent…), modifie-le dans la table passée à `lib.registerMenu` juste avant `lib.showMenu` (par exemple `monMenu.info = ('ID : ~r~%s~s~'):format(cache.serverId)`), ou passe-le dans `lib.registerContext` avant `lib.showContext`.

## Codes de texte GTA

Ils sont utilisables dans les titres, labels, descriptions, notifications et le TextUI :

- Couleurs : `~r~` rouge, `~g~` vert, `~b~` bleu, `~y~` jaune, `~o~` orange, `~p~` violet, `~q~` rose, `~c~` gris, `~m~` gris foncé, `~w~` blanc, `~s~` couleur par défaut.
- Mise en forme : `~h~` gras, `~n~` retour à la ligne.
- Touches : `~INPUT_CONTEXT~` affiche `E`, `~INPUT_DETONATE~` affiche `G`, etc. Dans les notifications et le TextUI, `[E]`, `[F2]` ou `[SHIFT]` s'affichent aussi comme une touche.
- Le Markdown léger reste disponible : `**gras**`, `*italique*`, listes, titres `#` et `` `code` ``.

## Polices

Le thème studio utilise **Poppins**, incluse dans `web/build/fonts/` (licence SIL Open Font License) : aucun téléchargement n'est nécessaire.

### Titres du thème RageUI

La police originale de GTA (« House Script ») n'est pas fournie, pour des raisons de droits. L'ordre utilisé est le suivant :

1. SignPainter HouseScript, si elle est installée sur le PC du joueur ;
2. Damion, chargée depuis Google Fonts ;
3. une police cursive du système.

Pour imposer ta propre police : copie-la dans `web/build/fonts/RageTitle.ttf`, puis décommente la ligne `url(...)` du bloc `@font-face 'RageTitle'` dans `rageui.css`.

## Petites différences avec l'interface d'origine

- **Alert dialog** : Entrée valide le bouton sélectionné. Échap et Retour annulent, comme avant.
- **Radial menu** : Échap ferme la roue et Retour revient en arrière. Le clic droit fonctionne comme dans l'original (page précédente ou retour).
- **Input dialog** : Entrée valide le formulaire, sauf dans un textarea. Les champs obligatoires vides sont signalés en rouge.
- **Menu et context** : la limite de 10 lignes visibles est réglable.

## Revenir à l'interface d'origine

Remets le dossier `web/build` et les deux fichiers Lua de ta sauvegarde, ou retélécharge ox_lib 3.39.0 depuis GitHub.

## Fichiers modifiés

- `web/build/` : entièrement remplacé (index.html, assets/rageui.css, assets/theme-studio.css, assets/js/*.js, assets/icons.js avec les icônes Font Awesome Free 6.7.2, et fonts/ avec Roboto et Poppins).
- `resource/interface/client/menu.lua` : transmet `subtitle`, `banner` et `info`.
- `resource/interface/client/context.lua` : transmet `subtitle`, `banner` et `info`.
- `resource/client.lua` : lit les convars `ox_ui:*` et les envoie à l'interface.
- `ox_ui_exemple.cfg` : liste des convars de personnalisation.
- `README_RAGEUI.md` : ce fichier.
