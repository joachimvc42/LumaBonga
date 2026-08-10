// lumabonga-data.jsx
// Shared state, formatters and seed data for the LumaBonga prototype.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "lumayaShare": 70,
  "currency": "IDR",
  "accent": "#7dd3a0",
  "lang": "en",
  "showCreative": true,
  "showSage": false
}/*EDITMODE-END*/;

// ── Formatters ───────────────────────────────────────────────
const fmtNum = (n) => {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');
};
const fmtMoney = (n, cur = 'IDR') => `${fmtNum(n)} ${cur}`;
// Quantity with up to 1 decimal (so small amounts don't round to 0).
const fmtQty = (n) => {
  const v = Number(n) || 0;
  const s = (Math.round(v * 10) / 10).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  return s.replace(/ | /g, ' ');
};
const fmtShort = (n) => {
  const v = Math.round(Number(n) || 0);
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1).replace('.0', '') + 'k';
  return String(v);
};
const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString(LB_LOCALE, { day: '2-digit', month: 'short' });
};
const fmtDay = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString(LB_LOCALE, { weekday: 'short', day: '2-digit', month: 'short' });
};
const todayISO = () => new Date().toISOString().slice(0, 10);
// Local-calendar-date version of todayISO(). todayISO() is UTC-based and
// stays that way for its existing callers (historical record-stamping,
// where an hours-scale skew is harmless). But for any user-facing "which
// day is today" comparison, UTC silently disagrees with the browser's
// local clock for part of every day at any non-zero UTC offset — this
// bit the to-do calendar's first version for exactly this app's real
// (UTC+8) users. Use this instead for every such comparison.
const todayLocalISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

// ── i18n ─────────────────────────────────────────────────────
// French strings are the keys. tr() returns English when lang==='en',
// else the key itself (French). Placeholders: tr('margin {p}%', {p: 12}).
let LB_LANG = 'en';
let LB_LOCALE = 'en-US';
const LB_LOCALES = { fr: 'fr-FR', id: 'id-ID', en: 'en-US' };
const setLbLang = (l) => { LB_LANG = (l === 'fr' || l === 'id') ? l : 'en'; LB_LOCALE = LB_LOCALES[LB_LANG]; };
const LB_EN = {
  // generic
  'Optionnel': 'Optional', 'Note': 'Note', 'Description': 'Description',
  'Enregistrer': 'Save', 'Enregistrer les modifications': 'Save changes',
  'Modifier': 'Edit', 'Nouvelle entrée': 'New entry', 'Produire': 'Produce',
  'Responsable': 'In charge', 'Produit par': 'Produced by', 'Atelier': 'Workshop', 'Qui / atelier': 'Who / workshop',
  'Catégorie': 'Category', 'Type': 'Type', 'matière': 'material', 'emballage': 'packaging', 'unité': 'unit',
  'Matière': 'Material', 'Emballage': 'Packaging',
  // transaction kinds / tags
  'Vente': 'Sale', 'Achat': 'Purchase', 'Charge': 'Expense', 'Production': 'Production',
  'Produit': 'Product', 'Matière première': 'Raw material',
  // nav
  'Profit': 'Profit', 'Ventes': 'Sales', 'Achats': 'Purchases', 'Stock': 'Stock', 'Produits': 'Products',
  'To do': 'To do',
  // dashboard
  'Profit net': 'Net profit', 'marge {p}%': 'margin {p}%',
  'Profit ce mois': 'Profit this month', 'Profit total': 'Total profit',
  'Δ valeur stock': 'Δ stock value', 'ce mois': 'this month', 'Stock total': 'Total stock',
  'Ce mois': 'This month', 'Total': 'Total', 'Δ ce mois': 'Δ this month', 'Stock value': 'Stock value',
  'Profit': 'Profit', 'Achats': 'Purchases', 'Stock': 'Stock',
  'Comptes équilibrés': 'Accounts settled', 'doit recevoir': 'must receive', 'Régler': 'Settle',
  'Historique des règlements ({n})': 'Settlement history ({n})',
  'Balance des comptes': 'Account balance',
  'à recevoir': 'to receive', 'à reverser': 'to pay', 'équilibré': 'settled',
  'Règlement entre associés': 'Partner settlement', 'Règlement': 'Settlement',
  'Perte / Profit par partie': 'Profit / Loss per party',
  'Pas de règlement pour l’instant — {names} pas encore en bénéfices.': 'No settlement for now — {names} not yet profitable.',
  'Enregistrer un règlement': 'Record a settlement',
  'depuis le début': 'since the start',
  'Qui paie': 'Who pays', '→ reçu par {name}': '→ received by {name}',
  'Coût prod.': 'Prod. cost', 'Valeur stock': 'Stock value',
  'Stock faible': 'Low stock', 'à produire': 'to produce', 'rupture': 'out of stock',
  '{n} produisibles': '{n} producible', 'rupture matières': 'out of materials',
  '{n} en stock': '{n} in stock',
  'Mouvements': 'Activity', '{n} récents': '{n} recent',
  '{n} unités produites': '{n} units produced',
  // sales screen
  'Total ventes': 'Total sales', '{n} transactions': '{n} transactions',
  '{n} entrées': '{n} entries', 'marge': 'margin', 'Tous': 'All',
  // products screen
  'Catalogue': 'Catalog', 'produits actifs': 'active products', 'Nouveau produit': 'New product',
  'Composition': 'Composition', 'Aucun composant': 'No components', 'Terminé': 'Done', 'Modifier': 'Edit',
  // add sheet
  'Unités vendues': 'Units sold', 'Prix unité ({cur})': 'Unit price ({cur})',
  'Total vente': 'Sale total', 'Marge ({c}/u de coût)': 'Margin ({c}/u cost)',
  "Crée d’abord une matière (onglet Matière).": 'Create a material first (Material tab).',
  'Quantité ({u})': 'Quantity ({u})', 'Prix / {u} ({cur})': 'Price / {u} ({cur})',
  'Quantité achetée': 'Quantity bought', 'Unité': 'Unit',
  'Prix total payé ({cur})': 'Total price paid ({cur})', 'Prix calculé / {u}': 'Computed price / {u}',
  'Fournisseur / note': 'Supplier / note', 'Total facture': 'Invoice total',
  'Transport, loyer atelier…': 'Transport, workshop rent…', 'Montant ({cur})': 'Amount ({cur})',
  'Produit fabriqué': 'Product made', 'Unités à produire': 'Units to produce',
  'Unités produites': 'Units produced',
  'Info : {n} unités produisibles avec le stock actuel': 'Info: {n} units producible with current stock',
  ' · le stock matières passera en négatif': ' · material stock will go negative',
  'Stock matières : {n} unités produisibles': 'Materials stock: {n} producible units',
  ' · limité par {name}': ' · limited by {name}',
  'Nom de la matière': 'Material name', 'Ex: Beurre de karité': 'e.g. Shea butter',
  'Unité de mesure': 'Unit of measure', 'Stock de départ ({u})': 'Starting stock ({u})',
  'Nom du produit': 'Product name', 'Ex: Savon noir': 'e.g. Black soap',
  'Prix de vente ({cur})': 'Selling price ({cur})',
  "La recette (matières + main d’œuvre) se définit ensuite dans la fiche produit.":
    'The recipe (materials + labor) is defined next in the product sheet.',
  'Encaissé par': 'Cashed in by', 'Payé par': 'Paid by',
  // purchases / stock screens
  'Achats matières': 'Material purchases', 'Charges': 'Expenses',
  '{n} factures': '{n} invoices', '{n} charges': '{n} expenses',
  'Matières': 'Materials', 'Factures d’achat': 'Purchase invoices', 'matières premières': 'raw materials',
  'Matière supprimée': 'Deleted material', 'Nouvelle facture d’achat': 'New purchase invoice',
  'hors matières': 'non-materials', 'Nouvelle charge': 'New expense',
  'Valeur matières': 'Materials value', 'Valeur produits finis': 'Finished goods value',
  'au coût de revient': 'at cost', 'Produits finis': 'Finished goods',
  'Stock matières': 'Materials stock', 'restant': 'remaining', 'en stock': 'in stock',
  'Nouvelle matière': 'New material', '{n} lots': '{n} batches', 'Lancer une production': 'Start a production',
  'Stock réel pour {name} ({u})': 'Actual stock for {name} ({u})',
  'Stock réel pour {name} (u)': 'Actual stock for {name} (units)',
  'Corriger le stock': 'Correct stock',
  // product detail
  'Ajouter un composant': 'Add a component', 'Ajouter de la main d’œuvre': 'Add labor',
  'Quantité du composant': 'Component quantity', 'Quantité par unité produite ({u})': 'Quantity per unit produced ({u})',
  'Retour': 'Back', 'Ajouter': 'Add',
  'Une tâche par défaut à 5 min · 1 000 {cur}/h. Ajuste ensuite la durée et le taux.':
    'A default task at 5 min · 1,000 {cur}/h. Adjust the duration and rate afterwards.',
  'Fiche produit': 'Product sheet', 'Vente {x} {cur}': 'Sell {x} {cur}',
  ' · {n} composants': ' · {n} components',
  'Coût / unité': 'Cost / unit', 'Marge nette': 'Net margin', 'Marge %': 'Margin %', 'Coût': 'Cost',
  'En stock': 'In stock', 'Produisibles': 'Producible', 'limité par {name}': 'limited by {name}',
  'Coût de production · 1 unité': 'Production cost · 1 unit', '{x}% / 6 mois': '{x}% / 6 months',
  'Matières & emballage': 'Materials & packaging', 'Main d’œuvre': 'Labor', 'Ajouter une tâche': 'Add a task',
  'Coût total / unité': 'Total cost / unit', 'Marge par unité': 'Margin per unit',
  // settings / auth (index.html)
  'Réglages': 'Settings', 'Mode sombre': 'Dark mode', "Couleur d’accent": 'Accent color',
  'Langue': 'Language', 'Devise': 'Currency', 'Part Lumaya · {x}%': 'Lumaya share · {x}%',
  'Déconnexion': 'Log out', 'Réinitialiser': 'Reset',
  'Réinitialiser TOUTES les données partagées et revenir aux exemples ? Irréversible, pour tout le monde.':
    'Reset ALL shared data and restore the demo content? Irreversible, for everyone.',
  'Données partagées via Supabase : tout le monde voit le même registre, synchronisé entre appareils. La réinitialisation efface les données pour tous les utilisateurs.':
    'Shared data via Supabase: everyone sees the same ledger, synced across devices. Resetting wipes the data for all users.',
  'Données mises à jour — toucher pour recharger': 'Data updated — tap to reload',
  "Code d’accès": 'Access code', 'Entrer': 'Enter', 'Connexion…': 'Connecting…',
  'Code incorrect.': 'Wrong code.', 'Chargement du registre…': 'Loading ledger…',
  'Serveur injoignable. Réessaie dans un instant.': 'Server unreachable. Try again in a moment.',
  // SOP
  'Procédure (SOP)': 'Procedure (SOP)', 'Voir la SOP': 'View SOP',
  'Créer la SOP': 'Create SOP', 'Éditer la SOP': 'Edit SOP',
  'Étape {n}': 'Step {n}', 'Décris cette étape…': 'Describe this step…',
  'Ingrédients concernés (optionnel)': 'Ingredients involved (optional)',
  'Ajouter une étape': 'Add next step',
  'Chaque étape doit avoir une description.': 'Each step needs a description.',
  'Attention : la SOP ne couvre pas 100% de chaque ingrédient.': 'Warning: the SOP doesn’t cover 100% of every ingredient.',
  '{name} : manquant (0%)': '{name}: missing (0%)',
  '{name} : {pct}% (doit faire 100%)': '{name}: {pct}% (must total 100%)',
  'Commentaire (optionnel)…': 'Comment (optional)…',
  'Réduire': 'Collapse', 'Développer': 'Expand',
  'Nouvelle catégorie…': 'New category…', 'Nouvelle': 'New', 'Autre': 'Other',
  // Material/product category tags (MATERIAL_CAT_LABELS / PRODUCT_CAT_LABELS
  // in lumabonga-data.jsx) — already English in the source, identity here.
  'Wax': 'Wax', 'Oil': 'Oil', 'EO': 'EO',
  'Surf': 'Surf', 'Baby': 'Baby', 'Atma': 'Atma', 'Balm': 'Balm', 'Spray': 'Spray', 'Bathroom': 'Bathroom',
  'Une nouvelle matière se crée depuis Achats, au moment du premier achat.':
    'A new material is created from Purchases, at the time of its first purchase.',
  'Le prix de cet achat devient le prix de référence de la matière.':
    'This purchase price becomes the material’s reference price.',
  'Combien d’unités veux-tu produire ?': 'How many units do you want to make?',
  'Quantité à produire': 'Quantity to make', 'unités': 'units',
  '1 unité ≈ {x} g': '1 unit ≈ {x} g',
  'Pour {x} g (~{n} unités)': 'For {x} g (~{n} units)',
  'Les quantités de la SOP s’adaptent automatiquement.': 'SOP quantities adapt automatically.',
  'Continuer': 'Continue', 'Pour {n} unité(s)': 'For {n} unit(s)',
  'Aucune SOP pour ce produit.': 'No SOP for this product yet.',
  'Supprimer cette étape': 'Delete this step',
  'Tout': 'All time',
  'Ventes · 7 derniers jours': 'Sales · last 7 days',
  'Télécharger l’app': 'Get the app',
  'Sur Safari : appuie sur Partager, puis « Sur l’écran d’accueil ».': 'On Safari: tap Share, then "Add to Home Screen".',
  'Ouvre le menu du navigateur et choisis « Installer l’application » (ou l’icône d’installation dans la barre d’adresse).':
    'Open your browser menu and choose "Install app" (or look for an install icon in the address bar).',
  // To-do
  'Tâches': 'Tasks', 'à faire': 'open', 'Nouvelle tâche…': 'New task…', 'Assigner à': 'Assign to',
  'Priorité': 'Priority', 'Haute': 'High', 'Moyenne': 'Medium', 'Basse': 'Low', 'Annuler': 'Cancel',
  'Supprimer': 'Delete', 'Supprimer le produit': 'Delete product',
  'Aucune tâche pour {name}.': 'No tasks for {name}.',
  'Répartition des revenus': 'Revenue split', 'Lumaya {x}%': 'Lumaya {x}%', 'GawahBonga {x}%': 'GawahBonga {x}%',
  'Tape DELETE pour confirmer': 'Type DELETE to confirm',
  '« {name} » sera supprimé définitivement, avec sa recette, sa SOP et son historique de suggestions. Cette action est irréversible.':
    '"{name}" will be permanently deleted, along with its recipe, SOP and suggestion history. This cannot be undone.',
  'Nouveau membre…': 'New member…', 'Équipe': 'Team',
  'Aucune tâche. Ajoute la première !': 'No tasks yet. Add the first one!',
  'Échéance (optionnel)': 'Deadline (optional)',
  'Échéance': 'Deadline',
  'En retard': 'Overdue',
  'Rien de prévu ce jour-là.': 'Nothing scheduled for this day.',
  'Tâche': 'Task',
  'Activité': 'Activity',
  'Terminées': 'Done',
  'Retirer {name}': 'Remove {name}',
  'À acheter': 'To purchase',
  'Stock insuffisant pour produire 10 unités': 'Not enough stock to make 10 units',
  'manquant': 'missing', 'pour 10× {name}': 'for 10× {name}',
  'Rien à acheter — les stocks couvrent 10 unités de chaque produit.': 'Nothing to buy — stock covers 10 units of every product.',
  // Public mode
  'Se connecter': 'Sign in',
  // labor presets
  'Mélange': 'Mixing', 'Chauffe & mélange': 'Heating & mixing', 'Coulage': 'Pouring',
  'Conditionnement': 'Packaging', 'Étiquetage': 'Labeling', 'Teinture': 'Dyeing',
  'Impression cire': 'Wax printing', 'Contrôle qualité': 'Quality control', 'Transport': 'Transport',
  // Test composition section (product card)
  'Test composition': 'Test composition',
  'Aucun test en cours pour ce produit.': 'No test in progress for this product.',
  'Démarrer le test': 'Start test',
  'Voir la SOP (test)': 'View SOP (test)',
  'Éditer la SOP (test)': 'Edit SOP (test)',
  'Créer la SOP (test)': 'Create SOP (test)',
  'Valider comme nouvelle base': 'Validate as new base',
  'Procédure (SOP) — Test': 'Procedure (SOP) — Test',
  'Choisir la version définitive': 'Choose the final version',
  'Le passage en Ready nécessite de choisir une version définitive. La version non choisie sera supprimée définitivement. Cette action est irréversible.':
    'Switching to Ready requires choosing a final version. The version not chosen will be permanently deleted. This action cannot be undone.',
  'Garder la version de test': 'Keep the test version',
  'Garder la version de base': 'Keep the base version',
  'Composition verrouillée pendant Test.': 'Composition locked while in Test.',
  'SOP verrouillée pendant Test — utilise la section Test composition ci-dessous.': 'SOP locked during Test — use the Test composition section below.',
};
// Indonesian — originally scoped to level-1 (public) screens only; now
// covers the whole app (French must not leak anywhere, any language mode).
// Anything still missing falls back to the French key, same as a missing
// English entry would.
const LB_ID = {
  "Code d'accès": 'Kode akses', 'Connexion…': 'Menghubungkan…', 'Entrer': 'Masuk',
  'Code incorrect.': 'Kode salah.',
  'Serveur injoignable. Réessaie dans un instant.': 'Server tidak dapat dijangkau. Coba lagi sebentar.',
  'Télécharger l’app': 'Unduh aplikasi',
  'Sur Safari : appuie sur Partager, puis « Sur l’écran d’accueil ».': 'Di Safari: ketuk Bagikan, lalu "Tambah ke Layar Utama".',
  'Ouvre le menu du navigateur et choisis « Installer l’application » (ou l’icône d’installation dans la barre d’adresse).':
    'Buka menu browser dan pilih "Instal aplikasi" (atau ikon instal di bilah alamat).',
  'Chargement du registre…': 'Memuat data…',
  'Catalogue': 'Katalog', 'produits actifs': 'produk aktif', 'Produits': 'Produk',
  'Composition': 'Komposisi', 'Aucun composant': 'Belum ada komponen',
  'Voir la SOP': 'Lihat SOP', 'Procédure (SOP)': 'Prosedur (SOP)',
  'Quantité à produire': 'Jumlah yang dibuat', 'unités': 'unit', 'Continuer': 'Lanjutkan',
  'Pour {n} unité(s)': 'Untuk {n} unit', 'Pour {x} g (~{n} unités)': 'Untuk {x} g (~{n} unit)',
  '1 unité ≈ {x} g': '1 unit ≈ {x} g',
  'Les quantités de la SOP s’adaptent automatiquement.': 'Jumlah pada SOP menyesuaikan secara otomatis.',
  'Étape {n}': 'Langkah {n}',

  // ── Settings ──
  'Réglages': 'Pengaturan', 'Langue': 'Bahasa', 'Mode sombre': 'Mode gelap',
  'Devise': 'Mata uang', 'Déconnexion': 'Keluar', 'Couleur d’accent': 'Warna aksen',
  'Réinitialiser TOUTES les données partagées et revenir aux exemples ? Irréversible, pour tout le monde.':
    'Setel ulang SEMUA data bersama dan kembali ke contoh? Tidak bisa dibatalkan, untuk semua orang.',
  'Réinitialiser': 'Setel ulang',
  'Données partagées via Supabase : tout le monde voit le même registre, synchronisé entre appareils. La réinitialisation efface les données pour tous les utilisateurs.':
    'Data dibagikan melalui Supabase: semua orang melihat catatan yang sama, tersinkron di semua perangkat. Menyetel ulang menghapus data untuk semua pengguna.',
  'Données mises à jour — toucher pour recharger': 'Data diperbarui — ketuk untuk memuat ulang',

  // ── Dashboard / balance ──
  'à recevoir': 'harus menerima', 'à reverser': 'harus membayar', 'équilibré': 'seimbang',
  'Règlement entre associés': 'Penyelesaian antar mitra', 'Règlement': 'Penyelesaian',
  'Perte / Profit par partie': 'Untung / Rugi per pihak',
  'Pas de règlement pour l’instant — {names} pas encore en bénéfices.': 'Belum ada penyelesaian — {names} belum untung.',
  'Enregistrer un règlement': 'Catat penyelesaian',
  'depuis le début': 'sejak awal',
  'Vente': 'Penjualan', 'Charge': 'Beban', 'Production': 'Produksi', 'Achat': 'Pembelian',
  'Matière': 'Bahan', 'Emballage': 'Kemasan', 'matière': 'bahan', 'emballage': 'kemasan', 'unité': 'satuan',
  'Autre': 'Lainnya',
  // Material/product category tags — kept in English (identity), same
  // judgment call as 'Profit': 'Profit' above: short brand/business-loanword
  // tags this file has no established Indonesian rendering for.
  'Wax': 'Wax', 'Oil': 'Oil', 'EO': 'EO',
  'Surf': 'Surf', 'Baby': 'Baby', 'Atma': 'Atma', 'Balm': 'Balm', 'Spray': 'Spray', 'Bathroom': 'Bathroom',
  '{n} unités produites': '{n} unit diproduksi',
  'Ventes': 'Penjualan', 'Achats': 'Pembelian', 'Charges': 'Beban', 'Valeur stock': 'Nilai stok',
  'Profit': 'Profit', 'Stock': 'Stok', 'To do': 'Agenda',
  'Profit net': 'Laba bersih', 'Comptes équilibrés': 'Akun seimbang', 'doit recevoir': 'harus menerima',
  'Régler': 'Selesaikan', 'Historique des règlements ({n})': 'Riwayat penyelesaian ({n})',
  'Stock faible': 'Stok menipis', 'à produire': 'untuk diproduksi', 'rupture': 'habis',
  'Mouvements': 'Aktivitas', '{n} récents': '{n} terbaru', 'Tous': 'Semua', 'Tout': 'Semua',

  // ── Sales screen ──
  'Ventes · 7 derniers jours': 'Penjualan · 7 hari terakhir', '{n} entrées': '{n} entri',
  'Total ventes': 'Total penjualan', '{n} transactions': '{n} transaksi', 'marge': 'margin',
  'marge {p}%': 'margin {p}%',

  // ── Products ──
  'Coût': 'Biaya', 'Vente {x} {cur}': 'Jual {x} {cur}', 'Créer la SOP': 'Buat SOP',
  'Réduire': 'Ciutkan', 'Développer': 'Perluas',
  'Commentaire (optionnel)…': 'Komentar (opsional)…',
  'Coût / unité': 'Biaya / unit', 'Marge nette': 'Margin bersih', 'Marge %': 'Margin %',
  'En stock': 'Stok tersedia', 'Produisibles': 'Dapat diproduksi', 'limité par {name}': 'dibatasi oleh {name}',
  'Coût de production · 1 unité': 'Biaya produksi · 1 unit', 'Produire': 'Produksi',
  'Ajouter un composant': 'Tambah komponen', 'Éditer la SOP': 'Edit SOP', 'Nouveau produit': 'Produk baru',

  // ── To do ──
  'Tâches': 'Tugas', 'à faire': 'belum selesai', 'Nouvelle tâche…': 'Tugas baru…',
  'Assigner à': 'Tugaskan ke', 'Nouveau membre…': 'Anggota baru…', 'Ajouter': 'Tambah',
  'Priorité': 'Prioritas', 'Haute': 'Tinggi', 'Moyenne': 'Sedang', 'Basse': 'Rendah', 'Annuler': 'Batal',
  'Supprimer': 'Hapus', 'Supprimer le produit': 'Hapus produk',
  'Aucune tâche pour {name}.': 'Tidak ada tugas untuk {name}.',
  'Répartition des revenus': 'Pembagian pendapatan', 'Lumaya {x}%': 'Lumaya {x}%', 'GawahBonga {x}%': 'GawahBonga {x}%',
  'Tape DELETE pour confirmer': 'Ketik DELETE untuk konfirmasi',
  '« {name} » sera supprimé définitivement, avec sa recette, sa SOP et son historique de suggestions. Cette action est irréversible.':
    '"{name}" akan dihapus permanen, beserta resep, SOP, dan riwayat sarannya. Tindakan ini tidak bisa dibatalkan.',
  'Aucune tâche. Ajoute la première !': 'Belum ada tugas. Tambahkan yang pertama!',
  'Échéance (optionnel)': 'Tenggat (opsional)',
  'Échéance': 'Tenggat',
  'En retard': 'Terlambat',
  'Rien de prévu ce jour-là.': 'Tidak ada rencana hari itu.',
  'Tâche': 'Tugas',
  'Activité': 'Kegiatan',
  'Terminées': 'Selesai',
  'Retirer {name}': 'Hapus {name}',
  'À acheter': 'Perlu dibeli', 'Stock insuffisant pour produire 10 unités': 'Stok tidak cukup untuk membuat 10 unit',
  'Rien à acheter — les stocks couvrent 10 unités de chaque produit.':
    'Tidak ada yang perlu dibeli — stok cukup untuk 10 unit setiap produk.',
  'pour 10× {name}': 'untuk 10× {name}', 'manquant': 'kurang',

  // ── Add/edit sheet: sale, purchase, cost, production, material, product, settlement ──
  'Encaissé par': 'Diterima oleh', 'Payé par': 'Dibayar oleh', 'Modifier': 'Edit',
  'Nouvelle entrée': 'Entri baru', 'Produit': 'Produk', 'Unités vendues': 'Unit terjual',
  'Prix unité ({cur})': 'Harga satuan ({cur})', 'Note': 'Catatan', 'Optionnel': 'Opsional',
  'Total vente': 'Total penjualan', 'Marge ({c}/u de coût)': 'Margin ({c}/unit biaya)',
  'Matière première': 'Bahan baku', 'Nouvelle matière': 'Bahan baru', 'Nom de la matière': 'Nama bahan',
  'Le prix de cet achat devient le prix de référence de la matière.':
    'Harga pembelian ini menjadi harga acuan bahan.',
  'Quantité achetée': 'Jumlah dibeli', 'Unité': 'Satuan', 'Prix total payé ({cur})': 'Total harga dibayar ({cur})',
  'Fournisseur / note': 'Pemasok / catatan', 'Total facture': 'Total faktur',
  'Prix calculé / {u}': 'Harga terhitung / {u}', 'Description': 'Deskripsi',
  'Transport, loyer atelier…': 'Transportasi, sewa bengkel…', 'Montant ({cur})': 'Jumlah ({cur})',
  'Qui / atelier': 'Siapa / bengkel', 'Produit fabriqué': 'Produk dibuat', 'Unités produites': 'Unit diproduksi',
  'Produit par': 'Dibuat oleh', 'Atelier': 'Bengkel',
  'Info : {n} unités produisibles avec le stock actuel': 'Info: {n} unit dapat diproduksi dengan stok saat ini',
  ' · le stock matières passera en négatif': ' · stok bahan akan menjadi negatif',
  'Ex: Beurre de karité': 'Contoh: Shea butter', 'Unité de mesure': 'Satuan ukur',
  'Type': 'Tipe', 'Catégorie': 'Kategori', 'Nouvelle catégorie…': 'Kategori baru…', 'Nouvelle': 'Baru',
  'Stock de départ ({u})': 'Stok awal ({u})', 'Prix / {u} ({cur})': 'Harga / {u} ({cur})',
  'Nom du produit': 'Nama produk', 'Ex: Savon noir': 'Contoh: Sabun hitam',
  'Prix de vente ({cur})': 'Harga jual ({cur})', 'Qui paie': 'Siapa yang bayar',
  '→ reçu par {name}': '→ diterima oleh {name}',
  'Enregistrer les modifications': 'Simpan perubahan', 'Enregistrer': 'Simpan',
  'La recette (matières + main d’œuvre) se définit ensuite dans la fiche produit.':
    'Resep (bahan + tenaga kerja) diatur setelahnya di halaman produk.',

  // ── Product detail / SOP editor (lumabonga-product.jsx) ──
  'Quantité du composant': 'Jumlah komponen', 'Quantité par unité produite ({u})': 'Jumlah per unit diproduksi ({u})',
  'Retour': 'Kembali', 'Ajouter de la main d’œuvre': 'Tambah tenaga kerja',
  'Une tâche par défaut à 5 min · 1 000 {cur}/h. Ajuste ensuite la durée et le taux.':
    'Tugas default 5 menit · 1.000 {cur}/jam. Sesuaikan durasi dan tarifnya.',
  'Fiche produit': 'Halaman produk', ' · {n} composants': ' · {n} komponen', '{x}% / 6 mois': '{x}% / 6 bulan',
  'Matières & emballage': 'Bahan & kemasan', 'Main d’œuvre': 'Tenaga kerja',
  'Ajouter une tâche': 'Tambah tugas', 'Coût total / unité': 'Total biaya / unit', 'Marge par unité': 'Margin per unit',
  'Chaque étape doit avoir une description.': 'Setiap langkah harus punya deskripsi.',
  '{name} : manquant (0%)': '{name}: kurang (0%)', '{name} : {pct}% (doit faire 100%)': '{name}: {pct}% (harus 100%)',
  'Attention : la SOP ne couvre pas 100% de chaque ingrédient.': 'Perhatian: SOP belum mencakup 100% setiap bahan.',
  'Supprimer cette étape': 'Hapus langkah ini', 'Décris cette étape…': 'Jelaskan langkah ini…',
  'Ingrédients concernés (optionnel)': 'Bahan terkait (opsional)', 'Ajouter une étape': 'Tambah langkah',

  // ── Stock / Purchases (lumabonga-stock.jsx) ──
  'Achats matières': 'Pembelian bahan', '{n} factures': '{n} faktur', '{n} charges': '{n} beban',
  'Matières': 'Bahan', 'Factures d’achat': 'Faktur pembelian', 'matières premières': 'bahan baku',
  'Matière supprimée': 'Bahan dihapus', 'Nouvelle facture d’achat': 'Faktur pembelian baru',
  'hors matières': 'di luar bahan', 'Nouvelle charge': 'Beban baru',
  'Valeur matières': 'Nilai bahan', 'Valeur produits finis': 'Nilai barang jadi', 'au coût de revient': 'pada harga pokok',
  'Produits finis': 'Barang jadi', 'Stock matières': 'Stok bahan', 'restant': 'tersisa',
  'Une nouvelle matière se crée depuis Achats, au moment du premier achat.':
    'Bahan baru dibuat dari Pembelian, saat pembelian pertamanya.',
  'en stock': 'tersedia', '{n} produisibles': '{n} dapat diproduksi',
  'Stock réel pour {name} (u)': 'Stok sebenarnya untuk {name} (u)', 'Corriger le stock': 'Koreksi stok',
  '{n} lots': '{n} batch', 'Lancer une production': 'Mulai produksi',

  // ── Labor presets (dynamic tr(task) in ProdAddLaborSheet) ──
  'Mélange': 'Pencampuran', 'Chauffe & mélange': 'Pemanasan & pencampuran', 'Coulage': 'Penuangan',
  'Conditionnement': 'Pengemasan', 'Étiquetage': 'Pelabelan', 'Teinture': 'Pewarnaan',
  'Impression cire': 'Cetak lilin', 'Contrôle qualité': 'Kontrol kualitas', 'Transport': 'Transportasi',

  // ── Test composition section (product card) ──
  'Test composition': 'Komposisi uji',
  'Aucun test en cours pour ce produit.': 'Belum ada uji coba untuk produk ini.',
  'Démarrer le test': 'Mulai uji coba',
  'Voir la SOP (test)': 'Lihat SOP (uji)',
  'Éditer la SOP (test)': 'Edit SOP (uji)',
  'Créer la SOP (test)': 'Buat SOP (uji)',
  'Valider comme nouvelle base': 'Jadikan versi dasar baru',
  'Procédure (SOP) — Test': 'Prosedur (SOP) — Uji',
  'Choisir la version définitive': 'Pilih versi final',
  'Le passage en Ready nécessite de choisir une version définitive. La version non choisie sera supprimée définitivement. Cette action est irréversible.':
    'Beralih ke Ready mengharuskan memilih satu versi final. Versi yang tidak dipilih akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.',
  'Garder la version de test': 'Simpan versi uji',
  'Garder la version de base': 'Simpan versi dasar',
  'Composition verrouillée pendant Test.': 'Komposisi terkunci selama status Test.',
  'SOP verrouillée pendant Test — utilise la section Test composition ci-dessous.': 'SOP terkunci selama status Test — gunakan bagian Test composition di bawah.',
};
// Normalise apostrophes so straight ' and curly ’ in the source both match.
const _lbNorm = (s) => String(s).replace(/’/g, "'");
const LB_EN_N = {};
for (const k of Object.keys(LB_EN)) LB_EN_N[_lbNorm(k)] = LB_EN[k];
const LB_ID_N = {};
for (const k of Object.keys(LB_ID)) LB_ID_N[_lbNorm(k)] = LB_ID[k];
const tr = (key, vars) => {
  let s = key;
  if (LB_LANG === 'en') s = LB_EN_N[_lbNorm(key)] != null ? LB_EN_N[_lbNorm(key)] : key;
  else if (LB_LANG === 'id') s = LB_ID_N[_lbNorm(key)] != null ? LB_ID_N[_lbNorm(key)] : key;
  if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(vars[k]);
  return s;
};

// ── Seed products (with default unit prices) ─────────────────
const SEED_PRODUCTS = [
  { id: 'p_zinc',     name: 'Zinc',              emoji: 'Zn', unitPrice: 2500, unitCost: 1200, hue: 196 },
  { id: 'p_deo',      name: 'Déodorant',         emoji: 'Dé', unitPrice: 3500, unitCost: 1700, hue: 152 },
  { id: 'p_anti',     name: 'Anti-moustique',    emoji: 'Am', unitPrice: 3000, unitCost: 1500, hue: 76  },
  { id: 'p_wax',      name: 'Wax',               emoji: 'Wx', unitPrice: 4000, unitCost: 2000, hue: 32  },
  { id: 'p_baume',    name: 'Baume pour le corps', emoji: 'Bc', unitPrice: 4500, unitCost: 2100, hue: 14 },
  { id: 'p_huile',    name: 'Huile cheveux',     emoji: 'Hc', unitPrice: 5000, unitCost: 2400, hue: 48  },
  { id: 'p_dent',     name: 'Dentifrice',        emoji: 'De', unitPrice: 2000, unitCost: 900,  hue: 220 },
  { id: 'p_levres',   name: 'Baume pour les lèvres', emoji: 'Bl', unitPrice: 1800, unitCost: 800, hue: 340 },
];

// ── Seed transactions (recent days) ──────────────────────────
const day = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const SEED_SALES = [
  { id: 's1', date: day(0), productId: 'p_zinc',   qty: 18, price: 2500, note: 'Marché Niamey' },
  { id: 's2', date: day(0), productId: 'p_deo',    qty: 12, price: 3500, note: '' },
  { id: 's3', date: day(1), productId: 'p_anti',   qty: 24, price: 3000, note: 'Pharmacie' },
  { id: 's4', date: day(1), productId: 'p_huile',  qty: 8,  price: 5000, note: '' },
  { id: 's5', date: day(2), productId: 'p_baume',  qty: 14, price: 4500, note: 'Boutique Marie' },
  { id: 's6', date: day(3), productId: 'p_wax',    qty: 10, price: 4000, note: '' },
  { id: 's7', date: day(4), productId: 'p_dent',   qty: 22, price: 2000, note: '' },
  { id: 's8', date: day(5), productId: 'p_levres', qty: 16, price: 1800, note: 'Coiffeuse' },
  { id: 's9', date: day(6), productId: 'p_zinc',   qty: 14, price: 2500, note: '' },
  { id: 's10',date: day(8), productId: 'p_deo',    qty: 8,  price: 3500, note: '' },
];

// Purchases now buy RAW MATERIALS: qty (in the material's unit) + unit price.
// The most recent purchase sets the material's current unit price.
const SEED_PURCHASES = [
  { id: 'a1', date: day(12), materialId: 'm_karite', qty: 5000, price: 2.9, note: 'Fournisseur Karité' },
  { id: 'a2', date: day(11), materialId: 'm_coco',   qty: 4000, price: 2.0, note: '' },
  { id: 'a3', date: day(10), materialId: 'm_cire',   qty: 1500, price: 4.4, note: '' },
  { id: 'a4', date: day(9),  materialId: 'm_zinc',   qty: 3000, price: 3.5, note: 'Lot import' },
  { id: 'a5', date: day(8),  materialId: 'm_etiq',   qty: 400,  price: 35,  note: 'Imprimerie' },
  { id: 'a6', date: day(8),  materialId: 'm_pot',    qty: 150,  price: 180, note: '' },
  { id: 'a7', date: day(7),  materialId: 'm_lavande',qty: 300,  price: 32,  note: '' },
  { id: 'a8', date: day(6),  materialId: 'm_tissu',  qty: 40,   price: 640, note: 'Marché textile' },
];

// Production lots: qty units of a product produced on a date.
// Consumes raw-material stock (per recipe) and creates finished-goods stock.
const SEED_PRODUCTION = [
  { id: 'pr1', date: day(13), productId: 'p_zinc',   qty: 50, who: 'Atelier' },
  { id: 'pr2', date: day(12), productId: 'p_deo',    qty: 40, who: 'Atelier' },
  { id: 'pr3', date: day(11), productId: 'p_anti',   qty: 40, who: 'Yacine' },
  { id: 'pr4', date: day(10), productId: 'p_huile',  qty: 20, who: 'Awa' },
  { id: 'pr5', date: day(9),  productId: 'p_baume',  qty: 30, who: 'Atelier' },
  { id: 'pr6', date: day(8),  productId: 'p_wax',    qty: 20, who: 'Moussa' },
  { id: 'pr7', date: day(7),  productId: 'p_dent',   qty: 40, who: 'Awa' },
  { id: 'pr8', date: day(6),  productId: 'p_levres', qty: 30, who: 'Awa' },
];

// Opening raw-material stock by unit (before purchases & production).
const STOCK0_BY_UNIT = { g: 20000, ml: 15000, 'm': 80, 'pièce': 600 };

const SEED_COSTS = [
  { id: 'c1', date: day(2),  label: 'Main d\u2019\u0153uvre — production déodorant', amount: 8500, who: 'Atelier' },
  { id: 'c2', date: day(4),  label: 'Étiquetage anti-moustique', amount: 3200, who: 'Yacine' },
  { id: 'c3', date: day(6),  label: 'Conditionnement Wax', amount: 5400, who: 'Atelier' },
  { id: 'c4', date: day(9),  label: 'Transport matières premières', amount: 4000, who: '' },
  { id: 'c5', date: day(11), label: 'Production baume corps (lot 12)', amount: 7200, who: 'Atelier' },
];

// ── Raw materials (matières premières) with price history ────
// price = FCFA per base unit (g, ml, m, or pièce). History is a step
// function: the price applies from its date forward.
const SEED_MATERIALS = [
  { id: 'm_karite', name: 'Beurre de karité', unit: 'g', hue: 48, kind: 'matière',
    priceHistory: [{ date: '2025-12-01', price: 2.2 }, { date: '2026-01-15', price: 2.4 }, { date: '2026-03-01', price: 2.7 }, { date: '2026-04-15', price: 2.9 }] },
  { id: 'm_coco', name: 'Huile de coco', unit: 'ml', hue: 76, kind: 'matière',
    priceHistory: [{ date: '2025-12-01', price: 1.6 }, { date: '2026-02-01', price: 1.8 }, { date: '2026-04-15', price: 2.0 }] },
  { id: 'm_cire', name: 'Cire d’abeille', unit: 'g', hue: 32, kind: 'matière',
    priceHistory: [{ date: '2025-12-01', price: 3.6 }, { date: '2026-01-15', price: 3.8 }, { date: '2026-03-01', price: 4.2 }, { date: '2026-04-15', price: 4.4 }] },
  { id: 'm_zinc', name: 'Oxyde de zinc', unit: 'g', hue: 196, kind: 'matière',
    priceHistory: [{ date: '2025-12-01', price: 3.2 }, { date: '2026-03-01', price: 3.5 }] },
  { id: 'm_bicarb', name: 'Bicarbonate', unit: 'g', hue: 220, kind: 'matière',
    priceHistory: [{ date: '2025-12-01', price: 0.9 }] },
  { id: 'm_glyc', name: 'Glycérine', unit: 'ml', hue: 260, kind: 'matière',
    priceHistory: [{ date: '2025-12-01', price: 1.1 }, { date: '2026-03-01', price: 1.2 }] },
  { id: 'm_citron', name: 'H.E. citronnelle', unit: 'ml', hue: 110, kind: 'matière',
    priceHistory: [{ date: '2025-12-01', price: 18 }, { date: '2026-01-15', price: 20 }, { date: '2026-03-01', price: 24 }, { date: '2026-04-15', price: 22 }] },
  { id: 'm_menthe', name: 'H.E. menthe', unit: 'ml', hue: 152, kind: 'matière',
    priceHistory: [{ date: '2025-12-01', price: 24 }, { date: '2026-03-01', price: 26 }] },
  { id: 'm_lavande', name: 'H.E. lavande', unit: 'ml', hue: 300, kind: 'matière',
    priceHistory: [{ date: '2025-12-01', price: 28 }, { date: '2026-02-01', price: 30 }, { date: '2026-04-15', price: 32 }] },
  { id: 'm_parfum', name: 'Parfum', unit: 'ml', hue: 14, kind: 'matière',
    priceHistory: [{ date: '2025-12-01', price: 16 }, { date: '2026-03-01', price: 18 }] },
  { id: 'm_argile', name: 'Argile blanche', unit: 'g', hue: 60, kind: 'matière',
    priceHistory: [{ date: '2025-12-01', price: 0.7 }] },
  { id: 'm_aloe', name: 'Gel d’aloe vera', unit: 'ml', hue: 140, kind: 'matière',
    priceHistory: [{ date: '2025-12-01', price: 1.4 }, { date: '2026-03-01', price: 1.5 }] },
  { id: 'm_eau', name: 'Eau distillée', unit: 'ml', hue: 210, kind: 'matière',
    priceHistory: [{ date: '2025-12-01', price: 0.2 }] },
  // Wax (textile)
  { id: 'm_tissu', name: 'Tissu écru', unit: 'm', hue: 24, kind: 'matière',
    priceHistory: [{ date: '2025-12-01', price: 560 }, { date: '2026-01-15', price: 600 }, { date: '2026-04-15', price: 640 }] },
  { id: 'm_paraffine', name: 'Paraffine', unit: 'm', hue: 50, kind: 'matière',
    priceHistory: [{ date: '2025-12-01', price: 110 }, { date: '2026-03-01', price: 120 }] },
  { id: 'm_colorant', name: 'Colorant wax', unit: 'm', hue: 330, kind: 'matière',
    priceHistory: [{ date: '2025-12-01', price: 180 }, { date: '2026-02-01', price: 200 }] },
  // Packaging (emballage)
  { id: 'm_pot', name: 'Pot 100 ml', unit: 'pièce', hue: 250, kind: 'emballage',
    priceHistory: [{ date: '2025-12-01', price: 170 }, { date: '2026-03-01', price: 180 }] },
  { id: 'm_flacon', name: 'Flacon 50 ml', unit: 'pièce', hue: 250, kind: 'emballage',
    priceHistory: [{ date: '2025-12-01', price: 145 }, { date: '2026-03-01', price: 150 }] },
  { id: 'm_stickdeo', name: 'Stick déodorant', unit: 'pièce', hue: 250, kind: 'emballage',
    priceHistory: [{ date: '2025-12-01', price: 210 }, { date: '2026-03-01', price: 220 }] },
  { id: 'm_sticklip', name: 'Pot baume lèvres', unit: 'pièce', hue: 250, kind: 'emballage',
    priceHistory: [{ date: '2025-12-01', price: 115 }, { date: '2026-03-01', price: 120 }] },
  { id: 'm_tube', name: 'Tube 75 ml', unit: 'pièce', hue: 250, kind: 'emballage',
    priceHistory: [{ date: '2025-12-01', price: 155 }, { date: '2026-03-01', price: 160 }] },
  { id: 'm_spray', name: 'Spray 100 ml', unit: 'pièce', hue: 250, kind: 'emballage',
    priceHistory: [{ date: '2025-12-01', price: 240 }, { date: '2026-03-01', price: 250 }] },
  { id: 'm_etiq', name: 'Étiquette', unit: 'pièce', hue: 250, kind: 'emballage',
    priceHistory: [{ date: '2025-12-01', price: 30 }, { date: '2026-03-01', price: 35 }] },
];

// ── Recipes: per-unit material quantities + labor lines ──────
// ingredients: { materialId, qty } — qty is per 1 unit produced.
// labor:       { task, who, minutes, rate } — rate is FCFA per hour.
const SEED_RECIPES = {
  p_zinc: {
    ingredients: [
      { materialId: 'm_zinc', qty: 60 }, { materialId: 'm_karite', qty: 120 },
      { materialId: 'm_coco', qty: 40 }, { materialId: 'm_pot', qty: 1 }, { materialId: 'm_etiq', qty: 1 },
    ],
    labor: [
      { task: 'Mélange', who: 'Atelier', minutes: 8, rate: 1200 },
      { task: 'Conditionnement', who: 'Awa', minutes: 6, rate: 1000 },
      { task: 'Étiquetage', who: 'Awa', minutes: 3, rate: 1000 },
    ],
  },
  p_deo: {
    ingredients: [
      { materialId: 'm_karite', qty: 50 }, { materialId: 'm_coco', qty: 30 }, { materialId: 'm_cire', qty: 25 },
      { materialId: 'm_bicarb', qty: 30 }, { materialId: 'm_lavande', qty: 6 },
      { materialId: 'm_stickdeo', qty: 1 }, { materialId: 'm_etiq', qty: 1 },
    ],
    labor: [
      { task: 'Chauffe & mélange', who: 'Atelier', minutes: 12, rate: 1200 },
      { task: 'Coulage', who: 'Yacine', minutes: 6, rate: 1000 },
      { task: 'Conditionnement', who: 'Awa', minutes: 5, rate: 1000 },
      { task: 'Étiquetage', who: 'Awa', minutes: 3, rate: 1000 },
    ],
  },
  p_anti: {
    ingredients: [
      { materialId: 'm_citron', qty: 25 }, { materialId: 'm_coco', qty: 20 }, { materialId: 'm_eau', qty: 50 },
      { materialId: 'm_glyc', qty: 10 }, { materialId: 'm_spray', qty: 1 }, { materialId: 'm_etiq', qty: 1 },
    ],
    labor: [
      { task: 'Mélange', who: 'Atelier', minutes: 6, rate: 1200 },
      { task: 'Conditionnement', who: 'Awa', minutes: 5, rate: 1000 },
      { task: 'Étiquetage', who: 'Awa', minutes: 3, rate: 1000 },
    ],
  },
  p_wax: {
    ingredients: [
      { materialId: 'm_tissu', qty: 2 }, { materialId: 'm_paraffine', qty: 2 }, { materialId: 'm_colorant', qty: 2 },
    ],
    labor: [
      { task: 'Impression cire', who: 'Moussa', minutes: 15, rate: 1500 },
      { task: 'Teinture', who: 'Moussa', minutes: 20, rate: 1200 },
      { task: 'Rinçage & séchage', who: 'Atelier', minutes: 10, rate: 1000 },
    ],
  },
  p_baume: {
    ingredients: [
      { materialId: 'm_karite', qty: 150 }, { materialId: 'm_coco', qty: 60 }, { materialId: 'm_cire', qty: 30 },
      { materialId: 'm_parfum', qty: 8 }, { materialId: 'm_pot', qty: 1 }, { materialId: 'm_etiq', qty: 1 },
    ],
    labor: [
      { task: 'Chauffe & mélange', who: 'Atelier', minutes: 12, rate: 1200 },
      { task: 'Coulage', who: 'Yacine', minutes: 6, rate: 1000 },
      { task: 'Conditionnement', who: 'Awa', minutes: 5, rate: 1000 },
      { task: 'Étiquetage', who: 'Awa', minutes: 3, rate: 1000 },
    ],
  },
  p_huile: {
    ingredients: [
      { materialId: 'm_coco', qty: 80 }, { materialId: 'm_karite', qty: 20 }, { materialId: 'm_lavande', qty: 5 },
      { materialId: 'm_parfum', qty: 5 }, { materialId: 'm_glyc', qty: 10 },
      { materialId: 'm_flacon', qty: 1 }, { materialId: 'm_etiq', qty: 1 },
    ],
    labor: [
      { task: 'Mélange', who: 'Atelier', minutes: 8, rate: 1200 },
      { task: 'Conditionnement', who: 'Awa', minutes: 6, rate: 1000 },
      { task: 'Étiquetage', who: 'Awa', minutes: 3, rate: 1000 },
    ],
  },
  p_dent: {
    ingredients: [
      { materialId: 'm_argile', qty: 40 }, { materialId: 'm_bicarb', qty: 20 }, { materialId: 'm_glyc', qty: 15 },
      { materialId: 'm_menthe', qty: 4 }, { materialId: 'm_eau', qty: 20 },
      { materialId: 'm_tube', qty: 1 }, { materialId: 'm_etiq', qty: 1 },
    ],
    labor: [
      { task: 'Mélange', who: 'Atelier', minutes: 6, rate: 1200 },
      { task: 'Conditionnement', who: 'Awa', minutes: 5, rate: 1000 },
      { task: 'Étiquetage', who: 'Awa', minutes: 3, rate: 1000 },
    ],
  },
  p_levres: {
    ingredients: [
      { materialId: 'm_karite', qty: 20 }, { materialId: 'm_cire', qty: 12 }, { materialId: 'm_coco', qty: 10 },
      { materialId: 'm_parfum', qty: 2 }, { materialId: 'm_sticklip', qty: 1 }, { materialId: 'm_etiq', qty: 1 },
    ],
    labor: [
      { task: 'Chauffe & coulage', who: 'Atelier', minutes: 8, rate: 1200 },
      { task: 'Conditionnement', who: 'Awa', minutes: 4, rate: 1000 },
      { task: 'Étiquetage', who: 'Awa', minutes: 3, rate: 1000 },
    ],
  },
};

const LABOR_PRESETS = ['Mélange', 'Chauffe & mélange', 'Coulage', 'Conditionnement', 'Étiquetage', 'Teinture', 'Impression cire', 'Contrôle qualité', 'Transport'];

// ── Units: density-aware conversion (15 drops = 1 ml) ────────────────────────
// Mass units in grams; volume units in millilitres. Mass↔volume uses density
// (ml per gram). Oils ≈ 1.1 ml/g; everything else defaults to 1 ml/g.
const MASS_FACTOR = { g: 1, kg: 1000 };                 // → grams
const VOL_FACTOR  = { ml: 1, l: 1000, cl: 10, goutte: 1 / 15 }; // → millilitres
const isMassUnit = (u) => MASS_FACTOR[u] != null;
const isVolUnit  = (u) => VOL_FACTOR[u] != null;
const DEFAULT_DENSITY = 1;     // ml per gram
const OIL_DENSITY = 1.1;       // 1 g oil ≈ 1.1 ml
const densityFor = (m) => (m && (materialCat(m) === 'oil' || materialCat(m) === 'eo')) ? OIL_DENSITY : DEFAULT_DENSITY;
// Units every recipe component can be expressed in.
const COMPONENT_UNITS = ['g', 'cl', 'ml', 'goutte'];
// Convert a quantity from one unit to another. `density` = ml per gram (oils 1.1).
const convertUnit = (qty, fromU, toU, density = DEFAULT_DENSITY) => {
  const q = Number(qty) || 0;
  if (fromU === toU) return q;
  // → grams (canonical)
  let grams;
  if (isMassUnit(fromU)) grams = q * MASS_FACTOR[fromU];
  else if (isVolUnit(fromU)) grams = (q * VOL_FACTOR[fromU]) / density;  // ml → g
  else return q; // pièce/m etc — no conversion
  // grams → target
  if (isMassUnit(toU)) return grams / MASS_FACTOR[toU];
  if (isVolUnit(toU)) return (grams * density) / VOL_FACTOR[toU];        // g → ml
  return q;
};

// ── Material categories (for grouped pickers) ────────────────
// A material's cat is either explicit (m.cat — any string, including
// user-created categories from the add-material form) or inferred from the
// name for legacy materials that predate this field. Default order: wax,
// oil, eo, other; any custom category sorts after, alphabetically.
const MATERIAL_CATS = ['wax', 'oil', 'eo', 'other'];
const MATERIAL_CAT_LABELS = { wax: 'Wax', oil: 'Oil', eo: 'EO', other: 'Autre' };
const catLabel = (cat) => MATERIAL_CAT_LABELS[cat] || (cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : cat);
const materialCat = (m) => {
  if (m && m.cat) return m.cat;
  const n = (m?.name || '').toLowerCase();
  if (/\beo\b|h\.?e\.?\s|essential oil|\babsolute\b|absolue/.test(n)) return 'eo';
  if (/wax|cire/.test(n)) return 'wax';
  if (/oil|huile|\bfco\b|butter|beurre|vitamin|vitamine/.test(n)) return 'oil';
  return 'other';
};
// All categories in use (defaults first, custom ones alphabetically after) —
// feeds the picker in the add/edit-material form, including categories
// created by simply typing a new one there.
const allMaterialCats = (materials) => {
  const used = new Set((materials || []).map(materialCat));
  const custom = [...used].filter((c) => !MATERIAL_CATS.includes(c)).sort((a, b) => a.localeCompare(b, 'fr'));
  return [...MATERIAL_CATS, ...custom];
};
// Materials grouped by category, alphabetical within each group.
const groupedMaterials = (materials) => {
  const cats = allMaterialCats(materials);
  const by = {};
  for (const k of cats) by[k] = [];
  for (const m of materials) by[materialCat(m)].push(m);
  for (const k of cats) by[k].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'fr'));
  return cats.map((k) => ({ cat: k, label: catLabel(k), items: by[k] })).filter((g) => g.items.length);
};

// ── Product categories (finished-goods ranges) ───────────────
// Fixed set of ranges chosen by the owners; a product's cat is p.cat.
// Anything unset (or unknown) lands in the trailing "Autre" bucket so
// legacy products never disappear when this field is introduced.
const PRODUCT_CATS = ['surf', 'baby', 'atma', 'balm', 'spray', 'oil', 'bathroom'];
const PRODUCT_CAT_LABELS = { surf: 'Surf', baby: 'Baby', atma: 'Atma', balm: 'Balm', spray: 'Spray', oil: 'Oil', bathroom: 'Bathroom' };
const productCat = (p) => (p && p.cat && PRODUCT_CATS.includes(p.cat)) ? p.cat : 'other';
const productCatLabel = (cat) => PRODUCT_CAT_LABELS[cat] || 'Autre';
// Products grouped by range, in fixed range order. Within a group the
// catalog (drag) order is preserved — no alphabetical sort, unlike materials.
const groupedProducts = (products) => {
  const cats = [...PRODUCT_CATS, 'other'];
  const by = {};
  for (const k of cats) by[k] = [];
  for (const p of (products || [])) by[productCat(p)].push(p);
  return cats.map((k) => ({ cat: k, label: productCatLabel(k), items: by[k] })).filter((g) => g.items.length);
};

// ── Cost engine ──────────────────────────────────────────────
// A material's price points = seed history + every purchase of it,
// sorted by date. Purchases are the real source of truth going forward.
const materialPricePoints = (mat, purchases) => {
  const pts = (mat?.priceHistory || []).map((h) => ({ date: h.date, price: h.price }));
  for (const p of (purchases || [])) {
    if (p.materialId === mat?.id) pts.push({ date: p.date, price: Number(p.price) });
  }
  pts.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return pts;
};

// Step-function lookup: price of a material on a given ISO date.
const materialPriceAt = (mat, iso, purchases) => {
  const pts = materialPricePoints(mat, purchases);
  if (!pts.length) return 0;
  let price = pts[0].price;
  for (const h of pts) {
    if (h.date <= iso) price = h.price; else break;
  }
  return price;
};
const materialCurrentPrice = (mat, purchases) => materialPriceAt(mat, todayISO(), purchases);

// Full breakdown of a recipe's per-unit cost at a date (default: today).
const recipeCost = (recipe, materialById, purchases, iso) => {
  const date = iso || todayISO();
  let materials = 0;
  const ingredientLines = (recipe?.ingredients || []).map((ing) => {
    const m = materialById[ing.materialId];
    const price = materialPriceAt(m, date, purchases);
    const cost = ing.qty * price;
    materials += cost;
    return { ...ing, material: m, price, cost };
  });
  let labor = 0;
  const laborLines = (recipe?.labor || []).map((l) => {
    const cost = (Number(l.minutes) / 60) * Number(l.rate);
    labor += cost;
    return { ...l, cost };
  });
  return { materials, labor, total: materials + labor, ingredientLines, laborLines };
};

// Monthly series of per-unit total cost (uses CURRENT quantities across history).
const costSeries = (recipe, materialById, purchases, months = 6) => {
  const now = new Date();
  const pts = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const iso = d.toISOString().slice(0, 10);
    const { total, materials, labor } = recipeCost(recipe, materialById, purchases, iso);
    pts.push({ date: iso, total, materials, labor, label: d.toLocaleDateString(LB_LOCALE, { month: 'short' }).replace('.', '') });
  }
  return pts;
};

// ── Persistence (localStorage) ───────────────────────────────
// Every transaction is saved to the browser. Survives refresh & reboot.
// Single device only — see README for multi-device sync (Supabase).
const LUMA_STORE_KEY = 'lumabonga:v1';
// Pluggable backend: if the host page (index.html) wires Supabase it sets
// window.__LUMA_INITIAL (loaded snapshot) and window.__LUMA_SAVE (writer).
// Otherwise we fall back to localStorage (single-device offline mode).
const loadPersisted = () => {
  if (typeof window !== 'undefined' && window.__LUMA_INITIAL !== undefined) {
    return window.__LUMA_INITIAL;
  }
  try {
    const raw = (typeof localStorage !== 'undefined') && localStorage.getItem(LUMA_STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
};
const savePersisted = (snapshot) => {
  // Public (read-only) viewers never write: not to the backend, and not to
  // localStorage either — a partial public catalog must not shadow real data.
  if (typeof window !== 'undefined' && window.__LUMA_READONLY) return;
  // Always keep a local backup (offline / refresh safety).
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(LUMA_STORE_KEY, JSON.stringify(snapshot));
  } catch (e) { /* quota / private mode — ignore */ }
  // Push to the shared backend when wired.
  if (typeof window !== 'undefined' && typeof window.__LUMA_SAVE === 'function') {
    try { window.__LUMA_SAVE(snapshot); } catch (e) { /* network — local backup still holds */ }
  }
};

// ── Store hook ───────────────────────────────────────────────
function useLumaStore(seed, shareLumaya) {
  const saved = React.useMemo(loadPersisted, []);
  // When a backend snapshot exists (Supabase, or prior local save) it is
  // authoritative — empty means empty. Demo seeds load only on a true first run.
  // No demo data anywhere: defaults are empty. Real data comes from the backend
  // (Supabase) or an explicit `seed` arg.
  const [products, setProducts] = React.useState(saved?.products || seed?.products || []);
  const [sales, setSales] = React.useState(saved?.sales || seed?.sales || []);
  const [purchases, setPurchases] = React.useState(saved?.purchases || seed?.purchases || []);
  const [costs, setCosts] = React.useState(saved?.costs || seed?.costs || []);
  const [production, setProduction] = React.useState(saved?.production || seed?.production || []);
  const [activeUser, setActiveUser] = React.useState(saved?.activeUser || 'lumaya'); // 'lumaya' | 'gawah'
  const [materials, setMaterials] = React.useState(() =>
    saved?.materials || seed?.materials || []);
  // Settlements: cash transfers between the two partners to balance accounts.
  // { id, date, from:'lumaya'|'gawah', to, amount, note }
  const [settlements, setSettlements] = React.useState(saved?.settlements || []);
  // Manual stock overrides (id -> target qty). When set, the displayed stock is
  // forced to this value instead of the derived one (used to match reality).
  const [materialAdj, setMaterialAdj] = React.useState(saved?.materialAdj || {});
  const [productAdj, setProductAdj] = React.useState(saved?.productAdj || {});
  // Selected reporting period: 'YYYY-MM' (a month) or 'all'. Default = everything.
  const [period, setPeriod] = React.useState('all');
  // SOPs — production procedure per product.
  // { [productId]: { steps: [{ id, text, items: [{ materialId, pct }] }] } }
  // `pct` = share of the recipe quantity handled in this step (default 100).
  const [sops, setSops] = React.useState(saved?.sops || {});
  // SOP drafts — one pending "to test" set of steps per product, compared
  // against the current (tested/base) SOP. Same shape as a SOP. Approving
  // one replaces `sops[pid]`; discarding just clears the draft. Fully
  // independent from `recipeDrafts` — approving/discarding one never
  // touches the other.
  const [sopDrafts, setSopDrafts] = React.useState(saved?.sopDrafts || {});
  // Team task board. { id, date, text, assignee, done }
  const [todos, setTodos] = React.useState(saved?.todos || []);
  const [team, setTeam] = React.useState(saved?.team || ['Pawung', 'Gani', 'Burhan', 'Joachim']);

  // recipes: give every ingredient/labor line a stable id for editing & keys
  const withIds = (recipes) => {
    const out = {};
    for (const pid of Object.keys(recipes)) {
      const r = recipes[pid];
      out[pid] = {
        ingredients: (r.ingredients || []).map((x, i) => ({ id: `${pid}_i${i}`, ...x })),
        labor: (r.labor || []).map((x, i) => ({ id: `${pid}_l${i}`, ...x })),
      };
    }
    return out;
  };
  const [recipes, setRecipes] = React.useState(() => saved?.recipes || (seed?.recipes ? withIds(seed.recipes) : {}));
  // Recipe drafts — one pending "to test" suggestion per product, compared
  // against the current (tested/base) recipe. Same shape as a recipe.
  // Approving one replaces `recipes[pid]`; discarding just clears the draft,
  // the base recipe is never touched by draft edits.
  const [recipeDrafts, setRecipeDrafts] = React.useState(saved?.recipeDrafts || {});
  const rid = (p) => p + Math.random().toString(36).slice(2, 7);

  // Persist on any change. Recipes already carry stable ids, so they round-trip.
  React.useEffect(() => {
    savePersisted({ products, sales, purchases, costs, production, materials, recipes, recipeDrafts, activeUser, settlements, materialAdj, productAdj, sops, sopDrafts, todos, team });
  }, [products, sales, purchases, costs, production, materials, recipes, recipeDrafts, activeUser, settlements, materialAdj, productAdj, sops, sopDrafts, todos, team]);

  const recipeFor = (pid) => recipes[pid] || { ingredients: [], labor: [] };
  const editRecipe = (pid, fn) => setRecipes((rs) => {
    const cur = rs[pid] || { ingredients: [], labor: [] };
    return { ...rs, [pid]: fn(cur) };
  });
  const addIngredient = (pid, materialId, qty) => editRecipe(pid, (r) =>
    ({ ...r, ingredients: [...r.ingredients, { id: rid('i_'), materialId, qty }] }));
  const updateIngredientQty = (pid, id, qty) => editRecipe(pid, (r) =>
    ({ ...r, ingredients: r.ingredients.map((i) => i.id === id ? { ...i, qty: Math.max(0, qty) } : i) }));
  // Patch a recipe line (qty stored in base unit; `unit` = display unit only).
  const updateIngredient = (pid, id, patch) => editRecipe(pid, (r) =>
    ({ ...r, ingredients: r.ingredients.map((i) => i.id === id ? { ...i, ...patch } : i) }));
  const removeIngredient = (pid, id) => editRecipe(pid, (r) =>
    ({ ...r, ingredients: r.ingredients.filter((i) => i.id !== id) }));
  const addLabor = (pid, labor) => editRecipe(pid, (r) =>
    ({ ...r, labor: [...r.labor, { id: rid('l_'), ...labor }] }));
  const updateLabor = (pid, id, patch) => editRecipe(pid, (r) =>
    ({ ...r, labor: r.labor.map((l) => l.id === id ? { ...l, ...patch } : l) }));
  const removeLabor = (pid, id) => editRecipe(pid, (r) =>
    ({ ...r, labor: r.labor.filter((l) => l.id !== id) }));

  // ── Recipe drafts ("suggest a correction") ───────────────────
  const draftFor = (pid) => recipeDrafts[pid] || null;
  const editDraft = (pid, fn) => setRecipeDrafts((ds) => {
    const cur = ds[pid];
    if (!cur) return ds;
    return { ...ds, [pid]: fn(cur) };
  });
  // Starts a draft as a copy of the current (tested) recipe — the base stays
  // untouched; only this copy is editable until approved or discarded.
  const startDraft = (pid) => setRecipeDrafts((ds) => ds[pid] ? ds : {
    ...ds,
    [pid]: {
      ingredients: (recipeFor(pid).ingredients || []).map((i) => ({ ...i })),
      labor: (recipeFor(pid).labor || []).map((l) => ({ ...l })),
    },
  });
  const addDraftIngredient = (pid, materialId, qty) => editDraft(pid, (r) =>
    ({ ...r, ingredients: [...r.ingredients, { id: rid('di_'), materialId, qty }] }));
  const updateDraftIngredient = (pid, id, patch) => editDraft(pid, (r) =>
    ({ ...r, ingredients: r.ingredients.map((i) => i.id === id ? { ...i, ...patch } : i) }));
  const removeDraftIngredient = (pid, id) => editDraft(pid, (r) =>
    ({ ...r, ingredients: r.ingredients.filter((i) => i.id !== id) }));
  const discardDraft = (pid) => setRecipeDrafts((ds) => { const n = { ...ds }; delete n[pid]; return n; });
  // Draft becomes the new base recipe — status untouched (still Test: keep testing).
  const approveDraftAsBase = (pid) => {
    const d = recipeDrafts[pid];
    if (!d) return;
    setRecipes((rs) => ({ ...rs, [pid]: { ingredients: d.ingredients, labor: d.labor } }));
    discardDraft(pid);
  };
  // Like approveDraftAsBase, but immediately reseeds the draft as a fresh copy
  // of the same new base — for the Test-composition "Valider" flow, where
  // testing continues right after promoting. Computes `next` once and uses it
  // for both writes so the reseeded draft never reads stale `recipes` state
  // from before this same click's setRecipes has taken effect.
  const approveDraftAsBaseAndRestart = (pid) => {
    const d = recipeDrafts[pid];
    if (!d) return;
    const next = { ingredients: d.ingredients.map((i) => ({ ...i })), labor: (d.labor || []).map((l) => ({ ...l })) };
    setRecipes((rs) => ({ ...rs, [pid]: next }));
    setRecipeDrafts((ds) => ({ ...ds, [pid]: { ingredients: next.ingredients.map((i) => ({ ...i })), labor: next.labor.map((l) => ({ ...l })) } }));
  };

  const addProduct = (p) => {
    const id = 'p_' + Math.random().toString(36).slice(2, 8);
    // New products start as 'test' — an admin must promote to 'ready' before
    // level-1 (public) visitors can see them.
    const next = { id, hue: Math.floor(Math.random() * 360), emoji: (p.name || '?').slice(0, 2), stock0: 0, unitPrice: 0, status: 'test', ...p };
    setProducts((xs) => [next, ...xs]);
    // start with an empty recipe so the fiche opens cleanly
    setRecipes((rs) => ({ ...rs, [id]: { ingredients: [], labor: [] } }));
    return next;
  };
  const updateProduct = (id, patch) => setProducts((xs) => xs.map((p) => p.id === id ? { ...p, ...patch } : p));
  // Deleting a product also drops everything keyed to it — recipe, SOP,
  // pending drafts (recipe + SOP), manual stock override — so nothing
  // orphaned lingers (a dangling recipe/SOP reference caused a real bug once
  // already).
  const removeProduct = (id) => {
    setProducts((xs) => xs.filter((p) => p.id !== id));
    setRecipes((rs) => { const n = { ...rs }; delete n[id]; return n; });
    setSops((s) => { const n = { ...s }; delete n[id]; return n; });
    setRecipeDrafts((ds) => { const n = { ...ds }; delete n[id]; return n; });
    setSopDrafts((ds) => { const n = { ...ds }; delete n[id]; return n; });
    setProductAdj((m) => { const n = { ...m }; delete n[id]; return n; });
  };
  // Reorder the catalog (drag & drop). Any id missing from `orderedIds`
  // (shouldn't happen) keeps its relative position at the end, so a stale
  // snapshot can never silently drop a product.
  const setProductsOrder = (orderedIds) => setProducts((xs) => {
    const byId = {};
    for (const p of xs) byId[p.id] = p;
    const reordered = orderedIds.map((id) => byId[id]).filter(Boolean);
    const missing = xs.filter((p) => !orderedIds.includes(p.id));
    return [...reordered, ...missing];
  });

  // Raw materials CRUD
  const addMaterial = (m) => {
    const id = 'm_' + Math.random().toString(36).slice(2, 8);
    const unit = m.unit || 'g';
    const price = Number(m.price) || 0;
    const next = {
      id, kind: m.kind || 'matière', hue: m.hue ?? Math.floor(Math.random() * 360),
      stock0: Number(m.stock0) || 0, unit, name: m.name || 'Matière', cat: m.cat || undefined,
      priceHistory: price > 0 ? [{ date: todayISO(), price }] : [],
    };
    setMaterials((xs) => [...xs, next]);
    return next;
  };
  const updateMaterial = (id, patch) => setMaterials((xs) => xs.map((m) => m.id === id ? { ...m, ...patch } : m));
  const removeMaterial = (id) => setMaterials((xs) => xs.filter((m) => m.id !== id));

  const addSale = (s) => {
    const id = 's_' + Math.random().toString(36).slice(2, 8);
    setSales((xs) => [{ id, date: todayISO(), ...s }, ...xs]);
  };
  const addPurchase = (s) => {
    const id = 'a_' + Math.random().toString(36).slice(2, 8);
    setPurchases((xs) => [{ id, date: todayISO(), ...s }, ...xs]);
  };
  const addCost = (c) => {
    const id = 'c_' + Math.random().toString(36).slice(2, 8);
    setCosts((xs) => [{ id, date: todayISO(), ...c }, ...xs]);
  };
  const addProductionLot = (p) => {
    const id = 'pr_' + Math.random().toString(36).slice(2, 8);
    setProduction((xs) => [{ id, date: todayISO(), ...p }, ...xs]);
  };
  const addSettlement = (s) => {
    const id = 'st_' + Math.random().toString(36).slice(2, 8);
    setSettlements((xs) => [{ id, date: todayISO(), ...s }, ...xs]);
  };
  const updateSettlement = (id, patch) => setSettlements((xs) => xs.map((x) => x.id === id ? { ...x, ...patch } : x));
  const removeSettlement = (id) => setSettlements((xs) => xs.filter((x) => x.id !== id));

  // Manual stock override: set/clear a forced quantity for a material or product.
  const setMaterialStockManual = (id, qty) => setMaterialAdj((m) => ({ ...m, [id]: Number(qty) }));
  const clearMaterialStockManual = (id) => setMaterialAdj((m) => { const n = { ...m }; delete n[id]; return n; });
  const setProductStockManual = (id, qty) => setProductAdj((m) => ({ ...m, [id]: Number(qty) }));
  const clearProductStockManual = (id) => setProductAdj((m) => { const n = { ...m }; delete n[id]; return n; });

  const removeSale = (id) => setSales((xs) => xs.filter((x) => x.id !== id));
  const removePurchase = (id) => setPurchases((xs) => xs.filter((x) => x.id !== id));
  const removeCost = (id) => setCosts((xs) => xs.filter((x) => x.id !== id));
  const removeProduction = (id) => setProduction((xs) => xs.filter((x) => x.id !== id));
  const updateSale = (id, patch) => setSales((xs) => xs.map((x) => x.id === id ? { ...x, ...patch } : x));
  const updatePurchase = (id, patch) => setPurchases((xs) => xs.map((x) => x.id === id ? { ...x, ...patch } : x));
  const updateCost = (id, patch) => setCosts((xs) => xs.map((x) => x.id === id ? { ...x, ...patch } : x));
  const updateProduction = (id, patch) => setProduction((xs) => xs.map((x) => x.id === id ? { ...x, ...patch } : x));

  // Wipe everything to an empty ledger (no demo data).
  const resetStore = () => {
    try { if (typeof localStorage !== 'undefined') localStorage.removeItem(LUMA_STORE_KEY); } catch (e) {}
    setProducts([]);
    setSales([]);
    setPurchases([]);
    setCosts([]);
    setProduction([]);
    setMaterials([]);
    setRecipes({});
    setRecipeDrafts({});
    setSopDrafts({});
    setActiveUser('lumaya');
    setSettlements([]);
    setMaterialAdj({});
    setProductAdj({});
    setSops({});
    setTodos([]);
    setTeam(['Pawung', 'Gani', 'Burhan', 'Joachim']);
  };

  const productById = React.useMemo(() => {
    const m = {};
    for (const p of products) m[p.id] = p;
    return m;
  }, [products]);

  const materialById = React.useMemo(() => {
    const m = {};
    for (const x of materials) m[x.id] = x;
    return m;
  }, [materials]);

  // Current unit price per material (last purchase / seed history)
  const materialPrices = React.useMemo(() => {
    const m = {};
    for (const mat of materials) m[mat.id] = materialCurrentPrice(mat, purchases);
    return m;
  }, [materials, purchases]);

  // Per-unit production cost of each product (materials at current price + labour)
  const unitCostFor = React.useCallback((pid) => {
    const r = recipes[pid] || { ingredients: [], labor: [] };
    return recipeCost(r, materialById, purchases).total;
  }, [recipes, materialById, purchases]);

  // ── Stock derivations ──────────────────────────────────────
  // Raw-material stock = opening + purchases − consumed by production (current recipe).
  const materialStock = React.useMemo(() => {
    const s = {};
    for (const m of materials) s[m.id] = m.stock0 || 0;
    for (const p of purchases) if (s[p.materialId] != null) s[p.materialId] += Number(p.qty) || 0;
    for (const pr of production) {
      const r = recipes[pr.productId];
      if (!r) continue;
      for (const ing of r.ingredients) {
        if (s[ing.materialId] != null) s[ing.materialId] -= (Number(pr.qty) || 0) * (Number(ing.qty) || 0);
      }
    }
    // Manual override wins (corrects stock to match reality).
    for (const id of Object.keys(materialAdj)) if (s[id] != null) s[id] = Number(materialAdj[id]);
    return s;
  }, [materials, purchases, production, recipes, materialAdj]);

  // Finished-goods stock = opening + produced − sold (manual override wins).
  const finishedStock = React.useMemo(() => {
    const s = {};
    for (const p of products) s[p.id] = p.stock0 || 0;
    for (const pr of production) if (s[pr.productId] != null) s[pr.productId] += Number(pr.qty) || 0;
    for (const sa of sales) if (s[sa.productId] != null) s[sa.productId] -= Number(sa.qty) || 0;
    for (const id of Object.keys(productAdj)) if (s[id] != null) s[id] = Number(productAdj[id]);
    return s;
  }, [products, production, sales, productAdj]);

  // How many more units of a product can be produced with current material stock.
  const producibleFor = React.useCallback((pid) => {
    const r = recipes[pid];
    if (!r || !r.ingredients.length) return 0;
    let min = Infinity;
    for (const ing of r.ingredients) {
      const need = Number(ing.qty) || 0;
      if (need <= 0) continue;
      const have = materialStock[ing.materialId] ?? 0;
      min = Math.min(min, Math.floor(have / need));
    }
    return min === Infinity ? 0 : Math.max(0, min);
  }, [recipes, materialStock]);

  // What limits production of a product (lowest-stock ingredient).
  const bottleneckFor = React.useCallback((pid) => {
    const r = recipes[pid];
    if (!r || !r.ingredients.length) return null;
    let best = null;
    for (const ing of r.ingredients) {
      const need = Number(ing.qty) || 0;
      if (need <= 0) continue;
      const have = materialStock[ing.materialId] ?? 0;
      const units = Math.floor(have / need);
      if (best === null || units < best.units) best = { materialId: ing.materialId, units, have, need };
    }
    return best;
  }, [recipes, materialStock]);

  const cogsOf = React.useCallback((s) => {
    const r = recipes[s.productId];
    const unit = r ? recipeCost(r, materialById, purchases, s.date).total : 0;
    return unit * (Number(s.qty) || 0);
  }, [recipes, materialById, purchases]);

  const totals = React.useMemo(() => {
    const ventes = sales.reduce((a, s) => a + s.qty * s.price, 0);
    const achats = purchases.reduce((a, s) => a + (Number(s.qty) || 0) * (Number(s.price) || 0), 0);
    const charges = costs.reduce((a, c) => a + c.amount, 0);
    let cogs = 0;
    for (const s of sales) cogs += cogsOf(s);
    // Cash-basis profit: every purchase made is charged against profit (not just
    // the cost of goods sold). profit = sales − all purchases − charges.
    const profit = ventes - achats - charges;
    const marge = ventes > 0 ? (profit / ventes) * 100 : 0;

    // This-month figures (dated in the current calendar month).
    const ym = (period && period !== 'all') ? period : null;
    const inMonth = (d) => ym ? ((d || '').slice(0, 7) === ym) : true;
    let ventesM = 0, cogsM = 0, chargesM = 0, achatsM = 0;
    for (const s of sales) if (inMonth(s.date)) { ventesM += s.qty * s.price; cogsM += cogsOf(s); }
    for (const c of costs) if (inMonth(c.date)) chargesM += c.amount;
    for (const p of purchases) if (inMonth(p.date)) achatsM += (Number(p.qty) || 0) * (Number(p.price) || 0);
    const profitMonth = ventesM - achatsM - chargesM;
    const margeMonth = ventesM > 0 ? (profitMonth / ventesM) * 100 : 0;
    // Stock value change this month = bought into stock − cost of goods sold out.
    const deltaStockMonth = achatsM - cogsM;

    // Inventory value at cost
    let valMatieres = 0;
    for (const m of materials) valMatieres += (materialStock[m.id] || 0) * (materialPrices[m.id] || 0);
    let valProduits = 0;
    for (const p of products) valProduits += (finishedStock[p.id] || 0) * unitCostFor(p.id);

    // ── Partner balances (cash settlement, sums to zero) ────────
    // entitled = each org's share of distributable cash (ventes − achats − charges).
    // held     = cash actually in each org's hands (its own sales − its purchases
    //            − its charges + settlements received − settlements paid).
    // balance  = held − entitled. NEGATIVE = is owed money (must receive).
    const distributable = ventes - achats - charges;
    // Default split (fallback for products without their own share) comes
    // from the shareLumaya tweak; each product can override it — set from
    // its own card — so entitlement is a per-sale weighted split, not one
    // flat percentage for the whole business.
    const defaultSl = (typeof shareLumaya === 'number' ? shareLumaya : 70) / 100;
    const shareFor = (pid) => {
      const p = productById[pid];
      const s = p && p.lumayaShare;
      return (typeof s === 'number' ? s : defaultSl * 100) / 100;
    };
    let lumayaFromSales = 0;
    for (const s of sales) lumayaFromSales += s.qty * s.price * shareFor(s.productId);
    const entitledLumaya = lumayaFromSales - (achats + charges) * defaultSl;
    const entitled = { lumaya: entitledLumaya, gawah: distributable - entitledLumaya };
    const held = { lumaya: 0, gawah: 0 };
    const ventesByOrg = { lumaya: 0, gawah: 0 };
    const achatsByOrg = { lumaya: 0, gawah: 0 };
    const chargesByOrg = { lumaya: 0, gawah: 0 };
    const orgOf = (x) => (x && x.org === 'gawah') ? 'gawah' : 'lumaya';
    for (const s of sales) { const v = s.qty * s.price; held[orgOf(s)] += v; ventesByOrg[orgOf(s)] += v; }
    for (const p of purchases) { const v = (Number(p.qty) || 0) * (Number(p.price) || 0); held[orgOf(p)] -= v; achatsByOrg[orgOf(p)] += v; }
    for (const c of costs) { const v = Number(c.amount) || 0; held[orgOf(c)] -= v; chargesByOrg[orgOf(c)] += v; }
    // Snapshot each org's own trading result — sales minus its own
    // purchases and charges — BEFORE settlement transfers are netted into
    // `held` below. Used to gate the settlement suggestion on both orgs
    // being individually profitable. `held` keeps including settlements
    // (money already paid/received) because it answers a different
    // question: "how much cash does this org have right now."
    const grossHeld = { ...held };
    for (const st of settlements) {
      const amt = Number(st.amount) || 0;
      if (st.from === 'lumaya') held.lumaya -= amt; else if (st.from === 'gawah') held.gawah -= amt;
      if (st.to === 'lumaya') held.lumaya += amt; else if (st.to === 'gawah') held.gawah += amt;
    }
    const balance = { lumaya: held.lumaya - entitled.lumaya, gawah: held.gawah - entitled.gawah };

    return {
      ventes, achats, charges, cogs, profit, marge,
      profitMonth, margeMonth, ventesM, achatsM, chargesM, cogsM, deltaStockMonth,
      valMatieres, valProduits, valStock: valMatieres + valProduits,
      entitled, held, balance, grossHeld, ventesByOrg, achatsByOrg, chargesByOrg,
    };
  }, [sales, purchases, costs, settlements, recipes, materialById, materials, products, productById, materialStock, finishedStock, materialPrices, unitCostFor, cogsOf, shareLumaya, period]);

  // ── SOP actions ────────────────────────────────────────────
  // Steps are saved as a whole from the editor (validated there: text required).
  const setSop = (pid, steps) => setSops((s) => ({ ...s, [pid]: { steps } }));
  const removeSop = (pid) => setSops((s) => { const n = { ...s }; delete n[pid]; return n; });

  // ── SOP draft actions ("suggest a correction") ───────────────────
  // Independent of recipe drafts: no "approve as Ready" here, because SOPs
  // have no Ready/Test status of their own — only the product does, and
  // that flag is owned entirely by the recipe side.
  const sopDraftFor = (pid) => sopDrafts[pid] || null;
  const startSopDraft = (pid) => setSopDrafts((ds) => ds[pid] ? ds : {
    ...ds,
    [pid]: { steps: (sops[pid]?.steps || []).map((s) => ({ ...s, items: (s.items || []).map((i) => ({ ...i })) })) },
  });
  const setSopDraftSteps = (pid, steps) => setSopDrafts((ds) => ({ ...ds, [pid]: { steps } }));
  const approveSopDraftAsBase = (pid) => {
    const d = sopDrafts[pid];
    if (!d) return;
    // Trim on commit (not on every keystroke — the compare sheet's per-step
    // text handler deliberately doesn't trim while typing), matching how
    // ProdSopEditorSheet's save() trims each step's text at the same point.
    setSops((s) => ({ ...s, [pid]: { steps: d.steps.map((step) => ({ ...step, text: step.text.trim() })) } }));
    setSopDrafts((ds) => { const n = { ...ds }; delete n[pid]; return n; });
  };
  // Same idea as approveDraftAsBaseAndRestart, for the SOP side.
  const approveSopDraftAsBaseAndRestart = (pid) => {
    const d = sopDrafts[pid];
    if (!d) return;
    const next = { steps: d.steps.map((step) => ({ ...step, text: step.text.trim(), items: (step.items || []).map((i) => ({ ...i })) })) };
    setSops((s) => ({ ...s, [pid]: next }));
    setSopDrafts((ds) => ({ ...ds, [pid]: { steps: next.steps.map((step) => ({ ...step, items: step.items.map((i) => ({ ...i })) })) } }));
  };
  const discardSopDraft = (pid) => setSopDrafts((ds) => { const n = { ...ds }; delete n[pid]; return n; });

  // ── To-do actions ──────────────────────────────────────────
  const addTodo = (td) => {
    const id = 'td_' + Math.random().toString(36).slice(2, 8);
    setTodos((xs) => [{ id, date: todayISO(), done: false, ...td }, ...xs]);
  };
  const updateTodo = (id, patch) => setTodos((xs) => xs.map((x) => x.id === id ? { ...x, ...patch } : x));
  const toggleTodo = (id) => setTodos((xs) => xs.map((x) => x.id === id ? { ...x, done: !x.done } : x));
  const removeTodo = (id) => setTodos((xs) => xs.filter((x) => x.id !== id));
  const addTeamMember = (name) => {
    const n = String(name || '').trim();
    if (!n) return;
    setTeam((xs) => xs.some((x) => x.toLowerCase() === n.toLowerCase()) ? xs : [...xs, n]);
  };
  const removeTeamMember = (name) => setTeam((xs) => xs.filter((x) => x !== name));

  // Shopping list: materials whose stock can't cover 10 units of some product.
  // For each product×ingredient, need = 10 × recipe qty; keep the worst shortfall
  // per material along with the product that drives it.
  const toPurchase = React.useMemo(() => {
    const out = {};
    for (const p of products) {
      const r = recipes[p.id];
      if (!r) continue;
      for (const ing of (r.ingredients || [])) {
        const need = 10 * (Number(ing.qty) || 0);
        if (need <= 0) continue;
        const have = materialStock[ing.materialId] ?? 0;
        const missing = need - have;
        if (missing <= 0) continue;
        const cur = out[ing.materialId];
        if (!cur || missing > cur.missing) out[ing.materialId] = { materialId: ing.materialId, missing, need, have, productId: p.id };
      }
    }
    return Object.values(out).sort((a, b) => b.missing - a.missing);
  }, [products, recipes, materialStock]);

  // Distinct months present in the ledger (newest first); current month always included.
  const availableMonths = React.useMemo(() => {
    const set = new Set([todayISO().slice(0, 7)]);
    for (const arr of [sales, purchases, costs, production, settlements])
      for (const x of arr) if (x && x.date) set.add(String(x.date).slice(0, 7));
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [sales, purchases, costs, production, settlements]);

  return {
    products, sales, purchases, costs, production, activeUser, materials, settlements,
    materialAdj, productAdj,
    period, setPeriod, availableMonths,
    setActiveUser,
    addProduct, updateProduct, removeProduct, setProductsOrder,
    addMaterial, updateMaterial, removeMaterial,
    addSale, updateSale, removeSale,
    addPurchase, updatePurchase, removePurchase,
    addCost, updateCost, removeCost,
    addProductionLot, updateProduction, removeProduction,
    addSettlement, updateSettlement, removeSettlement,
    setMaterialStockManual, clearMaterialStockManual,
    setProductStockManual, clearProductStockManual,
    resetStore,
    productById, materialById, materialPrices, totals,
    recipes, recipeFor, unitCostFor,
    recipeDrafts, draftFor, startDraft, discardDraft,
    addDraftIngredient, updateDraftIngredient, removeDraftIngredient,
    approveDraftAsBase, approveDraftAsBaseAndRestart,
    sops, setSop, removeSop,
    sopDrafts, sopDraftFor, startSopDraft, setSopDraftSteps, approveSopDraftAsBase, approveSopDraftAsBaseAndRestart, discardSopDraft,
    todos, addTodo, updateTodo, toggleTodo, removeTodo,
    team, addTeamMember, removeTeamMember, toPurchase,
    materialStock, finishedStock, producibleFor, bottleneckFor,
    addIngredient, updateIngredientQty, updateIngredient, removeIngredient,
    addLabor, updateLabor, removeLabor,
  };
}

// ── Icons (line, stroke-based, no emoji) ─────────────────────
const Icon = {
  dash: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1.5"/>
      <rect x="14" y="3" width="7" height="5" rx="1.5"/>
      <rect x="14" y="12" width="7" height="9" rx="1.5"/>
      <rect x="3" y="16" width="7" height="5" rx="1.5"/>
    </svg>
  ),
  sale: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M7 17 17 7"/>
      <path d="M9 7h8v8"/>
    </svg>
  ),
  buy: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M17 7 7 17"/>
      <path d="M15 17H7v-8"/>
    </svg>
  ),
  cost: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 21V10l5-3 5 3v11"/>
      <path d="M14 13h6v8h-6"/>
      <path d="M9 21v-4"/>
    </svg>
  ),
  prod: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 7l9-4 9 4"/>
      <path d="M3 7v10l9 4 9-4V7"/>
      <path d="M12 11v10"/>
      <path d="M3 7l9 4 9-4"/>
    </svg>
  ),
  plus: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  close: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M6 6l12 12M18 6L6 18"/>
    </svg>
  ),

  trash: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>
    </svg>
  ),
  back: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M15 6l-6 6 6 6"/>
    </svg>
  ),
  minus: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
      <path d="M5 12h14"/>
    </svg>
  ),
  clock: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 2"/>
    </svg>
  ),
  edit: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
    </svg>
  ),
  box: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 7l9-4 9 4v10l-9 4-9-4V7Z"/>
      <path d="M3 7l9 4 9-4M12 11v10"/>
    </svg>
  ),
  alert: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 9v4M12 17h.01"/>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>
    </svg>
  ),
  check: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 12l5 5L20 6"/>
    </svg>
  ),
  arrow: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  ),
  list: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 6h11M9 12h11M9 18h11"/>
      <circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>
    </svg>
  ),
  chevronDown: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 9l6 6 6-6"/>
    </svg>
  ),
  grip: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...p}>
      <circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/>
      <circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/>
      <circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/>
    </svg>
  ),
  todo: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="4" width="18" height="17" rx="3"/>
      <path d="M8 10.5l2.5 2.5L16 8.5"/>
      <path d="M8 16h8"/>
    </svg>
  ),
  spark: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>
    </svg>
  ),
};

// Animated number that counts up smoothly
function AnimatedNumber({ value, duration = 600, format = fmtNum, style }) {
  const [display, setDisplay] = React.useState(value);
  const fromRef = React.useRef(value);
  const startRef = React.useRef(null);
  const rafRef = React.useRef(null);
  React.useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const from = display;
    fromRef.current = from;
    startRef.current = null;
    const tick = (t) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      const k = Math.min(1, elapsed / duration);
      // easeOutCubic
      const e = 1 - Math.pow(1 - k, 3);
      setDisplay(from + (value - from) * e);
      if (k < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line
  }, [value]);
  return <span style={style}>{format(display)}</span>;
}

Object.assign(window, {
  TWEAK_DEFAULTS,
  fmtNum, fmtMoney, fmtShort, fmtDate, fmtDay, todayISO,
  SEED_PRODUCTS, SEED_SALES, SEED_PURCHASES, SEED_COSTS,
  SEED_MATERIALS, SEED_RECIPES, SEED_PRODUCTION, STOCK0_BY_UNIT, LABOR_PRESETS,
  materialPricePoints, materialPriceAt, materialCurrentPrice, recipeCost, costSeries,
  useLumaStore, Icon, AnimatedNumber,
  tr, setLbLang, fmtQty,
  materialCat, groupedMaterials, MATERIAL_CAT_LABELS, allMaterialCats, catLabel,
  PRODUCT_CATS, PRODUCT_CAT_LABELS, productCat, productCatLabel, groupedProducts,
  COMPONENT_UNITS, convertUnit, densityFor, isMassUnit, isVolUnit,
});
