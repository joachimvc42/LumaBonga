# Handoff: LumaBonga — application de comptabilité & production (direction « Créatif »)

## Overview
LumaBonga est une **application mobile de comptabilité artisanale** pour deux associés
(**Lumaya** et **GawahBonga**) qui fabriquent et vendent des produits cosmétiques/textiles
(zinc, déodorant, anti-moustique, wax, baumes, huiles, dentifrice…).

L'app permet de :
- enregistrer les **achats de matières premières** (quantité + prix unitaire) ;
- définir, pour chaque produit vendu, une **recette** = composition de matières + temps de
  main d'œuvre, d'où découle automatiquement le **coût de production unitaire** ;
- suivre le **stock** de matières premières et de produits finis, et calculer combien
  d'unités sont **encore produisibles** ;
- enregistrer la **production** de lots (consomme les matières, crée du stock fini) ;
- enregistrer les **ventes** (unités × prix) → marges, **profit net**, et **répartition**
  des gains entre Lumaya et GawahBonga ;
- créer / modifier / supprimer **chaque entrée** (matière, produit, vente, achat, charge, lot).

## About the Design Files
Les fichiers de ce bundle sont des **références de design réalisées en HTML/React (via Babel
in-browser)** — un prototype montrant l'apparence et le comportement voulus, **pas du code de
production à copier tel quel**. La tâche est de **recréer ce design dans l'environnement cible**
en suivant ses conventions. Comme il n'existe pas encore de codebase, le choix recommandé est
**React Native (Expo)** pour une vraie app mobile iOS/Android, ou **React + Vite** pour une PWA.
La logique métier (modèle de données + moteur de coûts) est framework-agnostique et doit être
extraite dans une couche `domain/` réutilisable.

## Fidelity
**High-fidelity.** Couleurs, typographie, espacements et interactions sont définitifs pour la
direction « Créatif ». Reproduire l'UI fidèlement. (Une 2ᵉ direction « Sage » existe dans le
prototype mais est **hors périmètre** pour la prod — ignorer `lumabonga-sage.jsx`.)

---

## Architecture recommandée (production)

```
src/
  domain/                # logique métier PURE, sans React — à tester unitairement
    types.ts             # Material, Product, Recipe, Sale, Purchase, Cost, Production
    costEngine.ts        # materialPriceAt, recipeCost, costSeries
    stock.ts             # materialStock, finishedStock, producibleFor, bottleneckFor
    totals.ts            # ventes, cogs, charges, profit, marge, valeurs de stock
  store/                 # état + persistance (Zustand/Redux + SQLite/AsyncStorage)
  ui/
    screens/             # Dashboard, Ventes, Achats, Stock, Produits, FicheProduit
    components/          # Hero, Vessels, Bead, Stepper, Chart, Sheet, Segment…
    theme.ts             # tokens (voir Design Tokens)
```

> ⚠️ Le prototype garde tout l'état **en mémoire** (React `useState`, perdu au refresh).
> La version prod **doit persister** (SQLite recommandé pour mobile) et idéalement
> synchroniser entre les deux associés (un backend léger — Supabase/Firebase — convient).

---

## Modèle de données

### Material (matière première ou emballage)
```ts
type Material = {
  id: string;
  name: string;
  unit: 'g' | 'ml' | 'm' | 'pièce';  // unité de mesure
  kind: 'matière' | 'emballage';
  hue: number;                        // 0–360, couleur d'accent de la pastille
  stock0: number;                     // stock d'ouverture (avant achats/production)
  priceHistory: { date: string /*ISO*/; price: number /*FCFA par unit*/ }[];
};
```
Le **prix courant** d'une matière = prix de l'achat le plus récent (les achats alimentent
l'historique de prix). C'est une **fonction en escalier** dans le temps.

### Product (produit fini vendu)
```ts
type Product = {
  id: string;
  name: string;
  emoji: string;       // 2 lettres / abréviation affichée dans la pastille
  hue: number;
  unitPrice: number;   // prix de VENTE unitaire (FCFA) — éditable
  stock0: number;      // stock fini d'ouverture (0 par défaut)
};
```

### Recipe (recette d'un produit, clé = productId)
```ts
type Recipe = {
  ingredients: { id: string; materialId: string; qty: number }[]; // qty PAR unité produite
  labor:       { id: string; task: string; who: string; minutes: number; rate: number }[];
  //            rate = FCFA/heure ; coût ligne = (minutes/60) * rate
};
```

### Mouvements (chacun éditable & supprimable)
```ts
type Sale       = { id; date; productId; qty; price; note };          // vente : unités × prix
type Purchase   = { id; date; materialId; qty; price; note };         // achat matière : qté × prix unitaire
type Cost       = { id; date; label; amount; who };                   // charge hors-matière (transport, loyer…)
type Production = { id; date; productId; qty; who };                   // lot produit : consomme matières, crée stock fini
```

---

## Moteur de coûts (domain/costEngine)

```
materialPricePoints(material, purchases)  // fusionne priceHistory + achats, trié par date
materialPriceAt(material, isoDate, purchases) -> prix en escalier à cette date
materialCurrentPrice(material, purchases)     -> prix à aujourd'hui

recipeCost(recipe, materialById, purchases, isoDate?) -> {
  materials,           // Σ ingredient.qty × prix(materialId, date)
  labor,               // Σ (minutes/60) × rate
  total,               // materials + labor  = COÛT DE PRODUCTION UNITAIRE
  ingredientLines[],   // détail avec prix & coût par ligne
  laborLines[],
}

costSeries(recipe, materialById, purchases, months=6)  // série mensuelle du coût unitaire (graphe)
```

## Stocks (domain/stock)

```
materialStock[materialId]  = stock0 + Σ achats.qty − Σ (production.qty × recipe[prod].ingredient.qty)
finishedStock[productId]   = stock0 + Σ production.qty − Σ sales.qty
producibleFor(productId)   = min sur les ingrédients de  floor(materialStock / qtyParUnité)
bottleneckFor(productId)   = l'ingrédient qui limite la production (le plus faible)
```
> Les stocks sont **dérivés** (recalculés depuis les mouvements), pas mutés en place — ainsi
> supprimer/éditer un mouvement recalcule tout proprement. **Conserver cette approche.**

## Totaux & profit (domain/totals)

```
ventes      = Σ sale.qty × sale.price
cogs        = Σ sale.qty × coûtProductionUnitaire(productId, à la date de la vente)
charges     = Σ cost.amount
profit      = ventes − cogs − charges            // PROFIT NET (base de la répartition)
marge       = profit / ventes × 100
valMatieres = Σ materialStock × prixCourant
valProduits = Σ finishedStock × coûtProductionUnitaire
valStock    = valMatieres + valProduits

// Répartition (réglable) :
partLumaya  = profit × (lumayaShare/100)   // lumayaShare par défaut 70
partGawah   = profit − partLumaya
```

---

## Écrans / Views

L'app est une **navigation à 5 onglets** (barre du bas) + un **bouton « + »** flottant (top-bar)
qui ouvre une feuille de saisie contextuelle, + une **fiche produit** plein écran.

### 1. Profit (Dashboard)
- **Hero** : « Profit net » en grand chiffre (Instrument Serif italic ~56px), sous-titre « marge X% ».
- **Vessels** : deux « vases » verticaux qui se remplissent → part **Lumaya** (accent vert) et
  **GawahBonga** (violet), avec % et montant. Hauteur ∝ montant, transition 0.8s.
- **3 KPI** : Ventes / Coût prod. / Valeur stock (cartes, chiffre Instrument Serif italic 22px).
- **Alertes stock faible** : produits avec ≤ 8 unités produisibles (icône alerte ; rouge si rupture matières).
- **Mouvements** : fil chronologique (timeline « beads ») des 7 dernières entrées (vente/achat/charge/production).

### 2. Ventes
- Hero « Total ventes ». Chips « top produits ». Liste des ventes : pastille produit, `qty × prix`,
  **marge** par ligne (vert/rouge), total. Chaque ligne : **éditer (crayon) + supprimer (poubelle)**.

### 3. Achats — contrôle segmenté **Matières / Charges**
- **Matières** : factures d'achat de matières premières (pastille matière, `qté unit × prix`, total). Édit/suppr.
- **Charges** : dépenses hors-matières (transport, loyer…). Édit/suppr.
- Bouton « + » en bas de chaque segment.

### 4. Stock — contrôle segmenté **Matières / Produits finis**
- **Matières** : chaque matière → **stock restant** (unité) + prix courant/unité + catégorie.
  Ambre si stock bas. Édit/suppr. Bouton « Nouvelle matière ».
- **Produits finis** : chaque produit → **stock fini** + « N produisibles » (rouge si 0) +
  bouton **« Produire »** (ouvre la feuille production préremplie). Puis **historique des lots** de
  production (édit/suppr). Bouton « Lancer une production ».

### 5. Produits (Catalogue)
- Cartes produit : nom, `prixVente − coût = marge`, badges « stock » et « produisibles », chevron.
- Tap → **Fiche produit**. Bouton « Nouveau produit ».

### Fiche produit (plein écran, prend le dessus sur la nav)
- Header : bouton retour, pastille + nom, ligne **« Vente X FCFA » éditable inline** (tap → input).
- **3 tuiles** : Coût / unité · Marge nette · Marge %.
- **Bandeau stock** : En stock · Produisibles (+ matière limitante) · bouton **Produire**.
- **Graphe** « Coût de production · 1 unité » sur 6 mois (aire + ligne, accent) + tendance %.
- **Matières & emballage** : liste éditable — chaque ligne a un **stepper +/−** sur la quantité,
  le prix/unité, et un bouton supprimer. Bouton « Ajouter un composant » (feuille de sélection).
- **Main d'œuvre** : liste éditable — stepper sur les minutes, taux/h + responsable, supprimer.
  Bouton « Ajouter une tâche » (presets).
- **Récap** : matières + main d'œuvre → coût total/unité → marge/unité.

### Feuille de saisie (« + », bottom sheet)
6 types (chips) : **Vente · Achat · Charge · Production · Matière · Produit**. En mode édition,
les chips sont masqués (type figé) et le bouton dit « Enregistrer les modifications ».
- Vente : produit (chips) + unités + prix → aperçu total & marge en direct.
- Achat : matière (chips) + quantité (dans l'unité) + prix/unité → total facture.
- Charge : description + montant + qui.
- Production : produit (chips) + unités + responsable → encart « N produisibles » (rouge si qty > stock).
- Matière : nom + unité (g/ml/m/pièce) + catégorie + stock départ + prix/unité.
- Produit : nom + prix de vente (recette définie ensuite dans la fiche).

---

## Interactions & comportements
- **Bottom sheets** : slide-up 0.3s `cubic-bezier(.2,.8,.2,1)`, backdrop `rgba(0,0,0,.55)` + blur 3px, tap backdrop = fermer.
- **Steppers** : −/valeur/+ ; pas adaptatif (pièce 1 · m 0.5 · g/ml 5 ; minutes 1).
- **Chiffres animés** : compteur easeOutCubic ~600ms à chaque changement de valeur (composant `AnimatedNumber`).
- **Nav du bas** : pastille active qui glisse (`transition left .35s cubic-bezier(.4,1.4,.5,1)`).
- **Segmented control** : pastille coulissante similaire.
- **Édition inline** du prix de vente : tap → `<input>` autofocus, blur/Enter = sauvegarde.
- **Recalcul live** : toute édition (quantité recette, prix d'achat, lot de production) recalcule
  immédiatement coûts, marges, stocks et produisibles partout.

## State management
État global : `products, materials, recipes, sales, purchases, costs, production, activeUser, tweaks`.
Mutations : `add/update/remove` pour chaque entité + `addIngredient/updateIngredientQty/removeIngredient`,
`addLabor/updateLabor/removeLabor`. Tout le reste (stocks, coûts, totaux) est **dérivé** via sélecteurs
mémoïsés. Réglages (« Tweaks ») : `dark`, `accent`, `currency`, `lumayaShare`.

---

## Design Tokens

### Couleurs — thème sombre (par défaut)
| Token | Hex |
|---|---|
| bg | `#08080b` |
| bg2 | `#0e0f14` |
| panel | `#13141b` |
| panel2 | `#1a1c25` |
| border | `#23252f` |
| borderSoft | `#1a1c25` |
| text | `#f3f1ea` |
| muted | `#8c8f9a` |
| mutedSoft | `#5d6068` |
| accent (Lumaya) | `#7dd3a0` |
| purple (GawahBonga / achats) | `#c4a8ff` |
| amber (charges / main d'œuvre) | `#f5c451` |
| rose (négatif / production) | `#f48fb1` |

### Couleurs — thème clair
bg `#f6f4ef` · bg2 `#ffffff` · panel `#ffffff` · panel2 `#f0eee6` · border `#e2dfd4` ·
borderSoft `#ece9df` · text `#15171c` · muted `#5a5e68` · mutedSoft `#9aa0a8`.
Accents identiques. Accent réglable : `#7dd3a0 / #8db4ff / #f5c451 / #c4a8ff / #f48fb1`.

### Pastilles produit/matière
Fond `oklch(0.22 0.08 <hue>)`, texte `oklch(0.92 0.14 <hue>)`, point `oklch(0.6 0.16 <hue>)`.

### Typographie
- **Display** : `Instrument Serif`, **italic** (chiffres héros, titres de section, montants). 18–56px.
- **Sans** : `Inter` (400/500/600/700) — labels, corps, boutons.
- **Mono** : `JetBrains Mono` (400/500/600) — chiffres tabulaires, prix, dates, %.
- Labels de section : 10px, `letter-spacing .6–1.2`, UPPERCASE, weight 600, couleur `muted`.

### Rayons & ombres
- Rayons : cartes 14–18px · pastilles/chips 999px · feuilles top 28px · téléphone 56px.
- Ombre carte téléphone : `0 30px 80px rgba(0,0,0,.45), 0 8px 24px rgba(0,0,0,.25)`.
- Halo hero : `radial-gradient(ellipse 80% 60% at 30% 50%, <accent>22, transparent 70%)` + blur 6px.

### Espacements
Padding écran horizontal **22px** (18px sur Sage). Gaps cartes 8–12px. Cadre device : 402×874, bord 14px.

### Devise
Symbole réglable, défaut **FCFA** (options : XOF, XAF, €, $, MAD, DH). Formatage `fr-FR`, espace comme séparateur de milliers.

---

## Assets
Aucune image bitmap : icônes = SVG stroke maison (voir l'objet `Icon` dans `lumabonga-data.jsx` :
dash, sale, buy, cost, prod, plus, minus, close, trash, edit, back, clock, check, arrow, box, alert).
Les « emoji » produits sont en fait des **abréviations 2 lettres** (Zn, Dé, Am, Wx…), pas des emoji.
Polices via Google Fonts (Instrument Serif, Inter, JetBrains Mono).

## Files (références dans ce bundle)
- `LumaBonga.html` — point d'entrée : scaffolding canvas, cadre iPhone, panneau Tweaks, montage React.
- `lumabonga-data.jsx` — **modèle de données + seeds + moteur de coûts + store (hook) + icônes**. ⭐ cœur métier.
- `lumabonga-creative.jsx` — direction « Créatif » : nav, dashboard, ventes, produits, feuille add/édit.
- `lumabonga-stock.jsx` — écrans Achats (matières/charges) et Stock (matières/produits finis/production).
- `lumabonga-product.jsx` — fiche produit (recette, graphe coût, stock/produire, marges).
- `tweaks-panel.jsx`, `design-canvas.jsx`, `ios-frame.jsx` — utilitaires de prototypage (NON nécessaires en prod).
- `lumabonga-sage.jsx` — 2ᵉ direction visuelle, **hors périmètre prod**.

### Pour démarrer (suggestion)
1. Extraire `domain/` depuis `lumabonga-data.jsx` (types + moteur de coûts + stocks + totaux) et écrire des tests.
2. Choisir le stack (Expo recommandé) + une persistance (SQLite) + un store (Zustand).
3. Recréer les 5 écrans + fiche produit + feuille de saisie en suivant les tokens ci-dessus.
4. Brancher la synchro multi-utilisateur (Lumaya/GawahBonga) si souhaité.
