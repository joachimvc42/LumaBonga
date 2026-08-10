# To-do calendar v2: 2-week grid, activities, local-date fix

Date: 2026-08-10
Status: Approved by user, ready for implementation planning
Supersedes: parts of `2026-08-05-todo-calendar-design.md` (the 7-day
strip layout and its "no time-zone handling needed" assumption — see
below). The v1 data-layer decision (extend `todos`, no separate entity)
stands and is extended further here, not replaced.

## Problem

Three things, one plan:

1. **Layout redesign.** The v1 7-day horizontal strip (shipped, live)
   should become a real 2-week grid — 7 columns × 2 rows (today + next
   13 days, not calendar-week-aligned), placed at the very top of the
   To-do screen (above the existing hero), with that day's scheduled
   items visible in-cell rather than only in a list below a selected
   day. Non-today cells can be visually smaller for ergonomics, but
   their contents must still be legible.
2. **A second kind of calendar entry: activities.** Alongside to-dos
   (things to actually do, assignable, prioritized, completable),
   the user wants "activities" — busy-time blocks (e.g. a meeting, a
   delivery window) that represent when people are *unavailable*, not
   urgent work. Activities and to-dos must be visually distinguishable
   in the calendar: to-dos in light red (urgency), activities in a
   neutral/gray tone (no urgency, just occupied time).
3. **A real, business-relevant bug found by this project's final
   whole-branch review of v1, to be fixed as part of this redesign
   rather than patched separately** (see "Local-date correction"
   below) — the app's existing `todayISO()` helper is UTC-based, but
   every date this feature reads or writes (date-picker input, "is
   this overdue," "which cell is today") is local. For this app's
   actual users (UTC+8, confirmed by this project's own commit
   timestamps landing at 07:00–08:00 local = still the previous UTC
   day), "today" was silently wrong for roughly the first 8 hours of
   every business day — the exact window in which this business's
   owner has been shown to work. v1's design spec incorrectly assumed
   "no time-zone handling needed"; that assumption is corrected here.
4. **Zero tolerance for untranslated French leaking into the EN/ID UI.**
   The user explicitly does not want to see French text in the app at
   all. An audit during this design phase found the existing app
   already has at least two such leaks predating this plan (`tr('Terminées')`
   and `tr('Retirer {name}')` have no EN/ID dictionary entries at all,
   confirmed via `grep` against `lumabonga-data.jsx` — not a v1/v2
   defect specifically, just a standing gap). This plan fixes those two
   opportunistically and holds itself to a stricter bar: no new string
   ships without both EN and ID entries, verified by rendering (not
   just by eye).

## Decision: still one `todos` array, one new discriminator field

No new Supabase-persisted entity. Extend the todo shape (already
holding `text`, `assignees`, `priority`, `done`, `date`, `dueDate`,
`time` from v1) with:

- `kind`: `'task'` (default, omitted = task — every existing todo,
  including all 13 real ones in production today, is implicitly a
  task, zero migration needed) or `'activity'`.

Activities reuse every existing field (`text`, `assignees`, `dueDate`,
`time`) but the UI:
- does not show or ask for `priority` (no urgency concept),
- does not show the done-toggle / strikethrough treatment (an activity
  isn't "completed," it either happened or didn't — v1's toggle button
  simply isn't rendered for `kind === 'activity'` rows),
- still requires at least one assignee, same as tasks — an activity's
  whole purpose is marking *specific people* unavailable, so "who" is
  not optional.

`store.addTodo`/`store.updateTodo` need no changes (same generic
patch-merge as v1) — `kind` is just another key in the patch.

## Local-date correction

Add a new helper, `todayLocalISO()`, used ONLY for this feature's new
UI-facing comparisons (which day is "today" in the grid, which day is
initially selected, the overdue check). The existing `todayISO()`
(UTC-based) is left untouched everywhere else in the app — it already
has other callers (e.g. stamping a todo's creation `date`) where an
8-hour skew is cosmetic, not a correctness bug, and changing its
definition risks unrelated regressions. Both the 14-day grid generation
and the overdue calculation must be built from `todayLocalISO()`, not
`new Date().toISOString()` or a mix of local-`Date`-object math and
UTC-string output (the exact bug class that caused v1's Task 2 fix
round).

## UI

### Calendar grid (replaces v1's strip)

Sits above `CreaHero` — the first thing on the To-do screen. 7 columns
× 2 rows, `todayLocalISO()` + next 13 days (fixed window, no
calendar-week alignment — confirmed explicitly with the user). Today's
cell is visually larger/emphasized; the other 13 are smaller but their
per-day indicators must stay legible.

Each cell shows compact indicators, not full rows (14 cells can't fit
full `CreaTodoRow`s): a small colored dot or count per kind present
that day — light red for tasks, neutral gray for activities — plus the
day number and (for today, and space permitting on other cells)
weekday label.

Tapping a cell selects it (same mechanic as v1: an accent-colored
selection state) and shows that day's full item list below the grid —
reusing `CreaTodoRow` for tasks and a to-be-defined equivalent-weight
row for activities (simplified: no priority pill, no done-toggle,
otherwise matching visual weight/spacing).

### Fixing v1's cross-render-site editing bug

v1 shipped with a single shared `editingId` used across four different
list-render sites (plain open list, plain done fold, calendar overdue
group, calendar day list) for the same `CreaTodoRow` component — when
a dated, not-done todo renders in two places at once (both the
selected-day calendar list and the plain list below), opening its edit
form opened it in BOTH places simultaneously, with `autoFocus` landing
on whichever instance mounted last. This redesign must not reintroduce
that: give the calendar section's row list(s) their own editing-id
state, independent from the plain list's, since it's now unambiguous
which "instance" of a todo the user tapped.

### "+" creation button

Lives on/near the grid, opens the existing add-form UI (already built
in v1: text, assignee picker, date/time — this plan adds a `kind`
toggle to it: Task / Activity, defaulting to whichever kind matches
what's already common in that context, or simply defaulting to Task).
When a grid cell is selected, the form's date is pre-filled to that
day, matching v1's existing "arm the form" behavior — but this
redesign should also fix v1's related bug where the form's armed date
silently desynced from the visibly-selected cell after submitting one
item (adding a second item without re-tapping a cell landed on no
date at all, contradicting the still-highlighted cell). The two must
stay in agreement, or the highlighted state must clearly stop implying
"armed" — pick one and make it true.

### Below the grid: unchanged from v1, in this order

1. Add-task form (already existing, extended with the `kind` toggle
   per above) — or, if simpler given the grid's own "+" affordance,
   the standalone quick-add form and the grid's creation flow may be
   the same form reached two ways; exact placement decided at
   implementation time, but there must not be two independently-coded
   creation forms.
2. Plain task list ("Tâches" section, unaffected by calendar selection
   — still shows everything, dated or not, matching v1's decision that
   the calendar is a second lens, not a filter).
3. "Terminées" fold — gets a real EN translation ("Done") and a real
   ID translation for the first time (currently has neither).
4. "À acheter" (to-purchase) — stays last, unaffected by this plan.

## i18n bar for this plan

Every new string introduced by this plan ships with both EN and ID
dictionary entries in the same task that introduces it (not deferred
to a later task, unlike v1's convention) — the user has explicitly
said French must never be visible in the running app. Additionally,
this plan's i18n task includes a full audit: grep every `tr('...')`
call site across all `.jsx`/`.html` files, cross-reference against
`LB_EN`/`LB_ID`, and fix every gap found — not just the two identified
during design (`'Terminées'`, `'Retirer {name}'`) — since the design-
time check used a simple single-line regex and may have missed
multi-line string literals.

## Out of scope

- No recurring activities/tasks.
- No drag-to-reschedule.
- Activities don't get their own priority scale or completion state —
  if that turns out to be wanted later, it's a small follow-up (add a
  `kind`-specific field), not a re-architecture.
- No change to `todayISO()` itself or its other (non-calendar) callers.
- No full-app i18n audit beyond `tr()` call-site coverage (i.e. this
  doesn't re-review whether existing EN/ID *translations* are good
  quality, only whether they exist).
