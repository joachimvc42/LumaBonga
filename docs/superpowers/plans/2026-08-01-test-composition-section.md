# Test Composition Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the recipe/SOP "suggestion" compare-sheet modals with a persistent, distinctly-colored "Test composition" section inline on the product card, plus an explicit base-vs-test choice gate when a product moves from Test to Ready status.

**Architecture:** No new data model — `recipeDrafts`/`sopDrafts` and their store functions (`startDraft`, `approveDraftAsBase`, `discardDraft`, `startSopDraft`, `approveSopDraftAsBase`, `discardSopDraft`, etc.) already exist and already do exactly what's needed. This is a UI rewire: (1) `ProdSopViewerSheet`/`ProdSopEditorSheet` in lumabonga-product.jsx gain a `draft` prop so they can show/edit the draft SOP instead of the base one; (2) a new inline section in lumabonga-creative.jsx replaces the two old suggestion buttons + their modal sheets; (3) the Test/Ready status chips gain side-effects (auto-copy base→draft on entering Test; a new confirm modal gating the Test→Ready transition); (4) the now-dead `ProdFormulaCompareSheet`/`ProdSopCompareSheet` components are deleted.

**Tech Stack:** React 18 (UMD, no bundler), Babel Standalone (in-browser JSX transpile), plain `window`-global module wiring across `lumabonga-*.jsx` files, Supabase for persistence (via the whole-store `savePersisted` snapshot).

## Global Constraints

- No test framework exists in this repo (no package.json, no jest/vitest/pytest). Every "test" step in this plan is a **manual browser verification**: seed `localStorage['lumabonga:v1']`, drive `LumaBonga.html` (the no-auth design canvas at the repo root — same app code, demo data) via the `mcp__Claude_Browser__*` tools, and check exact DOM/console/`window.__LUMA_INITIAL` output. Start the server via `.claude/launch.json`'s `lumabonga` config (`npx serve -l 3000 .`) if it isn't already running, then `mcp__Claude_Browser__preview_start` with `{ name: "lumabonga" }` and navigate to `http://localhost:3000/LumaBonga.html`.
- Recipe drafts (`ProdDraftRow`) commit ingredient-quantity edits on `onBlur`. A prior session lost edits because a scripted `form_input` call set the DOM value without firing a real blur event. When verifying `ProdDraftRow` interactions via browser tools, use `mcp__Claude_Browser__computer` (real click + type + blur-via-Tab-or-click-away), not a raw DOM value set.
- Follow existing code style exactly: 2-space indent, inline styles as JS objects, `tr('French source string')` for every user-facing string with EN/ID entries added to the dictionaries in lumabonga-data.jsx. French is the source language baked directly into JSX `tr()` calls — do not add a "French dictionary," only EN and ID translation entries for new strings.
- Line numbers cited below are accurate as of plan-writing time (before any task in this plan executes). Once Task 1 or Task 2 edits a file, later tasks touching the *same* file will have drifted line numbers — every step also quotes the exact surrounding code to locate the edit; **trust the quoted code over the line number** if they disagree.
- Cross-file component references in this codebase are bare identifiers, not `window.X` — e.g. `<ProdSopViewerSheet .../>` inside lumabonga-creative.jsx, even though it's defined in lumabonga-product.jsx and only reachable because `Object.assign(window, { ProdSopViewerSheet, ... })` makes it a global. Follow this convention for every new cross-file reference in this plan (`ProdDraftRow`, `CreaFinalizeVersionConfirm`, etc.) — never prefix with `window.` in JSX.

---

### Task 1: `testAccent` theme color + `draft` prop on the SOP viewer/editor sheets

**Files:**
- Modify: `lumabonga-creative.jsx:29-38` (`creaTheme` — add one new color key)
- Modify: `lumabonga-product.jsx:456-465` (`sopItemQty` — take the resolved recipe as a parameter instead of always looking up the base recipe)
- Modify: `lumabonga-product.jsx:541-623` (`ProdSopEditorSheet` — add `draft` prop)
- Modify: `lumabonga-product.jsx:628-739` (`ProdSopViewerSheet` — add `draft` prop)

**Interfaces:**
- Produces (consumed by Task 2 and Task 4):
  - `c.testAccent` — new theme color (blue), available anywhere `c`/`prodTheme(dark, accent)` is already used in both files.
  - `ProdSopViewerSheet({ store, dark, t, product, onClose, draft = false })` — when `draft` is true, reads `store.sopDraftFor(pid)` instead of `store.sops[pid]`, and resolves ingredient quantities against `store.draftFor(pid) || store.recipeFor(pid)` instead of always `store.recipeFor(pid)`.
  - `ProdSopEditorSheet({ store, dark, t, product, onClose, draft = false })` — when `draft` is true, seeds from and saves to `store.sopDraftFor(pid)` / `store.setSopDraftSteps(pid, steps)` instead of `store.sops[pid]` / `store.setSop(pid, steps)`, skips the 100%-ingredient-coverage guard (matches the same deliberate scoping the old `ProdSopCompareSheet` used, per its comment at product.jsx:903-907 — a recipe draft has its own independent lifecycle, so % coverage doesn't cleanly apply to it), and tints its "Enregistrer" button with `c.testAccent`.

- [ ] **Step 1: Add the `testAccent` color to `creaTheme`**

In `lumabonga-creative.jsx`, find:

```jsx
    accent:     acc,
    purple:     dark ? '#c4a8ff' : '#5b54c9',
    amber:      dark ? '#f5c451' : '#b5811d',
    rose:       dark ? '#f48fb1' : '#d2483f',
```

Replace with:

```jsx
    accent:     acc,
    purple:     dark ? '#c4a8ff' : '#5b54c9',
    amber:      dark ? '#f5c451' : '#b5811d',
    rose:       dark ? '#f48fb1' : '#d2483f',
    // Test-composition section (product card): deliberately distinct from
    // purple (already means GawahBonga throughout the finance views) and
    // amber (already means "needs review" elsewhere on this same card).
    testAccent: dark ? '#7aa2f7' : '#3b5bdb',
```

- [ ] **Step 2: Make `sopItemQty` take the resolved recipe as a parameter**

In `lumabonga-product.jsx`, replace (current lines 456-465):

```jsx
function sopItemQty(store, pid, item, batch) {
  const ing = (store.recipeFor(pid).ingredients || []).find((i) => i.materialId === item.materialId);
  const mat = store.materialById[item.materialId];
  if (!ing || !mat) return null;
  const base = mat.unit || 'g';
  const du = (typeof COMPONENT_UNITS !== 'undefined' && COMPONENT_UNITS.includes(ing.unit)) ? ing.unit : base;
  const pct = (item.pct == null ? 100 : Number(item.pct)) / 100;
  const qty = (Number(ing.qty) || 0) * pct * (batch || 1);
  return { name: mat.name, hue: mat.hue, qty: convertUnit(qty, base, du, densityFor(mat)), unit: du, pct: Math.round(pct * 100) };
}
```

with:

```jsx
// `recipe` is passed in (rather than looked up here) so callers can choose
// base vs. draft — the sole caller, ProdSopViewerSheet, needs both depending
// on its `draft` prop.
function sopItemQty(store, pid, item, batch, recipe) {
  const ing = (recipe.ingredients || []).find((i) => i.materialId === item.materialId);
  const mat = store.materialById[item.materialId];
  if (!ing || !mat) return null;
  const base = mat.unit || 'g';
  const du = (typeof COMPONENT_UNITS !== 'undefined' && COMPONENT_UNITS.includes(ing.unit)) ? ing.unit : base;
  const pct = (item.pct == null ? 100 : Number(item.pct)) / 100;
  const qty = (Number(ing.qty) || 0) * pct * (batch || 1);
  return { name: mat.name, hue: mat.hue, qty: convertUnit(qty, base, du, densityFor(mat)), unit: du, pct: Math.round(pct * 100) };
}
```

- [ ] **Step 3: `ProdSopViewerSheet` — add `draft` prop**

Replace the function signature and its first few lines (current lines 628-634):

```jsx
function ProdSopViewerSheet({ store, dark, t, product, onClose }) {
  const c = prodTheme(dark, t.accent);
  const pid = product.id;
  const steps = store.sops[pid]?.steps || [];
  const [batchDraft, setBatchDraft] = React.useState('1');
  const [mode, setMode] = React.useState('u');      // 'u' = units | 'g' = grams
  const [batch, setBatch] = React.useState(null);   // scale factor, null until confirmed
```

with:

```jsx
function ProdSopViewerSheet({ store, dark, t, product, onClose, draft = false }) {
  const c = prodTheme(dark, t.accent);
  const pid = product.id;
  const steps = (draft ? store.sopDraftFor(pid) : store.sops[pid])?.steps || [];
  // Ingredient quantities shown per step should resolve against whichever
  // recipe this viewer represents: the draft recipe (if one exists) when
  // viewing the test SOP, otherwise the base recipe — matches the old SOP
  // compare sheet's ingredient-resolution preference.
  const recipe = draft ? (store.draftFor(pid) || store.recipeFor(pid)) : store.recipeFor(pid);
  const [batchDraft, setBatchDraft] = React.useState('1');
  const [mode, setMode] = React.useState('u');      // 'u' = units | 'g' = grams
  const [batch, setBatch] = React.useState(null);   // scale factor, null until confirmed
```

Now replace the `unitWeight` calculation (current lines 636-647):

```jsx
  // Weight of ONE unit: every convertible ingredient of the recipe, in grams.
  const unitWeight = React.useMemo(() => {
    let g = 0;
    for (const ing of (store.recipeFor(pid).ingredients || [])) {
      const mat = store.materialById[ing.materialId];
      if (!mat) continue;
      const base = mat.unit || 'g';
      if (!isMassUnit(base) && !isVolUnit(base)) continue;   // pièce/m: no mass
      g += convertUnit(Number(ing.qty) || 0, base, 'g', densityFor(mat));
    }
    return g;
  }, [store, pid]);
```

with:

```jsx
  // Weight of ONE unit: every convertible ingredient of the recipe, in grams.
  const unitWeight = React.useMemo(() => {
    let g = 0;
    for (const ing of (recipe.ingredients || [])) {
      const mat = store.materialById[ing.materialId];
      if (!mat) continue;
      const base = mat.unit || 'g';
      if (!isMassUnit(base) && !isVolUnit(base)) continue;   // pièce/m: no mass
      g += convertUnit(Number(ing.qty) || 0, base, 'g', densityFor(mat));
    }
    return g;
  }, [store, pid, recipe]);
```

Now update the title (both the batch-prompt screen and the steps screen use `tr('Procédure (SOP)')` — current lines 666 and 704 respectively). Replace each occurrence of:

```jsx
      <ProdSheet title={tr('Procédure (SOP)')} c={c} onClose={onClose}>
```

with:

```jsx
      <ProdSheet title={draft ? tr('Procédure (SOP) — Test') : tr('Procédure (SOP)')} c={c} onClose={onClose}>
```

(there are two occurrences in this component — the no-batch-yet screen and the steps screen — update both).

Finally, update the `sopItemQty` call site (current line 718):

```jsx
                const q = sopItemQty(store, pid, it, batch);
```

with:

```jsx
                const q = sopItemQty(store, pid, it, batch, recipe);
```

- [ ] **Step 4: `ProdSopEditorSheet` — add `draft` prop**

Replace the function signature and setup (current lines 541-549):

```jsx
function ProdSopEditorSheet({ store, dark, t, product, onClose }) {
  const c = prodTheme(dark, t.accent);
  const pid = product.id;
  const ingredients = store.recipeFor(pid).ingredients || [];
  const newStep = () => ({ id: 'ss_' + Math.random().toString(36).slice(2, 8), text: '', items: [] });
  const [steps, setSteps] = React.useState(() => {
    const cur = store.sops[pid]?.steps;
    return (cur && cur.length) ? cur.map((s) => ({ ...s, items: (s.items || []).map((i) => ({ ...i })) })) : [newStep()];
  });
```

with:

```jsx
function ProdSopEditorSheet({ store, dark, t, product, onClose, draft = false }) {
  const c = prodTheme(dark, t.accent);
  const pid = product.id;
  const recipe = draft ? (store.draftFor(pid) || store.recipeFor(pid)) : store.recipeFor(pid);
  const ingredients = recipe.ingredients || [];
  const newStep = () => ({ id: 'ss_' + Math.random().toString(36).slice(2, 8), text: '', items: [] });
  const [steps, setSteps] = React.useState(() => {
    const cur = (draft ? store.sopDraftFor(pid) : store.sops[pid])?.steps;
    return (cur && cur.length) ? cur.map((s) => ({ ...s, items: (s.items || []).map((i) => ({ ...i })) })) : [newStep()];
  });
```

Replace the `save` function (current lines 563-590):

```jsx
  const save = () => {
    if (steps.some((s) => !s.text.trim())) { setErr(tr('Chaque étape doit avoir une description.')); return; }

    // Guard rail: every recipe ingredient must be fully accounted for across
    // all steps — the % shares must add up to exactly 100, no more, no less.
    const totals = {};
    for (const ing of ingredients) totals[ing.materialId] = 0;
    for (const s of steps) for (const it of s.items) {
      if (totals[it.materialId] == null) continue;
      totals[it.materialId] += Number(it.pct) || 0;
    }
    const problems = ingredients
      .map((ing) => ({ ing, total: Math.round((totals[ing.materialId] || 0) * 10) / 10 }))
      .filter(({ total }) => Math.abs(total - 100) > 0.5);
    if (problems.length) {
      const lines = problems.map(({ ing, total }) => {
        const name = store.materialById[ing.materialId]?.name || '—';
        return total <= 0
          ? tr('{name} : manquant (0%)', { name })
          : tr('{name} : {pct}% (doit faire 100%)', { name, pct: total });
      });
      setErr([tr('Attention : la SOP ne couvre pas 100% de chaque ingrédient.'), ...lines].join('\n'));
      return;
    }

    store.setSop(pid, steps.map((s) => ({ id: s.id, text: s.text.trim(), items: s.items })));
    onClose();
  };
```

with:

```jsx
  const save = () => {
    if (steps.some((s) => !s.text.trim())) { setErr(tr('Chaque étape doit avoir une description.')); return; }

    // Guard rail: every recipe ingredient must be fully accounted for across
    // all steps — the % shares must add up to exactly 100, no more, no less.
    // Deliberately skipped for the draft editor: a recipe draft has its own
    // independent lifecycle (may be mid-edit, ingredients still changing),
    // so % coverage doesn't cleanly apply to it — same scoping the old SOP
    // compare sheet used.
    if (!draft) {
      const totals = {};
      for (const ing of ingredients) totals[ing.materialId] = 0;
      for (const s of steps) for (const it of s.items) {
        if (totals[it.materialId] == null) continue;
        totals[it.materialId] += Number(it.pct) || 0;
      }
      const problems = ingredients
        .map((ing) => ({ ing, total: Math.round((totals[ing.materialId] || 0) * 10) / 10 }))
        .filter(({ total }) => Math.abs(total - 100) > 0.5);
      if (problems.length) {
        const lines = problems.map(({ ing, total }) => {
          const name = store.materialById[ing.materialId]?.name || '—';
          return total <= 0
            ? tr('{name} : manquant (0%)', { name })
            : tr('{name} : {pct}% (doit faire 100%)', { name, pct: total });
        });
        setErr([tr('Attention : la SOP ne couvre pas 100% de chaque ingrédient.'), ...lines].join('\n'));
        return;
      }
    }

    const clean = steps.map((s) => ({ id: s.id, text: s.text.trim(), items: s.items }));
    if (draft) store.setSopDraftSteps(pid, clean);
    else store.setSop(pid, clean);
    onClose();
  };
```

Replace the title and save button (current lines 592-593 and 617-620):

```jsx
    <ProdSheet title={tr('Procédure (SOP)')} c={c} onClose={onClose}>
```

with:

```jsx
    <ProdSheet title={draft ? tr('Procédure (SOP) — Test') : tr('Procédure (SOP)')} c={c} onClose={onClose}>
```

and:

```jsx
      <button onClick={save} style={{
        width: '100%', padding: '14px', borderRadius: 999, cursor: 'pointer', border: 'none',
        background: c.accent, color: c.inkContrast, fontFamily: prodSans, fontSize: 15, fontWeight: 700,
      }}>{tr('Enregistrer')}</button>
```

with:

```jsx
      <button onClick={save} style={{
        width: '100%', padding: '14px', borderRadius: 999, cursor: 'pointer', border: 'none',
        background: draft ? c.testAccent : c.accent, color: c.inkContrast, fontFamily: prodSans, fontSize: 15, fontWeight: 700,
      }}>{tr('Enregistrer')}</button>
```

- [ ] **Step 5: Manual verification — draft mode has no entry point yet, confirm no regressions**

1. Start the server and open `LumaBonga.html` (see Global Constraints).
2. Seed a product with both a base and a draft SOP+recipe, so both modes have real data to render:

```js
const cur = JSON.parse(localStorage.getItem('lumabonga:v1') || '{}');
cur.products = [{ id: 'p1', name: 'Test Balm', hue: 14, unitPrice: 1000, status: 'test' }];
cur.materials = [{ id: 'm1', name: 'Beeswax', unit: 'g', hue: 40 }, { id: 'm2', name: 'Shea butter', unit: 'g', hue: 55 }];
cur.recipes = { p1: { ingredients: [{ id: 'i1', materialId: 'm1', qty: 10 }], labor: [] } };
cur.recipeDrafts = { p1: { ingredients: [{ id: 'i1', materialId: 'm1', qty: 12 }, { id: 'i2', materialId: 'm2', qty: 5 }], labor: [] } };
cur.sops = { p1: { steps: [{ id: 's1', text: 'Melt the wax.', items: [{ materialId: 'm1', pct: 100 }] }] } };
cur.sopDrafts = { p1: { steps: [{ id: 's1', text: 'Melt the wax and shea butter.', items: [{ materialId: 'm1', pct: 100 }, { materialId: 'm2', pct: 100 }] }] } };
localStorage.setItem('lumabonga:v1', JSON.stringify(cur));
location.reload();
```

3. Navigate to Products, expand "Test Balm". Confirm the existing base "Voir la SOP" / "Éditer la SOP" buttons and the (still-present, not yet removed) old suggestion buttons all still work exactly as before — this task must not change base (non-draft) behavior at all.
4. Since no UI calls `draft={true}` yet, verify the new code path directly from the console instead:

```js
typeof ProdSopViewerSheet === 'function' && typeof ProdSopEditorSheet === 'function'
```

Expected: `true`. Then check for parse/runtime errors: `mcp__Claude_Browser__read_console_messages` with `onlyErrors: true` — expected: no errors (confirms the new JSX is syntactically valid and Babel-transpiles cleanly).
5. Open the base SOP editor ("Éditer la SOP"), confirm the Save button is still the normal accent color (not blue) — proves `draft` correctly defaults to `false` for existing call sites.
6. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 6: Commit**

```bash
git add lumabonga-creative.jsx lumabonga-product.jsx
git commit -m "Add testAccent theme color + draft prop on SOP viewer/editor sheets

Both sheets can now show/edit either the base SOP or the pending SOP
draft, resolving ingredient quantities against the matching recipe
(draft-or-base). No behavior change for existing (non-draft) callers.
Prepares for Task 2's inline Test composition section."
```

---

### Task 2: New "Test composition" section on the product card

**Files:**
- Modify: `lumabonga-product.jsx` (export `ProdDraftRow` to `window`)
- Modify: `lumabonga-creative.jsx` (new state + new section, added alongside the still-present old suggestion buttons)

**Interfaces:**
- Consumes: `c.testAccent`, `ProdSopViewerSheet`/`ProdSopEditorSheet` with `draft` (Task 1); existing `store.draftFor`, `store.sopDraftFor`, `store.startDraft`, `store.startSopDraft`, `store.recipeFor`, `store.materialById`; existing `ProdDraftRow`, `ProdAddMaterialSheet` (with its existing `draft` prop).
- Produces (consumed by Task 3 and Task 4): the "Test composition" section itself; new state `sopDraftView`, `sopDraftEdit`, `addTestFor` in `CreaProducts`.

- [ ] **Step 1: Export `ProdDraftRow` to `window`**

In `lumabonga-product.jsx`, find the export line (current line 1041):

```jsx
Object.assign(window, { CreaProductDetail, ProdAddMaterialSheet, ProdCostChart, ProdSopEditorSheet, ProdSopViewerSheet, ProdFormulaCompareSheet, ProdSopCompareSheet });
```

Replace with:

```jsx
Object.assign(window, { CreaProductDetail, ProdAddMaterialSheet, ProdCostChart, ProdSopEditorSheet, ProdSopViewerSheet, ProdFormulaCompareSheet, ProdSopCompareSheet, ProdDraftRow });
```

- [ ] **Step 2: Add new state to `CreaProducts`**

In `lumabonga-creative.jsx`, find (current lines 785-788):

```jsx
  const [sopView, setSopView] = React.useState(null);  // product whose SOP is being viewed
  const [sopEdit, setSopEdit] = React.useState(null);  // product whose SOP is being edited
  const [compareFor, setCompareFor] = React.useState(null);  // product whose formula suggestion is open
  const [sopCompareFor, setSopCompareFor] = React.useState(null);  // product whose SOP suggestion is open
```

Replace with:

```jsx
  const [sopView, setSopView] = React.useState(null);  // product whose SOP is being viewed
  const [sopEdit, setSopEdit] = React.useState(null);  // product whose SOP is being edited
  const [compareFor, setCompareFor] = React.useState(null);  // product whose formula suggestion is open
  const [sopCompareFor, setSopCompareFor] = React.useState(null);  // product whose SOP suggestion is open
  const [sopDraftView, setSopDraftView] = React.useState(null);  // product whose TEST SOP is being viewed
  const [sopDraftEdit, setSopDraftEdit] = React.useState(null);  // product whose TEST SOP is being edited
  const [addTestFor, setAddTestFor] = React.useState(null);  // product id currently adding a component to its TEST composition
```

(`compareFor`/`sopCompareFor` are removed in Task 4, once the old buttons that use them are gone — left alone here so the app keeps working after this task.)

- [ ] **Step 3: Add the "Test composition" section**

In `lumabonga-creative.jsx`, find the end of the base SOP block, immediately followed by the Delete button (current lines 1186-1209):

```jsx
              {/* SOP — production procedure */}
              {(() => {
                if (!hasSop && readonly) return null;
                const btn = (label, onClick, solid) => (
                  <button onClick={onClick} style={{
                    flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer',
                    border: solid ? 'none' : `1px solid ${c.border}`,
                    background: solid ? c.panel2 : 'transparent',
                    color: solid ? c.text : c.muted,
                    fontFamily: creaSans, fontSize: 12.5, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}><Icon.list width={15} height={15} /> {label}</button>
                );
                return (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {hasSop && btn(tr('Voir la SOP'), () => setSopView(p), true)}
                    {!readonly && btn(hasSop ? tr('Éditer la SOP') : tr('Créer la SOP'), () => setSopEdit(p), false)}
                  </div>
                );
              })()}

              {/* Delete — edit mode only, guarded by a typed confirmation
                  (see the DELETE modal below) so it can't happen by accident. */}
```

Replace with (inserting the new section between the two, everything else identical):

```jsx
              {/* SOP — production procedure */}
              {(() => {
                if (!hasSop && readonly) return null;
                const btn = (label, onClick, solid) => (
                  <button onClick={onClick} style={{
                    flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer',
                    border: solid ? 'none' : `1px solid ${c.border}`,
                    background: solid ? c.panel2 : 'transparent',
                    color: solid ? c.text : c.muted,
                    fontFamily: creaSans, fontSize: 12.5, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}><Icon.list width={15} height={15} /> {label}</button>
                );
                return (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {hasSop && btn(tr('Voir la SOP'), () => setSopView(p), true)}
                    {!readonly && btn(hasSop ? tr('Éditer la SOP') : tr('Créer la SOP'), () => setSopEdit(p), false)}
                  </div>
                );
              })()}

              {/* Test composition — editable draft, distinct blue tint.
                  Auto-created when status flips to Test (Task 3's status-chip
                  handler); "Valider" below promotes it to base and
                  immediately starts a fresh copy so testing continues
                  without an extra click. */}
              {!readonly && productStatus(p) === 'test' && (() => {
                const tc = c.testAccent;
                const draft = store.draftFor(p.id);
                const sopDraft = store.sopDraftFor(p.id);
                const hasSopDraft = !!(sopDraft && sopDraft.steps && sopDraft.steps.length > 0);
                const base = store.recipeFor(p.id);
                return (
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: `${tc}0e`, border: `1px solid ${tc}33` }}>
                    <div style={{ fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: tc, fontWeight: 700, fontFamily: creaSans, marginBottom: 4 }}>{tr('Test composition')}</div>
                    {!draft ? (
                      <React.Fragment>
                        <div style={{ fontFamily: creaSans, fontSize: 12, color: c.mutedSoft, padding: '4px 0 8px', lineHeight: 1.5 }}>
                          {tr('Aucun test en cours pour ce produit.')}
                        </div>
                        <button onClick={() => { store.startDraft(p.id); store.startSopDraft(p.id); }} style={{
                          width: '100%', padding: '9px', borderRadius: 10, cursor: 'pointer', border: 'none',
                          background: tc, color: '#ffffff', fontFamily: creaSans, fontSize: 12, fontWeight: 700,
                        }}>{tr('Démarrer le test')}</button>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        {draft.ingredients.length === 0 && (
                          <div style={{ fontFamily: creaSans, fontSize: 12, color: c.muted, padding: '6px 0' }}>{tr('Aucun composant')}</div>
                        )}
                        {draft.ingredients.map((ing) => {
                          const mat = store.materialById[ing.materialId];
                          const baseIng = base.ingredients.find((i) => i.materialId === ing.materialId);
                          const diff = !baseIng ? 'added' : (ing.qty !== baseIng.qty ? 'changed' : 'same');
                          return <ProdDraftRow key={ing.id} pid={p.id} ing={ing} mat={mat} diff={diff} store={store} c={c} />;
                        })}
                        <button onClick={() => setAddTestFor(p.id)} style={{
                          width: '100%', marginTop: 8, padding: '9px', borderRadius: 10, cursor: 'pointer',
                          border: `1px dashed ${tc}55`, background: 'transparent', color: tc,
                          fontFamily: creaSans, fontSize: 12, fontWeight: 600,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}><Icon.plus width={15} height={15} /> {tr('Ajouter un composant')}</button>

                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          {hasSopDraft && (
                            <button onClick={() => setSopDraftView(p)} style={{
                              flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer', border: 'none',
                              background: `${tc}22`, color: tc,
                              fontFamily: creaSans, fontSize: 12.5, fontWeight: 600,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}><Icon.list width={15} height={15} /> {tr('Voir la SOP (test)')}</button>
                          )}
                          <button onClick={() => setSopDraftEdit(p)} style={{
                            flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer',
                            border: `1px solid ${tc}55`, background: 'transparent', color: tc,
                            fontFamily: creaSans, fontSize: 12.5, fontWeight: 600,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}><Icon.list width={15} height={15} /> {tr(hasSopDraft ? 'Éditer la SOP (test)' : 'Créer la SOP (test)')}</button>
                        </div>

                        <button onClick={() => {
                          store.approveDraftAsBase(p.id);
                          store.approveSopDraftAsBase(p.id);
                          store.startDraft(p.id);
                          store.startSopDraft(p.id);
                        }} style={{
                          width: '100%', marginTop: 10, padding: '11px', borderRadius: 10, cursor: 'pointer', border: 'none',
                          background: tc, color: '#ffffff', fontFamily: creaSans, fontSize: 13, fontWeight: 700,
                        }}>{tr('Valider comme nouvelle base')}</button>
                      </React.Fragment>
                    )}
                  </div>
                );
              })()}

              {/* Delete — edit mode only, guarded by a typed confirmation
                  (see the DELETE modal below) so it can't happen by accident. */}
```

- [ ] **Step 4: Render the new sheets**

Find (current lines 1240-1245):

```jsx
      {addFor && <ProdAddMaterialSheet store={store} dark={dark} t={t} productId={addFor}
        used={new Set(store.recipeFor(addFor).ingredients.map((i) => i.materialId))} onClose={() => setAddFor(null)} />}
      {sopView && <ProdSopViewerSheet store={store} dark={dark} t={t} product={sopView} onClose={() => setSopView(null)} />}
      {sopEdit && <ProdSopEditorSheet store={store} dark={dark} t={t} product={sopEdit} onClose={() => setSopEdit(null)} />}
      {compareFor && <ProdFormulaCompareSheet store={store} dark={dark} t={t} product={compareFor} onClose={() => setCompareFor(null)} />}
      {sopCompareFor && <ProdSopCompareSheet store={store} dark={dark} t={t} product={sopCompareFor} onClose={() => setSopCompareFor(null)} />}
```

Replace with:

```jsx
      {addFor && <ProdAddMaterialSheet store={store} dark={dark} t={t} productId={addFor}
        used={new Set(store.recipeFor(addFor).ingredients.map((i) => i.materialId))} onClose={() => setAddFor(null)} />}
      {addTestFor && <ProdAddMaterialSheet store={store} dark={dark} t={t} productId={addTestFor} draft
        used={new Set((store.draftFor(addTestFor)?.ingredients || []).map((i) => i.materialId))} onClose={() => setAddTestFor(null)} />}
      {sopView && <ProdSopViewerSheet store={store} dark={dark} t={t} product={sopView} onClose={() => setSopView(null)} />}
      {sopEdit && <ProdSopEditorSheet store={store} dark={dark} t={t} product={sopEdit} onClose={() => setSopEdit(null)} />}
      {sopDraftView && <ProdSopViewerSheet store={store} dark={dark} t={t} product={sopDraftView} draft onClose={() => setSopDraftView(null)} />}
      {sopDraftEdit && <ProdSopEditorSheet store={store} dark={dark} t={t} product={sopDraftEdit} draft onClose={() => setSopDraftEdit(null)} />}
      {compareFor && <ProdFormulaCompareSheet store={store} dark={dark} t={t} product={compareFor} onClose={() => setCompareFor(null)} />}
      {sopCompareFor && <ProdSopCompareSheet store={store} dark={dark} t={t} product={sopCompareFor} onClose={() => setSopCompareFor(null)} />}
```

- [ ] **Step 5: Manual verification — full Test composition flow**

1. Open `LumaBonga.html`, seed the same "Test Balm" product from Task 1's verification (status `'test'`, base + draft recipe and SOP already populated), reload.
2. Navigate to Products, expand "Test Balm". Confirm the new blue-tinted "Test composition" section appears below the base SOP buttons, showing the draft's 2 ingredients (Beeswax, Shea butter) — Shea butter's dot should read as "added" (accent-colored, since it's not in the base recipe) and Beeswax as "changed" (amber, qty differs: 10 base vs 12 draft).
3. Click "Ajouter un composant" in the Test composition section — confirm `ProdAddMaterialSheet` opens (draft mode: the picker should exclude Beeswax and Shea butter, both already used).close it.
4. Edit the Beeswax draft row's quantity via `mcp__Claude_Browser__computer` (click the qty input, change value, click elsewhere to blur) — reload the page, confirm the new value persisted (proves `updateDraftIngredient` is wired correctly through the reused `ProdDraftRow`).
5. Click "Voir la SOP (test)" — confirm `ProdSopViewerSheet` opens in draft mode: title reads "Procédure (SOP) — Test", and the step text is the draft's ("Melt the wax and shea butter."), not the base's ("Melt the wax."). Close it.
6. Click "Éditer la SOP (test)" — confirm `ProdSopEditorSheet` opens in draft mode (title "— Test", Save button blue), edit the step text, save. Reload, reopen "Voir la SOP (test)" — confirm the edit persisted, and confirm `window.__LUMA_INITIAL.sops.p1` (the base) is unaffected.
7. Click "Valider comme nouvelle base" — confirm: `window.__LUMA_INITIAL.recipes.p1` and `.sops.p1` now match what was in the draft; the Test composition section is still populated (not empty) because it immediately restarted a fresh draft; open "Voir la SOP (test)" again — confirm it now shows the SAME content as the (just-updated) base, proving the fresh draft is a copy of the new base.
8. Confirm the OLD suggestion buttons (still present, Task 4 removes them) still work independently and weren't affected by any of this.
9. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 6: Commit**

```bash
git add lumabonga-creative.jsx lumabonga-product.jsx
git commit -m "Add inline Test composition section to the product card

Shows the pending recipe draft (editable, blue-tinted, diff-dotted
against base) plus its own SOP view/edit buttons (draft-mode sheets
from the previous commit) and a Valider button that promotes both
drafts to base and immediately restarts fresh ones. Coexists with the
old suggestion buttons for now — Task 4 removes those."
```

---

### Task 3: Status-chip hooks — auto-duplicate on Test entry, Ready-gate confirm modal

**Files:**
- Modify: `lumabonga-creative.jsx` (status chip onClick; new `CreaFinalizeVersionConfirm` component + render wiring)

**Interfaces:**
- Consumes: `store.startDraft`, `store.startSopDraft`, `store.draftFor`, `store.sopDraftFor`, `store.approveDraftAsBase`, `store.approveSopDraftAsBase`, `store.discardDraft`, `store.discardSopDraft`, `store.updateProduct` (all pre-existing).
- Produces: `CreaFinalizeVersionConfirm({ store, c, product, onClose })`; new state `finalizeFor` in `CreaProducts`.

- [ ] **Step 1: Add `finalizeFor` state**

In `lumabonga-creative.jsx`, add to the same state block Task 2 extended (right after the `addTestFor` line added in Task 2 Step 2):

```jsx
  const [finalizeFor, setFinalizeFor] = React.useState(null);  // product pending the Ready-vs-Test finalize choice
```

- [ ] **Step 2: Wire the status chips**

Find the status chip block (current lines 995-1019, unchanged by Tasks 1-2):

```jsx
              {!readonly && expanded && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {[
                    { id: 'ready', label: 'Ready', color: c.pos || c.accent },
                    { id: 'test', label: 'Test', color: c.amber },
                  ].map((st) => {
                    const active = productStatus(p) === st.id;
                    return (
                      <button key={st.id} disabled={!edit}
                        onClick={() => store.updateProduct(p.id, { status: st.id })}
                        style={{
                          padding: '4px 10px', borderRadius: 999, cursor: edit ? 'pointer' : 'default',
                          border: `1px solid ${active ? st.color : c.border}`,
                          background: active ? `${st.color}22` : 'transparent',
                          color: active ? st.color : c.mutedSoft,
                          fontFamily: creaSans, fontSize: 11, fontWeight: 700,
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: active ? st.color : c.border, flexShrink: 0 }} />
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              )}
```

Replace the `onClick` line only:

```jsx
                        onClick={() => store.updateProduct(p.id, { status: st.id })}
```

with:

```jsx
                        onClick={() => {
                          if (st.id === 'test') {
                            store.updateProduct(p.id, { status: 'test' });
                            store.startDraft(p.id);
                            store.startSopDraft(p.id);
                            return;
                          }
                          // st.id === 'ready'
                          if (productStatus(p) === 'test' && (store.draftFor(p.id) || store.sopDraftFor(p.id))) {
                            setFinalizeFor(p);
                            return;
                          }
                          store.updateProduct(p.id, { status: 'ready' });
                        }}
```

- [ ] **Step 3: Add the `CreaFinalizeVersionConfirm` component**

In `lumabonga-creative.jsx`, insert right after the closing `}` of `CreaDeleteProductConfirm` (immediately before the `// ── To-do board ──` comment block):

```jsx

// ── Ready-transition confirmation — switching a Test-status product to
// Ready forces an explicit choice between the base and the pending test
// version; whichever isn't picked is deleted. Modeled on
// CreaDeleteProductConfirm's overlay/card chrome.
function CreaFinalizeVersionConfirm({ store, c, product, onClose }) {
  const keepTest = () => {
    store.approveDraftAsBase(product.id);
    store.approveSopDraftAsBase(product.id);
    store.updateProduct(product.id, { status: 'ready' });
    onClose();
  };
  const keepBase = () => {
    store.discardDraft(product.id);
    store.discardSopDraft(product.id);
    store.updateProduct(product.id, { status: 'ready' });
    onClose();
  };
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 360, background: c.bg2, border: `1px solid ${c.border}`,
        borderRadius: 20, padding: 22, display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 36, height: 36, borderRadius: 999, background: `${c.testAccent}1c`, color: c.testAccent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><Icon.list width={17} height={17} /></span>
          <div style={{ fontFamily: creaDisplay, fontStyle: 'normal', fontSize: 19, color: c.text }}>{tr('Choisir la version définitive')}</div>
        </div>
        <div style={{ fontFamily: creaSans, fontSize: 13, color: c.muted, lineHeight: 1.5 }}>
          {tr('Le passage en Ready nécessite de choisir une version définitive. La version non choisie sera supprimée définitivement. Cette action est irréversible.')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          <button onClick={keepTest} style={{
            width: '100%', padding: '13px', borderRadius: 999, cursor: 'pointer', border: 'none',
            background: c.testAccent, color: '#ffffff', fontFamily: creaSans, fontSize: 14, fontWeight: 700,
          }}>{tr('Garder la version de test')}</button>
          <button onClick={keepBase} style={{
            width: '100%', padding: '13px', borderRadius: 999, cursor: 'pointer',
            background: 'transparent', color: c.text, border: `1px solid ${c.border}`,
            fontFamily: creaSans, fontSize: 14, fontWeight: 600,
          }}>{tr('Garder la version de base')}</button>
          <button onClick={onClose} style={{
            width: '100%', padding: '11px', borderRadius: 999, cursor: 'pointer',
            background: 'transparent', color: c.muted, border: 'none',
            fontFamily: creaSans, fontSize: 13, fontWeight: 600,
          }}>{tr('Annuler')}</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Render the modal**

Find (current lines 1246-1248, right after the two compare-sheet render lines):

```jsx
      {deleteTarget && (
        <CreaDeleteProductConfirm store={store} c={c} product={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
```

Replace with:

```jsx
      {deleteTarget && (
        <CreaDeleteProductConfirm store={store} c={c} product={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
      {finalizeFor && (
        <CreaFinalizeVersionConfirm store={store} c={c} product={finalizeFor} onClose={() => setFinalizeFor(null)} />
      )}
```

- [ ] **Step 5: Manual verification**

1. Open `LumaBonga.html`, seed a fresh product with NO drafts yet, status `'ready'`:

```js
const cur = JSON.parse(localStorage.getItem('lumabonga:v1') || '{}');
cur.products = [{ id: 'p2', name: 'Status Test', hue: 20, unitPrice: 500, status: 'ready' }];
cur.materials = [{ id: 'm1', name: 'Beeswax', unit: 'g', hue: 40 }];
cur.recipes = { p2: { ingredients: [{ id: 'i1', materialId: 'm1', qty: 10 }], labor: [] } };
cur.sops = { p2: { steps: [{ id: 's1', text: 'Melt the wax.', items: [{ materialId: 'm1', pct: 100 }] }] } };
localStorage.setItem('lumabonga:v1', JSON.stringify(cur));
location.reload();
```

2. Navigate to Products, expand "Status Test", enable edit mode, click the "Test" status chip. Confirm: status flips to Test, the new "Test composition" section (Task 2) immediately shows a populated draft (1 ingredient, Beeswax) — proving `startDraft`/`startSopDraft` fired automatically, no "Démarrer le test" fallback needed.
3. Click the "Ready" chip. Confirm: `CreaFinalizeVersionConfirm` opens (a draft exists) instead of the status changing immediately — verify status is still `'test'` at this point (`window.__LUMA_INITIAL.products` — actually check live React state via the visible chip, since `__LUMA_INITIAL` only reflects load time; visually confirm the Test chip is still the active one).
4. Click "Annuler" — confirm the modal closes, status is still Test, draft untouched.
5. Click "Ready" again, this time click "Garder la version de base" — confirm: status becomes Ready, `store.draftFor('p2')`/`store.sopDraftFor('p2')` are now null (check via reloading and inspecting `window.__LUMA_INITIAL.recipeDrafts.p2` / `.sopDrafts.p2` — both should be absent), and the base recipe/SOP are unchanged from step 1's seed.
6. Repeat from a fresh seed (re-run the step-1 script, reload), flip to Test (auto-drafts), edit the draft ingredient's quantity to something different from base (via the Test composition section), click "Ready" → "Garder la version de test" — confirm status becomes Ready AND the base recipe now shows the edited quantity (proving `approveDraftAsBase` ran), and the draft is cleared.
7. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 6: Commit**

```bash
git add lumabonga-creative.jsx
git commit -m "Gate Test-to-Ready transition behind a base-vs-test choice

Entering Test now auto-copies the base recipe+SOP into a draft.
Leaving Test (-> Ready) now requires an explicit choice via the new
CreaFinalizeVersionConfirm modal when a draft is pending — the
unchosen version is deleted. Fixes a prior gap where flipping to
Ready via approveDraftAsReady never touched a pending SOP draft."
```

---

### Task 4: Remove the old suggestion buttons and compare-sheet components

**Files:**
- Modify: `lumabonga-creative.jsx` (remove 2 buttons, `compareFor`/`sopCompareFor` state, their render lines)
- Modify: `lumabonga-product.jsx` (remove `ProdFormulaCompareSheet`, `ProdSopCompareSheet`, update window export; remove `approveDraftAsReady` from the store if confirmed unused)
- Modify: `lumabonga-data.jsx` (only if `approveDraftAsReady` is confirmed unused elsewhere)

**Interfaces:** none new — pure removal.

- [ ] **Step 1: Remove the two suggestion buttons**

In `lumabonga-creative.jsx`, find (current lines 1048-1074):

```jsx
              {/* Suggest a correction — only while Test; base recipe stays
                  locked, changes go through a compare-and-approve draft. */}
              {!readonly && productStatus(p) === 'test' && (
                <button onClick={() => setCompareFor(p)} style={{
                  width: '100%', marginTop: 8, padding: '9px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${c.amber}55`, background: `${c.amber}14`, color: c.amber,
                  fontFamily: creaSans, fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <Icon.list width={14} height={14} />
                  {store.draftFor(p.id) ? tr('Revoir la suggestion') : tr('Suggérer une correction')}
                </button>
              )}

              {/* SOP suggestion — independent lifecycle from the recipe
                  draft above: approving one never touches the other. */}
              {!readonly && productStatus(p) === 'test' && (
                <button onClick={() => setSopCompareFor(p)} style={{
                  width: '100%', marginTop: 8, padding: '9px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${c.amber}55`, background: `${c.amber}14`, color: c.amber,
                  fontFamily: creaSans, fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <Icon.list width={14} height={14} />
                  {store.sopDraftFor(p.id) ? tr('Revoir la suggestion (SOP)') : tr('Suggérer une correction (SOP)')}
                </button>
              )}

```

Delete this whole block (both buttons + surrounding blank line), leaving whatever comes immediately before (the SOP quick-access / name row) flowing directly into the Comment block that follows.

- [ ] **Step 2: Remove `compareFor`/`sopCompareFor` state and their sheet renders**

In `lumabonga-creative.jsx`, find:

```jsx
  const [compareFor, setCompareFor] = React.useState(null);  // product whose formula suggestion is open
  const [sopCompareFor, setSopCompareFor] = React.useState(null);  // product whose SOP suggestion is open
```

Delete both lines.

Find:

```jsx
      {compareFor && <ProdFormulaCompareSheet store={store} dark={dark} t={t} product={compareFor} onClose={() => setCompareFor(null)} />}
      {sopCompareFor && <ProdSopCompareSheet store={store} dark={dark} t={t} product={sopCompareFor} onClose={() => setSopCompareFor(null)} />}
```

Delete both lines.

- [ ] **Step 3: Delete `ProdFormulaCompareSheet` and `ProdSopCompareSheet`, update the window export**

In `lumabonga-product.jsx`, delete the entire `ProdFormulaCompareSheet` function (from its leading comment `// ── Formula suggestion sheet: Tested (base) vs To test (draft)...` through its closing `}`) and the entire `ProdSopCompareSheet` function (from its leading comment `// ── SOP suggestion sheet: Tested (base) vs To test (draft)...` through its closing `}`). Leave `ProdDraftRow` and `ProdSopStepEditor` in place — both are still used (by the new Test composition section and by both SOP sheets, respectively).

Update the window export:

```jsx
Object.assign(window, { CreaProductDetail, ProdAddMaterialSheet, ProdCostChart, ProdSopEditorSheet, ProdSopViewerSheet, ProdFormulaCompareSheet, ProdSopCompareSheet, ProdDraftRow });
```

with:

```jsx
Object.assign(window, { CreaProductDetail, ProdAddMaterialSheet, ProdCostChart, ProdSopEditorSheet, ProdSopViewerSheet, ProdDraftRow });
```

- [ ] **Step 4: Confirm `approveDraftAsReady` is now unused, remove if so**

Run:

```bash
grep -rn "approveDraftAsReady" --include="*.jsx" .
```

Expected: only the definition and its export in `lumabonga-data.jsx` remain (no call sites — the only caller was the just-deleted `ProdFormulaCompareSheet`). If that's what you see, remove it:

In `lumabonga-data.jsx`, find the function (right after `approveDraftAsBase`):

```jsx
  // Draft becomes the new base recipe AND the product is validated as Ready.
  const approveDraftAsReady = (pid) => {
    if (!recipeDrafts[pid]) return;
    approveDraftAsBase(pid);
```

Read a few lines further to see its full body and delete the whole function, then remove it from the store's export object (search `approveDraftAsBase, approveDraftAsReady,` and drop `approveDraftAsReady,`).

If the grep instead shows a call site this plan didn't anticipate, stop and leave the function in place — report the finding instead of guessing.

- [ ] **Step 5: Confirm now-orphaned translation strings, remove if so**

The old suggestion flow introduced these French keys (per `docs/superpowers/plans/2026-07-26-sop-draft-versioning.md` Task 5 and the pre-existing recipe-suggestion flow). For each, check whether any `tr('...')` call site still exists outside the EN/ID dictionaries themselves:

```bash
grep -rn "Suggérer une correction'" --include="*.jsx" . 
grep -rn "Revoir la suggestion'" --include="*.jsx" .
grep -rn "Suggérer une correction (SOP)'" --include="*.jsx" .
grep -rn "Revoir la suggestion (SOP)'" --include="*.jsx" .
grep -rn "Formule testée (actuelle)'" --include="*.jsx" .
grep -rn "Étapes testées (actuelles)'" --include="*.jsx" .
grep -rn "Testée'" --include="*.jsx" .
grep -rn "À tester'" --include="*.jsx" .
grep -rn "Démarrer une suggestion'" --include="*.jsx" .
grep -rn "Approuver comme formule Ready'" --include="*.jsx" .
grep -rn "Approuver comme nouvelle base à tester'" --include="*.jsx" .
grep -rn "Supprimer la suggestion'" --include="*.jsx" .
```

For every key where the only matches left are inside `lumabonga-data.jsx`'s EN/ID dictionary object literals (no `tr(...)` call site elsewhere), delete that key's EN and ID entries. For any key still referenced by a `tr(...)` call (e.g. `'Aucune étape'` might be reused elsewhere — check case by case), leave it in place.

- [ ] **Step 6: Manual verification — full regression pass**

1. Open `LumaBonga.html`, seed the same "Test Balm" product (base + draft recipe/SOP, status `'test'`), reload.
2. Navigate to Products, expand "Test Balm". Confirm the old "Suggérer une correction" / "Suggérer une correction (SOP)" buttons are gone.
3. Confirm the Test composition section (Task 2) still renders and works: edit an ingredient, view/edit the test SOP, click "Valider comme nouvelle base" — all exactly as verified in Task 2.
4. Confirm the status-chip flow (Task 3) still works: flip to Ready with a pending draft, confirm the choice modal appears and both choices behave correctly.
5. Check console for errors: `mcp__Claude_Browser__read_console_messages` with `onlyErrors: true` — expected: none (confirms no dangling reference to the deleted components).
6. Run `grep -n "ProdFormulaCompareSheet\|ProdSopCompareSheet" lumabonga-*.jsx` — expected: no matches at all (fully removed, not just unreferenced).
7. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 7: Commit**

```bash
git add lumabonga-creative.jsx lumabonga-product.jsx lumabonga-data.jsx
git commit -m "Remove old suggestion buttons and compare-sheet modals

Superseded by the inline Test composition section (previous commits).
Deletes ProdFormulaCompareSheet, ProdSopCompareSheet, their entry
buttons and state, the now-unused approveDraftAsReady store function,
and orphaned translation dictionary entries."
```

---

### Task 5: i18n — EN + ID translations for the new strings

**Files:**
- Modify: `lumabonga-data.jsx` (EN dictionary)
- Modify: `lumabonga-data.jsx` (ID dictionary)

**Interfaces:** none (pure data addition).

- [ ] **Step 1: Add EN entries**

In `lumabonga-data.jsx`'s EN dictionary object, add:

```jsx
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
```

- [ ] **Step 2: Add ID entries**

In `lumabonga-data.jsx`'s ID dictionary object, add:

```jsx
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
```

- [ ] **Step 3: Manual verification**

1. Open `LumaBonga.html` with a product seeded in Test status with a draft (same seed as Task 2).
2. Switch language to EN (whatever mechanism this canvas exposes for language) and confirm the Test composition section, its SOP buttons, the Validate button, and the Ready-transition confirm modal (trigger it) all show English text — no raw French leaking through.
3. Switch to ID and confirm the Indonesian strings show for the same elements.
4. Check console for any `tr()` missing-key warnings — expected: none.
5. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 4: Commit**

```bash
git add lumabonga-data.jsx
git commit -m "Add EN/ID translations for the Test composition section"
```

---

### Task 6: Deploy, verify against real production data

**Files:** none (verification-only against the live Supabase-backed app, `https://luma-bonga.vercel.app`).

**Interfaces:** none — this task exercises the shipped feature against real data.

- [ ] **Step 1: Push and confirm deploy**

```bash
git push
```

Wait for the Vercel deploy to finish (this repo auto-deploys `main`).

- [ ] **Step 2: Sign in**

Open `https://luma-bonga.vercel.app` in the browser tools. If it shows an access-code screen, ask the user to sign in — do not attempt to enter or guess the code.

- [ ] **Step 3: Find real Test-status products**

Read `window.__LUMA_INITIAL.products` and list every product with `status === 'test'` (normalize `'correction'` to Test too, matching `productStatus`'s existing mapping). For each, note whether `recipeDrafts[pid]` / `sopDrafts[pid]` already exist. Report what's found before touching anything.

- [ ] **Step 4: Read-only verification on real data**

For each real Test-status product found:
1. Expand its card, confirm the Test composition section renders correctly (populated from the existing draft if one exists, or the "Démarrer le test" prompt if not — do NOT click it yet without checking with the user, since it would mutate real production drafts for a product you don't have full context on).
2. If a draft exists, open "Voir la SOP (test)" (read-only) and confirm it renders without error.
3. Do **not** click "Valider comme nouvelle base", and do **not** click the "Ready" status chip if it would open the finalize-choice modal — both mutate/delete real pending data. If verifying these interactively is needed, ask the user first, or do it against a product they confirm is safe to touch (e.g. one with no meaningful pending draft).

- [ ] **Step 5: Report to user**

Summarize: which real products were found in Test status, whether their Test composition sections rendered correctly, and confirm no production data was mutated during verification (unless the user explicitly asked for an interactive check on a specific product).

---

## Self-Review Notes

- **Spec coverage:** every section of `docs/superpowers/specs/2026-08-01-test-composition-section-design.md` maps to a task — remove old entry points → Task 4; new Test composition section → Task 2; SOP sheets' `draft` prop → Task 1; status-chip hooks → Task 3; new confirm modal → Task 3; i18n → Task 5. The spec's "Out of scope" items are simply not built.
- **Deviation from the spec, and why:** the spec described the new blue as "a new fixed hue... not an existing theme token." This plan instead adds it as a proper `testAccent` key inside `creaTheme` (Task 1). Reason found during planning: `prodTheme(dark, accent)` in lumabonga-product.jsx is just `window.creaTheme(dark, accent)` — the two SOP sheets (product.jsx) and the card section (creative.jsx) both need the same blue, and threading a duplicate local hex constant through both files would either duplicate the two hex values or require a separate module-level export. Adding one key to the existing theme function both files already call is strictly simpler and matches how `purple`/`amber`/`rose`/`pos` are already defined — same mechanism, new color.
- **Type/name consistency check:** `sopDraftView`/`sopDraftEdit`/`addTestFor`/`finalizeFor` (Task 2/3 state) are referenced with these exact names in their `onClick` setters and their render lines. `ProdSopViewerSheet`/`ProdSopEditorSheet`'s `draft` prop (Task 1) is passed as JSX shorthand (`draft`, meaning `draft={true}`) at every Task 2/3 call site, and defaults to `false` for the untouched base-SOP call sites (`sopView`/`sopEdit`) — verified no existing call site needed updating. `sopItemQty`'s new `recipe` parameter is threaded through from `ProdSopViewerSheet`'s single call site (Task 1 Step 3) — no other callers exist (confirmed via grep during planning). `c.testAccent` used identically across creative.jsx (Task 2 section, Task 3 modal) and product.jsx (Task 1 sheets) — all derive from the same `creaTheme`/`prodTheme` functions.
- **Ordering rationale:** Tasks 1-3 are purely additive (old buttons/sheets stay functional throughout), so the app is never in a broken intermediate state. Task 4 (removal) comes last, once the replacement is fully proven working — lower risk than a big-bang swap.
