# Calendar cell text, tab-scoped "+" button, tab-scoped period picker

Date: 2026-08-12
Status: Approved by user, ready for implementation planning

## Problem

Three independent UI refinements to the To-do calendar (shipped in
`2026-08-10-todo-calendar-v2-design.md`) and the app's top bar:

1. **Calendar cells show only colored dots, not what's scheduled.** The
   14-cell grid (`lumabonga-creative.jsx`, `CreaTodos`) currently renders
   a day number plus a small red/gray dot per kind present that day —
   readable at a glance that *something* is scheduled, but not what.
2. **The top-bar "+" button is tab-blind.** `CreaApp`'s `defaultKind(tab)`
   only maps `sales`/`buys`/`stock`/`prods` to a kind, falling back to
   `'sale'` for every other tab — so pressing "+" on the Dashboard or
   To do tab silently opens a "Vente" (sale) entry sheet, unrelated to
   what's on screen. To do already has its own complete inline add-form
   below the calendar; Dashboard has no natural "thing to add" via this
   button (its only add-capable action, settling between partners, has
   its own dedicated button already). Once opened, the sheet's kind-
   switcher pills (`CreaAddSheet`, `kinds` array) also let a user pivot
   to any of the 6 kinds regardless of which tab they came from.
3. **The period picker (`CreaMonthPicker`, "Août 2026" / "Tout" +
   dropdown, next to +) shows on every tab**, including Stock, Produits,
   and To do — screens whose content is never filtered by `store.period`
   (confirmed: only `CreaDashboard`, `CreaTxScreen`/sales, and
   `CreaPurchases`/buys read `store.period` anywhere in their render).
   The control is dead weight everywhere else.

## Decisions

### 1. Calendar grid cells

Same 7-column grid, same overall width — only cell content and height
change.

- **Non-today cells**: fixed height sized for the day number plus up to
  4 small text lines. Each line is one scheduled item that day
  (`dueDate === iso`), truncated to a single line with ellipsis, prefixed
  with the same color already used for the dot (light red for
  `kind !== 'activity'`, neutral gray for `kind === 'activity'`).
  - ≤4 items that day: one line per item, in the same order as the day
    list below (`byTime` — untimed first, then chronological).
  - \>4 items: the first 3 item lines, then a 4th line reading `+N` where
    `N` is the remaining count (`items.length - 3`). No `tr()` needed —
    it's a bare number with a `+`, not a word.
  - 0 items: just the day number, the 4 lines' worth of vertical space
    stays reserved (empty) so every non-today cell keeps identical
    height — the grid must not jump around as items are added/removed
    on other days.
- **Today's cell**: same width as the other 13 (columns stay aligned),
  but taller — day number and item-line text both render larger than
  the other cells' — plus the existing accent-colored border/background
  treatment. Still capped at the same "4 lines then +N" content rule,
  just more legible given the extra space.
- Tap-to-select and the day-list rendered below the grid are unchanged
  — the in-cell text is a preview only, not independently interactive.

### 2. Tab-scoped "+" button

Scope is the generic top-bar "+" only. Every existing tab-specific
inline add button (`CreaPurchases`' "Nouvelle facture d'achat" →
`onAdd('buy')` and "Nouvelle charge" → `onAdd('cost')`;
`CreaStock`'s "Lancer une production" → `onAdd('production')`;
`CreaProducts`' "Nouveau produit" → `onAdd('product')`) keeps calling
`onAdd` with its own explicit kind, and `CreaAddSheet` keeps showing its
full, unrestricted kind-switcher for those — none of that code changes.

- **Dash, To do**: `CreaTopBar` renders no "+" button at all on these
  two tabs (`CreaApp` passes a new `hideAdd` — or equivalent — down,
  tab-derived). To do's own inline add-form (already below the
  calendar) is unaffected. Dashboard's settlement button is unaffected
  (it already calls `onAdd('settlement')` directly, bypassing the top
  bar).
- **Sales**: "+" opens `CreaAddSheet` with `kind='sale'` and the
  kind-switcher pill row suppressed entirely (only one valid kind for
  this tab, nothing to switch between).
- **Purchases (`buys`)**: "+" opens with `kind='buy'`, kind-switcher
  restricted to exactly two pills: Achat (`buy`), Charge (`cost`) —
  mirroring the tab's own two inline add-row buttons.
- **Stock**: "+" opens with kind restricted to exactly two pills:
  Matière (`material`), Produit (`product`) — never `production` (that
  stays reachable only via the tab's own "Lancer une production" row,
  unaffected). Initial kind on open matches whichever segment
  (Matières / Produits finis) is currently active in `CreaStock`'s own
  `seg` toggle; `production` is deliberately excluded from this
  picker's choices even though it's a valid Stock-tab concept elsewhere.
- **Produits (`prods`)**: "+" opens with `kind='product'`, pills
  suppressed (single valid kind), matching the tab's own "Nouveau
  produit" button.

Implementation shape: `CreaAddSheet` gains an optional `restrictKinds`
prop (array of kind ids, or omitted/null for today's unrestricted
behavior). Only calls originating from the generic top-bar "+" pass it;
every existing explicit-kind call site (the four buttons named above)
passes nothing and keeps its current unrestricted pill row.

### 3. Period picker visibility

`CreaMonthPicker` (rendered inside `CreaTopBar`) becomes visible only
when the active tab is `dash`, `sales`, or `buys`. Hidden on `stock`,
`prods`, `todos`. `store.period` itself, and how Dashboard/Sales/
Purchases read it, are completely unchanged — this is a display-only
gate, tab-derived, replacing/extending the existing role-derived
`hidePeriod` prop (`role === 'staff'` still hides it everywhere,
combined with the new tab check — either condition hides it).

No behavior change on Stock/Produits/To do: verified none of their
render code reads `store.period` — hiding the control there doesn't
change what's displayed on those screens.

## i18n

No new user-facing words are introduced. The "+N" overflow line in a
calendar cell is a bare number, not a translated phrase — `tr()` is not
needed for it, and this is a deliberate exception to noted in the plan
so a future audit doesn't flag it as a false gap.

## Out of scope

- No change to what `store.period` filters, or to any tab's own
  period-scoped totals/filtering logic.
- No change to any of the four existing tab-specific "Nouvelle ..." /
  "Lancer ..." inline add buttons, or to `CreaAddSheet`'s behavior when
  opened from them.
- No change to the day-list rendered below the calendar grid, or to
  `CreaTodoRow`.
- No recipe-versioning / historical-production-snapshot change (raised
  and separately confirmed correct-as-is during this session; explicitly
  not part of this plan).
