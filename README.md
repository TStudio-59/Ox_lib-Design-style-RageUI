<div align="center">

# 🎨 Ox_lib · Design style RageUI

**Un nouveau design moderne pour toute l'interface d'ox_lib.**
Installe, redémarre, c'est prêt : aucun script à modifier.

![Gratuit](https://img.shields.io/badge/gratuit-oui-3fbf6b?style=for-the-badge)
![ox_lib](https://img.shields.io/badge/ox__lib-3.39.0-0a8cf0?style=for-the-badge)
![Licence](https://img.shields.io/badge/licence-LGPL--3.0-1a1a1f?style=for-the-badge)
<img width="395" height="432" alt="Capture d&#39;écran 2026-10-03 165339" src="https://github.com/user-attachments/assets/5601276d-4571-479e-aad9-9d023d50b9fc" />
<img width="420" height="451" alt="Capture d&#39;écran 2026-10-03 165305" src="https://github.com/user-attachments/assets/e791fb5c-8f37-4170-80e5-3490e851bdff" />

![Aperçu](docs/apercu-scene.png)

</div>

## ✨ Ce qui change

Menus, context menus, notifications, barres de progression, TextUI, formulaires, fenêtres de confirmation, radial menu et skill check : **tout est redessiné**, dans un style sombre et translucide, avec la couleur de ton choix.

| Context menu | Formulaire |
|:---:|:---:|
| ![Context menu](docs/context.png) | ![Formulaire](docs/formulaire.png) |

| Radial menu | Skill check |
|:---:|:---:|
| ![Radial](docs/radial.png) | ![Skill check](docs/skillcheck.png) |

## 🚀 Installation

1. Télécharge **`ox_lib.zip`** dans les [Releases](https://github.com/TStudio-59/Ox_lib-Design-style-RageUI/releases/latest).
2. Remplace ton dossier `ox_lib` par celui du zip.
3. Redémarre ton serveur.

> ⚠️ Le dossier doit s'appeler exactement **`ox_lib`**.

## 🎨 Changer les couleurs

Ajoute une ligne dans ton `server.cfg`, **avant** `ensure ox_lib` :

```cfg
setr ox_ui:accent "rgb(0, 140, 240)"
```

Cette ligne suffit à recolorer tout le menu. Pour aller plus loin (fond, en-tête, police, arrondis…), le fichier [`ox_ui.cfg`](ox_ui.cfg) contient un réglage complet et plusieurs thèmes prêts à l'emploi.

## 🧩 Bonus : ligne d'info dans les menus

```lua
lib.registerMenu({
    id = 'personnel',
    title = 'Personnel',
    info = 'ID : ~b~1~s~ | Métier : ~b~Vigneron~s~',
    options = { ... },
})
```

## 📜 Crédits

- Basé sur [ox_lib](https://github.com/overextended/ox_lib) par **Overextended**, sous licence LGPL-3.0.
- Icônes : Font Awesome Free. Polices : Poppins et Roboto.

<div align="center">

Projet gratuit par **[TStudio-59](https://github.com/TStudio-59)**. Une ⭐ fait toujours plaisir !

</div>
