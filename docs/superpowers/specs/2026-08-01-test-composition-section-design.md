# Test composition section (replaces recipe/SOP suggestion sheets)

Date: 2026-08-01
Status: Approved by user, ready for implementation planning

## Problem

Recipe and SOP drafts already exist as an editable "Test" version of a
product's formula, entered via two buttons ("Suggérer une correction" /
"Suggérer une correction (SOP)") that open modal compare sheets
(`ProdFormulaCompareSheet`, `ProdSopCompareSheet` in lumabonga-product.jsx)
showing base vs draft side by side, with terminal actions buried inside
the modal (approve as base, approve as Ready, discard).

The user wants this surfaced directly on the product card instead of
behind a modal: a persistent "Test composition" section, visually
distinct (different color), sitting right below the existing
(unchanged) base Composition + SOP block. The two entry-point buttons
and their modals go away entirely — their function moves inline.

This also formalizes a full lifecycle that today is implicit/manual:
- Entering Test status should auto-copy the base recipe+SOP into a
  draft (today the draft only starts when the user manually clicks
  "Démarrer une suggestion" inside the old modal).
- Leaving Test status (→ Ready) must force an explicit choice between
  the base and the test version — whichever isn't picked is deleted.
  Today `approveDraftAsReady` silently promotes the recipe draft and
  never touches a pending SOP draft, which can dangle.

## Decision: reuse all existing draft data/actions, no new store functions

Every store function this needs already exists (lumabonga-data.jsx):
`draftFor`, `startDraft`, `addDraftIngredient`, `updateDraftIngredient`,
`removeDraftIngredient`, `approveDraftAsBase`, `discardDraft`;
`sopDraftFor`, `startSopDraft`, `setSopDraftSteps`,
`approveSopDraftAsBase`, `discardSopDraft`. This feature is a UI rewire
plus one new confirm modal, not a data model change.

`approveDraftAsReady` stops being called from anywhere (the new
Ready-confirm modal calls `approveDraftAsBase` + `updateProduct`
separately instead, so it can resolve the SOP draft in the same
action). Whether to delete the now-unused function is an implementation
step — confirm no other call site exists first, then remove it rather
than leave dead code.

## UI changes

### 1. Remove

- The two suggestion buttons in lumabonga-creative.jsx (~1048-1074) and
  their `compareFor`/`sopCompareFor` state (~787-788) and render lines
  (~1244-1245).
- `ProdFormulaCompareSheet` and `ProdSopCompareSheet` components in
  lumabonga-product.jsx (774-885, 887-1039) — dead once the only call
  sites are gone. Their internals (`ProdDraftRow`, `ProdSopStepEditor`)
  are reused, not deleted (see below).
- `ProdFormulaCompareSheet` / `ProdSopCompareSheet` removed from the
  `Object.assign(window, {...})` export at product.jsx:1041.

### 2. New "Test composition" section (lumabonga-creative.jsx)

Placed after the existing base SOP button row, before the delete
button. Same visibility gate as the removed buttons:
`!readonly && productStatus(p) === 'test'`.

Color: a new fixed hue (blue, ~245) computed the same way ingredient
dots already are (`oklch(0.62 0.16 245)`), not an existing theme
token — avoids clashing with `c.purple` (already means GawahBonga
throughout the finance views) and `c.amber` (already means "needs
review" elsewhere in this same card). Applied to the section label,
row accents, and both new buttons.

- No draft yet (only possible for products already in Test status
  before this feature ships): explanatory line + "Démarrer le test"
  button → `startDraft(pid)` + `startSopDraft(pid)`.
- Draft exists: ingredient rows via the reused `ProdDraftRow` (now
  exported to `window` from product.jsx, alongside the other
  cross-file components) — editable qty/unit, remove button, same as
  today's draft column but standalone instead of side-by-side. Below
  the rows, "Ajouter un composant" opens the existing
  `ProdAddMaterialSheet` with `draft` already true.
- SOP row: "Voir la SOP (test)" (solid) / "Éditer la SOP (test)"
  (outline) — same layout as the base SOP row, blue-tinted. Opens
  `ProdSopViewerSheet` / `ProdSopEditorSheet` with a new `draft={true}`
  prop (see below).
- "Valider comme nouvelle base" button (full width, solid blue):
  `approveDraftAsBase(pid)` + `approveSopDraftAsBase(pid)` (whichever
  draft exists — both already no-op safely if their draft is absent),
  immediately followed by `startDraft(pid)` + `startSopDraft(pid)` so
  the section refills from the new base without an extra click. Status
  untouched — product stays Test.

### 3. `ProdSopViewerSheet` / `ProdSopEditorSheet`: new `draft` prop

Both sheets (product.jsx:541, :628) gain a `draft` boolean, default
false:

- Viewer: steps source is `sopDraftFor(pid)?.steps || []` instead of
  `sops[pid]?.steps || []`. Batch-weight calc uses
  `draftFor(pid) || recipeFor(pid)` instead of always `recipeFor(pid)`
  (matches the old compare sheet's ingredient-resolution preference —
  product.jsx:902).
- Editor: initial `steps` state seeds from `sopDraftFor(pid)?.steps`.
  `ingredients` list (for the per-step tag picker) also switches to
  `draftFor(pid) || recipeFor(pid)`. Save calls
  `setSopDraftSteps(pid, steps)` instead of `setSop(pid, steps)`, and —
  matching the old compare sheet's deliberate scoping
  (product.jsx:903-907) — skips the 100%-ingredient-coverage guard,
  keeping only the "every step needs text" guard. Title/accent color
  switch to the blue Test tint when `draft` is true.

### 4. Status-chip hooks (lumabonga-creative.jsx ~998-1017)

- "Test" chip onClick: unchanged `updateProduct({status:'test'})`, plus
  `startDraft(pid)` + `startSopDraft(pid)` right after (no-op if a
  draft already exists, so re-clicking an already-active Test chip is
  harmless).
- "Ready" chip onClick: if current status is Test AND
  (`draftFor(pid) || sopDraftFor(pid)`) exists — open the new confirm
  modal instead of updating directly. Otherwise (already Ready, or
  Test with no draft at all) — unchanged direct
  `updateProduct({status:'ready'})`.

### 5. New confirm modal: `CreaFinalizeVersionConfirm`

Styled like the existing `CreaDeleteProductConfirm` (overlay + card).
Copy: warns that switching to Ready requires picking one version, the
other is deleted permanently, cannot be undone. Three actions:

- "Garder la version de test" → `approveDraftAsBase(pid)` +
  `approveSopDraftAsBase(pid)` → `updateProduct(pid, {status:'ready'})`
  → close.
- "Garder la version de base" → `discardDraft(pid)` +
  `discardSopDraft(pid)` → `updateProduct(pid, {status:'ready'})` →
  close.
- "Annuler" → close, no change.

## i18n

New strings need FR/EN/ID entries in lumabonga-data.jsx's translation
dictionaries, following the existing pattern (search `'Suggérer une
correction'` for where the old ones live, as a model for phrasing):
"Test composition", "Démarrer le test", "Voir la SOP (test)", "Éditer
la SOP (test)", "Valider comme nouvelle base", plus the confirm
modal's title/body/three button labels.

## Out of scope

- No multi-version history — still exactly one base + one pending
  draft per side, matching the existing recipe system's depth.
- No change to the recipe-draft lock on the base Composition list
  during Test status — stays exactly as it is today.
- No change to how percentages/coverage validation works for the base
  (non-draft) SOP editor — the relaxed (no coverage guard) behavior is
  scoped to `draft={true}` only.
