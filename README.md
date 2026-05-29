# LumaBonga

Application mobile de **comptabilité & production artisanale** pour deux associés —
**Lumaya** et **GawahBonga** — qui fabriquent et vendent des produits cosmétiques et textiles
(zinc, déodorant, anti-moustique, wax, baumes, huiles, dentifrice…).

L'app relie **achats de matières premières → recettes → production → ventes** pour calculer
automatiquement le **coût de production unitaire**, les **marges**, le **profit net** et la
**répartition des gains** entre les deux associés — tout en suivant les **stocks** de matières
et de produits finis, et en indiquant combien d'unités sont **encore produisibles**.

## Que contient ce dépôt

Ce dépôt est un **prototype haute-fidélité** réalisé en HTML + React (chargé via Babel dans le
navigateur, sans build). Il sert de **référence de design et de logique métier** pour construire
la version de production.

| Fichier | Rôle |
|---|---|
| `LumaBonga.html` | Point d'entrée : cadre iPhone, canvas, panneau de réglages, montage React |
| `lumabonga-data.jsx` | ⭐ Modèle de données, seeds, **moteur de coûts**, **stocks**, store, icônes |
| `lumabonga-creative.jsx` | Direction « Créatif » : nav, dashboard, ventes, produits, feuille de saisie |
| `lumabonga-stock.jsx` | Écrans Achats (matières / charges) et Stock (matières / produits finis / production) |
| `lumabonga-product.jsx` | Fiche produit : recette, graphe de coût, stock / production, marges |
| `lumabonga-sage.jsx` | 2ᵉ direction visuelle (mise de côté, hors périmètre prod) |
| `design_handoff_lumabonga/` | **Dossier de handoff** : README détaillé pour implémenter la version de production |

## Lancer le prototype

Aucune installation requise — c'est du HTML statique :

```bash
# au choix
open LumaBonga.html              # macOS
# ou servir le dossier
python3 -m http.server 8000      # puis http://localhost:8000/LumaBonga.html
```

> Astuce : ouvre le panneau **Tweaks** (barre d'outils) pour basculer en mode clair,
> changer la couleur d'accent, la devise et la répartition Lumaya / GawahBonga.

## Modèle métier (résumé)

- **Achats** = matières premières (quantité + prix unitaire ; la dernière facture fixe le prix courant).
- **Recette** par produit = composition de matières (qté/unité) + main d'œuvre (min/unité × taux).
- **Coût de production unitaire** = matières (au prix d'achat) + main d'œuvre — dérivé automatiquement.
- **Production** = un lot consomme les matières et crée du stock de produit fini.
- **Ventes** = unités × prix → marges, **profit net** (= ventes − coût de prod − charges), répartition.
- **Stock** = matières restantes, produits finis restants, et unités **encore produisibles**.
- Chaque entrée est **créable, modifiable et supprimable**.

## Vers la production

Voir **[`design_handoff_lumabonga/README.md`](design_handoff_lumabonga/README.md)** — il documente
le modèle de données complet, le moteur de coûts, les écrans, les tokens de design et une
architecture `domain/` recommandée (React Native / Expo + persistance SQLite).
