# Profit/Loss Per Party Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each party's (Lumaya/GawahBonga) own realized profit or loss on the Dashboard at all times, and only surface the existing "doit recevoir"/"Régler" settlement suggestion once both parties are individually profitable.

**Architecture:** Almost entirely additive to the existing `totals` memo (lumabonga-data.jsx) that already computes `held`/`entitled`/`balance` for the settlement ledger. Add one new pre-settlement snapshot (`grossHeld`) plus per-org ventes/achats/charges breakdowns, computed in the same org-attribution loops that already exist — no new loops, no new data model. A new always-visible card on the Dashboard (lumabonga-creative.jsx, `CreaDashboard`) shows the per-party breakdown; the existing account-balance block in the same component gets one new conditional branch for the "not both profitable yet" state. The settlement ledger itself (`store.settlements`, add/edit/remove, history list) is untouched and stays always available.

**Tech Stack:** React 18 (UMD, no bundler), Babel Standalone (in-browser JSX transpile), plain `window`-global module wiring across `lumabonga-*.jsx` files, Supabase for persistence.

## Global Constraints

- No test framework exists in this repo. Every "test" step is a **manual browser verification**: seed `localStorage['lumabonga:v1']`, drive `LumaBonga.html` (the no-auth demo canvas at the repo root — same app code, demo data) via `mcp__Claude_Browser__*` tools, and check exact DOM/`localStorage`/`window.__LUMA_INITIAL` output.
- Navigate explicitly to `http://localhost:3000/LumaBonga.html` — the bare root URL can resolve to `index.html` (the real Supabase-backed app, which has a login wall this demo canvas does not).
- If `mcp__Claude_Browser__computer` (screenshot, coordinate/ref clicks) fails with "the Browser pane is not displayed, so the page is not compositing frames" — that's a known sandbox limitation, not a code problem. Fall back entirely to `mcp__Claude_Browser__javascript_tool`: find elements via `document.querySelector`/`querySelectorAll`, click with the real DOM `.click()` method, read state via `document.body.innerText` / `localStorage.getItem('lumabonga:v1')`.
- Give each `javascript_tool` call its own IIFE (`(function(){ ... })()`) — bare top-level `const`/`let` persist across separate calls on the same page and throw "already declared" on reuse.
- Check state in a **separate** tool call after a click, not in the same script immediately after — React's render can lag a tick.
- Follow existing code style exactly: 2-space indent, inline styles as JS objects, `tr('French source string')` for every user-facing string, EN/ID entries added to the dictionaries in lumabonga-data.jsx (Task 4 of this plan) — French is the source language, do not add a "French dictionary."

---

### Task 1: Data layer — `grossHeld` + per-org ventes/achats/charges in `totals`

**Files:**
- Modify: `lumabonga-data.jsx:1135-1145` (the `held`/settlements section of the `totals` `React.useMemo`)
- Modify: `lumabonga-data.jsx:1147-1153` (the memo's return object)

**Interfaces:**
- Produces (consumed by Tasks 2-3): `totals.grossHeld.{lumaya,gawah}` — each party's own sales minus its own purchases minus its own charges, **not** adjusted for settlement transfers (unlike `totals.held`, which is unchanged and still settlement-adjusted). `totals.ventesByOrg.{lumaya,gawah}`, `totals.achatsByOrg.{lumaya,gawah}`, `totals.chargesByOrg.{lumaya,gawah}` — the three components that sum to `grossHeld` for each party.

- [ ] **Step 1: Track per-org gross components and snapshot before the settlements loop**

Find (current lines 1135-1145):

```jsx
    const held = { lumaya: 0, gawah: 0 };
    const orgOf = (x) => (x && x.org === 'gawah') ? 'gawah' : 'lumaya';
    for (const s of sales) held[orgOf(s)] += s.qty * s.price;
    for (const p of purchases) held[orgOf(p)] -= (Number(p.qty) || 0) * (Number(p.price) || 0);
    for (const c of costs) held[orgOf(c)] -= Number(c.amount) || 0;
    for (const st of settlements) {
      const amt = Number(st.amount) || 0;
      if (st.from === 'lumaya') held.lumaya -= amt; else if (st.from === 'gawah') held.gawah -= amt;
      if (st.to === 'lumaya') held.lumaya += amt; else if (st.to === 'gawah') held.gawah += amt;
    }
    const balance = { lumaya: held.lumaya - entitled.lumaya, gawah: held.gawah - entitled.gawah };
```

Replace with:

```jsx
    const held = { lumaya: 0, gawah: 0 };
    const ventesByOrg = { lumaya: 0, gawah: 0 };
    const achatsByOrg = { lumaya: 0, gawah: 0 };
    const chargesByOrg = { lumaya: 0, gawah: 0 };
    const orgOf = (x) => (x && x.org === 'gawah') ? 'gawah' : 'lumaya';
    for (const s of sales) { const v = s.qty * s.price; held[orgOf(s)] += v; ventesByOrg[orgOf(s)] += v; }
    for (const p of purchases) { const v = (Number(p.qty) || 0) * (Number(p.price) || 0); held[orgOf(p)] -= v; achatsByOrg[orgOf(p)] += v; }
    for (const c of costs) { const v = Number(c.amount) || 0; held[orgOf(c)] -= v; chargesByOrg[orgOf(c)] += v; }
    // Snapshot each org's own trading result — sales minus its own
    // purchases and charges — BEFORE settlement transfers are netted into
    // `held` below. Used to gate the settlement suggestion on both orgs
    // being individually profitable. `held` keeps including settlements
    // (money already paid/received) because it answers a different
    // question: "how much cash does this org have right now."
    const grossHeld = { ...held };
    for (const st of settlements) {
      const amt = Number(st.amount) || 0;
      if (st.from === 'lumaya') held.lumaya -= amt; else if (st.from === 'gawah') held.gawah -= amt;
      if (st.to === 'lumaya') held.lumaya += amt; else if (st.to === 'gawah') held.gawah += amt;
    }
    const balance = { lumaya: held.lumaya - entitled.lumaya, gawah: held.gawah - entitled.gawah };
```

- [ ] **Step 2: Export the new values from the memo**

Find (current lines 1147-1153):

```jsx
    return {
      ventes, achats, charges, cogs, profit, marge,
      profitMonth, margeMonth, ventesM, achatsM, chargesM, cogsM, deltaStockMonth,
      valMatieres, valProduits, valStock: valMatieres + valProduits,
      entitled, held, balance,
    };
  }, [sales, purchases, costs, settlements, recipes, materialById, materials, products, productById, materialStock, finishedStock, materialPrices, unitCostFor, cogsOf, shareLumaya, period]);
```

Replace with:

```jsx
    return {
      ventes, achats, charges, cogs, profit, marge,
      profitMonth, margeMonth, ventesM, achatsM, chargesM, cogsM, deltaStockMonth,
      valMatieres, valProduits, valStock: valMatieres + valProduits,
      entitled, held, balance, grossHeld, ventesByOrg, achatsByOrg, chargesByOrg,
    };
  }, [sales, purchases, costs, settlements, recipes, materialById, materials, products, productById, materialStock, finishedStock, materialPrices, unitCostFor, cogsOf, shareLumaya, period]);
```

(dependency array unchanged — every input the new values read from, `sales`/`purchases`/`costs`, is already listed.)

- [ ] **Step 3: Manual verification**

1. Start the server (`.claude/launch.json`'s `lumabonga` config) if not running, open `http://localhost:3000/LumaBonga.html` via the browser tools.
2. Seed org-attributed transactions where the two parties clearly differ (Lumaya profitable, GawahBonga not):

```js
const cur = {};
cur.products = [{ id: 'p1', name: 'Test Balm', hue: 14, unitPrice: 100, status: 'ready' }];
cur.materials = [{ id: 'm1', name: 'Wax', unit: 'g', hue: 40 }];
cur.recipes = { p1: { ingredients: [], labor: [] } };
cur.sales = [
  { id: 'sl1', productId: 'p1', qty: 10, price: 100, date: '2026-08-01', org: 'lumaya' },
  { id: 'sl2', productId: 'p1', qty: 5, price: 100, date: '2026-08-01', org: 'gawah' },
];
cur.purchases = [
  { id: 'pu1', materialId: 'm1', qty: 1, price: 200, date: '2026-08-01', org: 'lumaya' },
  { id: 'pu2', materialId: 'm1', qty: 1, price: 900, date: '2026-08-01', org: 'gawah' },
];
cur.costs = [];
localStorage.setItem('lumabonga:v1', JSON.stringify(cur));
location.reload();
```

3. After reload, there's no UI for this yet — verify the computed value directly. The store isn't on `window` by default; the simplest path is a temporary console check via React DevTools-free inspection: since that's awkward, instead confirm indirectly by checking `window.__LUMA_INITIAL` matches the seed (proves load path), then rely on Task 2's UI (next task) for the real check of `grossHeld`'s displayed values — OR, faster: temporarily add `console.log('grossHeld', totals.grossHeld, totals.ventesByOrg, totals.achatsByOrg, totals.chargesByOrg)` right after the `return` statement's closing `}, [...]);` is too late (memo already returned) — instead add it as the last line inside the memo, right before `return {`. Add it, reload, read the console log, then remove it:

```jsx
    console.log('grossHeld check', grossHeld, ventesByOrg, achatsByOrg, chargesByOrg);
    return {
```

   Expected console output: `grossHeld: { lumaya: 800, gawah: -400 }` (Lumaya: 1000 ventes − 200 achats = 800; GawahBonga: 500 ventes − 900 achats = −400), `ventesByOrg: { lumaya: 1000, gawah: 500 }`, `achatsByOrg: { lumaya: 200, gawah: 900 }`, `chargesByOrg: { lumaya: 0, gawah: 0 }`.
4. Remove the temporary `console.log` line before committing.
5. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 4: Commit**

```bash
git add lumabonga-data.jsx
git commit -m "Add grossHeld + per-org ventes/achats/charges to totals

grossHeld snapshots each org's own trading result (sales minus its own
purchases and charges) before settlement transfers are netted into the
existing held/balance figures, so it can answer 'is this org
profitable' without the circularity of a past settlement payment
making it look unprofitable. Reuses the existing org-attribution
loops — no new iteration, no data model change."
```

---

### Task 2: "Profit/loss per party" card on the Dashboard

**Files:**
- Modify: `lumabonga-creative.jsx` (inside `CreaDashboard`, insert a new card)

**Interfaces:**
- Consumes: `totals.grossHeld`, `totals.ventesByOrg`, `totals.achatsByOrg`, `totals.chargesByOrg` (Task 1).
- Produces (consumed by Task 3): nothing new exported — this is a self-contained display card, but it establishes the `bothProfitable` value pattern Task 3 also needs (each task computes it locally from `totals.grossHeld` rather than sharing state, since they're both simple derivations with no shared mutable state).

- [ ] **Step 1: Add the card**

In `lumabonga-creative.jsx`, inside `CreaDashboard`, find the end of the KPI grid and the start of the account-balance block (current lines ~456-471):

```jsx
      {/* KPI grid (selected period) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {kpiTiles.map((k) => (
          <div key={k.l} style={{ ...card, padding: '12px 13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: k.dot }} />
              <span style={{ fontFamily: creaSans, fontSize: 11, fontWeight: 600, color: c.muted }}>{k.l}</span>
            </div>
            <div style={{ fontFamily: creaDisplay, fontSize: 19, fontWeight: 700, color: c.text, marginTop: 4, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>
              <AnimatedNumber value={k.v} format={fmtNum} />
            </div>
          </div>
        ))}
      </div>

      {/* Account balance */}
```

Insert a new card between them:

```jsx
      {/* KPI grid (selected period) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {kpiTiles.map((k) => (
          <div key={k.l} style={{ ...card, padding: '12px 13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: k.dot }} />
              <span style={{ fontFamily: creaSans, fontSize: 11, fontWeight: 600, color: c.muted }}>{k.l}</span>
            </div>
            <div style={{ fontFamily: creaDisplay, fontSize: 19, fontWeight: 700, color: c.text, marginTop: 4, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>
              <AnimatedNumber value={k.v} format={fmtNum} />
            </div>
          </div>
        ))}
      </div>

      {/* Per-party profit/loss — always visible regardless of whether a
          settlement is currently suggested below; each party's own sales
          minus its own purchases and charges (all-time, not period-scoped,
          matching how the settlement/balance figures below are all-time). */}
      <div style={{ ...card, padding: '13px 15px' }}>
        <div style={{ fontFamily: creaSans, fontSize: 11, fontWeight: 600, color: c.muted, marginBottom: 10 }}>{tr('Perte / Profit par partie')}</div>
        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { name: 'Lumaya', color: c.accent, v: totals.grossHeld.lumaya, ventes: totals.ventesByOrg.lumaya, achats: totals.achatsByOrg.lumaya, charges: totals.chargesByOrg.lumaya },
            { name: 'GawahBonga', color: c.purple, v: totals.grossHeld.gawah, ventes: totals.ventesByOrg.gawah, achats: totals.achatsByOrg.gawah, charges: totals.chargesByOrg.gawah },
          ].map((o) => (
            <div key={o.name} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: creaSans, fontSize: 11.5, fontWeight: 700, color: o.color, marginBottom: 4 }}>{o.name}</div>
              <div style={{ fontFamily: creaDisplay, fontSize: 18, fontWeight: 700, color: o.v >= 0 ? c.pos : c.rose, letterSpacing: -0.4, fontVariantNumeric: 'tabular-nums' }}>
                {o.v >= 0 ? '+' : '−'}{fmtNum(Math.abs(o.v))} <span style={{ fontFamily: creaMono, fontSize: 10, color: c.mutedSoft, fontWeight: 400 }}>{t.currency}</span>
              </div>
              <div style={{ fontFamily: creaMono, fontSize: 9.5, color: c.mutedSoft, marginTop: 3, lineHeight: 1.5 }}>
                {tr('Ventes')} {fmtNum(o.ventes)} · {tr('Achats')} {fmtNum(o.achats)} · {tr('Charges')} {fmtNum(o.charges)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account balance */}
```

- [ ] **Step 2: Manual verification**

1. Open `LumaBonga.html`, seed the same data as Task 1's Step 3 (Lumaya profitable, GawahBonga not).
2. Navigate to the dashboard (default screen, or whichever nav item shows `CreaDashboard`).
3. Confirm the new "Perte / Profit par partie" card renders with two columns:
   - Lumaya: `+800 IDR` (or the app's configured currency) in a positive color, sub-line "Ventes 1 000 · Achats 200 · Charges 0".
   - GawahBonga: `−400 IDR` in the negative/rose color, sub-line "Ventes 500 · Achats 900 · Charges 0".
4. Confirm the card appears regardless of the account-balance block below it (Task 3 not built yet, so that block still shows its old unconditional behavior at this point — that's expected, Task 3 changes it next).
5. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 3: Commit**

```bash
git add lumabonga-creative.jsx
git commit -m "Add always-visible per-party profit/loss card to Dashboard

Shows each org's own ventes/achats/charges and net gain/loss
(grossHeld), so profitability is visible independent of whether a
settlement is currently suggested."
```

---

### Task 3: Gate the settlement suggestion on both parties being profitable

**Files:**
- Modify: `lumabonga-creative.jsx` (inside `CreaDashboard`: the balance-derivation `const`s and the account-balance JSX block)

**Interfaces:**
- Consumes: `totals.grossHeld` (Task 1).

- [ ] **Step 1: Add the `bothProfitable` check**

Find (current lines ~417-422):

```jsx
  // Balance: who must receive money. balance < 0 means that org is owed.
  const owedToLumaya = totals.balance.lumaya < -0.5;
  const owedToGawah = totals.balance.gawah < -0.5;
  const settled = !owedToLumaya && !owedToGawah;
  const creditor = owedToLumaya ? 'Lumaya' : owedToGawah ? 'GawahBonga' : null;
  const owedAmount = Math.abs(owedToLumaya ? totals.balance.lumaya : totals.balance.gawah);
```

Replace with:

```jsx
  // Balance: who must receive money. balance < 0 means that org is owed.
  const owedToLumaya = totals.balance.lumaya < -0.5;
  const owedToGawah = totals.balance.gawah < -0.5;
  const settled = !owedToLumaya && !owedToGawah;
  const creditor = owedToLumaya ? 'Lumaya' : owedToGawah ? 'GawahBonga' : null;
  const owedAmount = Math.abs(owedToLumaya ? totals.balance.lumaya : totals.balance.gawah);
  // No settlement is suggested until both orgs are individually
  // profitable on their own trading activity (see grossHeld, totals memo).
  const bothProfitable = totals.grossHeld.lumaya > 0 && totals.grossHeld.gawah > 0;
  const unprofitableNames = [
    totals.grossHeld.lumaya <= 0 ? 'Lumaya' : null,
    totals.grossHeld.gawah <= 0 ? 'GawahBonga' : null,
  ].filter(Boolean).join(' · ');
```

- [ ] **Step 2: Branch the account-balance card on `bothProfitable`**

Find (current lines ~471-493):

```jsx
      {/* Account balance */}
      <div>
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: settled ? c.mutedSoft : c.rose, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {settled ? (
              <span style={{ fontFamily: creaSans, fontSize: 13.5, color: c.muted }}>{tr('Comptes équilibrés')}</span>
            ) : (
              <React.Fragment>
                <div style={{ fontFamily: creaSans, fontSize: 12.5, color: c.muted }}>
                  <b style={{ color: creditor === 'Lumaya' ? c.accent : c.purple }}>{creditor}</b> {tr('doit recevoir')}
                </div>
                <div style={{ fontFamily: creaDisplay, fontSize: 18, fontWeight: 700, color: c.text, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {fmtNum(owedAmount)} <span style={{ fontFamily: creaMono, fontSize: 11, color: c.mutedSoft, fontWeight: 400 }}>{t.currency}</span>
                </div>
              </React.Fragment>
            )}
          </div>
          <button onClick={() => onAdd && onAdd('settlement')} style={{
            padding: '9px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: c.ink, color: c.inkContrast, fontFamily: creaSans, fontSize: 12.5, fontWeight: 600, flexShrink: 0,
          }}>{tr('Régler')}</button>
        </div>
```

Replace with:

```jsx
      {/* Account balance */}
      <div>
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: (!bothProfitable || settled) ? c.mutedSoft : c.rose, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {!bothProfitable ? (
              <span style={{ fontFamily: creaSans, fontSize: 12.5, color: c.muted, lineHeight: 1.45 }}>
                {tr('Pas de règlement pour l’instant — {names} pas encore en bénéfices.', { names: unprofitableNames })}
              </span>
            ) : settled ? (
              <span style={{ fontFamily: creaSans, fontSize: 13.5, color: c.muted }}>{tr('Comptes équilibrés')}</span>
            ) : (
              <React.Fragment>
                <div style={{ fontFamily: creaSans, fontSize: 12.5, color: c.muted }}>
                  <b style={{ color: creditor === 'Lumaya' ? c.accent : c.purple }}>{creditor}</b> {tr('doit recevoir')}
                </div>
                <div style={{ fontFamily: creaDisplay, fontSize: 18, fontWeight: 700, color: c.text, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {fmtNum(owedAmount)} <span style={{ fontFamily: creaMono, fontSize: 11, color: c.mutedSoft, fontWeight: 400 }}>{t.currency}</span>
                </div>
              </React.Fragment>
            )}
          </div>
          {bothProfitable && (
            <button onClick={() => onAdd && onAdd('settlement')} style={{
              padding: '9px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: c.ink, color: c.inkContrast, fontFamily: creaSans, fontSize: 12.5, fontWeight: 600, flexShrink: 0,
            }}>{tr('Régler')}</button>
          )}
        </div>
```

Everything after this (the settlement-history toggle button and list, current lines ~494-517) stays exactly as-is — untouched, always available regardless of `bothProfitable`, since it's a record of already-happened transfers, not "the calculated settlement."

- [ ] **Step 3: Manual verification**

1. Open `LumaBonga.html`, seed the same not-both-profitable scenario (Task 1/2's seed: Lumaya +800, GawahBonga −400).
2. Confirm the account-balance card shows the new neutral message mentioning "GawahBonga" (not "Lumaya", since only GawahBonga is ≤0) and does **not** show a "Régler" button.
3. Confirm the settlement-history section (if any settlements exist) still renders below regardless — seed one first to check:

```js
const cur = JSON.parse(localStorage.getItem('lumabonga:v1') || '{}');
cur.settlements = [{ id: 'st1', from: 'lumaya', to: 'gawah', amount: 50, date: '2026-07-01', note: 'test' }];
localStorage.setItem('lumabonga:v1', JSON.stringify(cur));
location.reload();
```

   Confirm "Historique des règlements (1)" still appears and expands to show the entry, even though `bothProfitable` is false and the "Régler" button is hidden.
4. Now flip both to profitable — adjust the seed so GawahBonga's purchases are lower than its sales (e.g. change `pu2`'s price to `50` instead of `900`, making GawahBonga's achats 50 < ventes 500 → grossHeld +450), reload. Confirm: "Régler" button reappears, and the balance card shows either "Comptes équilibrés" or a "doit recevoir" figure (whichever `totals.balance` computes) — i.e. the original pre-Task-3 behavior, now correctly gated back on.
5. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 4: Commit**

```bash
git add lumabonga-creative.jsx
git commit -m "Gate the settlement suggestion on both parties being profitable

No 'Régler' button and no 'doit recevoir' figure until both orgs'
grossHeld is positive — shows a neutral explanatory message naming
whichever org isn't profitable yet instead. Settlement history and
manual recording stay available regardless, since that's bookkeeping
of already-happened transfers, not the calculated suggestion."
```

---

### Task 4: i18n — EN + ID translations for the new strings

**Files:**
- Modify: `lumabonga-data.jsx` (EN dictionary)
- Modify: `lumabonga-data.jsx` (ID dictionary)

**Interfaces:** none (pure data addition).

- [ ] **Step 1: Add EN entries**

In `lumabonga-data.jsx`'s EN dictionary object, add:

```jsx
  'Perte / Profit par partie': 'Profit / Loss per party',
  'Pas de règlement pour l’instant — {names} pas encore en bénéfices.': 'No settlement for now — {names} not yet profitable.',
```

(`'Ventes'`, `'Achats'`, `'Charges'` already have EN entries from the existing KPI tiles — confirm via grep before assuming, but they're long-standing strings used elsewhere on this same dashboard, so they should already be translated.)

- [ ] **Step 2: Add ID entries**

In `lumabonga-data.jsx`'s ID dictionary object, add:

```jsx
  'Perte / Profit par partie': 'Untung / Rugi per pihak',
  'Pas de règlement pour l’instant — {names} pas encore en bénéfices.': 'Belum ada penyelesaian — {names} belum untung.',
```

- [ ] **Step 3: Manual verification**

1. Open `LumaBonga.html` with the not-both-profitable seed from Task 3.
2. Switch language to EN, confirm the new card's title and the neutral gate message show in English, with "{names}" correctly substituted (e.g. "GawahBonga not yet profitable.").
3. Switch to ID, confirm Indonesian strings show.
4. Check console for `tr()` missing-key warnings — expected: none.
5. Clean up: `localStorage.removeItem('lumabonga:v1')`.

- [ ] **Step 4: Commit**

```bash
git add lumabonga-data.jsx
git commit -m "Add EN/ID translations for the per-party profit/loss feature"
```

---

### Task 5: Deploy, verify against real production data

**Files:** none (verification-only against the live Supabase-backed app, `https://luma-bonga.vercel.app`).

**Interfaces:** none.

- [ ] **Step 1: Push and confirm deploy**

```bash
git push
```

Wait for the Vercel deploy to finish (this repo auto-deploys `main`).

- [ ] **Step 2: Sign in**

Open `https://luma-bonga.vercel.app` in the browser tools. If it shows an access-code screen, ask the user to sign in — do not attempt to enter or guess the code.

- [ ] **Step 3: Read-only verification on real data**

1. On the dashboard, confirm the new "Perte / Profit par partie" card renders with real numbers for Lumaya and GawahBonga, and that the ventes/achats/charges sub-line numbers are plausible (roughly consistent with the existing KPI tiles' all-time totals, split by org).
2. Check the account-balance card: if both orgs' figures on the new card are positive, confirm "Régler" still shows as before (no regression); if either is negative or zero, confirm the new neutral message shows instead and "Régler" is hidden.
3. Do **not** click "Régler" or record a settlement as part of this verification — that would create real ledger data. Read-only checks only.

- [ ] **Step 4: Report to user**

Summarize: real Lumaya/GawahBonga profit-loss figures observed, and whether the settlement suggestion is currently gated on or off for the real data, so the user knows what to expect next time they open the app.

---

## Self-Review Notes

- **Spec coverage:** every section of `docs/superpowers/specs/2026-08-02-profit-loss-per-party-design.md` maps to a task — `grossHeld`/per-org breakdown → Task 1, always-visible card → Task 2, settlement gate → Task 3, i18n → Task 4, out-of-scope items (no change to `held`/`entitled`/`balance`/`CreaVessels`, no line-by-line breakdown, no auto-payout) are simply not built.
- **Deviation from the spec, and why:** the spec described an "expandable detail" view showing entitled share + resulting balance on top of the always-visible ventes/achats/charges/net breakdown. This plan drops the separate expand/collapse mechanism: the new card (Task 2) already shows the full ventes/achats/charges/net breakdown inline and always, and the existing account-balance card (Task 3) already shows the entitled-derived `balance`/"doit recevoir" figure whenever it's actionable (`bothProfitable`) — stacking these two always-visible cards achieves the same "complete decomposition" the spec asked for without adding a toggle interaction for what is, in practice, four numbers per party. If the user wants the entitled/balance math visible even while gated off, that's a small, easy follow-up now that `grossHeld` and the gate exist — not built here to avoid scope creep on a first pass.
- **Type/name consistency check:** `grossHeld`, `ventesByOrg`, `achatsByOrg`, `chargesByOrg` are defined in Task 1 and consumed with these exact names and shapes (`{lumaya, gawah}`) in Tasks 2-3. `bothProfitable` is computed identically (from `totals.grossHeld`) wherever it's needed — Task 3 is its only consumer in this plan (Task 2's card doesn't need the boolean, it just displays the raw numbers).
- **Ordering rationale:** Task 1 (data) before Tasks 2-3 (UI) is required since both UI tasks read `totals.grossHeld`/`ventesByOrg`/etc. Task 2 (new card) before Task 3 (gate) is not a hard dependency — they touch different parts of `CreaDashboard` — but doing the purely-additive display card first, then the existing-behavior-changing gate second, keeps the same lower-risk-first ordering this project's other plans have used.
