# To-do calendar (deadline scheduling + day view)

Date: 2026-08-05
Status: Approved by user, ready for implementation planning

## Problem

To-dos today only carry a creation-timestamp `date` (auto-stamped, not
user-facing as a deadline) and no time. The user wants to be able to:

1. Give a task a **deadline date** (and optionally a time), separate from
   when it was created.
2. See these scheduled tasks in a small calendar-style day view, sitting
   directly above the existing to-do list — no new nav section.
3. Assign scheduled tasks to people, same as today's to-dos (already
   supported via `assignees`).
4. See at a glance which non-done tasks are **overdue** (red highlight),
   so they get ticked or rescheduled.

Undated to-dos (no deadline) must keep working exactly as today — this
is additive, not a replacement for the plain to-do flow.

## Decision: extend the existing todo, no new entity

No separate "calendar event" model. A todo gains two new optional fields:

- `dueDate` (ISO date string `YYYY-MM-DD`, or absent/`null`) — the
  deadline. Distinct from the existing `date` field, which stays exactly
  as-is (creation timestamp, already displayed in the to-do row's
  "assignee · date" line — e.g. `creative.jsx`'s `CreaTodoRow`).
- `time` (`"HH:MM"` 24h string, or absent/`null`) — optional time of day.
  Only meaningful alongside a `dueDate`; a todo can have a `dueDate`
  with no `time` (shows as an untimed/all-day entry for that date).

Calendar eligibility rule: a todo appears on the calendar day view **if
and only if** it has a `dueDate` set (`time` is not required). A todo
with no `dueDate` never appears on the calendar, regardless of its
creation `date` — this is the rule the user confirmed explicitly.

`addTodo`/`updateTodo` (`lumabonga-data.jsx`) already merge whatever
patch they're given into the todo object, so both new fields slot in
with zero changes to those two functions — only the add/edit form UI
and the new calendar view need to read/write them.

## Overdue highlighting

A todo is "overdue" when `dueDate` is before today's date AND
`done === false`. Overdue todos are highlighted red:

- In the new calendar day view, on whatever day cell they'd fall under
  (today's date strip cell, since an overdue item's actual `dueDate` is
  in the past — see UI section below for exactly how past-due items
  surface in a view centered on today+6).
- In the existing plain to-do list (`CreaTodoRow`), reusing the same red
  tone the codebase already uses for "high priority" / negative amounts
  (`c.prioHigh` / `c.rose` — exact token chosen at implementation time to
  match existing row-tinting conventions, e.g. `softTintBar`).

## UI

### Calendar day strip (new, sits above the to-do list)

A horizontal row of 7 day cells: today plus the next 6 days, today
visually prominent (larger/bold/accent-colored), the other 6 smaller/
secondary — not a scroll-to-discover-more-days design, this fixed
7-day window is the whole default view. Tapping a day cell selects it
(highlights as "active"), showing that day's scheduled todos below the
strip.

Below the strip: a vertical, time-ordered list of the selected day's
todos that have a `dueDate` of that day — timed ones (`time` set)
sorted chronologically, untimed/all-day ones grouped together (above or
below the timed ones — exact ordering decided at implementation time,
consistent either way). Each entry reuses the existing `CreaTodoRow`
rendering (assignee chips, priority tint, done-toggle) so behavior
(toggle done, edit, delete) is identical to the plain list — this is
still literally a todo, just displayed under the calendar strip instead
of (or in addition to — see below) the plain list.

Reusing `CreaTodoRow` inside the calendar section means dated tasks are
NOT hidden from the plain to-do list below — they'd otherwise show up
twice conceptually (once under their day in the calendar, once in the
undifferentiated "Tasks" list). Decided: dated todos stay in the plain
list too (no filtering-out), since the plain list is still useful as
"everything, done or not, regardless of date" and users already filter
it by person. The calendar is a second, date-oriented lens on the same
underlying items, not a replacement view.

**Overdue items and the 7-day window:** since the day strip only shows
today+6 (never past days), an overdue (past-`dueDate`, not-done) todo
has no day cell of its own in the strip. It surfaces by being included
in "today"'s selected-day list when today is the active selection —
displayed there with the same red overdue treatment, positioned above
today's own scheduled items (a small "En retard" / "Overdue" grouping
label above the day's own timed/untimed groups) so the user can't miss
it while looking at "today."

### Creating a scheduled task

The day strip's "+" (or the existing quick-add form, extended) opens the
same add-task form already used for to-dos, with two additions: a date
picker (pre-filled to whichever day is currently selected in the strip,
editable) and an optional time picker. The existing assignee-chip picker
and priority selector are unchanged and reused as-is.

The plain to-do quick-add (top of the existing list) stays exactly as
fast/dateless as today by default — `dueDate`/`time` are only set via
this extended form or by editing an existing todo afterward (the
existing `CreaTodoRow` edit mode gains the same two new fields).

## Out of scope

- No month/week grid view — only the fixed 7-day (today+6) strip.
- No recurring tasks.
- No time-zone handling (single-timezone business, same as the rest of
  the app).
- No drag-to-reschedule — editing `dueDate`/`time` goes through the
  existing edit-todo form.
- Calendar events remain identical to todos in every other respect
  (no separate permissions, no separate assignee model, no separate
  priority scale).
