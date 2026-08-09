# To-do Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let todos carry an optional deadline (date + optional time), separate from the existing creation-date field, flag overdue not-done todos in red, and show a small 7-day (today+6) calendar strip above the task list that lists whichever day is selected.

**Architecture:** No data-layer changes — `store.addTodo`/`store.updateTodo` (lumabonga-data.jsx) already merge whatever object they're given into a todo, so the two new fields (`dueDate`, `time`) just need to be read/written by the existing add/edit forms in `CreaTodos`/`CreaTodoRow` (lumabonga-creative.jsx). The calendar itself is a new day-strip + day-list block inserted into `CreaTodos`, reusing the existing `CreaTodoRow` component for entries so toggle/edit/delete behavior is identical everywhere a todo appears.

**Tech Stack:** React 18 (UMD, no bundler), Babel Standalone (in-browser JSX transpile), plain `window`-global module wiring across `lumabonga-*.jsx` files, Supabase for persistence.

## Global Constraints

- No test framework exists in this repo. Every "test" step is a **manual browser verification**: seed `localStorage['lumabonga:v1']`, drive `LumaBonga.html` (the no-auth demo canvas at the repo root) via `mcp__Claude_Browser__*` tools, and check exact DOM/console/`localStorage` output.
- Navigate explicitly to `http://localhost:3000/LumaBonga.html` — the bare root URL can resolve to `index.html` (the real Supabase-backed app with a login wall this demo canvas does not have). Port 3000 may be occupied by another session's dev server — if `preview_start` reports the port is in use by something else, start `npx serve -l 3500 .` directly via Bash and navigate to `http://localhost:3500/LumaBonga.html` instead.
- If `mcp__Claude_Browser__computer` (screenshot, coordinate/ref clicks) fails with "the Browser pane is not displayed, so the page is not compositing frames" — known sandbox limitation, not a code problem. Fall back entirely to `mcp__Claude_Browser__javascript_tool`: find elements via `document.querySelector`/`querySelectorAll`, click with the real DOM `.click()` method, read state via `document.body.innerText` / `localStorage.getItem('lumabonga:v1')`.
- Give each `javascript_tool` call its own IIFE (`(function(){ ... })()`) — bare top-level `const`/`let` persist across separate calls on the same page and throw "already declared" on reuse.
- Check state in a **separate** tool call after a click, not the same script — React's render can lag a tick.
- **Never write a straight apostrophe `'` inside a single-quoted French string literal or its dictionary key** — this exact mistake broke production once already on this project (a straight apostrophe inside `'...l'instant...'` terminated the string early, causing a file-wide parse error and a blank screen for every user). Use the curly `'` for every French elision (`l'instant`, `d'un`, etc.), matching the established convention already used throughout `lumabonga-data.jsx`. After any i18n edit, load the page and confirm `document.getElementById('root').children.length > 0` before considering the task done.
- Follow existing code style exactly: 2-space indent, inline styles as JS objects, `tr('French source string')` for every user-facing string, EN/ID entries added to the dictionaries in lumabonga-data.jsx (Task 3 of this plan) — French is the source language, do not add a "French dictionary."
- Reuse existing helpers already global in this file set: `todayISO()`, `fmtDate(iso)`, `fmtDay(iso)`, `LB_LOCALE` (all defined in lumabonga-data.jsx, usable bare in lumabonga-creative.jsx per this codebase's UMD/global-script convention — confirm this pattern already works by checking any existing cross-file bare reference, e.g. `tr(...)` itself, before assuming a new one does).

---

### Task 1: Deadline fields (dueDate + time) on add/edit forms, overdue highlighting

**Files:**
- Modify: `lumabonga-creative.jsx` (`CreaTodos` — add form; `CreaTodoRow` — edit form + static display)

**Interfaces:**
- Produces (consumed by Task 2): todos may now carry `dueDate` (`"YYYY-MM-DD"` or absent) and `time` (`"HH:MM"` or absent, only meaningful alongside `dueDate`). No new store functions — `store.addTodo(patch)`/`store.updateTodo(id, patch)` already accept these keys generically.
- Consumes: nothing new — `store.todos`, `store.addTodo`, `store.updateTodo`, `todayISO()`, `fmtDate()`, `fmtDay()` all already exist.

- [ ] **Step 1: Add `dueDate`/`time` state and inputs to the quick-add form**

In `lumabonga-creative.jsx`, inside `CreaTodos`, find the state declarations (current lines 1511-1518):

```jsx
  const [text, setText] = React.useState('');
  const [assignees, setAssignees] = React.useState(() => store.team[0] ? [store.team[0]] : []);
  const [priority, setPriority] = React.useState('medium');
  const [addingMember, setAddingMember] = React.useState(false);
  const [memberDraft, setMemberDraft] = React.useState('');
  const [editingId, setEditingId] = React.useState(null);
  const [personFilter, setPersonFilter] = React.useState(null);  // team member name, or null = everyone
  const [doneOpen, setDoneOpen] = React.useState(false);  // "Completed" fold — closed by default
```

Replace with:

```jsx
  const [text, setText] = React.useState('');
  const [assignees, setAssignees] = React.useState(() => store.team[0] ? [store.team[0]] : []);
  const [priority, setPriority] = React.useState('medium');
  const [dueDate, setDueDate] = React.useState('');  // "" = no deadline; the add form and the calendar strip below share this one field
  const [time, setTime] = React.useState('');        // "" = no specific time; only meaningful alongside dueDate
  const [addingMember, setAddingMember] = React.useState(false);
  const [memberDraft, setMemberDraft] = React.useState('');
  const [editingId, setEditingId] = React.useState(null);
  const [personFilter, setPersonFilter] = React.useState(null);  // team member name, or null = everyone
  const [doneOpen, setDoneOpen] = React.useState(false);  // "Completed" fold — closed by default
```

Find the `add` function (current lines 1528-1534):

```jsx
  const add = () => {
    const txt = text.trim();
    if (!txt || !assignees.length) return;
    store.addTodo({ text: txt, assignees, priority });
    setText('');
    setPriority('medium');
  };
```

Replace with:

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

Find the priority block's closing and the "Ajouter" button (current lines 1594-1613):

```jsx
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
          <button onClick={add} disabled={!text.trim() || !assignees.length} style={{
            width: '100%', marginTop: 12, padding: '12px', borderRadius: 999,
            cursor: (text.trim() && assignees.length) ? 'pointer' : 'default', border: 'none',
            background: c.accent, color: c.inkContrast, opacity: (text.trim() && assignees.length) ? 1 : 0.45,
            fontFamily: creaSans, fontSize: 14, fontWeight: 700,
          }}>{tr('Ajouter')}</button>
```

Replace with (inserting the deadline fields between the priority row and the Ajouter button):

```jsx
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
          <div style={{ fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase', color: c.mutedSoft, fontWeight: 600, fontFamily: creaSans, margin: '10px 0 6px' }}>
            {tr('Échéance (optionnel)')}
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{
              flex: 1, boxSizing: 'border-box', background: c.panel2, color: c.text,
              border: `1px solid ${c.border}`, borderRadius: 10, padding: '9px 11px',
              fontFamily: creaSans, fontSize: 13, outline: 'none',
            }} />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={!dueDate} style={{
              width: 100, boxSizing: 'border-box', background: c.panel2, color: c.text,
              border: `1px solid ${c.border}`, borderRadius: 10, padding: '9px 11px',
              fontFamily: creaSans, fontSize: 13, outline: 'none', opacity: dueDate ? 1 : 0.5,
            }} />
          </div>
          <button onClick={add} disabled={!text.trim() || !assignees.length} style={{
            width: '100%', marginTop: 12, padding: '12px', borderRadius: 999,
            cursor: (text.trim() && assignees.length) ? 'pointer' : 'default', border: 'none',
            background: c.accent, color: c.inkContrast, opacity: (text.trim() && assignees.length) ? 1 : 0.45,
            fontFamily: creaSans, fontSize: 14, fontWeight: 700,
          }}>{tr('Ajouter')}</button>
```

- [ ] **Step 2: Add `dueDate`/`time` state and inputs to the edit form, in `CreaTodoRow`**

Find (current lines 1722-1732):

```jsx
function CreaTodoRow({ td, store, c, card, dark, editing, onEdit, onCloseEdit }) {
  const [text, setText] = React.useState(td.text);
  const [assignees, setAssignees] = React.useState(() => td.assignees || (td.assignee ? [td.assignee] : []));
  const [priority, setPriority] = React.useState(td.priority || 'medium');
  React.useEffect(() => {
    if (editing) {
      setText(td.text);
      setAssignees(td.assignees || (td.assignee ? [td.assignee] : []));
      setPriority(td.priority || 'medium');
    }
  }, [editing]);
```

Replace with:

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

Find `save` (current lines 1737-1742):

```jsx
  const save = () => {
    const txt = text.trim();
    if (!txt || !assignees.length) return;
    store.updateTodo(td.id, { text: txt, assignees, priority });
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
    // null explicitly rather than omitting the key.
    store.updateTodo(td.id, {
      text: txt, assignees, priority,
      dueDate: dueDate || null,
      time: (dueDate && time) ? time : null,
    });
    onCloseEdit();
  };
```

Find the priority block inside the edit-mode return and the Annuler/Enregistrer button row (current lines 1766-1791):

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
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={onCloseEdit} style={{
            flex: 1, padding: '10px', borderRadius: 999, cursor: 'pointer',
            background: 'transparent', color: c.muted, border: `1px solid ${c.border}`,
            fontFamily: creaSans, fontSize: 13, fontWeight: 600,
          }}>{tr('Annuler')}</button>
          <button onClick={save} disabled={!text.trim() || !assignees.length} style={{
            flex: 2, padding: '10px', borderRadius: 999, cursor: 'pointer', border: 'none',
            background: c.accent, color: c.inkContrast, opacity: (text.trim() && assignees.length) ? 1 : 0.45,
            fontFamily: creaSans, fontSize: 13, fontWeight: 700,
          }}>{tr('Enregistrer')}</button>
        </div>
```

Replace with (inserting the deadline fields between the priority row and the button row):

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
            flex: 1, boxSizing: 'border-box', background: c.panel2, color: c.text,
            border: `1px solid ${c.border}`, borderRadius: 10, padding: '8px 10px',
            fontFamily: creaSans, fontSize: 12.5, outline: 'none',
          }} />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={!dueDate} style={{
            width: 92, boxSizing: 'border-box', background: c.panel2, color: c.text,
            border: `1px solid ${c.border}`, borderRadius: 10, padding: '8px 10px',
            fontFamily: creaSans, fontSize: 12.5, outline: 'none', opacity: dueDate ? 1 : 0.5,
          }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={onCloseEdit} style={{
            flex: 1, padding: '10px', borderRadius: 999, cursor: 'pointer',
            background: 'transparent', color: c.muted, border: `1px solid ${c.border}`,
            fontFamily: creaSans, fontSize: 13, fontWeight: 600,
          }}>{tr('Annuler')}</button>
          <button onClick={save} disabled={!text.trim() || !assignees.length} style={{
            flex: 2, padding: '10px', borderRadius: 999, cursor: 'pointer', border: 'none',
            background: c.accent, color: c.inkContrast, opacity: (text.trim() && assignees.length) ? 1 : 0.45,
            fontFamily: creaSans, fontSize: 13, fontWeight: 700,
          }}>{tr('Enregistrer')}</button>
        </div>
```

- [ ] **Step 3: Overdue highlighting in the static (non-editing) row**

Find (current lines 1796-1813):

```jsx
  const pid = td.priority || 'medium';
  const pc = prioColor(c, pid);
  const pLabel = (TODO_PRIORITIES.find((p) => p.id === pid) || TODO_PRIORITIES[1]).label;

  return (
    <div style={{ ...card, ...softTintBar(dark, prioHue(pid)), display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', opacity: td.done ? 0.55 : 1 }}>
      <button onClick={() => store.toggleTodo(td.id)} aria-label="toggle" style={{
        width: 24, height: 24, borderRadius: 999, flexShrink: 0, cursor: 'pointer',
        border: `1.5px solid ${td.done ? c.accent : c.border}`,
        background: td.done ? c.accent : 'transparent',
        color: c.inkContrast, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{td.done && <Icon.check width={13} height={13} />}</button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: creaSans, fontSize: 13.5, color: c.text, fontWeight: 500, textDecoration: td.done ? 'line-through' : 'none' }}>{td.text}</div>
        <div style={{ fontFamily: creaMono, fontSize: 10.5, color: c.muted, marginTop: 1 }}>
          {(td.assignees || (td.assignee ? [td.assignee] : [])).join(', ')} · {fmtDate(td.date)}
        </div>
      </div>
```

Replace with:

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
```

- [ ] **Step 4: Manual verification**

1. Start the server (`.claude/launch.json`'s `lumabonga` config, or `npx serve -l 3500 .` if port 3000 is taken — see Global Constraints), open `LumaBonga.html` via the browser tools.
2. Seed a product-free baseline (todos only need `team` to exist for the assignee picker):

```js
const cur = {};
cur.team = ['Pawung', 'Gani'];
cur.todos = [];
localStorage.setItem('lumabonga:v1', JSON.stringify(cur));
location.reload();
```

3. Navigate to "To do". In the add form, type a task, pick an assignee, set a due date to **yesterday's date** (compute it from today), leave time blank, click "Ajouter". Confirm the new row appears tinted red (overdue) with "Échéance {yesterday's day/month}" shown after the assignee/creation-date line, and no time shown.
4. Add a second task with a due date of **today** and a time (e.g. 14:30). Confirm this row is NOT red-tinted (not overdue — today, not past) and shows the time appended after the date.
5. Add a third task with no due date at all. Confirm it renders exactly as todos did before this change (no "Échéance" text, normal priority tint).
6. Toggle the first (overdue) task done. Confirm the red tint is replaced by the normal priority tint (dimmed 0.55 opacity, per the existing done-state styling) — overdue-but-done should not stay red, matching `!td.done` in the `overdue` condition.
7. Edit the third (undated) task via its pencil icon — confirm the edit form shows empty date/time inputs, set a due date, save, confirm it now shows "Échéance" text and behaves like the others.
8. Edit the second (dated) task and clear its date field, save — confirm the "Échéance" text disappears (proves the edit form's explicit `null`-on-empty write works, distinct from the add form's omit-the-key behavior).
9. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 5: Commit**

```bash
git add lumabonga-creative.jsx
git commit -m "Add optional deadline (date+time) to todos, red overdue highlight

Reuses store.addTodo/updateTodo's existing generic patch-merge — no
data-layer changes needed. Deadline is fully separate from the
existing creation-date field. Overdue = has a past dueDate and isn't
done yet; takes visual precedence over the existing priority tint."
```

---

### Task 2: Calendar day strip (today + next 6 days) above the task list

**Files:**
- Modify: `lumabonga-creative.jsx` (`CreaTodos`)

**Interfaces:**
- Consumes: `dueDate`/`time` fields on todos (Task 1), `store.todos`, `todayISO()`, `fmtDay()`, `LB_LOCALE`, the existing `dueDate`/`setDueDate` state already living in `CreaTodos` from Task 1 (selecting a day in the strip sets this same state, so the add form above it becomes "armed" for that day — no separate "+" button or second form needed).
- Produces: nothing new exported.

- [ ] **Step 1: Add day-list state and derived data**

In `lumabonga-creative.jsx`, inside `CreaTodos`, find (current lines, right after Task 1's new `dueDate`/`time` state — search for the `assigneesOf`/`matchesFilter`/`open`/`done` block):

```jsx
  const assigneesOf = (td) => td.assignees || (td.assignee ? [td.assignee] : []);
  const matchesFilter = (td) => !personFilter || assigneesOf(td).includes(personFilter);
  const open = byPriority(store.todos.filter((x) => !x.done && matchesFilter(x)));
  const done = byPriority(store.todos.filter((x) => x.done && matchesFilter(x)));
```

Replace with (adding the calendar's own state and derived lists right after the existing ones — the plain list below is completely unaffected, both views read the same `store.todos`):

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
    const base = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      days.push(d.toISOString().slice(0, 10));
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

- [ ] **Step 2: Render the day strip + selected-day list**

Find the boundary between the add-form block and the "Task list" section header (current lines, right after the add-form's closing `</div>` and before `{/* Task list */}`):

```jsx
        </div>
      </div>

      {/* Task list */}
      <CreaSection title={tr('Tâches')} right={`${open.length}`} dark={dark} t={t} />
```

Replace with (inserting the whole calendar block between them):

```jsx
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
                {new Date(iso).toLocaleDateString(LB_LOCALE, { weekday: 'short' })}
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
      <CreaSection title={tr('Tâches')} right={`${open.length}`} dark={dark} t={t} />
```

- [ ] **Step 3: Manual verification**

1. Open `LumaBonga.html`, seed `team` and an empty `todos` array as in Task 1, reload.
2. Navigate to "To do". Confirm a 7-cell day strip renders, today's cell visually larger/emphasized (bigger date number, accent-colored border when selected — it should be selected by default since `selectedDay` initializes to `todayISO()`), the other 6 cells smaller.
3. Confirm the selected-day area below the strip shows "Rien de prévu ce jour-là." (empty state) for today with no todos yet.
4. In the add form above, add a task with today's date and a time — confirm it immediately appears in the selected-day list below the strip (still on today), sorted correctly if you add a second one with an earlier time (earlier time should sort first).
5. Add an untimed task also dated today — confirm it sorts before the timed one(s) (untimed-first ordering).
6. Tap a different day cell (e.g. 3 days from now) — confirm `selectedDay` updates (border/accent moves to that cell) and the list below switches to that day's tasks (should be empty), AND confirm the add form's date field above now shows that same future date (proves the shared-state "arm the form" behavior).
7. Add a task from the add form while that future day is selected — confirm it appears under that day when re-selected, not under today.
8. Re-select today. Seed (via localStorage edit + reload) or create via the edit-form-with-past-date trick from Task 1 an overdue task — confirm it appears in a separate "En retard" group above today's own list, red-tinted (reusing Task 1's `overdue` styling via `CreaTodoRow`).
9. Confirm the plain "Tâches" list further down the page still shows ALL todos (dated and undated, open ones), unaffected by which calendar day is selected — the calendar is a second lens on the same data, not a filter on the plain list.
10. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 4: Commit**

```bash
git add lumabonga-creative.jsx
git commit -m "Add 7-day calendar strip above the to-do list

Selecting a day shows that day's scheduled todos (chronological, untimed
first) and arms the add form above with that date, so creating a task
while a day is selected schedules it there without a separate creation
flow. Overdue items group above today's own list when today is selected.
Reuses CreaTodoRow for entries so toggle/edit/delete stay identical
everywhere a todo appears — the plain task list further down is
unaffected, both views read the same store.todos."
```

---

### Task 3: i18n — EN + ID translations for the new strings

**Files:**
- Modify: `lumabonga-data.jsx` (EN dictionary)
- Modify: `lumabonga-data.jsx` (ID dictionary)

**Interfaces:** none (pure data addition).

- [ ] **Step 1: Add EN entries**

In `lumabonga-data.jsx`'s EN dictionary object, add:

```jsx
  'Échéance (optionnel)': 'Deadline (optional)',
  'Échéance': 'Deadline',
  'En retard': 'Overdue',
  'Rien de prévu ce jour-là.': 'Nothing scheduled for this day.',
```

- [ ] **Step 2: Add ID entries**

In `lumabonga-data.jsx`'s ID dictionary object, add:

```jsx
  'Échéance (optionnel)': 'Tenggat (opsional)',
  'Échéance': 'Tenggat',
  'En retard': 'Terlambat',
  'Rien de prévu ce jour-là.': 'Tidak ada rencana hari itu.',
```

- [ ] **Step 3: Manual verification**

1. Open `LumaBonga.html` with a seeded overdue todo and an empty-day selection (per Task 1/2's seeds).
2. Switch language to EN — confirm "Deadline (optional)" in the add form, "Deadline" prefix in a dated row, "Overdue" group label, "Nothing scheduled for this day." empty state all show correctly.
3. Switch to ID — confirm the Indonesian strings show.
4. Check console for `tr()` missing-key warnings — expected: none. Also re-confirm `document.getElementById('root').children.length > 0` after switching languages (per this plan's Global Constraints note on the prior apostrophe-outage — cheap, always worth doing after any i18n edit).
5. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 4: Commit**

```bash
git add lumabonga-data.jsx
git commit -m "Add EN/ID translations for the to-do calendar feature"
```

---

### Task 4: Deploy, verify against real production data

**Files:** none (verification-only against the live Supabase-backed app, `https://luma-bonga.vercel.app`).

**Interfaces:** none.

- [ ] **Step 1: Push and confirm deploy**

```bash
git push
```

Wait for the Vercel deploy, then **immediately** load the deployed URL and confirm `document.getElementById('root').children.length > 0` with no console errors, before doing anything else — this repo has had a real production outage from an i18n edit before; this check is not optional.

- [ ] **Step 2: Sign in**

Open `https://luma-bonga.vercel.app` in the browser tools. If it shows an access-code screen, ask the user to sign in — do not attempt to enter or guess the code.

- [ ] **Step 3: Read-only verification on real data**

1. Navigate to "To do". Confirm the day strip renders with today emphasized, real dates.
2. Confirm the existing (real) todos still display correctly in both the plain list and — for any that happen to already have no `dueDate` (all of them, since this field didn't exist before this plan) — confirm they're simply absent from every calendar day's list and show no "Échéance" text, i.e. fully backward compatible with zero data migration needed.
3. Optionally (only if the user is present and confirms it's fine to create real data): add one real test todo with a near-future date to confirm the end-to-end flow works on production, then delete it via the trash icon to leave no residue. Otherwise, skip any data-mutating step and rely on the read-only checks above.

- [ ] **Step 4: Report to user**

Summarize what was verified on production and confirm no unintended real data was created or left behind.

---

## Self-Review Notes

- **Spec coverage:** every section of `docs/superpowers/specs/2026-08-05-todo-calendar-design.md` maps to a task — separate `dueDate` field (not repurposing creation `date`) → Task 1, overdue red highlight → Task 1, 7-day strip with today emphasized → Task 2, assignment (already supported, untouched) → n/a, i18n → Task 3, deploy/verify → Task 4. Out-of-scope items (month/week view, recurring tasks, time zones, drag-to-reschedule) are simply not built.
- **Deviation from the spec, and why:** the spec's UI section described a "+" affordance on the day strip to create a task for that day. This plan drops the separate "+" entirely: selecting a day cell both shows that day's list AND sets the (already-existing, Task-1-added) add form's `dueDate` state to that day, since both live in the same `CreaTodos` component and the add form already sits directly above the strip. This is a strict simplification, not a scope cut — the same end-to-end capability (create a task scheduled for a specific day, without extra clicks) is delivered with less new UI surface and no duplicated creation flow.
- **Type/name consistency check:** `dueDate`/`time` are read and written with these exact names in both the add form (Task 1) and edit form (Task 1), and read (never written) by the calendar strip (Task 2) via `store.todos` directly — no prop-drilling, no duplicated field names. `overdue` is computed identically (same expression) in the one place it's needed (`CreaTodoRow`'s static render) and naturally applies wherever that component is used, including inside Task 2's day lists — confirmed by inspection, not duplicated logic.
- **Ordering rationale:** Task 1 (fields + highlighting) before Task 2 (calendar) is required — the calendar has nothing to show without `dueDate` existing. Task 3 (i18n) after both UI tasks, matching this project's established convention of translating once the exact final strings are settled, not mid-flight.
