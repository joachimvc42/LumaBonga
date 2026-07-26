# SOP Draft Versioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give SOPs the same base/draft ("Test") versioning recipes already have — a product's current SOP stays untouched while a parallel, editable draft SOP can be iterated on and later approved as the new base, independent of the recipe draft's own lifecycle.

**Architecture:** Mirror the existing `recipeDrafts` pattern (lumabonga-data.jsx) with a new `sopDrafts[pid] = { steps }` state slice and four store functions. A new `ProdSopCompareSheet` (lumabonga-product.jsx) shows base-vs-draft steps side by side, reusing a newly-extracted `ProdSopStepEditor` component (factored out of the existing `ProdSopEditorSheet` so both the single-version editor and the new draft editor render steps identically). Wired into the catalog via a new button in lumabonga-creative.jsx, next to the existing recipe-suggestion button.

**Tech Stack:** React 18 (UMD, no bundler), Babel Standalone (in-browser JSX transpile), plain `window`-global module wiring across `lumabonga-*.jsx` files, Supabase for persistence (via the whole-store `savePersisted` snapshot).

## Global Constraints

- No test framework exists in this repo (no package.json, no jest/vitest/pytest). Every "test" step in this plan is a **manual browser verification**: seed `localStorage['lumabonga:v1']`, drive `LumaBonga.html` (the no-auth design canvas — same app code, demo data) via the `mcp__Claude_Browser__*` tools, and check exact DOM/console/`window.__LUMA_INITIAL` output. This is the same method used successfully throughout this project's prior sessions.
- Recipe drafts (`ProdDraftRow`) commit ingredient-quantity edits on `onBlur`. **Do not repeat that pattern for SOP steps.** A prior session lost 6 edited quantities because a scripted `form_input` call set the DOM value without firing a real blur event, and the commit silently never happened. SOP step edits in this plan commit on every `onChange` directly to the store (no local buffer, no Save button, no blur dependency) — there is no unit-conversion step to defer for, so immediate commit is both simpler and safer here.
- Follow existing code style exactly: 2-space indent, inline styles as JS objects, `tr('French source string')` for every user-facing string with EN/ID entries added to the dictionaries in lumabonga-data.jsx.
- French is the source language baked directly into JSX `tr()` calls — do not add a "French dictionary," only EN and ID translation entries for new strings.

---

### Task 1: Data layer — `sopDrafts` state, persistence, store functions

**Files:**
- Modify: `lumabonga-data.jsx:783` (add `sopDrafts` state, right after the existing `sops` declaration)
- Modify: `lumabonga-data.jsx:809-811` (persistence effect — add `sopDrafts` to both the `savePersisted({...})` call and its dependency array)
- Modify: `lumabonga-data.jsx:1136-1137` (add the four new functions right after `setSop`/`removeSop`)
- Modify: `lumabonga-data.jsx:1203` (store return object — export the new functions)

**Interfaces:**
- Produces (consumed by Task 3):
  - `sopDraftFor(pid: string) → { steps: Array<{id, text, items: Array<{materialId, pct}>}> } | null`
  - `startSopDraft(pid: string) → void` — no-op if a draft already exists for `pid`
  - `setSopDraftSteps(pid: string, steps: Array<{id, text, items}>) → void` — wholesale replace, same shape/semantics as the existing `setSop(pid, steps)`
  - `approveSopDraftAsBase(pid: string) → void` — `sops[pid] = { steps: sopDrafts[pid].steps }`, then clears `sopDrafts[pid]`
  - `discardSopDraft(pid: string) → void` — deletes `sopDrafts[pid]`, `sops[pid]` untouched

- [ ] **Step 1: Add the `sopDrafts` state slice**

In `lumabonga-data.jsx`, right after line 783 (`const [sops, setSops] = React.useState(saved?.sops || {});`), insert:

```jsx
  // SOP drafts — one pending "to test" set of steps per product, compared
  // against the current (tested/base) SOP. Same shape as a SOP. Approving
  // one replaces `sops[pid]`; discarding just clears the draft. Fully
  // independent from `recipeDrafts` — approving/discarding one never
  // touches the other.
  const [sopDrafts, setSopDrafts] = React.useState(saved?.sopDrafts || {});
```

- [ ] **Step 2: Wire `sopDrafts` into persistence**

Replace lines 809-811:

```jsx
  React.useEffect(() => {
    savePersisted({ products, sales, purchases, costs, production, materials, recipes, recipeDrafts, activeUser, settlements, materialAdj, productAdj, sops, todos, team });
  }, [products, sales, purchases, costs, production, materials, recipes, recipeDrafts, activeUser, settlements, materialAdj, productAdj, sops, todos, team]);
```

with:

```jsx
  React.useEffect(() => {
    savePersisted({ products, sales, purchases, costs, production, materials, recipes, recipeDrafts, activeUser, settlements, materialAdj, productAdj, sops, sopDrafts, todos, team });
  }, [products, sales, purchases, costs, production, materials, recipes, recipeDrafts, activeUser, settlements, materialAdj, productAdj, sops, sopDrafts, todos, team]);
```

- [ ] **Step 3: Add the four SOP-draft functions**

Right after line 1137 (`const removeSop = (pid) => setSops((s) => { const n = { ...s }; delete n[pid]; return n; });`), insert:

```jsx

  // ── SOP draft actions ("suggest a correction") ───────────────
  // Independent of recipe drafts: no "approve as Ready" here, because SOPs
  // have no Ready/Test status of their own — only the product does, and
  // that flag is owned entirely by the recipe side (approveDraftAsReady).
  const sopDraftFor = (pid) => sopDrafts[pid] || null;
  const startSopDraft = (pid) => setSopDrafts((ds) => ds[pid] ? ds : {
    ...ds,
    [pid]: { steps: (sops[pid]?.steps || []).map((s) => ({ ...s, items: (s.items || []).map((i) => ({ ...i })) })) },
  });
  const setSopDraftSteps = (pid, steps) => setSopDrafts((ds) => ({ ...ds, [pid]: { steps } }));
  const approveSopDraftAsBase = (pid) => {
    const d = sopDrafts[pid];
    if (!d) return;
    setSops((s) => ({ ...s, [pid]: { steps: d.steps } }));
    setSopDrafts((ds) => { const n = { ...ds }; delete n[pid]; return n; });
  };
  const discardSopDraft = (pid) => setSopDrafts((ds) => { const n = { ...ds }; delete n[pid]; return n; });
```

- [ ] **Step 4: Export the new functions from the store**

Replace line 1203:

```jsx
    sops, setSop, removeSop,
```

with:

```jsx
    sops, setSop, removeSop,
    sopDrafts, sopDraftFor, startSopDraft, setSopDraftSteps, approveSopDraftAsBase, discardSopDraft,
```

- [ ] **Step 5: Manual verification — persistence round-trip**

No UI calls these functions yet, so verify the plumbing (load path + save path) directly:

1. Start the local server: it should already be running via `.claude/launch.json`'s `lumabonga` config (`npx serve -l 3000 .`). If not, start it.
2. Use `mcp__Claude_Browser__preview_start` with `{ name: "lumabonga" }`, then `mcp__Claude_Browser__navigate` to `http://localhost:3000/LumaBonga.html` (the no-auth canvas).
3. Seed a fake draft directly into localStorage and reload, to test the **load** path:

```js
const cur = JSON.parse(localStorage.getItem('lumabonga:v1') || '{}');
cur.sopDrafts = { p_test: { steps: [{ id: 's1', text: 'hello', items: [] }] } };
localStorage.setItem('lumabonga:v1', JSON.stringify(cur));
location.reload();
```

4. After reload (wait ~3s), run:

```js
window.__LUMA_INITIAL.sopDrafts
```

   Expected: `{ p_test: { steps: [{ id: 's1', text: 'hello', items: [] }] } }` — confirms `saved?.sopDrafts` loads correctly.

5. Test the **save** path: trigger any unrelated state change (e.g. click a nav tab, or if a to-do exists, toggle it) so the persistence `useEffect` fires with the new dependency array. Wait 1s, then reload again and re-run `window.__LUMA_INITIAL.sopDrafts` — expected: same value survives, proving `sopDrafts` is now part of every save payload, not silently dropped.
6. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 6: Commit**

```bash
git add lumabonga-data.jsx
git commit -m "Add sopDrafts store state + draft lifecycle functions

Mirrors recipeDrafts: a pending 'to test' set of SOP steps per product,
compared against sops[pid]. Independent of recipeDrafts — only 2 terminal
actions (approve-as-base, discard), no approve-as-Ready, since SOPs have
no status of their own (only the product does, owned by the recipe side)."
```

---

### Task 2: Extract `ProdSopStepEditor`, refactor the base SOP editor to use it

**Files:**
- Modify: `lumabonga-product.jsx:470-608` (`ProdSopEditorSheet`)

**Interfaces:**
- Produces (consumed by Task 3):
  - `ProdSopStepEditor({ step, index, ingredients, materialById, c, canRemove, hasError, onPatchText, onToggleItem, onSetPct, onRemove })` — pure presentational component, one step's full editing UI (header, textarea, ingredient chips with %). No internal state; every mutation goes through the passed callbacks.
- Consumes: nothing new — this task is a pure refactor of existing code, zero behavior change.

- [ ] **Step 1: Add the `ProdSopStepEditor` component**

Insert immediately **before** `function ProdSopEditorSheet` (i.e. right before current line 470):

```jsx
// ── SOP: one step's editor UI (text + optional ingredient/% tags) ───────────
// Pure/presentational — no internal state. Used by both the single-version
// SOP editor (ProdSopEditorSheet, local-state-backed) and the draft compare
// sheet (ProdSopCompareSheet, store-backed): both supply their own callbacks.
function ProdSopStepEditor({ step, index, ingredients, materialById, c, canRemove, hasError, onPatchText, onToggleItem, onSetPct, onRemove }) {
  return (
    <div style={{ padding: 14, borderRadius: 14, background: c.panel, border: `1px solid ${c.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: prodSans, fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: c.accent }}>
          {tr('Étape {n}', { n: index + 1 })}
        </span>
        {canRemove && (
          <button onClick={onRemove} aria-label={tr('Supprimer cette étape')} style={{
            background: 'none', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 2, display: 'flex',
          }}><Icon.close width={15} height={15} /></button>
        )}
      </div>
      <textarea value={step.text} onChange={(e) => onPatchText(e.target.value)}
        placeholder={tr('Décris cette étape…')} rows={2}
        style={{
          width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 48,
          background: c.panel2, color: c.text, border: `1px solid ${(!step.text.trim() && hasError) ? c.rose : c.border}`,
          borderRadius: 10, padding: '10px 12px', fontFamily: prodSans, fontSize: 14, outline: 'none', lineHeight: 1.45,
        }} />
      {ingredients.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase', color: c.mutedSoft, fontWeight: 600, fontFamily: prodSans, marginBottom: 6 }}>
            {tr('Ingrédients concernés (optionnel)')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {ingredients.map((ing) => {
              const mat = materialById[ing.materialId];
              if (!mat) return null;
              const sel = step.items.find((it) => it.materialId === ing.materialId);
              return (
                <span key={ing.materialId} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <button onClick={() => onToggleItem(ing.materialId)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px',
                    borderRadius: sel ? '999px 0 0 999px' : 999,
                    border: `1px solid ${sel ? c.accent : c.border}`,
                    background: sel ? c.accent : c.panel2, color: sel ? c.inkContrast : c.text,
                    cursor: 'pointer', fontFamily: prodSans, fontSize: 12.5, fontWeight: 600,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: `oklch(0.62 0.16 ${mat.hue || 0})`, flexShrink: 0 }} />
                    {mat.name}
                  </button>
                  {sel && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      border: `1px solid ${c.accent}`, borderLeft: 'none', borderRadius: '0 999px 999px 0',
                      background: c.panel2, padding: '4px 9px 4px 6px', gap: 1,
                    }}>
                      <input type="number" inputMode="numeric" min="0" max="100" value={sel.pct}
                        onChange={(e) => onSetPct(ing.materialId, e.target.value)}
                        style={{
                          width: 34, background: 'transparent', border: 'none', outline: 'none',
                          color: c.text, fontFamily: prodMono, fontSize: 12.5, fontWeight: 600, textAlign: 'right',
                        }} />
                      <span style={{ fontFamily: prodMono, fontSize: 11, color: c.muted }}>%</span>
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

```

- [ ] **Step 2: Rewire `ProdSopEditorSheet` to use it**

Inside `ProdSopEditorSheet`, replace the per-step block (currently lines ~524-587, the `{steps.map((s, i) => ( <div key={s.id} style={{ padding: 14, ... }}> ... </div> ))}` block that starts right after the `<div style={{ fontFamily: prodSans, fontSize: 13, color: c.muted, marginTop: -8 }}>{product.name}</div>` line and ends right before the `{err && (` block) with:

```jsx
      {steps.map((s, i) => (
        <ProdSopStepEditor key={s.id} step={s} index={i} ingredients={ingredients} materialById={store.materialById} c={c}
          canRemove={steps.length > 1} hasError={!!err}
          onPatchText={(text) => patchStep(s.id, { text })}
          onToggleItem={(materialId) => toggleItem(s.id, materialId)}
          onSetPct={(materialId, pct) => setPct(s.id, materialId, pct)}
          onRemove={() => removeStep(s.id)} />
      ))}
```

Everything else in `ProdSopEditorSheet` (the `newStep`/`steps` state, `patchStep`/`toggleItem`/`setPct`/`removeStep`, the `save()` validation, the `err` banner, the "Ajouter une étape"/"Enregistrer" buttons) stays exactly as-is — this step only replaces the per-step JSX with a call to the extracted component.

- [ ] **Step 3: Manual verification — base editor unchanged**

1. Open `LumaBonga.html` via the browser tools (same as Task 1).
2. Seed a product with an existing SOP and open its editor:

```js
const cur = JSON.parse(localStorage.getItem('lumabonga:v1') || '{}');
cur.products = [{ id: 'p1', name: 'Test Balm', hue: 14, unitPrice: 1000, status: 'test' }];
cur.recipes = { p1: { ingredients: [{ id: 'i1', materialId: 'm1', qty: 10 }], labor: [] } };
cur.materials = [{ id: 'm1', name: 'Beeswax', unit: 'g', hue: 40 }];
cur.sops = { p1: { steps: [
  { id: 's1', text: 'Melt the wax.', items: [{ materialId: 'm1', pct: 100 }] },
  { id: 's2', text: 'Pour and cool.', items: [] },
] } };
localStorage.setItem('lumabonga:v1', JSON.stringify(cur));
location.reload();
```

3. Navigate to Products, expand "Test Balm", click "SOP" (opens `ProdSopViewerSheet` since a SOP exists) — then find and click whatever opens the editor (the pencil / "Éditer la SOP" action) to reach `ProdSopEditorSheet`.
4. Confirm both steps render with their text and the "Beeswax" chip pre-selected at 100% on step 1.
5. Edit step 1's text, toggle the Beeswax chip off then on again (confirm % input reappears defaulting to 100), click "Ajouter une étape" (confirm a new empty step 3 appears), click "Enregistrer".
6. Reload and re-open the editor — confirm all 3 steps persisted with your edits. This proves the refactor didn't change behavior.
7. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 4: Commit**

```bash
git add lumabonga-product.jsx
git commit -m "Extract ProdSopStepEditor from ProdSopEditorSheet

Pure refactor, no behavior change — isolates one step's editing UI
(text + ingredient/% chips) so the upcoming SOP draft compare sheet
can reuse it instead of duplicating the JSX."
```

---

### Task 3: `ProdSopCompareSheet` — the draft compare/approve UI

**Files:**
- Modify: `lumabonga-product.jsx` (add the new component right after `ProdFormulaCompareSheet`, i.e. after current line 870 / before the `Object.assign(window, ...)` line currently at 872; update that export line)

**Interfaces:**
- Consumes:
  - From Task 1: `store.sops`, `store.sopDraftFor(pid)`, `store.startSopDraft(pid)`, `store.setSopDraftSteps(pid, steps)`, `store.approveSopDraftAsBase(pid)`, `store.discardSopDraft(pid)`, plus existing `store.draftFor(pid)` / `store.recipeFor(pid)` (recipe drafts, already in the store) and `store.materialById`.
  - From Task 2: `ProdSopStepEditor`.
- Produces (consumed by Task 4): `ProdSopCompareSheet({ store, dark, t, product, onClose })` — same call signature as `ProdFormulaCompareSheet`.

- [ ] **Step 1: Add the component**

Insert right after the closing `}` of `ProdFormulaCompareSheet` (current line 870) and before the `Object.assign(window, ...)` line:

```jsx

// ── SOP suggestion sheet: Tested (base) vs To test (draft), side by side.
// Mirrors ProdFormulaCompareSheet but fully independent: no "approve as
// Ready" here (SOPs have no status of their own — only the product does,
// owned by the recipe side). Draft edits commit straight to the store on
// every change (setSopDraftSteps), no local buffer and no Save button —
// see the Global Constraints note on why (recipe drafts' onBlur commit
// once silently dropped edits under scripted input).
function ProdSopCompareSheet({ store, dark, t, product, onClose }) {
  const c = prodTheme(dark, t.accent);
  const pid = product.id;
  const baseSteps = store.sops[pid]?.steps || [];
  const draft = store.sopDraftFor(pid);
  // Ingredient chips in the step editor should reflect whichever recipe is
  // "current" for testing purposes: the recipe draft if one exists (that's
  // almost always why you're drafting new SOP steps), else the base recipe.
  const ingredients = (store.draftFor(pid) || store.recipeFor(pid)).ingredients || [];

  if (!draft) {
    return (
      <ProdSheet title={tr('Suggérer une correction (SOP)')} c={c} onClose={onClose}>
        <div style={{ fontFamily: prodSans, fontSize: 13, color: c.muted, marginTop: -8 }}>{product.name}</div>
        <div style={{ fontSize: 10, letterSpacing: 0.9, textTransform: 'uppercase', color: c.muted, fontWeight: 600, fontFamily: prodSans }}>{tr('Étapes testées (actuelles)')}</div>
        {baseSteps.length === 0 && <div style={{ fontFamily: prodSans, fontSize: 12, color: c.muted }}>{tr('Aucune étape')}</div>}
        {baseSteps.map((s, i) => (
          <div key={s.id} style={{ padding: '8px 0', borderTop: i === 0 ? 'none' : `1px solid ${c.borderSoft}` }}>
            <div style={{ fontFamily: prodSans, fontSize: 11, fontWeight: 700, color: c.mutedSoft, marginBottom: 2 }}>{tr('Étape {n}', { n: i + 1 })}</div>
            <div style={{ fontFamily: prodSans, fontSize: 13, color: c.text, lineHeight: 1.45 }}>{s.text}</div>
          </div>
        ))}
        <div style={{ fontFamily: prodSans, fontSize: 12, color: c.mutedSoft, lineHeight: 1.5 }}>
          {tr('Une suggestion part d’une copie des étapes testées : ajuste, ajoute ou retire des étapes, sans jamais modifier la version actuelle tant qu’elle n’est pas approuvée.')}
        </div>
        <button onClick={() => store.startSopDraft(pid)} style={{
          width: '100%', padding: '14px', borderRadius: 999, cursor: 'pointer', border: 'none',
          background: c.amber, color: '#1a1400', fontFamily: prodSans, fontSize: 15, fontWeight: 700,
        }}>{tr('Démarrer une suggestion')}</button>
      </ProdSheet>
    );
  }

  const newStep = () => ({ id: 'ss_' + Math.random().toString(36).slice(2, 8), text: '', items: [] });
  const patchDraft = (fn) => store.setSopDraftSteps(pid, fn(draft.steps));
  const patchStep = (id, patch) => patchDraft((xs) => xs.map((s) => s.id === id ? { ...s, ...patch } : s));
  const toggleItem = (sid, materialId) => patchDraft((xs) => xs.map((s) => {
    if (s.id !== sid) return s;
    const has = s.items.some((it) => it.materialId === materialId);
    return { ...s, items: has ? s.items.filter((it) => it.materialId !== materialId) : [...s.items, { materialId, pct: 100 }] };
  }));
  const setPct = (sid, materialId, pct) => patchDraft((xs) => xs.map((s) => s.id === sid
    ? { ...s, items: s.items.map((it) => it.materialId === materialId ? { ...it, pct: Math.max(0, Math.min(100, Number(pct) || 0)) } : it) }
    : s));
  const removeStep = (id) => patchDraft((xs) => xs.length > 1 ? xs.filter((s) => s.id !== id) : xs);
  const addStep = () => patchDraft((xs) => [...xs, newStep()]);

  // Union of step ids from both sides, base order first — same technique
  // ProdFormulaCompareSheet uses for materialId (lines ~798-802).
  const ids = [
    ...baseSteps.map((s) => s.id),
    ...draft.steps.map((s) => s.id).filter((id) => !baseSteps.some((s) => s.id === id)),
  ];
  const usedInDraft = new Set(draft.steps.map((s) => s.id));

  return (
    <ProdSheet title={tr('Suggérer une correction (SOP)')} c={c} onClose={onClose}>
      <div style={{ fontFamily: prodSans, fontSize: 13, color: c.muted, marginTop: -8 }}>{product.name}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: 0.7, textTransform: 'uppercase', color: c.mutedSoft, fontWeight: 700, fontFamily: prodSans, marginBottom: 2 }}>{tr('Testée')}</div>
          {ids.map((id) => {
            const s = baseSteps.find((x) => x.id === id);
            const removed = !usedInDraft.has(id);
            if (!s) return <div key={id} style={{ padding: '7px 0', borderTop: `1px solid ${c.borderSoft}` }} />;
            return (
              <div key={id} style={{ padding: '7px 0', borderTop: `1px solid ${c.borderSoft}`, opacity: removed ? 0.5 : 1 }}>
                <div style={{ fontFamily: prodSans, fontSize: 11.5, color: c.text, lineHeight: 1.4, textDecoration: removed ? 'line-through' : 'none' }}>{s.text}</div>
              </div>
            );
          })}
        </div>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: 0.7, textTransform: 'uppercase', color: c.amber, fontWeight: 700, fontFamily: prodSans, marginBottom: 2 }}>{tr('À tester')}</div>
          {ids.map((id, idx) => {
            const s = draft.steps.find((x) => x.id === id);
            const baseS = baseSteps.find((x) => x.id === id);
            if (!s) return <div key={id} style={{ padding: '7px 0', borderTop: `1px solid ${c.borderSoft}` }} />;
            const diff = !baseS ? 'added' : (s.text !== baseS.text || JSON.stringify(s.items) !== JSON.stringify(baseS.items)) ? 'changed' : 'same';
            const dot = diff === 'added' ? c.accent : diff === 'changed' ? c.amber : c.mutedSoft;
            return (
              <div key={id} style={{ position: 'relative', paddingLeft: 10, marginBottom: 6 }}>
                <span style={{ position: 'absolute', left: 0, top: 20, width: 6, height: 6, borderRadius: 999, background: dot }} />
                <ProdSopStepEditor step={s} index={idx} ingredients={ingredients} materialById={store.materialById} c={c}
                  canRemove={draft.steps.length > 1} hasError={false}
                  onPatchText={(text) => patchStep(id, { text })}
                  onToggleItem={(materialId) => toggleItem(id, materialId)}
                  onSetPct={(materialId, pct) => setPct(id, materialId, pct)}
                  onRemove={() => removeStep(id)} />
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={addStep} style={{
        width: '100%', padding: '9px', borderRadius: 10, cursor: 'pointer',
        border: `1px dashed ${c.border}`, background: 'transparent', color: c.muted,
        fontFamily: prodSans, fontSize: 12, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}><Icon.plus width={15} height={15} /> {tr('Ajouter une étape')}</button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        <button onClick={() => { store.approveSopDraftAsBase(pid); onClose(); }} style={{
          width: '100%', padding: '13px', borderRadius: 999, cursor: 'pointer',
          background: 'transparent', color: c.text, border: `1px solid ${c.border}`,
          fontFamily: prodSans, fontSize: 14, fontWeight: 600,
        }}>{tr('Approuver comme nouvelle base à tester')}</button>
        <button onClick={() => { store.discardSopDraft(pid); onClose(); }} style={{
          width: '100%', padding: '11px', borderRadius: 999, cursor: 'pointer',
          background: 'transparent', color: c.rose, border: `1px solid ${c.rose}55`,
          fontFamily: prodSans, fontSize: 13, fontWeight: 600,
        }}>{tr('Supprimer la suggestion')}</button>
      </div>
    </ProdSheet>
  );
}

```

- [ ] **Step 2: Update the window export**

Replace current line 872:

```jsx
Object.assign(window, { CreaProductDetail, ProdAddMaterialSheet, ProdCostChart, ProdSopEditorSheet, ProdSopViewerSheet, ProdFormulaCompareSheet });
```

with:

```jsx
Object.assign(window, { CreaProductDetail, ProdAddMaterialSheet, ProdCostChart, ProdSopEditorSheet, ProdSopViewerSheet, ProdFormulaCompareSheet, ProdSopCompareSheet });
```

- [ ] **Step 3: Manual verification (component exists, no crash)**

This component has no entry point yet (Task 4 wires the button) — just confirm the file still parses/loads cleanly:

1. Open `LumaBonga.html` via the browser tools.
2. Check the console: `mcp__Claude_Browser__read_console_messages` with `onlyErrors: true` — expected: no errors (confirms the new JSX is syntactically valid and Babel-transpiles cleanly).
3. Run in the page: `typeof window.ProdSopCompareSheet` — expected: `"function"`.

- [ ] **Step 4: Commit**

```bash
git add lumabonga-product.jsx
git commit -m "Add ProdSopCompareSheet: SOP draft compare/approve UI

Mirrors ProdFormulaCompareSheet's base-vs-draft layout, reusing
ProdSopStepEditor for the editable draft column. Draft edits commit
straight to the store on every change (no Save button, no onBlur
dependency). Two terminal actions only, no approve-as-Ready — SOPs
have no status of their own to promote."
```

---

### Task 4: Wire the entry point into the product catalog

**Files:**
- Modify: `lumabonga-creative.jsx:787` (add `sopCompareFor` state)
- Modify: `lumabonga-creative.jsx:1046-1060` (add the new button, same visibility rule as the recipe one)
- Modify: `lumabonga-creative.jsx:1230` (render the new sheet)

**Interfaces:**
- Consumes: `ProdSopCompareSheet` (Task 3), `store.sopDraftFor` (Task 1).

- [ ] **Step 1: Add state**

Right after line 787 (`const [compareFor, setCompareFor] = React.useState(null);  // product whose formula suggestion is open`), insert:

```jsx
  const [sopCompareFor, setSopCompareFor] = React.useState(null);  // product whose SOP suggestion is open
```

- [ ] **Step 2: Add the button**

Right after the existing recipe-suggestion button's closing `)}` (current lines 1050-1060), insert:

```jsx
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

- [ ] **Step 3: Render the sheet**

Right after current line 1230 (`{compareFor && <ProdFormulaCompareSheet store={store} dark={dark} t={t} product={compareFor} onClose={() => setCompareFor(null)} />}`), insert:

```jsx
      {sopCompareFor && <ProdSopCompareSheet store={store} dark={dark} t={t} product={sopCompareFor} onClose={() => setSopCompareFor(null)} />}
```

- [ ] **Step 4: Manual verification — full flow**

1. Open `LumaBonga.html`, seed the same `Test Balm` product from Task 2's verification (status `'test'`, one recipe ingredient, one existing SOP with 2 steps), reload.
2. Navigate to Products, expand "Test Balm". Confirm **two** buttons now appear stacked: the existing recipe one ("Suggérer une correction") and the new one ("Suggérer une correction (SOP)") — confirm they open different sheets and don't interfere with each other.
3. Click the SOP button → confirm the no-draft view shows the 2 existing steps read-only + "Démarrer une suggestion" button.
4. Click "Démarrer une suggestion" → confirm it flips to the 2-column view, both columns showing the same 2 steps (draft is a fresh copy of base).
5. In the "À tester" column, edit step 1's text via `mcp__Claude_Browser__computer` (click into the textarea, type an addition) — confirm the dot next to it turns amber (changed) after the edit registers, and the "Testée" column's step 1 stays unchanged.
6. Click "Ajouter une étape" in the draft column — confirm a new empty step appears with an accent-colored dot (added) and no corresponding spacer needed on the left has a blank row (verify by checking the left column got one more blank/empty spacer row at that position).
7. Close the sheet (X), reopen it (button should now read "Revoir la suggestion (SOP)") — confirm your edits persisted (proves `setSopDraftSteps` commits immediately, no data lost by closing).
8. Reload the whole page — reopen the sheet — confirm edits still there (proves the Supabase/localStorage round-trip works for `sopDrafts` end-to-end through real UI, not just the synthetic check from Task 1).
9. Click "Approuver comme nouvelle base à tester" — confirm the sheet closes, and reopening it shows the no-draft view again with your edited steps now listed as the "current" ones (proves `sops[pid]` was replaced and the draft cleared).
10. Repeat steps 3-4, make an edit, then click "Supprimer la suggestion" instead — confirm the draft is discarded and the base SOP is unchanged from before that edit.
11. Confirm throughout that the **recipe** draft/base state for "Test Balm" was never touched by any of this (open the recipe suggestion sheet at any point and confirm it's independent).
12. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 5: Commit**

```bash
git add lumabonga-creative.jsx
git commit -m "Wire SOP draft suggestion button into the product catalog

New button sits next to the existing recipe-suggestion button, same
Test-only visibility rule. Independent state (sopCompareFor) and
independent store calls — confirmed the two draft lifecycles (recipe,
SOP) never cross-touch each other."
```

---

### Task 5: i18n — EN + ID translations for the new strings

**Files:**
- Modify: `lumabonga-data.jsx:173` (EN dictionary — insert after the existing `'Supprimer la suggestion': 'Discard suggestion',` line)
- Modify: `lumabonga-data.jsx:333` (ID dictionary — insert after the existing `'Supprimer la suggestion': 'Hapus saran',` line)

**Interfaces:** none (pure data addition, no new functions).

- [ ] **Step 1: Add EN entries**

Right after current line 173 (`'Supprimer la suggestion': 'Discard suggestion',`), insert:

```jsx
  'Suggérer une correction (SOP)': 'Suggest a correction (SOP)',
  'Revoir la suggestion (SOP)': 'Review suggestion (SOP)',
  'Étapes testées (actuelles)': 'Tested steps (current)',
  'Aucune étape': 'No steps',
  'Une suggestion part d’une copie des étapes testées : ajuste, ajoute ou retire des étapes, sans jamais modifier la version actuelle tant qu’elle n’est pas approuvée.':
    'A suggestion starts as a copy of the tested steps: adjust, add or remove steps, without ever touching the current version until it’s approved.',
```

- [ ] **Step 2: Add ID entries**

Right after current line 333 (`'Supprimer la suggestion': 'Hapus saran',`), insert:

```jsx
  'Suggérer une correction (SOP)': 'Sarankan koreksi (SOP)',
  'Revoir la suggestion (SOP)': 'Tinjau saran (SOP)',
  'Étapes testées (actuelles)': 'Langkah teruji (saat ini)',
  'Aucune étape': 'Belum ada langkah',
  'Une suggestion part d’une copie des étapes testées : ajuste, ajoute ou retire des étapes, sans jamais modifier la version actuelle tant qu’elle n’est pas approuvée.':
    'Saran dimulai dari salinan langkah teruji: sesuaikan, tambah, atau hapus langkah, tanpa pernah mengubah versi saat ini sampai disetujui.',
```

- [ ] **Step 3: Manual verification**

1. Open `LumaBonga.html` with the same seeded "Test Balm" product (status `'test'`, with a `sopDrafts` entry so the "Revoir la suggestion (SOP)" label path is also exercised).
2. Switch language to EN (public-role language toggle, or whatever mechanism this canvas exposes for language — check `LangToggle`/`set('lang', 'en')`) and confirm the SOP button and sheet show the English strings above (no raw French leaking through).
3. Switch to ID and confirm the Indonesian strings show.
4. Check console for any `tr()` missing-key warnings — expected: none.
5. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 4: Commit**

```bash
git add lumabonga-data.jsx
git commit -m "Add EN/ID translations for the SOP draft suggestion flow"
```

---

### Task 6: Deploy, then draft the real Lip Balm SOP

**Files:** none (data-only task against the live Supabase-backed app, `https://luma-bonga.vercel.app`).

**Interfaces:** none — this task exercises the shipped feature against real production data.

- [ ] **Step 1: Push and confirm deploy**

```bash
git push
```

Wait for the Vercel deploy to finish (this repo auto-deploys `main` — confirm via the same method used in prior sessions, e.g. checking the deployed URL loads the new code).

- [ ] **Step 2: Sign in**

Open `https://luma-bonga.vercel.app` in the Chrome MCP tab. If it shows the access-code screen, ask the user to sign in (same as the prior session's Lip Balm recipe work) — do not attempt to enter or guess the code.

- [ ] **Step 3: Confirm current state matches expectations**

Read `window.__LUMA_INITIAL` and confirm, before making any changes:
- `recipes.p_lip` = the **original** Lip Balm formula (White beeswax 22, Castor oil 19, Cocoa butter 14, Jojoba oil 14, Apricot oil 9, Coconut oil 8, Shea butter 8, Candelilla wax 3, Carnauba wax 2, Vitamin E 0.5, Vanilla absolute 5 gouttes) — untouched, per the prior session.
- `recipeDrafts.p_lip` = the new 13-line formula (same as before, now with Lanoline anhydre 8g and Maizena/arrow-root 2g added, several quantities revised) — still pending, not approved.
- `sops.p_lip` = the existing 6-step base SOP (melt waxes+cocoa+shea → add castor+coconut → add jojoba+apricot → add vitamin E+vanilla → pour/cool → tips).

If any of this doesn't match, stop and report — don't proceed on a different starting state without checking with the user first.

- [ ] **Step 4: Start and edit the SOP draft**

Via the UI (Products → expand Lip Balm → "Suggérer une correction (SOP)" → "Démarrer une suggestion"), edit the draft's 6 steps to reflect the new (draft) recipe:

1. Step 1 ("melt the waxes"): update text to mention the new quantities and fold in Lanoline anhydre (it melts alongside the waxes/butters). Tag the step's ingredients: keep White beeswax, Candelilla wax, Carnauba wax, Cocoa butter, Shea butter at 100%, add Lanoline anhydre at 100%.
2. Step 2 ("add castor + coconut oil"): update the quantities mentioned in the text (Castor 17g, Coconut 5g). Ingredient tags unchanged (both still 100% here).
3. Step 3 ("add jojoba + apricot"): update Apricot to 8g in the text. Ingredient tags unchanged.
4. New step (insert before the vitamin E/vanilla step): "Once below ~50°C, sift in the Maizena (arrow-root) while stirring to avoid clumps." Tag Maizena at 100%.
5. Step 4 ("vitamin E + vanilla"): update the vanilla dose mentioned in the text to 8 gouttes (up from 5) — call out that this is a stronger scent than the current version, matching the note already given to the user when the recipe draft was created.
6. Steps 5-6 (pour/cool, tips): leave as-is unless the new formula's behavior is expected to change pouring/cooling — no evidence it does, so no edit needed.
- [ ] **Step 5: Verify, leave pending**

Reload the page, reopen the SOP suggestion sheet, confirm all edits persisted and the base SOP (visible once you discard, or by checking `window.__LUMA_INITIAL.sops.p_lip` still shows the original 6 steps) is untouched. **Do not click "Approuver comme nouvelle base à tester."** The user asked for this to be visible as a pending test version, not validated.

- [ ] **Step 6: Report to user**

Summarize what's now in place: recipe draft (from prior session) + SOP draft (this task) both pending for Lip Balm, base recipe and base SOP both untouched, nothing approved.

---

## Self-Review Notes

- **Spec coverage:** every section of `docs/superpowers/specs/2026-07-26-sop-draft-versioning-design.md` maps to a task — data model → Task 1, independence decision → Task 1 (function shape) + Task 3 (only 2 buttons), UI → Tasks 2-4, i18n → Task 5, Lip Balm follow-up → Task 6, out-of-scope items are simply not built (no task adds them).
- **Deviation from the spec's literal wording, and why:** the spec described draft-step functions mirroring the recipe draft's granular per-field style (`addDraftSopStep`/`updateDraftSopStep`/`removeDraftSopStep`). This plan instead uses a single `setSopDraftSteps(pid, steps)` wholesale setter, with the UI computing the next full array and committing on every `onChange` (no local buffer). This is a strict improvement, not a scope change: it delivers the same "editable draft steps" requirement while avoiding the exact onBlur-commit bug class that lost real edits in the prior session's recipe-draft work, and it matches the existing `setSop(pid, steps)` function's shape already used for the base SOP — more consistent with this codebase's established convention than the alternative.
- **Type/name consistency check:** `sopDraftFor`, `startSopDraft`, `setSopDraftSteps`, `approveSopDraftAsBase`, `discardSopDraft` — used with these exact names in Task 1 (definition + export) and Tasks 3-4 (consumption). `ProdSopStepEditor`'s prop names (`onPatchText`, `onToggleItem`, `onSetPct`, `onRemove`, `canRemove`, `hasError`) are used identically in both its Task 2 caller (base editor) and Task 3 caller (draft compare sheet).
