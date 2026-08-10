# To-do Calendar v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the shipped 7-day calendar strip with a 2-week (7×2) grid at the very top of the To-do screen, add an "activity" kind alongside tasks (busy-time blocks, no priority/completion, gray in the calendar vs. tasks' light red), fix a real local-vs-UTC date bug the v1 final review found, and close out untranslated-string gaps so no French ever leaks into the EN/ID UI.

**Architecture:** Still zero new Supabase entities — todos gain one more optional field, `kind` (`'task'` default or `'activity'`). A new `todayLocalISO()` helper (alongside the existing UTC-based `todayISO()`, which stays untouched for its other callers) becomes the single source of truth for every new "which day is today" comparison. `CreaTodoRow` gains a `calendarView` prop so its tinting can switch to the kind-based light-red/gray scheme only when rendered inside the calendar section, while the plain list below keeps its existing priority/overdue tinting unchanged. The calendar section itself is rebuilt from a 7-cell strip into a 14-cell grid with its own `editingId`, independent from the plain list's, fixing v1's duplicate-simultaneous-edit-form bug.

**Tech Stack:** React 18 (UMD, no bundler), Babel Standalone (in-browser JSX transpile), plain `window`-global module wiring across `lumabonga-*.jsx` files, Supabase for persistence.

## Global Constraints

- No test framework exists in this repo. Every "test" step is a **manual browser verification**: seed `localStorage['lumabonga:v1']`, drive `LumaBonga.html` (the no-auth demo canvas at the repo root) via `mcp__Claude_Browser__*` tools, and check exact DOM/console/`localStorage` output.
- Navigate explicitly to `http://localhost:3000/LumaBonga.html` — the bare root URL can resolve to `index.html` (the real Supabase-backed app with a login wall). Port 3000 may be occupied by another session — if so, run `npx serve -l 3500 .` via Bash and use `http://localhost:3500/LumaBonga.html` instead.
- If `mcp__Claude_Browser__computer` fails with "the Browser pane is not displayed" — known sandbox limitation. Fall back entirely to `mcp__Claude_Browser__javascript_tool`: `document.querySelector`/`.click()`/`document.body.innerText`/`localStorage.getItem('lumabonga:v1')`. Give each call its own IIFE. Check state in a **separate** tool call after a click, not the same script.
- **Never write a straight apostrophe `'` inside a single-quoted French string literal or its dictionary key.** This exact mistake broke production once already (a straight apostrophe inside `'...l'instant...'` terminated the string early, blank screen for every user). Use the curly `'` for every French elision. After any i18n edit, confirm `document.getElementById('root').children.length > 0` before considering the task done.
- **Zero tolerance for untranslated strings.** Every new `tr('...')` string introduced by ANY task in this plan must have both an EN and an ID dictionary entry added in that same task — do not defer i18n to a later task the way v1 did. The user has explicitly said French must never be visible in the running (EN/ID) app.
- Follow existing code style exactly: 2-space indent, inline styles as JS objects, `tr()` for every user-facing string.
- `todayISO()` (UTC-based, `lumabonga-data.jsx:40`) is used elsewhere in this app for historical record-stamping, where an hours-scale skew is harmless. Do not change its definition or its other call sites. Every NEW comparison this plan adds ("is this today," "is this overdue," which grid cell is which) must use the new `todayLocalISO()` (Task 1) instead.

---

### Task 1: `todayLocalISO()` helper

**Files:**
- Modify: `lumabonga-data.jsx:40` (right after the existing `todayISO()`)

**Interfaces:**
- Produces (consumed by Task 3): `todayLocalISO(): string` — returns the browser's local calendar date as `"YYYY-MM-DD"`, unaffected by UTC offset. Global, bare-referenceable from `lumabonga-creative.jsx` the same way `todayISO()`/`fmtDate()`/`fmtDay()` already are.

- [ ] **Step 1: Add the helper**

In `lumabonga-data.jsx`, find:

```jsx
const todayISO = () => new Date().toISOString().slice(0, 10);
```

Replace with:

```jsx
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
```

- [ ] **Step 2: Manual verification**

1. Start the server (see Global Constraints), open `LumaBonga.html` via the browser tools.
2. In the console, run: `typeof todayLocalISO === 'function' ? todayLocalISO() : 'MISSING'` — expected: a `"YYYY-MM-DD"` string matching your machine's actual local date (compare against your system clock, not the server's).
3. Run: `todayISO()` — note its value too. If your test environment happens to be running in UTC (offset 0), the two will be identical — that's expected and doesn't invalidate the fix; the formulas are still different, they just coincide at offset 0. If your environment has a non-zero offset (check `new Date().getTimezoneOffset()`), confirm `todayLocalISO()` matches the actual local calendar date and `todayISO()` may differ.
4. Check console for errors — expected: none.

- [ ] **Step 3: Commit**

```bash
git add lumabonga-data.jsx
git commit -m "Add todayLocalISO() alongside the existing UTC-based todayISO()

todayISO() stays UTC for its existing (historical-stamp) callers. Every
new user-facing 'is this today' comparison the to-do calendar v2 plan
adds should use this instead — the v1 calendar's final review found
todayISO() silently wrong for part of every day at non-zero UTC offsets,
which affects this app's real (UTC+8) users."
```

---

### Task 2: `kind` field (task vs activity) on the add/edit forms and row display

**Files:**
- Modify: `lumabonga-creative.jsx` (`CreaTodos` add form, `CreaTodoRow` edit form + static display)

**Interfaces:**
- Produces (consumed by Task 3): todos may carry `kind: 'activity'` (or be absent/`'task'`, the default — every existing todo, including all real production ones, is implicitly a task, zero migration). `CreaTodoRow` gains a new prop, `calendarView` (boolean, default `false` when omitted) — when `false` (the plain list's usage, unchanged), tinting/priority/toggle behave exactly as today; when `true` (Task 3's usage), the row switches to the kind-based light-red/gray scheme instead of priority/overdue tinting. This task adds the prop and its `false`-path behavior only; Task 3 is what actually passes `calendarView` (there is no call site passing it yet after this task — that's expected and correct, matches this plan's task-boundary convention of landing interfaces one task before their consumer).
- Consumes: nothing new.

- [ ] **Step 1: Add `kind` state and a Task/Activity toggle to the add form**

In `lumabonga-creative.jsx`, inside `CreaTodos`, find the state declarations:

```jsx
  const [text, setText] = React.useState('');
  const [assignees, setAssignees] = React.useState(() => store.team[0] ? [store.team[0]] : []);
  const [priority, setPriority] = React.useState('medium');
  const [dueDate, setDueDate] = React.useState('');  // "" = no deadline; the add form and the calendar strip below share this one field
  const [time, setTime] = React.useState('');        // "" = no specific time; only meaningful alongside dueDate
```

Replace with:

```jsx
  const [text, setText] = React.useState('');
  const [kind, setKind] = React.useState('task');    // 'task' or 'activity' — see TODO_KINDS below
  const [assignees, setAssignees] = React.useState(() => store.team[0] ? [store.team[0]] : []);
  const [priority, setPriority] = React.useState('medium');
  const [dueDate, setDueDate] = React.useState('');  // "" = no deadline; the add form and the calendar grid below share this one field
  const [time, setTime] = React.useState('');        // "" = no specific time; only meaningful alongside dueDate
```

Find the `add` function:

```jsx
  const add = () => {
    const txt = text.trim();
    if (!txt || !assignees.length) return;
    const patch = { text: txt, assignees, priority };
    if (dueDate) patch.dueDate = dueDate;
    if (dueDate && time) patch.time = time;
    store.addTodo(patch);
    setText('');
    setPriority('medium');
    setDueDate('');
    setTime('');
  };
```

Replace with:

```jsx
  const add = () => {
    const txt = text.trim();
    if (!txt || !assignees.length) return;
    const patch = { text: txt, assignees };
    if (kind === 'activity') patch.kind = 'activity';
    else patch.priority = priority;  // activities have no priority concept
    if (dueDate) patch.dueDate = dueDate;
    if (dueDate && time) patch.time = time;
    store.addTodo(patch);
    setText('');
    setKind('task');
    setPriority('medium');
    setDueDate('');
    setTime('');
  };
```

Find the text input and the "Assigner à" label right after it:

```jsx
          <input value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
            placeholder={tr('Nouvelle tâche…')}
            style={{
              width: '100%', boxSizing: 'border-box', background: c.panel2, color: c.text,
              border: `1px solid ${c.border}`, borderRadius: 10, padding: '11px 13px',
              fontFamily: creaSans, fontSize: 14, outline: 'none',
            }} />
          <div style={{ fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase', color: c.mutedSoft, fontWeight: 600, fontFamily: creaSans, margin: '10px 0 6px' }}>
            {tr('Assigner à')}
          </div>
```

Replace with (inserting a Task/Activity toggle between the text input and the assignee section):

```jsx
          <input value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
            placeholder={tr('Nouvelle tâche…')}
            style={{
              width: '100%', boxSizing: 'border-box', background: c.panel2, color: c.text,
              border: `1px solid ${c.border}`, borderRadius: 10, padding: '11px 13px',
              fontFamily: creaSans, fontSize: 14, outline: 'none',
            }} />
          <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
            {TODO_KINDS.map((k) => {
              const sel = kind === k.id;
              return (
                <button key={k.id} onClick={() => setKind(k.id)} style={{
                  flex: 1, padding: '7px 0', borderRadius: 999, cursor: 'pointer',
                  border: `1px solid ${sel ? c.accent : c.border}`,
                  background: sel ? `${c.accent}22` : c.panel2, color: sel ? c.accent : c.text,
                  fontFamily: creaSans, fontSize: 12.5, fontWeight: 700,
                }}>{tr(k.label)}</button>
              );
            })}
          </div>
          <div style={{ fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase', color: c.mutedSoft, fontWeight: 600, fontFamily: creaSans, margin: '10px 0 6px' }}>
            {tr('Assigner à')}
          </div>
```

Find the priority section (still needs to exist for tasks, hidden for activities):

```jsx
          <div style={{ fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase', color: c.mutedSoft, fontWeight: 600, fontFamily: creaSans, margin: '10px 0 6px' }}>
            {tr('Priorité')}
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            {TODO_PRIORITIES.map((p) => {
              const sel = priority === p.id;
              const pc = prioColor(c, p.id);
              return (
                <button key={p.id} onClick={() => setPriority(p.id)} style={{
                  flex: 1, padding: '7px 0', borderRadius: 999, cursor: 'pointer',
                  border: `1px solid ${sel ? pc : c.border}`,
                  background: sel ? `${pc}22` : c.panel2, color: sel ? pc : c.text,
                  fontFamily: creaSans, fontSize: 12.5, fontWeight: 700,
                }}>{tr(p.label)}</button>
              );
            })}
          </div>
```

Replace with:

```jsx
          {kind === 'task' && (
            <React.Fragment>
              <div style={{ fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase', color: c.mutedSoft, fontWeight: 600, fontFamily: creaSans, margin: '10px 0 6px' }}>
                {tr('Priorité')}
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                {TODO_PRIORITIES.map((p) => {
                  const sel = priority === p.id;
                  const pc = prioColor(c, p.id);
                  return (
                    <button key={p.id} onClick={() => setPriority(p.id)} style={{
                      flex: 1, padding: '7px 0', borderRadius: 999, cursor: 'pointer',
                      border: `1px solid ${sel ? pc : c.border}`,
                      background: sel ? `${pc}22` : c.panel2, color: sel ? pc : c.text,
                      fontFamily: creaSans, fontSize: 12.5, fontWeight: 700,
                    }}>{tr(p.label)}</button>
                  );
                })}
              </div>
            </React.Fragment>
          )}
```

- [ ] **Step 2: Define `TODO_KINDS`**

In `lumabonga-creative.jsx`, find `TODO_PRIORITIES`:

```jsx
const TODO_PRIORITIES = [
  { id: 'high', label: 'Haute' },
  { id: 'medium', label: 'Moyenne' },
  { id: 'low', label: 'Basse' },
];
```

Replace with:

```jsx
const TODO_PRIORITIES = [
  { id: 'high', label: 'Haute' },
  { id: 'medium', label: 'Moyenne' },
  { id: 'low', label: 'Basse' },
];
// 'task' = normal to-do (assignable, prioritized, completable). 'activity'
// = a busy-time block (a meeting, a delivery window) — still assignable
// (marks specific people unavailable), but no urgency/priority concept and
// no completion state. Both live in the same store.todos array.
const TODO_KINDS = [
  { id: 'task', label: 'Tâche' },
  { id: 'activity', label: 'Activité' },
];
```

- [ ] **Step 3: Add `kind` state and toggle to the edit form (`CreaTodoRow`)**

Find:

```jsx
function CreaTodoRow({ td, store, c, card, dark, editing, onEdit, onCloseEdit }) {
  const [text, setText] = React.useState(td.text);
  const [assignees, setAssignees] = React.useState(() => td.assignees || (td.assignee ? [td.assignee] : []));
  const [priority, setPriority] = React.useState(td.priority || 'medium');
  const [dueDate, setDueDate] = React.useState(td.dueDate || '');
  const [time, setTime] = React.useState(td.time || '');
  React.useEffect(() => {
    if (editing) {
      setText(td.text);
      setAssignees(td.assignees || (td.assignee ? [td.assignee] : []));
      setPriority(td.priority || 'medium');
      setDueDate(td.dueDate || '');
      setTime(td.time || '');
    }
  }, [editing]);
```

Replace with:

```jsx
function CreaTodoRow({ td, store, c, card, dark, editing, onEdit, onCloseEdit, calendarView }) {
  const [text, setText] = React.useState(td.text);
  const [kind, setKind] = React.useState(td.kind === 'activity' ? 'activity' : 'task');
  const [assignees, setAssignees] = React.useState(() => td.assignees || (td.assignee ? [td.assignee] : []));
  const [priority, setPriority] = React.useState(td.priority || 'medium');
  const [dueDate, setDueDate] = React.useState(td.dueDate || '');
  const [time, setTime] = React.useState(td.time || '');
  React.useEffect(() => {
    if (editing) {
      setText(td.text);
      setKind(td.kind === 'activity' ? 'activity' : 'task');
      setAssignees(td.assignees || (td.assignee ? [td.assignee] : []));
      setPriority(td.priority || 'medium');
      setDueDate(td.dueDate || '');
      setTime(td.time || '');
    }
  }, [editing]);
```

Find `save`:

```jsx
  const save = () => {
    const txt = text.trim();
    if (!txt || !assignees.length) return;
    // Unlike the add form (which just omits the keys when empty), edit must
    // be able to CLEAR a previously-set deadline — so empty here writes
    // null explicitly rather than omitting the key.
    store.updateTodo(td.id, {
      text: txt, assignees, priority,
      dueDate: dueDate || null,
      time: (dueDate && time) ? time : null,
    });
    onCloseEdit();
  };
```

Replace with:

```jsx
  const save = () => {
    const txt = text.trim();
    if (!txt || !assignees.length) return;
    // Unlike the add form (which just omits the keys when empty), edit must
    // be able to CLEAR a previously-set deadline — so empty here writes
    // null explicitly rather than omitting the key. Same reasoning for
    // `kind`: it must be writable both ways (task -> activity and back),
    // so it's always written explicitly here, unlike the add form's
    // omit-when-default approach.
    store.updateTodo(td.id, {
      text: txt, kind, assignees, priority,
      dueDate: dueDate || null,
      time: (dueDate && time) ? time : null,
    });
    onCloseEdit();
  };
```

Find the text input and the assignee block inside the `editing` branch:

```jsx
        <input value={text} autoFocus onChange={(e) => setText(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', background: c.panel2, color: c.text,
            border: `1px solid ${c.border}`, borderRadius: 10, padding: '9px 12px',
            fontFamily: creaSans, fontSize: 13.5, outline: 'none',
          }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {store.team.map((name) => {
```

Replace with (inserting the kind toggle between the text input and the assignees):

```jsx
        <input value={text} autoFocus onChange={(e) => setText(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', background: c.panel2, color: c.text,
            border: `1px solid ${c.border}`, borderRadius: 10, padding: '9px 12px',
            fontFamily: creaSans, fontSize: 13.5, outline: 'none',
          }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {TODO_KINDS.map((k) => {
            const sel = kind === k.id;
            return (
              <button key={k.id} onClick={() => setKind(k.id)} style={{
                flex: 1, padding: '6px 0', borderRadius: 999, cursor: 'pointer',
                border: `1px solid ${sel ? c.accent : c.border}`,
                background: sel ? `${c.accent}22` : c.panel2, color: sel ? c.accent : c.text,
                fontFamily: creaSans, fontSize: 11.5, fontWeight: 700,
              }}>{tr(k.label)}</button>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {store.team.map((name) => {
```

Find the priority block inside the `editing` branch:

```jsx
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {TODO_PRIORITIES.map((p) => {
            const sel = priority === p.id;
            const pc = prioColor(c, p.id);
            return (
              <button key={p.id} onClick={() => setPriority(p.id)} style={{
                flex: 1, padding: '6px 0', borderRadius: 999, cursor: 'pointer',
                border: `1px solid ${sel ? pc : c.border}`,
                background: sel ? `${pc}22` : c.panel2, color: sel ? pc : c.text,
                fontFamily: creaSans, fontSize: 11.5, fontWeight: 700,
              }}>{tr(p.label)}</button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{
```

Replace with:

```jsx
        {kind === 'task' && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {TODO_PRIORITIES.map((p) => {
              const sel = priority === p.id;
              const pc = prioColor(c, p.id);
              return (
                <button key={p.id} onClick={() => setPriority(p.id)} style={{
                  flex: 1, padding: '6px 0', borderRadius: 999, cursor: 'pointer',
                  border: `1px solid ${sel ? pc : c.border}`,
                  background: sel ? `${pc}22` : c.panel2, color: sel ? pc : c.text,
                  fontFamily: creaSans, fontSize: 11.5, fontWeight: 700,
                }}>{tr(p.label)}</button>
              );
            })}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{
```

- [ ] **Step 4: Static-display changes — hide toggle/priority for activities, add `calendarView` tinting**

Find:

```jsx
  const pid = td.priority || 'medium';
  const pc = prioColor(c, pid);
  const pLabel = (TODO_PRIORITIES.find((p) => p.id === pid) || TODO_PRIORITIES[1]).label;
  // Overdue = has a deadline, it's in the past, and it's not done yet —
  // takes visual precedence over the priority tint (25 = same red hue as
  // "high" priority, prioHue('high')) since it's a more urgent signal.
  const overdue = !!(td.dueDate && td.dueDate < todayISO() && !td.done);

  return (
    <div style={{ ...card, ...softTintBar(dark, overdue ? 25 : prioHue(pid)), display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', opacity: td.done ? 0.55 : 1 }}>
      <button onClick={() => store.toggleTodo(td.id)} aria-label="toggle" style={{
        width: 24, height: 24, borderRadius: 999, flexShrink: 0, cursor: 'pointer',
        border: `1.5px solid ${td.done ? c.accent : c.border}`,
        background: td.done ? c.accent : 'transparent',
        color: c.inkContrast, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{td.done && <Icon.check width={13} height={13} />}</button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: creaSans, fontSize: 13.5, color: c.text, fontWeight: 500, textDecoration: td.done ? 'line-through' : 'none' }}>{td.text}</div>
        <div style={{ fontFamily: creaMono, fontSize: 10.5, color: overdue ? c.rose : c.muted, marginTop: 1, fontWeight: overdue ? 700 : 400 }}>
          {(td.assignees || (td.assignee ? [td.assignee] : [])).join(', ')} · {fmtDate(td.date)}
          {td.dueDate && (
            <React.Fragment> · {tr('Échéance')} {fmtDay(td.dueDate)}{td.time ? ` ${td.time}` : ''}</React.Fragment>
          )}
        </div>
      </div>
      <span style={{
        flexShrink: 0, padding: '3px 9px', borderRadius: 999,
        border: `1px solid ${pc}`, background: `${pc}22`, color: pc,
        fontFamily: creaSans, fontSize: 10, fontWeight: 700,
      }}>{tr(pLabel)}</span>
      <button onClick={onEdit} aria-label="edit" style={{
        background: 'none', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0,
      }}><Icon.edit width={15} height={15} /></button>
      <button onClick={() => store.removeTodo(td.id)} aria-label="delete" style={{
        background: 'none', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0,
      }}><Icon.trash width={15} height={15} /></button>
    </div>
  );
}
```

Replace with:

```jsx
  const isActivity = td.kind === 'activity';
  const pid = td.priority || 'medium';
  const pc = prioColor(c, pid);
  const pLabel = (TODO_PRIORITIES.find((p) => p.id === pid) || TODO_PRIORITIES[1]).label;
  // Overdue only applies to tasks — activities have no urgency concept.
  const overdue = !!(!isActivity && td.dueDate && td.dueDate < todayLocalISO() && !td.done);
  // Tinting has two schemes: the plain list (calendarView=false, unchanged
  // from before this task) keeps priority/overdue-based coloring; inside
  // the calendar (calendarView=true, wired up in the next task) every task
  // is a consistent light red and every activity is neutral, so the two
  // kinds read apart from across the whole grid at a glance rather than
  // varying by priority.
  const tintStyle = isActivity ? {} : (calendarView ? softTintBar(dark, 25) : softTintBar(dark, overdue ? 25 : prioHue(pid)));

  return (
    <div style={{ ...card, ...tintStyle, display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', opacity: td.done ? 0.55 : 1 }}>
      {!isActivity && (
        <button onClick={() => store.toggleTodo(td.id)} aria-label="toggle" style={{
          width: 24, height: 24, borderRadius: 999, flexShrink: 0, cursor: 'pointer',
          border: `1.5px solid ${td.done ? c.accent : c.border}`,
          background: td.done ? c.accent : 'transparent',
          color: c.inkContrast, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{td.done && <Icon.check width={13} height={13} />}</button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: creaSans, fontSize: 13.5, color: c.text, fontWeight: 500, textDecoration: td.done ? 'line-through' : 'none' }}>{td.text}</div>
        <div style={{ fontFamily: creaMono, fontSize: 10.5, color: overdue ? c.rose : c.muted, marginTop: 1, fontWeight: overdue ? 700 : 400 }}>
          {(td.assignees || (td.assignee ? [td.assignee] : [])).join(', ')} · {fmtDate(td.date)}
          {td.dueDate && (
            <React.Fragment> · {tr('Échéance')} {fmtDay(td.dueDate)}{td.time ? ` ${td.time}` : ''}</React.Fragment>
          )}
        </div>
      </div>
      {!isActivity && (
        <span style={{
          flexShrink: 0, padding: '3px 9px', borderRadius: 999,
          border: `1px solid ${pc}`, background: `${pc}22`, color: pc,
          fontFamily: creaSans, fontSize: 10, fontWeight: 700,
        }}>{tr(pLabel)}</span>
      )}
      <button onClick={onEdit} aria-label="edit" style={{
        background: 'none', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0,
      }}><Icon.edit width={15} height={15} /></button>
      <button onClick={() => store.removeTodo(td.id)} aria-label="delete" style={{
        background: 'none', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0,
      }}><Icon.trash width={15} height={15} /></button>
    </div>
  );
}
```

- [ ] **Step 5: Manual verification**

1. Open `LumaBonga.html`, seed `team` + empty `todos`, reload.
2. Navigate to "To do". Confirm the add form shows a Task/Activity toggle (defaulting to Task) right after the text input, before "Assigner à".
3. Switch to Activity — confirm the Priority section disappears. Type text, pick an assignee, click Ajouter. Confirm the new row: no checkbox/toggle button, no priority pill, plain (untinted) card background.
4. Switch back to Task, add a second item — confirm it looks exactly as todos did before this task (checkbox, priority pill, priority-tinted background).
5. Edit the activity via its pencil icon — confirm the edit form shows the kind toggle set to "Activité", no priority row. Switch it to "Tâche", pick a priority, save — confirm it now renders with the toggle button and priority pill (kind successfully changed both ways).
6. Give a task a due date in the past (via edit) — confirm it still shows the existing overdue red tint/text exactly as before (plain-list behavior unaffected, `calendarView` defaults to falsy everywhere it's not explicitly passed, since no call site passes it yet).
7. Give an ACTIVITY a due date in the past via edit — confirm it does NOT get red-tinted or bold (overdue is task-only, per the `!isActivity` guard).
8. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 6: Commit**

```bash
git add lumabonga-creative.jsx
git commit -m "Add activity kind alongside tasks; calendarView tinting prop

Activities (kind: 'activity') skip the priority selector and the
done-toggle — they mark busy time, not completable work. CreaTodoRow
gains a calendarView prop (unused by any call site yet, wired up next
task) that will switch tinting to a consistent light-red-for-tasks /
neutral-for-activities scheme inside the calendar, while the plain
list keeps its existing priority/overdue-based tinting unchanged."
```

---

### Task 3: Rebuild the calendar as a 2-week grid at the top of the screen

**Files:**
- Modify: `lumabonga-creative.jsx` (`CreaTodos`)

**Interfaces:**
- Consumes: `todayLocalISO()` (Task 1), `kind`/`calendarView` (Task 2).
- Produces: nothing new exported — this is the calendar section's full rewrite.

This task replaces the entire v1 calendar block (state, day-window generation, render) and moves it above `CreaHero`. It also fixes two bugs the v1 final review found: a shared `editingId` across four render sites caused the same todo's edit form to open twice at once when it appeared in both the calendar and the plain list; and the add form's armed `dueDate` desynced from the visibly-selected cell after the first item was added.

- [ ] **Step 1: Replace the calendar state block**

Find (current, right after `assigneesOf`/`matchesFilter`/`open`/`done`):

```jsx
  const assigneesOf = (td) => td.assignees || (td.assignee ? [td.assignee] : []);
  const matchesFilter = (td) => !personFilter || assigneesOf(td).includes(personFilter);
  const open = byPriority(store.todos.filter((x) => !x.done && matchesFilter(x)));
  const done = byPriority(store.todos.filter((x) => x.done && matchesFilter(x)));

  // ── Calendar day strip: today + next 6 days, fixed window (no
  // scroll-to-discover-more). Selecting a day both shows that day's todos
  // below the strip AND sets the add form's dueDate above it, so adding a
  // task while a day is selected schedules it there — no separate creation
  // flow needed.
  const [selectedDay, setSelectedDay] = React.useState(todayISO());
  const next7Days = React.useMemo(() => {
    const days = [];
    const [y, m, d] = todayISO().split('-').map(Number);
    for (let i = 0; i < 7; i++) {
      days.push(new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10));
    }
    return days;
  }, []);
  // Chronological, not priority-ordered — a calendar day view should read
  // top-to-bottom in time order. Untimed ("all-day") entries sort first,
  // matching how Google Calendar puts all-day events above the timed grid.
  const byTime = (xs) => [...xs].sort((a, b) => {
    const ta = a.time || ''; const tb = b.time || '';
    if (!ta && tb) return -1;
    if (ta && !tb) return 1;
    return ta.localeCompare(tb);
  });
  const dayTodosAll = store.todos.filter((x) => x.dueDate === selectedDay);
  const dayOpen = byTime(dayTodosAll.filter((x) => !x.done));
  const dayDone = byTime(dayTodosAll.filter((x) => x.done));
  const overdueTodos = selectedDay === todayISO()
    ? byTime(store.todos.filter((x) => x.dueDate && x.dueDate < todayISO() && !x.done))
    : [];
```

Replace with:

```jsx
  const assigneesOf = (td) => td.assignees || (td.assignee ? [td.assignee] : []);
  const matchesFilter = (td) => !personFilter || assigneesOf(td).includes(personFilter);
  const open = byPriority(store.todos.filter((x) => !x.done && matchesFilter(x)));
  const done = byPriority(store.todos.filter((x) => x.done && matchesFilter(x)));

  // ── Calendar grid: today + next 13 days (14 total, 7 columns × 2 rows),
  // fixed window, not calendar-week-aligned. Selecting a day shows that
  // day's items below the grid AND sets the add form's dueDate above it —
  // "arming" it — so adding an item while a day is selected schedules it
  // there. The armed date and the visibly-selected cell are kept in sync
  // in both directions (see Step 3's `add()` and this state's own init)
  // — v1 let them drift apart after the first add, which is fixed here.
  const [selectedDay, setSelectedDay] = React.useState(todayLocalISO());
  // Two independent editing-id tracks: v1 shared one `editingId` across
  // every render site a todo could appear in (calendar + plain list for
  // the same dated item), so editing a todo from the calendar could open
  // a SECOND edit form for the same todo in the plain list below,
  // simultaneously, with autoFocus landing on whichever mounted last. The
  // calendar section and the plain list now track their own editing todo.
  const [calEditingId, setCalEditingId] = React.useState(null);
  const next14Days = React.useMemo(() => {
    const days = [];
    const [y, m, d] = todayLocalISO().split('-').map(Number);
    for (let i = 0; i < 14; i++) {
      days.push(new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10));
    }
    return days;
  }, []);
  // Chronological, not priority-ordered — a calendar day view should read
  // top-to-bottom in time order. Untimed ("all-day") entries sort first,
  // matching how Google Calendar puts all-day events above the timed grid.
  const byTime = (xs) => [...xs].sort((a, b) => {
    const ta = a.time || ''; const tb = b.time || '';
    if (!ta && tb) return -1;
    if (ta && !tb) return 1;
    return ta.localeCompare(tb);
  });
  const dayTodosAll = store.todos.filter((x) => x.dueDate === selectedDay);
  const dayOpen = byTime(dayTodosAll.filter((x) => !x.done));
  const dayDone = byTime(dayTodosAll.filter((x) => x.done));
  const overdueTodos = selectedDay === todayLocalISO()
    ? byTime(store.todos.filter((x) => x.kind !== 'activity' && x.dueDate && x.dueDate < todayLocalISO() && !x.done))
    : [];
```

- [ ] **Step 2: Sync the armed date after adding**

Find `add` (as it stands after Task 2's edit):

```jsx
  const add = () => {
    const txt = text.trim();
    if (!txt || !assignees.length) return;
    const patch = { text: txt, assignees };
    if (kind === 'activity') patch.kind = 'activity';
    else patch.priority = priority;  // activities have no priority concept
    if (dueDate) patch.dueDate = dueDate;
    if (dueDate && time) patch.time = time;
    store.addTodo(patch);
    setText('');
    setKind('task');
    setPriority('medium');
    setDueDate('');
    setTime('');
  };
```

Replace with:

```jsx
  const add = () => {
    const txt = text.trim();
    if (!txt || !assignees.length) return;
    const patch = { text: txt, assignees };
    if (kind === 'activity') patch.kind = 'activity';
    else patch.priority = priority;  // activities have no priority concept
    if (dueDate) patch.dueDate = dueDate;
    if (dueDate && time) patch.time = time;
    store.addTodo(patch);
    setText('');
    setKind('task');
    setPriority('medium');
    // Re-arm for the still-selected calendar day rather than clearing —
    // v1 cleared to '', which silently desynced the form from whichever
    // cell was still visibly highlighted, so a second item added right
    // after the first landed with no deadline at all even though a day
    // was still selected.
    setDueDate(selectedDay);
    setTime('');
  };
```

- [ ] **Step 3: Replace the render — move the calendar above `CreaHero`, grid instead of strip, in-cell indicators, own editing-id**

Find (current — the Hero line through the end of the calendar block, right before the "Task list" section comment):

```jsx
      <CreaHero label={tr('Tâches')} value={open.length} sub={tr('à faire')} color={c.amber} t={t} dark={dark} unit="" />

      {/* New task */}
      <div style={{ padding: '0 22px' }}>
```

Replace with:

```jsx
      {/* Calendar grid — today + next 13 days (7 columns × 2 rows), today
          emphasized. Tap a day to see its scheduled items below the grid;
          only todos with a dueDate show here, undated todos stay
          exclusively in the plain list further down. Tasks render light
          red, activities neutral gray, so the two kinds read apart across
          the whole grid at a glance. */}
      <div style={{ padding: '18px 22px 4px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
        {next14Days.map((iso, i) => {
          const isToday = i === 0;
          const sel = selectedDay === iso;
          const dayItems = store.todos.filter((x) => x.dueDate === iso);
          const hasTask = dayItems.some((x) => x.kind !== 'activity');
          const hasActivity = dayItems.some((x) => x.kind === 'activity');
          return (
            <button key={iso} onClick={() => { setSelectedDay(iso); setDueDate(iso); }} style={{
              padding: isToday ? '9px 3px' : '6px 2px',
              borderRadius: 12, cursor: 'pointer',
              border: `1px solid ${sel ? c.accent : c.border}`,
              background: sel ? `${c.accent}1c` : c.panel2,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <span style={{ fontFamily: creaSans, fontSize: isToday ? 10.5 : 8.5, fontWeight: 700, color: sel ? c.accent : c.mutedSoft, textTransform: 'uppercase' }}>
                {new Date(iso).toLocaleDateString(LB_LOCALE, { weekday: 'short', timeZone: 'UTC' })}
              </span>
              <span style={{ fontFamily: creaDisplay, fontSize: isToday ? 18 : 13, fontWeight: 700, color: sel ? c.accent : c.text }}>
                {iso.slice(8, 10)}
              </span>
              <span style={{ display: 'flex', gap: 3, height: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: 999, background: hasTask ? c.rose : 'transparent' }} />
                <span style={{ width: 5, height: 5, borderRadius: 999, background: hasActivity ? c.mutedSoft : 'transparent' }} />
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ padding: '10px 22px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {overdueTodos.length > 0 && (
          <div>
            <div style={{ fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase', color: c.rose, fontWeight: 700, fontFamily: creaSans, marginBottom: 6 }}>
              {tr('En retard')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {overdueTodos.map((td) => (
                <CreaTodoRow key={td.id} td={td} store={store} c={c} card={card} dark={dark} calendarView
                  editing={calEditingId === td.id}
                  onEdit={() => setCalEditingId(td.id)}
                  onCloseEdit={() => setCalEditingId(null)} />
              ))}
            </div>
          </div>
        )}
        {dayOpen.length === 0 && dayDone.length === 0 && overdueTodos.length === 0 && (
          <div style={{ fontFamily: creaSans, fontSize: 12.5, color: c.mutedSoft, padding: '4px 0' }}>{tr('Rien de prévu ce jour-là.')}</div>
        )}
        {dayOpen.map((td) => (
          <CreaTodoRow key={td.id} td={td} store={store} c={c} card={card} dark={dark} calendarView
            editing={calEditingId === td.id}
            onEdit={() => setCalEditingId(td.id)}
            onCloseEdit={() => setCalEditingId(null)} />
        ))}
        {dayDone.map((td) => (
          <CreaTodoRow key={td.id} td={td} store={store} c={c} card={card} dark={dark} calendarView
            editing={calEditingId === td.id}
            onEdit={() => setCalEditingId(td.id)}
            onCloseEdit={() => setCalEditingId(null)} />
        ))}
      </div>

      <CreaHero label={tr('Tâches')} value={open.length} sub={tr('à faire')} color={c.amber} t={t} dark={dark} unit="" />

      {/* New task */}
      <div style={{ padding: '0 22px' }}>
```

- [ ] **Step 4: Remove the old (now-duplicate) strip and day-list block below the add form**

The add-form block (text/kind/assignees/priority/deadline/Ajouter) stays exactly where it is (right after the block moved in Step 3), but its OWN trailing calendar strip — the one that used to sit between the add form and `{/* Task list */}` — is now redundant (the grid moved above the hero in Step 3) and must be deleted. Find:

```jsx
          <button onClick={add} disabled={!text.trim() || !assignees.length} style={{
            width: '100%', marginTop: 12, padding: '12px', borderRadius: 999,
            cursor: (text.trim() && assignees.length) ? 'pointer' : 'default', border: 'none',
            background: c.accent, color: c.inkContrast, opacity: (text.trim() && assignees.length) ? 1 : 0.45,
            fontFamily: creaSans, fontSize: 14, fontWeight: 700,
          }}>{tr('Ajouter')}</button>
        </div>
      </div>

      {/* Calendar day strip — today + next 6 days, today emphasized. Tap a
          day to see its scheduled tasks below; only todos with a dueDate
          show here, undated todos stay exclusively in the plain list
          further down. */}
      <div style={{ padding: '14px 22px 10px', display: 'flex', gap: 6 }}>
        {next7Days.map((iso, i) => {
          const isToday = i === 0;
          const sel = selectedDay === iso;
          const hasTasks = store.todos.some((x) => x.dueDate === iso);
          return (
            <button key={iso} onClick={() => { setSelectedDay(iso); setDueDate(iso); }} style={{
              flex: isToday ? '0 0 60px' : 1,
              padding: isToday ? '10px 4px' : '7px 2px',
              borderRadius: 14, cursor: 'pointer',
              border: `1px solid ${sel ? c.accent : c.border}`,
              background: sel ? `${c.accent}1c` : c.panel2,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <span style={{ fontFamily: creaSans, fontSize: isToday ? 11 : 9.5, fontWeight: 700, color: sel ? c.accent : c.mutedSoft, textTransform: 'uppercase' }}>
                {new Date(iso).toLocaleDateString(LB_LOCALE, { weekday: 'short', timeZone: 'UTC' })}
              </span>
              <span style={{ fontFamily: creaDisplay, fontSize: isToday ? 20 : 15, fontWeight: 700, color: sel ? c.accent : c.text }}>
                {iso.slice(8, 10)}
              </span>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: hasTasks ? (sel ? c.accent : c.mutedSoft) : 'transparent' }} />
            </button>
          );
        })}
      </div>
      <div style={{ padding: '0 22px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {overdueTodos.length > 0 && (
          <div>
            <div style={{ fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase', color: c.rose, fontWeight: 700, fontFamily: creaSans, marginBottom: 6 }}>
              {tr('En retard')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {overdueTodos.map((td) => (
                <CreaTodoRow key={td.id} td={td} store={store} c={c} card={card} dark={dark}
                  editing={editingId === td.id}
                  onEdit={() => setEditingId(td.id)}
                  onCloseEdit={() => setEditingId(null)} />
              ))}
            </div>
          </div>
        )}
        {dayOpen.length === 0 && dayDone.length === 0 && overdueTodos.length === 0 && (
          <div style={{ fontFamily: creaSans, fontSize: 12.5, color: c.mutedSoft, padding: '4px 0' }}>{tr('Rien de prévu ce jour-là.')}</div>
        )}
        {dayOpen.map((td) => (
          <CreaTodoRow key={td.id} td={td} store={store} c={c} card={card} dark={dark}
            editing={editingId === td.id}
            onEdit={() => setEditingId(td.id)}
            onCloseEdit={() => setEditingId(null)} />
        ))}
        {dayDone.map((td) => (
          <CreaTodoRow key={td.id} td={td} store={store} c={c} card={card} dark={dark}
            editing={editingId === td.id}
            onEdit={() => setEditingId(td.id)}
            onCloseEdit={() => setEditingId(null)} />
        ))}
      </div>

      {/* Task list */}
```

Replace with (keeping the Ajouter button and the form's closing divs, deleting everything from the old strip comment through the old day-list `</div>`, since that entire block was moved and rebuilt in Step 3):

```jsx
          <button onClick={add} disabled={!text.trim() || !assignees.length} style={{
            width: '100%', marginTop: 12, padding: '12px', borderRadius: 999,
            cursor: (text.trim() && assignees.length) ? 'pointer' : 'default', border: 'none',
            background: c.accent, color: c.inkContrast, opacity: (text.trim() && assignees.length) ? 1 : 0.45,
            fontFamily: creaSans, fontSize: 14, fontWeight: 700,
          }}>{tr('Ajouter')}</button>
        </div>
      </div>

      {/* Task list */}
```

- [ ] **Step 5: Manual verification**

1. Open `LumaBonga.html`, seed `team` + empty `todos`, reload.
2. Navigate to "To do". Confirm the calendar grid is the FIRST thing on the screen (above the "Tâches" hero number), 7 columns × 2 rows = 14 cells, today's cell (first) visually bigger than the other 13.
3. Confirm today's cell is selected by default (accent border/background) and the empty state "Rien de prévu ce jour-là." shows below the grid.
4. Add a TASK due today with a time — confirm a red dot appears on today's cell, and the item appears in the list below (light-red tinted row, per Task 2's `calendarView` scheme — NOT priority-colored even if you picked a specific priority).
5. Add an ACTIVITY due today — confirm a gray/muted dot appears alongside the red one on today's cell (both dots visible), and the activity renders below with no checkbox, no priority pill, untinted background.
6. Tap a different cell (e.g. index 5). Confirm it becomes selected, the list below switches to that (empty) day, AND the add form's date field (scroll down to see it) now shows that same date — confirm the sync explicitly, not just visually: run `document.querySelector('input[type=date]').value` and compare to the tapped cell's date.
7. From that selected future day, add a second task WITHOUT re-tapping any cell first — confirm it lands on the still-selected future day (not undated) — this is the v1 arm-desync bug, explicitly re-verify it's fixed by checking the created todo's actual `dueDate` in `localStorage.getItem('lumabonga:v1')`, not just that the UI looked right.
8. Re-select today. Seed (via localStorage edit + reload) an overdue task (past `dueDate`, `done: false`, no `kind` or `kind: 'task'`) — confirm it appears in a red "En retard" group above today's own list. Seed an overdue ACTIVITY the same way — confirm it does NOT appear in the overdue group (activities have no urgency concept, per Task 2's `!isActivity` guard on the `overdue` calculation).
9. **Duplicate-edit-form regression check (the bug this task explicitly fixes):** create a task due today, confirm it appears both in the calendar's day list AND in the plain "Tâches" list further down the page (same todo, two render sites, by design — the calendar is a second lens, not a filter). Click the pencil icon on the CALENDAR's copy of this row. Confirm ONLY that one opens an edit form (check via `document.querySelectorAll('input[autofocus]').length === 1` or by reading the DOM for exactly one open edit card) — the plain list's copy of the same todo must stay in its static (non-editing) display, proving `calEditingId` and `editingId` are now independent.
10. Confirm the plain "Tâches" list further down still shows ALL todos (dated and undated, tasks and activities, open ones) unaffected by calendar selection — unchanged behavior.
11. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 6: Commit**

```bash
git add lumabonga-creative.jsx
git commit -m "Rebuild to-do calendar as a 2-week grid above the hero

Replaces the 7-day strip with 14 cells (7x2), moved above CreaHero per
explicit placement request. Cells show separate task/activity dot
indicators (red/gray). Fixes two bugs the v1 final review found: a
shared editingId let the same todo's edit form open twice at once when
rendered in both the calendar and the plain list (now calEditingId is
independent); and the add form's armed date desynced from the
selected cell after the first add (now re-arms to the same day
instead of clearing). Uses todayLocalISO() throughout instead of the
UTC-based todayISO(), fixing the other v1 finding."
```

---

### Task 4: i18n — new strings, plus full audit and fix of every pre-existing gap

**Files:**
- Modify: `lumabonga-data.jsx` (EN dictionary)
- Modify: `lumabonga-data.jsx` (ID dictionary)

**Interfaces:** none (pure data addition).

- [ ] **Step 1: Add EN + ID entries for every new string this plan introduced**

In `lumabonga-data.jsx`'s EN dictionary, add:

```jsx
  'Tâche': 'Task',
  'Activité': 'Activity',
```

In the ID dictionary, add:

```jsx
  'Tâche': 'Tugas',
  'Activité': 'Kegiatan',
```

(`'En retard'`, `'Rien de prévu ce jour-là.'`, `'Échéance (optionnel)'`, `'Échéance'` already have EN/ID entries from the v1 plan — confirm via grep in Step 2 rather than assuming, since this task's whole point is not trusting that assumption.)

- [ ] **Step 2: Full audit — every `tr('...')` call site must have a real EN and ID entry**

Run, from the repo root:

```bash
grep -ohE "tr\('[^']*'" lumabonga-*.jsx index.html | sed -E "s/^tr\('//;s/'$//" | sort -u
```

This catches simple single-line, single-quoted `tr(...)` calls but MISSES multi-line string literals (this codebase has a few, e.g. long explanatory strings that wrap across two source lines) and any `tr("...")` double-quoted calls. Follow up with:

```bash
grep -n 'tr("' lumabonga-*.jsx index.html
```

and manually scan for any multi-line `tr('...` calls (a `tr('` with no closing `'` before end-of-line) by grepping for `tr('$` or similar and reading the following line.

For every distinct French string found by either method, confirm it has a matching key in BOTH `LB_EN` and `LB_ID` (`lumabonga-data.jsx`) — a plain `grep -F "'exact string'" lumabonga-data.jsx` should show it appearing at least twice (once per dictionary; it may also appear as the `tr()` call site itself, so expect 3 total matches across the whole file — the call site plus 2 dictionary entries — for a healthy key). Two already-known gaps to fix as part of this pass (found during design, both currently have ZERO dictionary entries in either language):

In `lumabonga-data.jsx`'s EN dictionary, add:

```jsx
  'Terminées': 'Done',
  'Retirer {name}': 'Remove {name}',
```

In the ID dictionary, add:

```jsx
  'Terminées': 'Selesai',
  'Retirer {name}': 'Hapus {name}',
```

For any ADDITIONAL gap the audit finds beyond these two and this plan's own new strings, add EN + ID entries for it too, following the exact French source text and this file's existing translation tone/style for nearby entries. Do not skip any — the whole point of this task is zero remaining gaps.

- [ ] **Step 3: Manual verification**

1. Open `LumaBonga.html` with a seeded task, an activity, an overdue task, and at least one completed (`done: true`) todo, so every new UI element in this plan renders at least once.
2. Switch language to EN — confirm every string this plan touches renders in English: the Task/Activity toggle labels, "Overdue", "Nothing scheduled for this day.", the "Done" fold label (not "Terminées" or "Completed" — confirm it now reads exactly "Done" per the user's explicit request), the team-remove button's accessible name (`document.querySelector('[aria-label^="Remove"]')` should exist).
3. Switch to ID — confirm the same set of elements show Indonesian text.
4. Re-run the Step 2 audit script one final time and confirm every string it finds now has both dictionary entries — paste the actual final `grep` output showing zero remaining gaps into your report, not a summary.
5. Check console for `tr()` missing-key warnings — expected: none. Confirm `document.getElementById('root').children.length > 0` (per this repo's outage history — non-negotiable after any i18n edit).
6. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 4: Commit**

```bash
git add lumabonga-data.jsx
git commit -m "Add EN/ID translations for calendar v2 + close pre-existing gaps

Full audit of every tr() call site against both dictionaries — fixes
2 gaps that predate this plan ('Terminées' and 'Retirer {name}' had
zero translations in either language, always rendering French) plus
covers every string this plan itself introduced. No known remaining
gaps after this commit."
```

---

### Task 5: Deploy, verify against real production data

**Files:** none (verification-only against the live Supabase-backed app, `https://luma-bonga.vercel.app`).

**Interfaces:** none.

- [ ] **Step 1: Push and confirm deploy**

```bash
git push
```

**Immediately** load the deployed URL and confirm `document.getElementById('root').children.length > 0` with zero console errors, before doing anything else — this repo has had a real production outage from a bad push before; this check is not optional.

- [ ] **Step 2: Sign in**

Open `https://luma-bonga.vercel.app` in the browser tools. If it shows an access-code screen with no existing session, ask the user to sign in — do not attempt to enter or guess the code.

- [ ] **Step 3: Read-only verification on real data**

1. Navigate to "To do". Confirm the calendar grid renders at the top of the screen with real dates, today emphasized, 14 cells.
2. Confirm the 13 real (pre-existing) todos, none of which have a `kind` field (this field didn't exist before this plan), render as tasks (checkbox, priority pill) exactly as before — full backward compatibility, zero migration.
3. Confirm the "Done"/completed fold shows "Done" (not "Terminées") if the language is set to EN.
4. Optionally (only if the user is present and confirms it's fine to create real data): add one real test task and one real test activity with near-future dates to confirm the end-to-end flow works on production, then delete both via the trash icon to leave no residue. Otherwise, skip any data-mutating step and rely on the read-only checks above.

- [ ] **Step 4: Report to user**

Summarize what was verified on production and confirm no unintended real data was created or left behind.

---

## Self-Review Notes

- **Spec coverage:** every section of `docs/superpowers/specs/2026-08-10-todo-calendar-v2-design.md` maps to a task — local-date correction → Task 1, activities → Task 2, grid layout + placement + editing/arm-sync fixes → Task 3, zero-French-leakage bar (including the audit of pre-existing gaps) → Task 4, deploy/verify → Task 5. Out-of-scope items (recurring items, drag-to-reschedule, activity-specific priority/completion, changing `todayISO()` itself, full translation-quality review) are simply not built.
- **Deviation from the spec, and why:** the spec left the exact placement of the add-form vs. the grid's own creation affordance open ("exact placement decided at implementation time, but there must not be two independently-coded creation forms"). This plan resolves it as: the grid has no separate "+" button of its own — tapping a cell arms the existing add form (already below the grid, per Task 3's Step 3 ordering: grid → hero → add form → plain list), which is the single creation flow for both kinds. This satisfies "not two independently-coded creation forms" as directly as possible and reuses 100% of the existing, already-verified add-form code rather than building a second entry point.
- **Type/name consistency check:** `kind` is read/written identically (`'task'`/`'activity'`/absent-means-task) in the add form, edit form, static row, and both calendar filters (`overdueTodos`, the grid's `hasTask`/`hasActivity`). `calendarView` is a boolean prop, passed as JSX shorthand (`calendarView` = `calendarView={true}`) at every Task 3 call site, and every other existing call site (the plain list, untouched by Task 3) omits it, correctly defaulting to falsy. `calEditingId`/`setCalEditingId` are used only within the calendar section (Task 3); `editingId`/`setEditingId` (pre-existing, untouched) are used only in the plain list — confirmed no cross-contamination between the two states.
- **Ordering rationale:** Task 1 (helper) before Task 3 (consumes it) is required. Task 2 (`kind` + `calendarView` prop, unused by any call site) before Task 3 (the only consumer) follows this project's established convention of landing an interface one task before its consumer, so each task stays independently testable — Task 2's verification explicitly confirms the plain list is unaffected (since nothing passes `calendarView` yet), which would be impossible to isolate if kind support and the grid rewrite happened in the same task. Task 4 (i18n) last among the code tasks, since it needs the final strings settled and explicitly includes an audit that only makes sense once all this plan's own strings exist.
