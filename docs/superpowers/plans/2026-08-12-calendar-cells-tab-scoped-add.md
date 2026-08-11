# Calendar cell text, tab-scoped "+" button, tab-scoped period picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show scheduled-item text (not just dots) inside each calendar grid cell with today emphasized, make the top-bar "+" button only offer entries relevant to the active tab, and only show the period picker on tabs whose content it actually filters.

**Architecture:** Three cohesive edits to the existing plain-script-tag React app (`lumabonga-creative.jsx`, `lumabonga-stock.jsx`) — no new files, no new components, no data-layer changes. Task 1 touches only the calendar grid's render block inside `CreaTodos`. Task 2 touches `CreaTopBar`, `CreaAddSheet`, `CreaApp`, and `CreaStock` to make the "+" button and period picker tab-aware.

**Tech Stack:** React 18 UMD (no bundler), Babel Standalone in-browser JSX transpile, Supabase-backed store (`lumabonga-data.jsx`, untouched by this plan).

## Global Constraints

- Never a straight apostrophe (`'`) inside a single-quoted French string literal — use a curly apostrophe (`'`) instead, or the file throws a parse error that blanks the app for every real user (this has happened before in this project). This plan introduces zero new user-facing strings (see spec's i18n section), so this mostly matters if you touch anything else in passing — don't.
- After every push to `main`, verify live: `document.getElementById('root').children.length > 0` and zero new console errors. This is mandatory, not optional.
- The Browser pane's `computer` tool (screenshot/coordinate clicks) fails inside subagent sandboxes with "the Browser pane is not displayed, so the page is not compositing frames." Use ref-based `computer` clicks or pure `javascript_tool` DOM manipulation (`document.querySelector(...).click()`) instead — both work without needing visual compositing.
- Direct commits to `main` — this project's established convention for this whole session's work. No new branch.
- This app has real production data and real users. Test additively (create/delete your own test rows) and clean up test data before finishing each task's verification.

---

### Task 1: Calendar grid cells — show item text, today taller

**Files:**
- Modify: `lumabonga-creative.jsx:1654-1682` (the `next14Days.map(...)` block inside `CreaTodos`)

**Interfaces:**
- Consumes: `next14Days` (array of ISO date strings, already defined above this block), `today` (ISO string, already defined above this block), `selectedDay`/`setSelectedDay`, `dueDate`/`setDueDate` (already defined above this block), `byTime` (function, already defined at `lumabonga-creative.jsx:1602`, sorts an array of todos untimed-first then chronological by `.time`), `store.todos` (array of `{ id, text, kind, dueDate, ... }`).
- Produces: nothing new consumed by later tasks — this is a leaf render change.

- [ ] **Step 1: Replace the grid cell render block**

Find this exact block at `lumabonga-creative.jsx:1654-1682`:

```jsx
      <div style={{ padding: '18px 22px 4px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
        {next14Days.map((iso, i) => {
          const isToday = iso === today;
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
```

Replace it with:

```jsx
      <div style={{ padding: '18px 22px 4px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
        {next14Days.map((iso, i) => {
          const isToday = iso === today;
          const sel = selectedDay === iso;
          // Text preview, not just a dot: up to 4 lines per cell. More than
          // 4 items that day shows the first 3 plus a "+N" line (bare
          // number, no tr() needed) rather than growing the cell — every
          // non-today cell must stay the same height so the grid doesn't
          // jump as items are added/removed on other days.
          const dayItems = byTime(store.todos.filter((x) => x.dueDate === iso));
          const overflowN = dayItems.length > 4 ? dayItems.length - 3 : 0;
          const previewItems = overflowN > 0 ? dayItems.slice(0, 3) : dayItems;
          const lineH = isToday ? 13 : 10;
          return (
            <button key={iso} onClick={() => { setSelectedDay(iso); setDueDate(iso); }} style={{
              padding: isToday ? '9px 4px' : '6px 3px',
              borderRadius: 12, cursor: 'pointer',
              border: `1px solid ${sel ? c.accent : c.border}`,
              background: sel ? `${c.accent}1c` : c.panel2,
              display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 2,
              minWidth: 0,
            }}>
              <span style={{ fontFamily: creaSans, fontSize: isToday ? 10.5 : 8.5, fontWeight: 700, color: sel ? c.accent : c.mutedSoft, textTransform: 'uppercase', textAlign: 'center' }}>
                {new Date(iso).toLocaleDateString(LB_LOCALE, { weekday: 'short', timeZone: 'UTC' })}
              </span>
              <span style={{ fontFamily: creaDisplay, fontSize: isToday ? 20 : 13, fontWeight: 700, color: sel ? c.accent : c.text, textAlign: 'center' }}>
                {iso.slice(8, 10)}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 1, height: lineH * 4, marginTop: 2, width: '100%', minWidth: 0 }}>
                {previewItems.map((x) => (
                  <span key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%', minWidth: 0 }}>
                    <span style={{ width: 4, height: 4, borderRadius: 999, flexShrink: 0, background: x.kind === 'activity' ? c.mutedSoft : c.rose }} />
                    <span style={{
                      flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      fontFamily: creaSans, fontSize: isToday ? 8.5 : 7, fontWeight: 600, color: c.text, lineHeight: `${lineH}px`,
                    }}>{x.text}</span>
                  </span>
                ))}
                {overflowN > 0 && (
                  <span style={{ fontFamily: creaMono, fontSize: isToday ? 8.5 : 7, fontWeight: 700, lineHeight: `${lineH}px`, color: c.mutedSoft }}>
                    +{overflowN}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
```

Note: `hasTask`/`hasActivity` are gone — the two dot indicators they drove are replaced by the per-item colored-dot-plus-text lines above, so nothing else in this file should still reference them (there's no other use — they were locals scoped to this one `.map()` callback).

- [ ] **Step 2: Verify no leftover references**

Run: search `lumabonga-creative.jsx` for `hasTask` and `hasActivity` — both should return zero matches (they only ever existed inside the block you just replaced).

- [ ] **Step 3: Live-browser verification**

Serve the repo root as a static site and open `LumaBonga.html` in the Browser pane (see this project's existing dev workflow — no build step). Then, using `javascript_tool`:
- `document.getElementById('root').children.length` → must be `1`.
- `read_console_messages` → zero new JS/React errors (a pre-existing unrelated 404 for a design-tool artifact file is expected and fine).
- Navigate to the To do tab. Create 5 test todos/activities all with the same `dueDate` set to today (mix of `kind: 'task'` and `kind: 'activity'`, e.g. via the add-form). Confirm via `read_page` or `javascript_tool` DOM query: today's grid cell shows exactly 3 item-text lines plus a line reading `+2`, and the first 3 lines' dot colors match each item's kind (light red for tasks, gray for activities).
- Create a 6th test todo with `dueDate` set to tomorrow (≤4 items on that day, e.g. just 1). Confirm tomorrow's cell shows that 1 item's text directly (no `+N` line), and every non-today cell (with 0, 1, or the +N case) is the same height — check via `javascript_tool`, e.g. compare `getBoundingClientRect().height` across a few cells with different item counts.
- Confirm today's cell is visibly taller than the others and its text is a larger font size (compare `getBoundingClientRect().height` and computed `font-size` today vs. a non-today cell).
- Delete all test todos/activities you created, confirm the grid returns to its empty state with no console errors.
- Paste the actual values you observed (real `getBoundingClientRect()` output, real DOM text content) in your task report — not a restatement of what you expected to see.

- [ ] **Step 4: Commit**

```bash
git add lumabonga-creative.jsx
git commit -m "Show item text (not just dots) in calendar grid cells, today taller"
```

---

### Task 2: Tab-scoped "+" button and period picker

**Files:**
- Modify: `lumabonga-creative.jsx` — `CreaTopBar` (~line 181-211), `CreaAddSheet` (~line 2151, 2266-2273, 2323-2329), `CreaApp` (~line 2674-2708)
- Modify: `lumabonga-stock.jsx` — `CreaStock` (~line 165-188)

**Interfaces:**
- Consumes: nothing from Task 1 (independent leaf change elsewhere in the same component).
- Produces: nothing consumed by Task 3 (Task 3 is deploy/verify only).

- [ ] **Step 1: Make `CreaStock`'s segment toggle controllable from outside**

`CreaStock` currently owns its Matières/Produits-finis segment as fully local state, so nothing outside the component can read or default off it — needed because the "+" button (which lives in `CreaTopBar`, a sibling, not a child, of `CreaStock`) must default to the segment the user currently has open.

Find in `lumabonga-stock.jsx`:

```js
function CreaStock({ store, dark, t, onEdit, onAdd, onOpen, role }) {
  const c = creaTheme(dark, t.accent);
  const [seg, setSeg] = React.useState('mat');
```

Replace with:

```js
function CreaStock({ store, dark, t, onEdit, onAdd, onOpen, role, seg: segProp, onSegChange }) {
  const c = creaTheme(dark, t.accent);
  // Controlled/uncontrolled hybrid: CreaApp now needs to read which
  // segment (Matières/Produits finis) is active, to default the top-bar
  // "+" button's kind to match what's on screen. Falls back to fully
  // local state if no controlling props are passed, so any other caller
  // of this component keeps working unchanged.
  const [segState, setSegState] = React.useState('mat');
  const seg = segProp !== undefined ? segProp : segState;
  const setSeg = onSegChange || setSegState;
```

Every other reference to `seg`/`setSeg` inside `CreaStock` (the `CreaHero` label, the `StkSegment` component, the two `seg === 'mat'`/`seg === 'prod'` render branches) stays exactly as-is — they already just read the `seg`/`setSeg` names, which now resolve to the controlled value when provided.

- [ ] **Step 2: Give `CreaAddSheet` an optional kind-restriction**

Find in `lumabonga-creative.jsx`:

```js
function CreaAddSheet({ store, dark, t, kind, setKind, editing, onClose }) {
```

Replace with:

```js
function CreaAddSheet({ store, dark, t, kind, setKind, editing, onClose, restrictKinds }) {
```

Find (still in `CreaAddSheet`, a bit further down):

```js
  const kinds = [
    { id: 'sale', label: 'Vente' },
    { id: 'buy', label: 'Achat' },
    { id: 'cost', label: 'Charge' },
    { id: 'production', label: 'Production' },
    { id: 'material', label: 'Matière' },
    { id: 'product', label: 'Produit' },
  ];
```

Add right after it:

```js
  // The generic top-bar "+" passes a tab-derived restrictKinds array so
  // it only ever offers what's relevant to the tab it was opened from
  // (e.g. Sales tab -> only "Vente", never "Production"). Every explicit
  // tab-specific add button (the Achat/Charge rows in Purchases, the
  // Production row in Stock, the Nouveau produit button in Produits)
  // still passes nothing here and keeps the full unrestricted picker.
  const visibleKinds = restrictKinds ? kinds.filter((k) => restrictKinds.includes(k.id)) : kinds;
```

Find:

```js
        {!isEdit && kind !== 'settlement' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {kinds.map((k) => (
              <button key={k.id} onClick={() => setKind(k.id)} style={pill(kind === k.id)}>{tr(k.label)}</button>
            ))}
          </div>
        )}
```

Replace with (only the `kinds` → `visibleKinds` swap, plus a `visibleKinds.length > 1` gate so a single-kind restriction — Sales, Produits — shows no pill row at all, since there's nothing to switch between):

```js
        {!isEdit && kind !== 'settlement' && visibleKinds.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {visibleKinds.map((k) => (
              <button key={k.id} onClick={() => setKind(k.id)} style={pill(kind === k.id)}>{tr(k.label)}</button>
            ))}
          </div>
        )}
```

Leave the sheet's title (`kinds.find((k) => k.id === kind)?.label`, a few lines above) reading from the full `kinds` array, unchanged — the title must resolve regardless of restriction.

- [ ] **Step 3: Make `CreaTopBar` hide the "+" button per-tab**

Find in `lumabonga-creative.jsx`:

```js
function CreaTopBar({ store, dark, t, onAdd, readonly, hidePeriod }) {
```

Replace with:

```js
function CreaTopBar({ store, dark, t, onAdd, readonly, hidePeriod, hideAdd }) {
```

Find:

```js
      {!readonly && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!hidePeriod && <CreaMonthPicker store={store} dark={dark} t={t} />}
          <button onClick={onAdd} aria-label="+" style={{
            width: 34, height: 34, borderRadius: 999,
            background: c.ink, color: c.inkContrast, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon.plus />
          </button>
        </div>
      )}
```

Replace with:

```js
      {!readonly && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!hidePeriod && <CreaMonthPicker store={store} dark={dark} t={t} />}
          {!hideAdd && (
            <button onClick={onAdd} aria-label="+" style={{
              width: 34, height: 34, borderRadius: 999,
              background: c.ink, color: c.inkContrast, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon.plus />
            </button>
          )}
        </div>
      )}
```

- [ ] **Step 4: Wire tab-scoping in `CreaApp`**

Find in `lumabonga-creative.jsx`:

```js
function CreaApp({ t, dark, role }) {
  const c = creaTheme(dark, t.accent);
  const store = useLumaStore(undefined, t.lumayaShare);
  const allowed = ALLOWED_TABS[role] || ALLOWED_TABS.admin;
  const [tab, setTab] = React.useState(allowed[0]);
  // If the role can't see the current tab, snap to its first allowed tab.
  if (!allowed.includes(tab)) { setTab(allowed[0]); }
  const [adding, setAdding] = React.useState(null);      // kind string
  const [editing, setEditing] = React.useState(null);    // entry data being edited

  const defaultKind = (tb) => ({ sales: 'sale', buys: 'buy', stock: 'production', prods: 'product' }[tb] || 'sale');
  const openAdd = (k) => { setEditing(null); setAdding(typeof k === 'string' ? k : defaultKind(tab)); };
  const openEdit = (k, data) => { setEditing(data); setAdding(k); };
  const closeSheet = () => { setAdding(null); setEditing(null); };
  const goTab = (id) => { setTab(id); };
```

Replace with:

```js
function CreaApp({ t, dark, role }) {
  const c = creaTheme(dark, t.accent);
  const store = useLumaStore(undefined, t.lumayaShare);
  const allowed = ALLOWED_TABS[role] || ALLOWED_TABS.admin;
  const [tab, setTab] = React.useState(allowed[0]);
  // If the role can't see the current tab, snap to its first allowed tab.
  if (!allowed.includes(tab)) { setTab(allowed[0]); }
  const [adding, setAdding] = React.useState(null);      // kind string
  const [editing, setEditing] = React.useState(null);    // entry data being edited
  // Lifted out of CreaStock so the top-bar "+" (a sibling component) can
  // default its kind to whichever segment (Matières/Produits finis) is
  // currently open on the Stock tab.
  const [stockSeg, setStockSeg] = React.useState('mat');
  // Which kinds the generic top-bar "+" is allowed to offer, per tab —
  // null means unrestricted (only ever used for explicit-kind opens, see
  // openAdd below). Dash and To do have no entry here: their "+" is
  // hidden entirely (see hideAdd on CreaTopBar below).
  const KIND_RESTRICT_BY_TAB = {
    sales: ['sale'],
    buys: ['buy', 'cost'],
    stock: ['material', 'product'],
    prods: ['product'],
  };
  const [addRestrict, setAddRestrict] = React.useState(null);

  const defaultKind = (tb) => ({ sales: 'sale', buys: 'buy', stock: 'production', prods: 'product' }[tb] || 'sale');
  const openAdd = (k) => {
    setEditing(null);
    if (typeof k === 'string') {
      // Explicit-kind open (a tab's own "Nouvelle facture d'achat" /
      // "Nouvelle charge" / "Lancer une production" / "Nouveau produit"
      // row, or Dashboard's "Règlement" button) — always unrestricted,
      // exactly as before this plan.
      setAdding(k);
      setAddRestrict(null);
    } else {
      // Generic top-bar "+" — restrict to what's relevant on this tab.
      const restrict = KIND_RESTRICT_BY_TAB[tab] || null;
      const initialKind = tab === 'stock'
        ? (stockSeg === 'mat' ? 'material' : 'product')
        : (restrict ? restrict[0] : defaultKind(tab));
      setAdding(initialKind);
      setAddRestrict(restrict);
    }
  };
  const openEdit = (k, data) => { setEditing(data); setAdding(k); setAddRestrict(null); };
  const closeSheet = () => { setAdding(null); setEditing(null); setAddRestrict(null); };
  const goTab = (id) => { setTab(id); };
```

(`openEdit` now also resets `addRestrict` to `null` — editing an existing entry must never be kind-restricted, matching `CreaAddSheet`'s own `!isEdit` guard on the pill row, and guarding against a stale restriction left over from a previous generic-"+" open leaking into an edit sheet.)

Find:

```js
        <CreaTopBar store={store} dark={dark} t={t} onAdd={() => openAdd()} readonly={role === 'public'} hidePeriod={role === 'staff'} />
        {tab === 'dash' && <CreaDashboard store={store} dark={dark} t={t} onAdd={openAdd} onEdit={openEdit} />}
        {tab === 'sales' && <CreaTxScreen store={store} dark={dark} t={t} kind="sale" onEdit={openEdit} role={role} />}
        {tab === 'buys' && <CreaPurchases store={store} dark={dark} t={t} onEdit={openEdit} onAdd={openAdd} />}
        {tab === 'stock' && <CreaStock store={store} dark={dark} t={t} onEdit={openEdit} onAdd={openAdd} onOpen={(p) => goTab('prods')} role={role} />}
        {tab === 'prods' && <CreaProducts store={store} dark={dark} t={t} onAdd={openAdd} onEdit={openEdit} readonly={role === 'public'} />}
        {tab === 'todos' && <CreaTodos store={store} dark={dark} t={t} />}
      </div>
      <CreaNav value={tab} onChange={goTab} dark={dark} t={t} role={role} />
      {adding && <CreaAddSheet store={store} dark={dark} t={t} kind={adding} setKind={setAdding} editing={editing} onClose={closeSheet} />}
```

Replace with:

```js
        <CreaTopBar store={store} dark={dark} t={t} onAdd={() => openAdd()} readonly={role === 'public'}
          hidePeriod={role === 'staff' || !['dash', 'sales', 'buys'].includes(tab)}
          hideAdd={['dash', 'todos'].includes(tab)} />
        {tab === 'dash' && <CreaDashboard store={store} dark={dark} t={t} onAdd={openAdd} onEdit={openEdit} />}
        {tab === 'sales' && <CreaTxScreen store={store} dark={dark} t={t} kind="sale" onEdit={openEdit} role={role} />}
        {tab === 'buys' && <CreaPurchases store={store} dark={dark} t={t} onEdit={openEdit} onAdd={openAdd} />}
        {tab === 'stock' && <CreaStock store={store} dark={dark} t={t} onEdit={openEdit} onAdd={openAdd} onOpen={(p) => goTab('prods')} role={role} seg={stockSeg} onSegChange={setStockSeg} />}
        {tab === 'prods' && <CreaProducts store={store} dark={dark} t={t} onAdd={openAdd} onEdit={openEdit} readonly={role === 'public'} />}
        {tab === 'todos' && <CreaTodos store={store} dark={dark} t={t} />}
      </div>
      <CreaNav value={tab} onChange={goTab} dark={dark} t={t} role={role} />
      {adding && <CreaAddSheet store={store} dark={dark} t={t} kind={adding} setKind={setAdding} editing={editing} onClose={closeSheet} restrictKinds={addRestrict} />}
```

- [ ] **Step 5: Live-browser verification**

Using the same dev-server setup as Task 1:
- `document.getElementById('root').children.length` → `1`, zero new console errors.
- Dash tab: confirm no "+" button renders in the top bar (query for `button[aria-label="+"]` → should not be found while on this tab), but the period picker ("Août 2026"/"Tout") still renders. Confirm Dashboard's "Règlement" button (if a settlement is currently suggestable) still opens its sheet correctly.
- To do tab: confirm no "+" renders, and the existing inline add-form below the calendar still works (add and then delete a test todo).
- Sales tab: tap "+", confirm the sheet opens titled "Vente" with **no** kind pill row visible at all (query the DOM — the pill row's container should not be present, since Sales only has one valid kind). Confirm the period picker is visible on this tab. Close without saving.
- Purchases tab: tap "+", confirm exactly 2 kind pills render (Achat, Charge), confirm the period picker is visible. Tap the "Charge" pill, confirm the sheet's title/fields switch to Charge. Close without saving.
- Stock tab: switch to the "Produits finis" segment via `StkSegment`, then tap "+" — confirm the sheet opens already on "Produit" (not "Matière" or "Production"), confirm exactly 2 pills render (Matière, Produit — **not** Production), confirm the period picker is **not** visible on this tab. Switch segment back to "Matières", tap "+" again, confirm it now opens on "Matière". Close without saving. Separately, confirm the tab's own "Lancer une production" row button still opens a Production sheet with the full unrestricted pill row (all 6 kinds) — this must be completely unaffected.
- Produits tab: tap "+", confirm it opens "Produit" with no pill row, confirm the period picker is not visible. Confirm the tab's own "Nouveau produit" button still works identically.
- Purchases tab's own "Nouvelle facture d'achat" and "Nouvelle charge" row buttons: confirm both still open with the full unrestricted 6-kind pill row (unaffected by this change — only the generic top-bar "+" is restricted).
- Paste the actual DOM query results/counts you observed for each of the above — not a restatement of what you expected.

- [ ] **Step 6: Commit**

```bash
git add lumabonga-creative.jsx lumabonga-stock.jsx
git commit -m "Scope + button and period picker to the active tab"
```

---

### Task 3: Deploy and verify against real production data

**Files:** none (verification-only task)

**Interfaces:**
- Consumes: Tasks 1 and 2's committed changes.
- Produces: nothing (terminal task).

- [ ] **Step 1: Push to production**

```bash
git push origin main
```

- [ ] **Step 2: Verify live on the real deployed app**

Open the real production URL (not a local dev server) in the Browser pane. Confirm:
- `document.getElementById('root').children.length > 0`, zero console errors.
- The calendar grid on the To do tab renders real existing todos'/activities' text in-cell (not just dots), today's cell visibly taller.
- The "+" button and period picker show/hide correctly per tab exactly as verified in Task 2, but against real production data and the real deployed bundle (not the dev server).
- Do **not** create throwaway test data against production in a way that leaves it behind — if verification requires creating an entry, delete it immediately after confirming, and re-verify the app is back to a clean state with no console errors.

- [ ] **Step 3: Report**

Write a brief report: what you saw live in production (real DOM output/values, not restated expectations), confirmation the outage check passed, and confirmation no test data was left behind.
