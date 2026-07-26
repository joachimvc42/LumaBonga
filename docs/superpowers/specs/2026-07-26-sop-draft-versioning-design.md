# SOP draft versioning (parallel to recipe drafts)

Date: 2026-07-26
Status: Approved by user, ready for implementation planning

## Problem

Recipes already support a base/draft ("Test") versioning workflow:
`recipes[pid]` is the current tested formula; `recipeDrafts[pid]` is an
editable copy you can tweak without touching the base, compared side by
side in `ProdFormulaCompareSheet` (lumabonga-product.jsx:759-870), with
three terminal actions — `discardDraft`, `approveDraftAsBase` (draft
becomes the new base, product stays Test), `approveDraftAsReady` (draft
becomes the new base AND the product flips to Ready).

SOPs have none of this. `sops[pid]` (lumabonga-data.jsx:783, 1136-1137)
is a single `{ steps: [...] }` blob, directly edited in place via
`ProdSopEditorSheet` (lumabonga-product.jsx:470). Each step is
`{ id, text, items }`, where `items` is `[{ materialId, pct }]` — the
subset of the recipe's ingredients used at that step (e.g. "melt the
waxes" lists the wax/butter materialIds at 100%; a SPF variant note can
reference zinc oxide at a partial %). There is no way to draft a new set
of steps alongside the current one, compare them, and decide later —
editing a Test-phase product's SOP silently overwrites the only copy.

Concretely: when a new recipe draft is proposed (e.g. Lip Balm's
reformulation), the corresponding SOP steps have nowhere to live in
"draft" form. The user wants the same base/draft duality SOPs already
partially get for free through the recipe system, applied explicitly to
SOPs.

## Decision: recipe and SOP drafts stay independent

Confirmed with user (2026-07-26): a product's recipe draft and SOP draft
are two separate objects with separate lifecycles. Approving one does
not touch the other. This means, unlike recipes, **SOP drafts have only
two terminal actions, not three**:

- `approveSopDraftAsBase` — draft steps become `sops[pid]`, draft cleared.
- `discardSopDraft` — draft cleared, `sops[pid]` untouched.

There is no `approveSopDraftAsReady` for SOPs. Reason: "Ready" is a
product-level flag (`product.status`) owned by the recipe side
(`approveDraftAsReady` sets it). SOPs have no independent Ready/Test
status of their own today, so there is nothing meaningful for a
SOP-only "promote to Ready" to do beyond what `approveSopDraftAsBase`
already does. A pending SOP draft can outlive a product's promotion to
Ready — that's expected under "independent," not a bug to guard against.

## Data model

Mirrors `recipeDrafts` exactly, same file/region as `sops` in
lumabonga-data.jsx:

```
const [sopDrafts, setSopDrafts] = React.useState(saved?.sopDrafts || {});
```

Add `sopDrafts` to the persisted snapshot (the `savePersisted({...})` call
at data.jsx:810 and its effect dependency array at :811).

Functions (same file, near the existing `setSop`/`removeSop` at :1136):

- `sopDraftFor(pid)` → `sopDrafts[pid] || null`
- `startSopDraft(pid)` → copies `(sops[pid]?.steps || [])` into
  `sopDrafts[pid]`, no-op if a draft already exists (same guard as
  `startDraft` for recipes at :843)
- `addDraftSopStep(pid, step)`
- `updateDraftSopStep(pid, stepId, patch)`
- `removeDraftSopStep(pid, stepId)`
- No reorder function needed: `ProdSopEditorSheet` has no reorder
  affordance today (only add/edit/remove — confirmed by reading it), so
  the draft editor matches that scope, nothing extra to build.
- `approveSopDraftAsBase(pid)` → `sops[pid] = { steps: sopDrafts[pid].steps }`, then clear the draft
- `discardSopDraft(pid)` → delete `sopDrafts[pid]`

Export all of the above from the store's return object (data.jsx:1203
area, next to `sops, setSop, removeSop`).

## UI

New component `ProdSopCompareSheet` in lumabonga-product.jsx, placed next
to `ProdFormulaCompareSheet` (which it mirrors structurally):

- No draft yet: show current steps read-only, explanatory line (same
  copy pattern as the recipe sheet's "part from a copy of the tested
  formula..."), button "Démarrer une suggestion" → `startSopDraft`.
- Draft exists: two columns, "Testée" (read-only current steps) /
  "À tester" (editable draft steps — add/edit/remove, diff-colored:
  added = accent, changed text = amber, unchanged = neutral, matching
  `ProdDraftRow`'s `diff` coloring convention at product.jsx:727-757).
  Steps matched by `id` across columns the same way ingredients are
  matched by `materialId` in `ProdFormulaCompareSheet` (lines 798-802).
- Two buttons only (per the independence decision): "Approuver comme
  nouvelle base" and "Supprimer la suggestion" — no Ready button.

Entry point in lumabonga-creative.jsx: a second button right next to the
existing recipe "Suggérer une correction" / "Revoir la suggestion" button
(creative.jsx:1046-1060), same visibility rule (`!readonly &&
productStatus(p) === 'test'`), same `store.draftFor` →
`store.sopDraftFor` swap for the label. New `sopCompareFor` state in
`CreaProducts` alongside the existing `compareFor` (creative.jsx:787),
rendered alongside the existing
`{compareFor && <ProdFormulaCompareSheet .../>}` line (creative.jsx:1230).

Window export: add `ProdSopCompareSheet` to the `Object.assign(window, {...})`
call at product.jsx:872.

## i18n

Every new user-facing string (button labels, column headers, empty-state
copy, confirmation text) needs FR/EN/ID entries in lumabonga-data.jsx's
translation dictionaries, following the existing keys for the recipe
suggestion flow (search `'Suggérer une correction'`, `'Testée'`,
`'À tester'`, `'Démarrer une suggestion'`, `'Supprimer la suggestion'`
for the pattern — the SOP versions can mostly reuse identical phrasing
with "SOP" or "étapes" substituted where needed to disambiguate from the
recipe sheet's identical-looking buttons).

## Concrete follow-up: Lip Balm

Once the feature ships: recipe side is already correctly in the desired
state from the prior session (base recipe = original formula, untouched;
`recipeDrafts.p_lip` = the new 13-ingredient formula, pending). This spec
does not change that. Separately, start a SOP draft for `p_lip` from the
existing base SOP (6 steps: melt waxes+cocoa+shea → add castor+coconut →
add jojoba+apricot → add vitamin E+vanilla → pour/cool → tips) and edit
the draft's steps + `items` to reflect the new formula: updated qtys
throughout, Lanoline anhydre folded into the wax/butter melt step,
Maizena (arrow-root) added as its own step (typically stirred in once
the mix has cooled slightly, since starches can clump at high heat —
confirm placement makes sense during implementation), vanilla dose note
updated for the new gouttes count. Left pending, not approved — mirrors
the recipe draft's current state.

## Out of scope (explicitly not building)

- No SOP-level Ready/Test status field.
- No auto-coupling between recipe and SOP draft approval actions.
- No history beyond one base + one pending draft per side (matches the
  existing recipe system's depth — not adding multi-version history).
