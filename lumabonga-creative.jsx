// lumabonga-creative.jsx
// Variation B — Créatif: sculptural mobile UI with display type, vessels, and beads.

// ── Ledger theme ─────────────────────────────────────────────
// Clean light fintech palette (default), with a refined dark variant kept for
// the dark-mode toggle. All token keys preserved so every screen keeps working.
// The accent picker stores light pastels (great on dark); on the light theme we
// map each to a deeper, readable shade.
const ACCENT_LIGHT = {
  '#7dd3a0': '#1f7a5a', // sage → forest green
  '#8db4ff': '#2563c9', // blue
  '#f5c451': '#b5811d', // amber
  '#c4a8ff': '#5b54c9', // lavender
  '#f48fb1': '#c2456a', // pink
};
const creaTheme = (dark, accent) => {
  const acc = dark ? (accent || '#7dd3a0') : (ACCENT_LIGHT[accent] || accent || '#1f7a5a');
  return {
    bg:         dark ? '#0e0f13' : '#f4f5f7',
    bg2:        dark ? '#16181f' : '#ffffff',
    panel:      dark ? '#16181f' : '#ffffff',
    panel2:     dark ? '#1e212a' : '#f0f2f5',
    border:     dark ? '#262a35' : '#e7e9ee',
    borderSoft: dark ? '#1e212a' : '#eef0f3',
    text:       dark ? '#f3f4f7' : '#10131a',
    muted:      dark ? '#8b91a0' : '#5b6472',
    mutedSoft:  dark ? '#5b6170' : '#9aa3b2',
    accent:     acc,
    purple:     dark ? '#c4a8ff' : '#5b54c9',
    amber:      dark ? '#f5c451' : '#b5811d',
    rose:       dark ? '#f48fb1' : '#d2483f',
    pos:        dark ? '#7dd3a0' : '#138a5e',
    ink:        dark ? '#f3f4f7' : '#10131a',
    inkContrast: dark ? '#0e0f13' : '#ffffff',
  };
};

const creaSerif = '"Fraunces", "Playfair Display", "Source Serif Pro", Georgia, serif';
const creaSans = '"Hanken Grotesk", "Inter", -apple-system, system-ui, sans-serif';
const creaMono = '"JetBrains Mono", "SF Mono", "Geist Mono", ui-monospace, monospace';

// Ledger display face: a clean grotesque for headings + big figures (no italic).
const creaDisplay = '"Schibsted Grotesk", "Hanken Grotesk", "Inter", system-ui, sans-serif';

// Purchase-unit options with a factor converting the entered quantity INTO the
// material's base unit. Mass and volume share one list (density ~1 → 1 ml = 1 g),
// so a g-based material can still be bought in ml/l and vice-versa.
const MASS_VOL_UNITS = [
  { u: 'g', f: 1 }, { u: 'kg', f: 1000 },
  { u: 'ml', f: 1 }, { u: 'l', f: 1000 }, { u: 'cl', f: 10 },
];
const BUY_UNITS = {
  g:  MASS_VOL_UNITS,
  ml: MASS_VOL_UNITS,
  m:  [{ u: 'm', f: 1 }, { u: 'cm', f: 0.01 }],
  'pièce': [{ u: 'pièce', f: 1 }],
  // Essential oils: base unit is the drop. 15 drops = 1 ml (buy in ml/l, store drops).
  'goutte': [{ u: 'goutte', f: 1 }, { u: 'ml', f: 15 }, { u: 'l', f: 15000 }],
};
const buyUnitsFor = (base) => BUY_UNITS[base] || [{ u: base || 'pièce', f: 1 }];
const buyFactor = (base, u) => (buyUnitsFor(base).find((x) => x.u === u) || { f: 1 }).f;

// ── Month / period picker ────────────────────────────────────
function periodLabel(p) {
  if (!p || p === 'all') return tr('Tout');
  const [y, m] = p.split('-').map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString(LB_LOCALE, { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function CreaMonthPicker({ store, dark, t }) {
  const c = creaTheme(dark, t.accent);
  const [open, setOpen] = React.useState(false);
  // Year shown in the panel: the selected period's year, else the current year.
  const selYM = (store.period && store.period !== 'all') ? store.period : null;
  const [year, setYear] = React.useState(() => selYM ? Number(selYM.slice(0, 4)) : new Date().getFullYear());
  const monthName = (m) => {
    const s = new Date(2000, m, 1).toLocaleDateString(LB_LOCALE, { month: 'short' }).replace('.', '');
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const pick = (p) => { store.setPeriod(p); setOpen(false); };
  const navBtn = {
    width: 28, height: 28, borderRadius: 9, cursor: 'pointer',
    border: `1px solid ${c.border}`, background: c.panel2, color: c.text,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => { setOpen((v) => !v); if (selYM) setYear(Number(selYM.slice(0, 4))); }} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
        background: c.panel, border: `1px solid ${c.border}`, borderRadius: 999,
        color: c.text, cursor: 'pointer', fontFamily: creaSans, fontSize: 12.5, fontWeight: 600,
      }}>
        {periodLabel(store.period)}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c.mutedSoft} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <React.Fragment>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 41,
            background: c.bg2, border: `1px solid ${c.border}`, borderRadius: 14,
            boxShadow: dark ? '0 12px 32px rgba(0,0,0,.5)' : '0 12px 32px rgba(16,19,26,.12)',
            padding: 10, width: 232,
          }}>
            {/* All time */}
            <button onClick={() => pick('all')} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
              padding: '9px 11px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: store.period === 'all' ? c.panel2 : 'transparent', color: c.text,
              fontFamily: creaSans, fontSize: 13, fontWeight: store.period === 'all' ? 700 : 500, textAlign: 'left',
            }}>
              {periodLabel('all')}
              {store.period === 'all' && <span style={{ color: c.accent, display: 'flex' }}><Icon.check width={15} height={15} /></span>}
            </button>
            <div style={{ height: 1, background: c.borderSoft, margin: '8px 0' }} />
            {/* Year navigator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <button onClick={() => setYear((y) => y - 1)} aria-label="prev" style={navBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
              </button>
              <span style={{ fontFamily: creaDisplay, fontSize: 15, fontWeight: 700, color: c.text }}>{year}</span>
              <button onClick={() => setYear((y) => y + 1)} aria-label="next" style={navBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
              </button>
            </div>
            {/* 12-month grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
              {Array.from({ length: 12 }, (_, m) => {
                const p = `${year}-${String(m + 1).padStart(2, '0')}`;
                const sel = store.period === p;
                const hasData = (store.availableMonths || []).includes(p);
                return (
                  <button key={p} onClick={() => pick(p)} style={{
                    padding: '8px 0', borderRadius: 9, cursor: 'pointer',
                    border: `1px solid ${sel ? c.accent : 'transparent'}`,
                    background: sel ? c.accent : 'transparent',
                    color: sel ? c.inkContrast : (hasData ? c.text : c.mutedSoft),
                    fontFamily: creaSans, fontSize: 12, fontWeight: sel ? 700 : (hasData ? 600 : 500),
                  }}>{monthName(m)}</button>
                );
              })}
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

// ── Top bar ──────────────────────────────────────────────────
function CreaTopBar({ store, dark, t, onAdd, readonly, hidePeriod }) {
  const c = creaTheme(dark, t.accent);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 20px 14px', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: c.accent, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: creaDisplay, fontSize: 12, fontWeight: 700, letterSpacing: -0.5,
        }}>LB</div>
        <span style={{ fontFamily: creaDisplay, fontSize: 17, fontWeight: 700, color: c.text, letterSpacing: -0.3 }}>LumaBonga</span>
      </div>
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
    </div>
  );
}

// ── Profit vessels (two columns filling) ─────────────────────
// Partner account balances. Negative = is owed money (must receive from the other).
function CreaVessels({ balance, t, dark, onSettle }) {
  const c = creaTheme(dark, t.accent);
  const max = Math.max(Math.abs(balance.lumaya), Math.abs(balance.gawah), 1);

  const Card = ({ bal, color, name }) => {
    const owed = bal < -0.5;              // this org should receive money
    const owes = bal > 0.5;               // this org should pay
    const h = Math.max(8, (Math.abs(bal) / max) * 100);
    const tone = owed ? c.rose : owes ? color : c.muted;
    const label = owed ? tr('à recevoir') : owes ? tr('à reverser') : tr('équilibré');
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontFamily: creaMono, fontSize: 10, color: c.muted, letterSpacing: 0.6, textTransform: 'uppercase' }}>{name}</div>
        <div style={{ position: 'relative', width: '100%', height: 120, borderRadius: 14, overflow: 'hidden', background: c.panel2, border: `1px solid ${c.border}` }}>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: `${h}%`,
            background: `linear-gradient(180deg, ${tone}88, ${tone})`,
            transition: 'height .8s cubic-bezier(.2,.8,.2,1)',
          }} />
          <div style={{ position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', fontFamily: creaSans, fontSize: 9, color: c.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
        </div>
        <div style={{ fontFamily: creaMono, fontSize: 15, fontWeight: 600, color: tone }}>
          {bal < 0 ? '−' : ''}{(Math.abs(bal) / 1e6).toFixed(3)}M
          <span style={{ fontSize: 10, color: c.muted, marginLeft: 3, fontWeight: 500, fontFamily: creaSans }}>{t.currency}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '0 22px' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Card bal={balance.lumaya} color={c.accent} name="Lumaya" />
        <Card bal={balance.gawah} color={c.purple} name="GawahBonga" />
      </div>
      <button onClick={onSettle} style={{
        width: '100%', marginTop: 12, padding: '11px', borderRadius: 12, cursor: 'pointer',
        background: 'transparent', color: c.muted, border: `1px dashed ${c.border}`,
        fontFamily: creaSans, fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}><Icon.plus width={16} height={16} /> {tr('Règlement entre associés')}</button>
    </div>
  );
}

// ── Hero (clean Ledger header block) ─────────────────────────
function CreaHero({ label, value, sub, t, dark, color, unit }) {
  const c = creaTheme(dark, t.accent);
  const k = color || c.accent;
  const u = unit != null ? unit : t.currency;
  return (
    <div style={{ padding: '6px 22px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: k }} />
        <span style={{ fontFamily: creaSans, fontSize: 11, color: c.muted, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: creaDisplay, fontSize: 40, fontWeight: 700, color: c.text, letterSpacing: -1.2, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          <AnimatedNumber value={value} format={fmtNum} />
        </span>
        {u ? <span style={{ fontFamily: creaMono, fontSize: 12, color: c.mutedSoft }}>{u}</span> : null}
      </div>
      {sub && <span style={{ fontFamily: creaSans, fontSize: 12.5, color: c.muted, fontWeight: 500 }}>{sub}</span>}
    </div>
  );
}

// ── Section header ───────────────────────────────────────────
function CreaSection({ title, right, dark, t }) {
  const c = creaTheme(dark, t.accent);
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '0 22px', marginTop: 22, marginBottom: 10,
    }}>
      <div style={{ fontFamily: creaDisplay, fontSize: 17, fontWeight: 700, color: c.text, letterSpacing: -0.3 }}>{title}</div>
      {right && <div style={{ fontFamily: creaSans, fontSize: 12, color: c.mutedSoft, fontWeight: 500 }}>{right}</div>}
    </div>
  );
}

// ── Activity bead (timeline-style) ───────────────────────────
function CreaBead({ item, store, dark, t, isLast }) {
  const c = creaTheme(dark, t.accent);
  const isSale = item.kind === 'sale';
  const isCost = item.kind === 'cost';
  const isBuy  = item.kind === 'buy';
  const isProd = item.kind === 'prod';
  const product = item.productId ? store.productById[item.productId] : null;
  const material = item.materialId ? store.materialById[item.materialId] : null;
  const amount = isCost ? item.amount : isProd ? 0 : item.qty * item.price;
  const color = isSale ? c.accent : isCost ? c.amber : isProd ? c.rose : c.purple;
  const tag = isSale ? tr('Vente') : isCost ? tr('Charge') : isProd ? tr('Production') : tr('Achat');
  const sign = isSale ? '+' : isProd ? '' : '−';
  const title = isSale || isProd ? (product?.name || '—') : isBuy ? (material?.name || '—') : item.label;
  const unit = material?.unit || 'u';
  return (
    <div style={{ display: 'flex', gap: 14, position: 'relative', padding: '0 22px' }}>
      <div style={{ width: 18, flexShrink: 0, position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 8, top: 0, bottom: isLast ? '50%' : '-2px',
          width: 1, background: c.border,
        }} />
        <div style={{
          position: 'absolute', top: 12, left: 4, width: 10, height: 10,
          borderRadius: 999, background: color, boxShadow: `0 0 0 3px ${c.bg}`,
        }} />
      </div>
      <div style={{
        flex: 1, padding: '8px 0 18px',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: creaSans, fontSize: 10, color, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>
            {tag}
          </span>
          <span style={{ fontFamily: creaMono, fontSize: 10, color: c.mutedSoft }}>
            {fmtDate(item.date)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontFamily: creaSans, fontSize: 15, color: c.text, fontWeight: 500 }}>
            {title}
          </span>
          <span style={{ fontFamily: creaDisplay, fontSize: 18, fontStyle: 'normal', color }}>
            {isProd ? `${item.qty} u` : `${sign}${fmtShort(amount)}`}
          </span>
        </div>
        <div style={{ fontFamily: creaSans, fontSize: 11, color: c.muted }}>
          {isCost ? (item.who || tr('Charge')) :
           isProd ? `${tr('{n} unités produites', { n: item.qty })}${item.who ? ` · ${item.who}` : ''}` :
           isBuy ? `${fmtNum(item.qty)} ${unit} × ${fmtNum(item.price)} ${t.currency}` :
           `${item.qty} u × ${fmtNum(item.price)} ${t.currency}`}
        </div>
      </div>
    </div>
  );
}

// ── Area trend chart (monthly) ───────────────────────────────
function CreaAreaTrend({ data, color, c, w = 326, h = 56 }) {
  if (!data || data.length < 2) return <div style={{ height: h }} />;
  const vals = data.map((d) => d.v);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = Math.max(1, max - min);
  const lo = min - span * 0.25, hi = max + span * 0.25;
  const X = (i) => (i / (data.length - 1)) * w;
  const Y = (v) => h - 4 - ((v - lo) / (hi - lo)) * (h - 8);
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(d.v).toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = 'tr' + Math.round(w) + Math.round(color.charCodeAt(1) || 0);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.34" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X(data.length - 1)} cy={Y(vals[vals.length - 1])} r="3.4" fill={color} />
    </svg>
  );
}

// ── Screen: Dashboard ────────────────────────────────────────
function CreaDashboard({ store, dark, t, onAdd, onEdit }) {
  const c = creaTheme(dark, t.accent);
  const { totals } = store;
  const [showSettlements, setShowSettlements] = React.useState(false);
  const periodScoped = store.period && store.period !== 'all';
  const inPeriod = (d) => !periodScoped || (d || '').slice(0, 7) === store.period;

  const recent = React.useMemo(() => {
    const a = store.sales.map((x) => ({ ...x, kind: 'sale' }));
    const b = store.purchases.map((x) => ({ ...x, kind: 'buy' }));
    const d = store.costs.map((x) => ({ ...x, kind: 'cost' }));
    const e = store.production.map((x) => ({ ...x, kind: 'prod' }));
    return [...a, ...b, ...d, ...e].filter((x) => inPeriod(x.date)).sort((x, y) => (y.date > x.date ? 1 : -1)).slice(0, 7);
  }, [store.sales, store.purchases, store.costs, store.production, store.period]);

  // Last 6 calendar months of cash-basis profit (ventes − achats − charges).
  const trend = React.useMemo(() => {
    const now = new Date();
    const out = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = dt.toISOString().slice(0, 7);
      let v = 0;
      for (const s of store.sales) if ((s.date || '').slice(0, 7) === ym) v += s.qty * s.price;
      for (const p of store.purchases) if ((p.date || '').slice(0, 7) === ym) v -= (Number(p.qty) || 0) * (Number(p.price) || 0);
      for (const x of store.costs) if ((x.date || '').slice(0, 7) === ym) v -= Number(x.amount) || 0;
      out.push({ ym, v });
    }
    return out;
  }, [store.sales, store.purchases, store.costs]);

  const alerts = React.useMemo(() => {
    return store.products
      .map((p) => ({ p, can: store.producibleFor(p.id) }))
      .filter((x) => x.can <= 8)
      .sort((a, b) => a.can - b.can)
      .slice(0, 3);
  }, [store.products, store.producibleFor]);

  // Balance: who must receive money. balance < 0 means that org is owed.
  const owedToLumaya = totals.balance.lumaya < -0.5;
  const owedToGawah = totals.balance.gawah < -0.5;
  const settled = !owedToLumaya && !owedToGawah;
  const creditor = owedToLumaya ? 'Lumaya' : owedToGawah ? 'GawahBonga' : null;
  const owedAmount = Math.abs(owedToLumaya ? totals.balance.lumaya : totals.balance.gawah);

  const card = { background: c.panel, border: `1px solid ${c.border}`, borderRadius: 14 };
  const kpiTiles = [
    { l: tr('Ventes'), v: totals.ventesM, dot: c.pos },
    { l: tr('Achats'), v: totals.achatsM, dot: c.purple },
    { l: tr('Charges'), v: totals.chargesM, dot: c.amber },
    { l: tr('Valeur stock'), v: totals.valStock, dot: c.mutedSoft },
  ];

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* hero card */}
      <div style={{ ...card, padding: '15px 17px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: c.accent }} />
          <span style={{ fontFamily: creaSans, fontSize: 11, fontWeight: 600, color: c.muted, letterSpacing: 0.3 }}>
            {tr('Profit net')} · {periodLabel(store.period)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
          <span style={{ fontFamily: creaDisplay, fontSize: 34, fontWeight: 700, color: totals.profitMonth >= 0 ? c.text : c.rose, letterSpacing: -1.2, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            <AnimatedNumber value={totals.profitMonth} format={fmtNum} />
          </span>
          <span style={{ fontFamily: creaMono, fontSize: 12, color: c.mutedSoft }}>{t.currency}</span>
          <span style={{ marginLeft: 'auto', fontFamily: creaSans, fontSize: 12, fontWeight: 600, color: totals.margeMonth >= 0 ? c.pos : c.rose }}>
            {tr('marge {p}%', { p: Math.round(totals.margeMonth) })}
          </span>
        </div>
        <div style={{ marginTop: 8, marginLeft: -17, marginRight: -17 }}>
          <CreaAreaTrend data={trend} color={c.accent} c={c} />
        </div>
      </div>

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
        {store.settlements.length > 0 && (
          <button onClick={() => setShowSettlements((v) => !v)} style={{
            marginTop: 8, background: 'transparent', border: 'none', cursor: 'pointer',
            color: c.muted, fontFamily: creaSans, fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Icon.clock width={14} height={14} /> {tr('Historique des règlements ({n})', { n: store.settlements.length })}
          </button>
        )}
        {showSettlements && store.settlements.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 2px', borderBottom: `1px solid ${c.borderSoft}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: creaSans, fontSize: 13, color: c.text }}>
                <b style={{ color: s.from === 'lumaya' ? c.accent : c.purple }}>{s.from === 'lumaya' ? 'Lumaya' : 'GawahBonga'}</b>
                {' → '}
                <b style={{ color: s.to === 'lumaya' ? c.accent : c.purple }}>{s.to === 'lumaya' ? 'Lumaya' : 'GawahBonga'}</b>
              </div>
              <div style={{ fontFamily: creaMono, fontSize: 10.5, color: c.mutedSoft, marginTop: 1 }}>{fmtDate(s.date)}{s.note ? ` · ${s.note}` : ''}</div>
            </div>
            <span style={{ fontFamily: creaMono, fontSize: 13, color: c.text }}>{fmtNum(s.amount)} {t.currency}</span>
            <button onClick={() => onEdit && onEdit('settlement', s)} style={{ background: 'transparent', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 0, display: 'flex' }}><Icon.edit /></button>
            <button onClick={() => store.removeSettlement(s.id)} style={{ background: 'transparent', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 0, display: 'flex' }}><Icon.trash /></button>
          </div>
        ))}
      </div>

      {/* Low stock */}
      {alerts.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: creaDisplay, fontSize: 17, fontWeight: 700, color: c.text, letterSpacing: -0.3 }}>{tr('Stock faible')}</span>
            <span style={{ fontFamily: creaSans, fontSize: 12, color: c.mutedSoft, fontWeight: 500 }}>{tr('à produire')}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {alerts.map(({ p, can }) => (
              <div key={p.id} style={{ flex: 1, minWidth: 0, ...card, border: `1px solid ${can === 0 ? (dark ? '#5a3530' : '#f3d6d3') : c.border}`, padding: '10px 11px' }}>
                <div style={{ fontFamily: creaSans, fontSize: 11.5, fontWeight: 600, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontFamily: creaMono, fontSize: 13, fontWeight: 700, color: can === 0 ? c.rose : c.amber, marginTop: 3 }}>{can === 0 ? tr('rupture') : `${can} u`}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity */}
      <div style={{ marginLeft: -16, marginRight: -16 }}>
        <CreaSection title={tr('Mouvements')} right={tr('{n} récents', { n: recent.length })} dark={dark} t={t} />
        <div>
          {recent.map((r, i) => (
            <CreaBead key={r.id} item={r} store={store} dark={dark} t={t} isLast={i === recent.length - 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Product chip (creative variant) ──────────────────────────
function CreaProductChip({ p, dark, t, onClick, selected }) {
  const c = creaTheme(dark, t.accent);
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 12px 7px 7px', borderRadius: 999,
      background: selected ? `oklch(0.22 0.08 ${p.hue})` : c.panel2,
      border: `1px solid ${selected ? `oklch(0.55 0.12 ${p.hue})` : c.border}`,
      color: selected ? `oklch(0.92 0.12 ${p.hue})` : c.text,
      cursor: 'pointer', fontFamily: creaSans, fontSize: 12, fontWeight: 500,
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: 999,
        background: `oklch(0.55 0.16 ${p.hue})`, color: '#0c0c10',
        fontFamily: creaMono, fontSize: 10, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{p.emoji}</span>
      {p.name}
    </button>
  );
}

// Org filter (Tous / Lumaya / GawahBonga) — shared by Sales & Purchases.
function OrgFilter({ value, onChange, c }) {
  const opts = [['all', tr('Tous'), c.ink], ['lumaya', 'Lumaya', c.accent], ['gawah', 'GawahBonga', c.purple]];
  return (
    <div style={{ display: 'flex', gap: 6, padding: '6px 22px 0' }}>
      {opts.map(([id, lab, tone]) => {
        const sel = value === id;
        return (
          <button key={id} onClick={() => onChange(id)} style={{
            padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
            background: sel ? tone : 'transparent',
            color: sel ? c.inkContrast : c.text,
            border: `1px solid ${sel ? tone : c.border}`,
            fontFamily: creaSans, fontSize: 12, fontWeight: 600,
          }}>{lab}</button>
        );
      })}
    </div>
  );
}
const orgOf = (x) => (x && x.org === 'gawah') ? 'gawah' : 'lumaya';

// ── Screen: Ventes ───────────────────────────────────────────
function CreaTxScreen({ store, dark, t, kind, onEdit, role }) {
  const c = creaTheme(dark, t.accent);
  const [orgFilter, setOrgFilter] = React.useState('all');
  // Staff (level-1 pass) gets no financial overview: no period picker, always
  // the last 7 days, every line still editable — just no totals shown.
  const restricted = role === 'staff';
  const last7 = React.useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  }, []);
  const periodScoped = !restricted && store.period && store.period !== 'all';
  const inPeriod = (d) => restricted ? (d || '') >= last7 : (!periodScoped || (d || '').slice(0, 7) === store.period);
  const items = store.sales
    .filter((s) => inPeriod(s.date))
    .filter((s) => orgFilter === 'all' || orgOf(s) === orgFilter);
  const remove = store.removeSale;
  const total = items.reduce((a, s) => a + s.qty * s.price, 0);
  const color = c.accent;

  const topProducts = React.useMemo(() => {
    const m = {};
    for (const it of items) {
      const k = it.productId;
      m[k] = (m[k] || 0) + it.qty * it.price;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 4)
      .map(([id, v]) => ({ product: store.productById[id], value: v }));
  }, [items, store.productById]);

  return (
    <div>
      {restricted
        ? <CreaSection title={tr('Ventes · 7 derniers jours')} right={tr('{n} entrées', { n: items.length })} dark={dark} t={t} />
        : (
          <React.Fragment>
            <CreaHero label={tr('Total ventes')} value={total} sub={tr('{n} transactions', { n: items.length })} color={color} t={t} dark={dark} />

            <OrgFilter value={orgFilter} onChange={setOrgFilter} c={c} />

            <div style={{ padding: '6px 22px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {topProducts.map((tp) => (
                <div key={tp.product?.id} style={{
                  padding: '8px 12px', borderRadius: 12,
                  background: c.panel, border: `1px solid ${c.border}`,
                  display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0,
                }}>
                  <div style={{ fontSize: 10, color: c.muted, fontFamily: creaSans, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 92 }}>{tp.product?.name}</div>
                  <div style={{ fontFamily: creaMono, fontSize: 13, fontWeight: 600, color }}>{fmtShort(tp.value)}</div>
                </div>
              ))}
            </div>

            <CreaSection title={tr('Ventes')} right={tr('{n} entrées', { n: items.length })} dark={dark} t={t} />
          </React.Fragment>
        )}

      <div style={{ padding: '0 22px' }}>
        {items.map((it, i) => {
          const p = store.productById[it.productId];
          const unitCost = store.unitCostFor(it.productId);
          const margin = (it.price - unitCost) * it.qty;
          return (
            <div key={it.id} style={{
              padding: '8px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${c.borderSoft}`,
              display: 'flex', gap: 10, alignItems: 'center',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: `oklch(0.22 0.08 ${p?.hue || 0})`,
                color: `oklch(0.88 0.14 ${p?.hue || 0})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: creaMono, fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>{p?.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: creaSans, fontSize: 13.5, color: c.text, fontWeight: 500, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p?.name}</span>
                  <span style={{ fontFamily: creaMono, fontSize: 13, color, fontWeight: 600, marginLeft: 'auto', flexShrink: 0 }}>{fmtNum(it.qty * it.price)} {t.currency}</span>
                </div>
                <div style={{ fontSize: 11, color: c.muted, fontFamily: creaMono, marginTop: 1 }}>
                  {it.qty} × {fmtNum(it.price)} · {tr('marge')} <span style={{ color: margin >= 0 ? c.accent : c.rose }}>{margin >= 0 ? '+' : '−'}{fmtShort(Math.abs(margin))}</span>
                </div>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'center', padding: '2px 8px', borderRadius: 8, background: c.panel2, border: `1px solid ${c.border}` }}>
                <span style={{ fontFamily: creaMono, fontSize: 10.5, color: c.muted }}>{fmtDate(it.date)}</span>
              </div>
              <button onClick={() => onEdit && onEdit('sale', it)} style={{ background: 'transparent', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 0, display: 'flex' }}><Icon.edit /></button>
              <button onClick={() => remove(it.id)} style={{ background: 'transparent', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 0, display: 'flex' }}><Icon.trash /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// One editable ingredient line: type the quantity + pick the unit (no steppers).
function CreaIngredientEdit({ pid, ln, c, store }) {
  // qty is stored in the material's base unit; `ln.unit` is the chosen display unit.
  const base = ln.material?.unit || 'g';
  const dens = densityFor(ln.material);
  const unit = COMPONENT_UNITS.includes(ln.unit) ? ln.unit : (COMPONENT_UNITS.includes(base) ? base : 'g');
  const [val, setVal] = React.useState(String(Math.round(convertUnit(ln.qty, base, unit, dens) * 10) / 10));
  React.useEffect(() => { setVal(String(Math.round(convertUnit(ln.qty, base, unit, dens) * 10) / 10)); }, [ln.qty, unit]);
  const commit = (raw, u) => {
    const q = Number(raw);
    if (!isFinite(q)) return;
    store.updateIngredient(pid, ln.id, { qty: convertUnit(q, u, base, dens), unit: u });
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: `1px solid ${c.borderSoft}` }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: `oklch(0.62 0.16 ${ln.material?.hue || 0})`, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0, fontFamily: creaSans, fontSize: 13, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ln.material?.name || '—'}</span>
      <input type="number" inputMode="decimal" value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={(e) => commit(e.target.value, unit)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
        style={{ width: 64, textAlign: 'right', background: c.panel2, color: c.text, border: `1px solid ${c.border}`, borderRadius: 8, padding: '6px 8px', fontFamily: creaMono, fontSize: 13, outline: 'none' }} />
      <select value={unit} onChange={(e) => commit(val, e.target.value)}
        style={{ background: c.panel2, color: c.text, border: `1px solid ${c.border}`, borderRadius: 8, padding: '6px 4px', fontFamily: creaMono, fontSize: 12, cursor: 'pointer' }}>
        {COMPONENT_UNITS.map((u) => <option key={u} value={u} style={{ background: c.panel, color: c.text }}>{u}</option>)}
      </select>
      <button onClick={() => store.removeIngredient(pid, ln.id)} style={{ background: 'transparent', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 0, display: 'flex' }}><Icon.trash /></button>
    </div>
  );
}

// Small framed bar chart, one bar per month. The y-axis starts at 0 and tops
// out just above the highest value (not min→max), so bar heights stay
// proportional to the real cost — differences between months read accurately
// instead of being exaggerated by a zoomed-in scale.
function CreaSparkline({ series, c, title }) {
  const W = 92, H = 48, padL = 4, padR = 4, padT = 5, padB = 8;
  const vals = (series || []).map((p) => p.total);
  const max = vals.length ? Math.max(...vals) : 0;
  const scaleMax = max > 0 ? max * 1.15 : 1;   // a little headroom above the tallest bar
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const n = Math.max(vals.length, 1);
  const slot = innerW / n;
  const barW = Math.max(2, slot * 0.58);
  const barH = (v) => (v / scaleMax) * innerH;
  const last = vals.length - 1;
  return (
    <div style={{
      flexShrink: 0, padding: '4px 6px 2px', borderRadius: 10,
      background: c.panel, border: `1px solid ${c.border}`,
    }}>
      <div style={{ fontSize: 7.5, letterSpacing: 0.4, textTransform: 'uppercase', color: c.mutedSoft, fontWeight: 700, fontFamily: creaSans, marginBottom: 1 }}>{tr('Coût')}</div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <title>{title}</title>
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke={c.border} strokeWidth="1" />
        {vals.map((v, i) => {
          const h = Math.max(1, barH(v));
          const x = padL + slot * i + (slot - barW) / 2;
          const y = H - padB - h;
          return <rect key={i} x={x} y={y} width={barW} height={h} rx="1"
            fill={i === last ? c.accent : c.accent} opacity={i === last ? 1 : 0.35} />;
        })}
      </svg>
    </div>
  );
}

// ── Screen: Products (per-product edit) ──────────────────────────────────────
function CreaProducts({ store, dark, t, onAdd, onEdit, readonly }) {
  const c = creaTheme(dark, t.accent);
  const [editId, setEditId] = React.useState(null);  // product currently being edited
  const [addFor, setAddFor] = React.useState(null);  // product id awaiting a component
  const [nameDraft, setNameDraft] = React.useState('');
  const [sopView, setSopView] = React.useState(null);  // product whose SOP is being viewed
  const [sopEdit, setSopEdit] = React.useState(null);  // product whose SOP is being edited
  const [compareFor, setCompareFor] = React.useState(null);  // product whose formula suggestion is open
  const [expandedIds, setExpandedIds] = React.useState(() => new Set());  // rows showing the full card
  const toggleExpand = (id) => setExpandedIds((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  // ── Drag & drop reordering (pointer events — works for mouse and touch) ──
  // The dragged row floats under the pointer; everything else stays put until
  // release, when it snaps into the computed slot. Avoids compounding-
  // transform bugs from live-reordering every sibling mid-drag.
  const rowRefs = React.useRef({});
  const [dragState, setDragState] = React.useState(null);  // { id, dy, targetIndex } — for rendering only
  const dragRef = React.useRef(null);  // same shape, read synchronously on release (no impure updaters)
  const startDrag = (id, e) => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    const ids = store.products.map((x) => x.id);
    const rects = {};
    for (const pid of ids) {
      const el = rowRefs.current[pid];
      if (el) { const r = el.getBoundingClientRect(); rects[pid] = r.top + r.height / 2; }
    }
    const startMid = rects[id] ?? e.clientY;
    const initial = { id, dy: 0, targetIndex: ids.indexOf(id) };
    dragRef.current = initial;
    setDragState(initial);
    const onMove = (ev) => {
      let targetIndex = 0, best = Infinity;
      ids.forEach((pid, i) => {
        const mid = rects[pid];
        if (mid == null) return;
        const d = Math.abs(ev.clientY - mid);
        if (d < best) { best = d; targetIndex = i; }
      });
      const next = { id, dy: ev.clientY - startMid, targetIndex };
      dragRef.current = next;
      setDragState(next);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const s = dragRef.current;
      dragRef.current = null;
      setDragState(null);
      if (s) {
        const order = ids.filter((x) => x !== s.id);
        order.splice(s.targetIndex, 0, s.id);
        store.setProductsOrder(order);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Level-1 (public, no password) visitors only ever see "Ready" products.
  // Missing status = legacy product = treated as Ready (nothing disappears
  // when this field is introduced). Legacy 'correction' (retired status,
  // folded into Test) reads as Test.
  const productStatus = (p) => {
    const st = p.status || 'ready';
    return st === 'correction' ? 'test' : st;
  };
  const products = readonly ? store.products.filter((p) => productStatus(p) === 'ready') : store.products;

  return (
    <div>
      <CreaHero label={tr('Catalogue')} value={products.length} sub={tr('produits actifs')} color={c.rose} t={t} dark={dark} unit="" />
      <CreaSection title={tr('Produits')} right={`${products.length}`} dark={dark} t={t} />

      <div style={{ padding: '0 22px', display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
        {products.map((p, idx) => {
          const recipe = store.recipeFor(p.id);
          const cost = recipeCost(recipe, store.materialById, store.purchases);
          const unitCost = cost.total;
          const margin = (p.unitPrice || 0) - unitCost;
          const stock = store.finishedStock[p.id] ?? 0;
          const can = store.producibleFor(p.id);
          const bn = store.bottleneckFor(p.id);
          const marginPct = (p.unitPrice || 0) > 0 ? (margin / p.unitPrice) * 100 : 0;
          const series = costSeries(recipe, store.materialById, store.purchases, 6);
          const edit = editId === p.id;
          const expanded = expandedIds.has(p.id);
          const hasSop = !!(store.sops[p.id]?.steps?.length);
          const dragging = dragState && dragState.id === p.id;
          const dropHere = !!dragState && !dragging && dragState.targetIndex === idx;
          return (
            <div key={p.id} ref={(el) => { rowRefs.current[p.id] = el; }} style={{
              position: 'relative', overflow: 'hidden', padding: expanded ? 16 : '7px 12px', borderRadius: expanded ? 18 : 12,
              background: c.panel, border: `1px solid ${dropHere ? c.accent : (edit ? c.accent : c.border)}`,
              transform: dragging ? `translateY(${dragState.dy}px)` : 'none',
              zIndex: dragging ? 60 : 'auto',
              boxShadow: dragging ? (dark ? '0 12px 32px rgba(0,0,0,.5)' : '0 12px 32px rgba(16,19,26,.2)') : 'none',
              opacity: dragging ? 0.96 : 1,
            }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, background: `oklch(0.6 0.18 ${p.hue})` }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: expanded ? 14 : 8 }}>
                {!readonly && (
                  <span onPointerDown={(e) => startDrag(p.id, e)} style={{
                    color: c.mutedSoft, cursor: dragging ? 'grabbing' : 'grab', flexShrink: 0,
                    display: 'flex', touchAction: 'none',
                  }}><Icon.grip width={expanded ? 15 : 13} height={expanded ? 15 : 13} /></span>
                )}
                <div style={{
                  width: expanded ? 56 : 30, height: expanded ? 56 : 30, borderRadius: expanded ? 14 : 9,
                  background: `oklch(0.22 0.08 ${p.hue})`, color: `oklch(0.92 0.14 ${p.hue})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: creaMono,
                  fontSize: expanded ? 18 : 11, fontWeight: 700, flexShrink: 0, transition: 'width .15s, height .15s',
                }}>{p.emoji}</div>
                <div style={{ flex: 1, minWidth: 0, display: expanded ? 'block' : 'flex', alignItems: 'baseline', gap: 8 }}>
                  {edit ? (
                    <input value={nameDraft} autoFocus onChange={(e) => setNameDraft(e.target.value)}
                      onBlur={() => { const n = nameDraft.trim(); if (n && n !== p.name) store.updateProduct(p.id, { name: n }); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                      style={{ width: '100%', boxSizing: 'border-box', background: c.panel2, color: c.text, border: `1px solid ${c.border}`, borderRadius: 8, padding: '6px 10px', fontFamily: creaSans, fontSize: 16, outline: 'none' }} />
                  ) : (
                    <div style={{
                      fontFamily: creaDisplay, fontStyle: 'normal', fontSize: expanded ? 18 : 13, color: c.text,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{p.name}</div>
                  )}
                  {!readonly && (
                    <div style={{ fontSize: expanded ? 11 : 10, color: c.muted, fontFamily: creaMono, marginTop: expanded ? 2 : 0, flexShrink: 0 }}>
                      {tr('Vente {x} {cur}', { x: fmtNum(p.unitPrice), cur: t.currency })}
                    </div>
                  )}
                </div>
                {/* SOP quick-access — sits mid-row (between name/price and the
                    status/chevron/pencil cluster), labeled so it reads clearly.
                    Jumps straight to view/create without expanding the card.
                    Hidden for public with no SOP. */}
                {(hasSop || !readonly) && (
                  <button onClick={(e) => { e.stopPropagation(); hasSop ? setSopView(p) : setSopEdit(p); }}
                    aria-label={hasSop ? tr('Voir la SOP') : tr('Créer la SOP')} style={{
                    flexShrink: 0, padding: expanded ? '7px 12px' : '4px 9px', borderRadius: 999, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: hasSop ? `${c.accent}1c` : c.panel2, color: hasSop ? c.accent : c.mutedSoft,
                    border: `1px solid ${hasSop ? c.accent + '55' : c.border}`,
                    fontFamily: creaSans, fontSize: expanded ? 12 : 10.5, fontWeight: 700,
                  }}><Icon.list width={expanded ? 14 : 11} height={expanded ? 14 : 11} /> SOP</button>
                )}
                {/* Status, compact inline form — only in the collapsed row (the
                    expanded card shows the same chips full-size, below). */}
                {!readonly && !expanded && (
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {[
                      { id: 'ready', label: 'Ready', color: c.pos || c.accent },
                      { id: 'test', label: 'Test', color: c.amber },
                    ].map((st) => {
                      const active = productStatus(p) === st.id;
                      if (!active) return null;  // collapsed: only show the active one, saves space
                      return (
                        <span key={st.id} style={{
                          padding: '2px 7px', borderRadius: 999, border: `1px solid ${st.color}`,
                          background: `${st.color}22`, color: st.color,
                          fontFamily: creaSans, fontSize: 9.5, fontWeight: 700, whiteSpace: 'nowrap',
                        }}>{st.label}</span>
                      );
                    })}
                  </div>
                )}
                {/* Chevron — opens/closes the full card. The row itself only
                    ever shows name, price and status (per the compact list view). */}
                <button onClick={() => toggleExpand(p.id)} aria-label={expanded ? tr('Réduire') : tr('Développer')} style={{
                  flexShrink: 0, width: expanded ? 34 : 24, height: expanded ? 34 : 24, borderRadius: 999, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: c.panel2, color: c.muted, border: `1px solid ${c.border}`,
                  transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s',
                }}><Icon.chevronDown width={expanded ? 15 : 12} height={expanded ? 15 : 12} /></button>
                {/* Per-product edit / done button — clicking it also opens the card. */}
                {!readonly && <button onClick={(e) => {
                  e.stopPropagation();
                  if (edit) { setEditId(null); }
                  else { setNameDraft(p.name); setEditId(p.id); setExpandedIds((s) => new Set(s).add(p.id)); }
                }} style={{
                  flexShrink: 0, width: expanded ? 34 : 24, height: expanded ? 34 : 24, borderRadius: 999, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: edit ? c.accent : c.panel2, color: edit ? c.inkContrast : c.muted,
                  border: `1px solid ${edit ? c.accent : c.border}`,
                }}>{edit ? <Icon.check width={expanded ? 16 : 13} height={expanded ? 16 : 13} /> : <Icon.edit width={expanded ? 16 : 13} height={expanded ? 16 : 13} />}</button>}
              </div>

              {/* Status — level 2/3 (staff/admin) only, full form once expanded.
                  Only "Ready" products reach the public catalog (filtered above). */}
              {!readonly && expanded && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {[
                    { id: 'ready', label: 'Ready', color: c.pos || c.accent },
                    { id: 'test', label: 'Test', color: c.amber },
                  ].map((st) => {
                    const active = productStatus(p) === st.id;
                    return (
                      <button key={st.id} disabled={!edit}
                        onClick={() => store.updateProduct(p.id, { status: st.id })}
                        style={{
                          padding: '4px 10px', borderRadius: 999, cursor: edit ? 'pointer' : 'default',
                          border: `1px solid ${active ? st.color : c.border}`,
                          background: active ? `${st.color}22` : 'transparent',
                          color: active ? st.color : c.mutedSoft,
                          fontFamily: creaSans, fontSize: 11, fontWeight: 700,
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: active ? st.color : c.border, flexShrink: 0 }} />
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Everything below is hidden in the compact row — the chevron
                  opens it. Matches "les infos de l'image uniquement" for the
                  collapsed state: icon, name, price, status only. */}
              {expanded && (
              <React.Fragment>
              {/* Suggest a correction — only while Test; base recipe stays
                  locked, changes go through a compare-and-approve draft. */}
              {!readonly && productStatus(p) === 'test' && (
                <button onClick={() => setCompareFor(p)} style={{
                  width: '100%', marginTop: 8, padding: '9px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${c.amber}55`, background: `${c.amber}14`, color: c.amber,
                  fontFamily: creaSans, fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <Icon.list width={14} height={14} />
                  {store.draftFor(p.id) ? tr('Revoir la suggestion') : tr('Suggérer une correction')}
                </button>
              )}

              {/* Comment — free-text note, level 2/3 only, never shown to public. */}
              {!readonly && (edit ? (
                <textarea defaultValue={p.comment || ''} rows={2} placeholder={tr('Commentaire (optionnel)…')}
                  onBlur={(e) => { const v = e.target.value; if (v !== (p.comment || '')) store.updateProduct(p.id, { comment: v }); }}
                  style={{
                    width: '100%', boxSizing: 'border-box', marginTop: 10, resize: 'vertical', minHeight: 44,
                    background: c.panel2, color: c.text, border: `1px solid ${c.border}`, borderRadius: 10,
                    padding: '8px 11px', fontFamily: creaSans, fontSize: 12.5, outline: 'none', lineHeight: 1.5,
                  }} />
              ) : (p.comment && (
                <div style={{
                  marginTop: 10, padding: '8px 11px', borderRadius: 10,
                  background: c.panel2, border: `1px solid ${c.border}`,
                  color: c.muted, fontFamily: creaSans, fontSize: 12.5, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                }}>{p.comment}</div>
              )))}

              {/* Margin tiles */}
              {!readonly && <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {[
                  { lab: tr('Coût / unité'), val: fmtNum(unitCost), col: c.text },
                  { lab: tr('Marge nette'), val: `${margin >= 0 ? '+' : '−'}${fmtNum(Math.abs(margin))}`, col: margin >= 0 ? c.accent : c.rose },
                  { lab: tr('Marge %'), val: `${Math.round(marginPct)}%`, col: margin >= 0 ? c.accent : c.rose },
                ].map((tile) => (
                  <div key={tile.lab} style={{ flex: 1, padding: '9px 11px', borderRadius: 12, background: c.panel2, border: `1px solid ${c.border}`, minWidth: 0 }}>
                    <div style={{ fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', color: c.muted, fontWeight: 600, fontFamily: creaSans }}>{tile.lab}</div>
                    <div style={{ fontFamily: creaDisplay, fontStyle: 'normal', fontSize: 19, color: tile.col, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{tile.val}</div>
                  </div>
                ))}
              </div>}

              {/* Stock + produce strip */}
              {!readonly && <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, padding: '10px 13px', borderRadius: 12, background: c.panel2, border: `1px solid ${c.border}` }}>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', color: c.muted, fontWeight: 600, fontFamily: creaSans }}>{tr('En stock')}</div>
                  <div style={{ fontFamily: creaDisplay, fontStyle: 'normal', fontSize: 18, color: c.text, lineHeight: 1 }}>{stock} <span style={{ fontFamily: creaMono, fontSize: 10, color: c.muted, fontStyle: 'normal' }}>u</span></div>
                </div>
                <div style={{ width: 1, alignSelf: 'stretch', background: c.border }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', color: c.muted, fontWeight: 600, fontFamily: creaSans }}>{tr('Produisibles')}</div>
                  <div style={{ fontFamily: creaDisplay, fontStyle: 'normal', fontSize: 18, color: can === 0 ? c.rose : c.text, lineHeight: 1 }}>{can} <span style={{ fontFamily: creaMono, fontSize: 10, color: c.muted, fontStyle: 'normal' }}>u</span></div>
                  {bn && <div style={{ fontFamily: creaMono, fontSize: 9, color: c.mutedSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tr('limité par {name}', { name: store.materialById[bn.materialId]?.name })}</div>}
                </div>
                {/* Mini cost sparkline (no month labels), inline on the producible row */}
                <CreaSparkline series={series} c={c} title={tr('Coût de production · 1 unité')} />
                <button onClick={() => onEdit && onEdit('production', { productId: p.id, qty: '', who: '' })} style={{
                  padding: '9px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: c.accent, color: c.inkContrast, fontFamily: creaSans, fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>{tr('Produire')}</button>
              </div>}

              {/* Composition */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: c.mutedSoft, fontWeight: 700, fontFamily: creaSans, marginBottom: 4 }}>{tr('Composition')}</div>
                {cost.ingredientLines.length === 0 && (
                  <div style={{ fontFamily: creaSans, fontSize: 12, color: c.muted, padding: '6px 0' }}>{tr('Aucun composant')}</div>
                )}
                {edit && productStatus(p) === 'test' && (
                  <div style={{ fontFamily: creaSans, fontSize: 11.5, color: c.mutedSoft, padding: '4px 0 2px', fontStyle: 'italic' }}>
                    {tr('Composition verrouillée pendant Test — utilise « Suggérer une correction ».')}
                  </div>
                )}
                {edit && productStatus(p) !== 'test'
                  ? cost.ingredientLines.map((ln) => <CreaIngredientEdit key={ln.id} pid={p.id} ln={ln} c={c} store={store} />)
                  : cost.ingredientLines.map((ln) => (
                      <div key={ln.id} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, padding: '4px 0' }}>
                        <span style={{ fontFamily: creaSans, fontSize: 12.5, color: c.text, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 999, background: `oklch(0.62 0.16 ${ln.material?.hue || 0})`, marginRight: 7 }} />
                          {ln.material?.name || '—'}
                        </span>
                        {(() => {
                          const base = ln.material?.unit || 'g';
                          const du = COMPONENT_UNITS.includes(ln.unit) ? ln.unit : base;
                          return (
                            <span style={{ fontFamily: creaMono, fontSize: 12, color: c.muted, flexShrink: 0 }}>
                              {fmtQty(convertUnit(ln.qty, base, du, densityFor(ln.material)))} {du}{readonly ? '' : ` · ${fmtNum(ln.cost)} ${t.currency}`}
                            </span>
                          );
                        })()}
                      </div>
                    ))}
                {edit && productStatus(p) !== 'test' && (
                  <button onClick={() => setAddFor(p.id)} style={{
                    width: '100%', marginTop: 8, padding: '9px', borderRadius: 10, cursor: 'pointer',
                    border: `1px dashed ${c.border}`, background: 'transparent', color: c.muted,
                    fontFamily: creaSans, fontSize: 12, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}><Icon.plus width={15} height={15} /> {tr('Ajouter un composant')}</button>
                )}
              </div>

              {/* SOP — production procedure */}
              {(() => {
                if (!hasSop && readonly) return null;
                const btn = (label, onClick, solid) => (
                  <button onClick={onClick} style={{
                    flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer',
                    border: solid ? 'none' : `1px solid ${c.border}`,
                    background: solid ? c.panel2 : 'transparent',
                    color: solid ? c.text : c.muted,
                    fontFamily: creaSans, fontSize: 12.5, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}><Icon.list width={15} height={15} /> {label}</button>
                );
                return (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {hasSop && btn(tr('Voir la SOP'), () => setSopView(p), true)}
                    {!readonly && btn(hasSop ? tr('Éditer la SOP') : tr('Créer la SOP'), () => setSopEdit(p), false)}
                  </div>
                );
              })()}
              </React.Fragment>
              )}
            </div>
          );
        })}
      </div>

      {!readonly && (
        <div style={{ padding: '14px 22px 0' }}>
          <button onClick={() => onAdd && onAdd('product')} style={{
            width: '100%', padding: '13px', borderRadius: 14,
            border: `1px dashed ${c.border}`, background: 'transparent', color: c.muted,
            cursor: 'pointer', fontFamily: creaSans, fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}><Icon.plus width={16} height={16} /> {tr('Nouveau produit')}</button>
        </div>
      )}

      {addFor && <ProdAddMaterialSheet store={store} dark={dark} t={t} productId={addFor}
        used={new Set(store.recipeFor(addFor).ingredients.map((i) => i.materialId))} onClose={() => setAddFor(null)} />}
      {sopView && <ProdSopViewerSheet store={store} dark={dark} t={t} product={sopView} onClose={() => setSopView(null)} />}
      {sopEdit && <ProdSopEditorSheet store={store} dark={dark} t={t} product={sopEdit} onClose={() => setSopEdit(null)} />}
      {compareFor && <ProdFormulaCompareSheet store={store} dark={dark} t={t} product={compareFor} onClose={() => setCompareFor(null)} />}
    </div>
  );
}

// ── To-do board ──────────────────────────────────────────────
// Manual tasks assigned to team members + an automatic "to purchase" list of
// materials whose stock can't cover 10 units of some product.
function CreaTodos({ store, dark, t }) {
  const c = creaTheme(dark, t.accent);
  const [text, setText] = React.useState('');
  const [assignee, setAssignee] = React.useState(store.team[0] || '');
  const [addingMember, setAddingMember] = React.useState(false);
  const [memberDraft, setMemberDraft] = React.useState('');

  const open = store.todos.filter((x) => !x.done);
  const done = store.todos.filter((x) => x.done);

  const add = () => {
    const txt = text.trim();
    if (!txt || !assignee) return;
    store.addTodo({ text: txt, assignee });
    setText('');
  };
  const confirmMember = () => {
    const n = memberDraft.trim();
    if (n) { store.addTeamMember(n); setAssignee(n); }
    setMemberDraft(''); setAddingMember(false);
  };

  const card = { background: c.panel, border: `1px solid ${c.border}`, borderRadius: 14 };

  return (
    <div>
      <CreaHero label={tr('Tâches')} value={open.length} sub={tr('à faire')} color={c.amber} t={t} dark={dark} unit="" />

      {/* New task */}
      <div style={{ padding: '0 22px' }}>
        <div style={{ ...card, padding: 14 }}>
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
            {store.team.map((name) => {
              const sel = assignee === name;
              return (
                <button key={name} onClick={() => setAssignee(name)} style={{
                  padding: '6px 13px', borderRadius: 999, cursor: 'pointer',
                  border: `1px solid ${sel ? c.accent : c.border}`,
                  background: sel ? c.accent : c.panel2, color: sel ? c.inkContrast : c.text,
                  fontFamily: creaSans, fontSize: 12.5, fontWeight: 600,
                }}>{name}</button>
              );
            })}
            {addingMember ? (
              <input value={memberDraft} autoFocus onChange={(e) => setMemberDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmMember(); if (e.key === 'Escape') { setAddingMember(false); setMemberDraft(''); } }}
                onBlur={confirmMember}
                placeholder={tr('Nouveau membre…')}
                style={{
                  width: 130, background: c.panel2, color: c.text, border: `1px dashed ${c.accent}`,
                  borderRadius: 999, padding: '6px 13px', fontFamily: creaSans, fontSize: 12.5, outline: 'none',
                }} />
            ) : (
              <button onClick={() => setAddingMember(true)} aria-label={tr('Nouveau membre…')} style={{
                padding: '6px 11px', borderRadius: 999, cursor: 'pointer',
                border: `1px dashed ${c.border}`, background: 'transparent', color: c.muted,
                fontFamily: creaSans, fontSize: 12.5, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
              }}><Icon.plus width={13} height={13} /></button>
            )}
          </div>
          <button onClick={add} disabled={!text.trim()} style={{
            width: '100%', marginTop: 12, padding: '12px', borderRadius: 999,
            cursor: text.trim() ? 'pointer' : 'default', border: 'none',
            background: c.accent, color: c.inkContrast, opacity: text.trim() ? 1 : 0.45,
            fontFamily: creaSans, fontSize: 14, fontWeight: 700,
          }}>{tr('Ajouter')}</button>
        </div>
      </div>

      {/* Task list */}
      <CreaSection title={tr('Tâches')} right={`${open.length}`} dark={dark} t={t} />
      <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {store.todos.length === 0 && (
          <div style={{ fontFamily: creaSans, fontSize: 13, color: c.muted, padding: '4px 0' }}>{tr('Aucune tâche. Ajoute la première !')}</div>
        )}
        {[...open, ...done].map((td) => (
          <div key={td.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', opacity: td.done ? 0.55 : 1 }}>
            <button onClick={() => store.toggleTodo(td.id)} aria-label="toggle" style={{
              width: 24, height: 24, borderRadius: 999, flexShrink: 0, cursor: 'pointer',
              border: `1.5px solid ${td.done ? c.accent : c.border}`,
              background: td.done ? c.accent : 'transparent',
              color: c.inkContrast, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{td.done && <Icon.check width={13} height={13} />}</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: creaSans, fontSize: 13.5, color: c.text, fontWeight: 500, textDecoration: td.done ? 'line-through' : 'none' }}>{td.text}</div>
              <div style={{ fontFamily: creaMono, fontSize: 10.5, color: c.muted, marginTop: 1 }}>{td.assignee} · {fmtDate(td.date)}</div>
            </div>
            <button onClick={() => store.removeTodo(td.id)} aria-label="delete" style={{
              background: 'none', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0,
            }}><Icon.trash width={15} height={15} /></button>
          </div>
        ))}
      </div>

      {/* To purchase — auto shopping list */}
      <CreaSection title={tr('À acheter')} right={`${store.toPurchase.length}`} dark={dark} t={t} />
      <div style={{ padding: '0 22px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontFamily: creaSans, fontSize: 11.5, color: c.mutedSoft, marginTop: -6 }}>{tr('Stock insuffisant pour produire 10 unités')}</div>
        {store.toPurchase.length === 0 && (
          <div style={{ fontFamily: creaSans, fontSize: 13, color: c.muted }}>{tr('Rien à acheter — les stocks couvrent 10 unités de chaque produit.')}</div>
        )}
        {store.toPurchase.map((x) => {
          const mat = store.materialById[x.materialId];
          const prod = store.productById[x.productId];
          if (!mat) return null;
          return (
            <div key={x.materialId} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px' }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: `oklch(0.62 0.16 ${mat.hue || 0})`, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: creaSans, fontSize: 13.5, color: c.text, fontWeight: 500 }}>{mat.name}</div>
                <div style={{ fontFamily: creaMono, fontSize: 10.5, color: c.muted, marginTop: 1 }}>{prod ? tr('pour 10× {name}', { name: prod.name }) : ''}</div>
              </div>
              <div style={{ fontFamily: creaDisplay, fontSize: 16, color: c.amber, flexShrink: 0, fontWeight: 600 }}>
                {fmtQty(x.missing)} <span style={{ fontFamily: creaMono, fontSize: 10.5, color: c.muted }}>{mat.unit} {tr('manquant')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Bottom nav (creative — blob style) ──────────────────────
function CreaNav({ value, onChange, dark, t, role }) {
  const c = creaTheme(dark, t.accent);
  const allowed = ALLOWED_TABS[role] || ALLOWED_TABS.admin;
  const tabs = [
    { id: 'dash', label: 'Profit', icon: Icon.dash },
    { id: 'sales', label: 'Ventes', icon: Icon.sale },
    { id: 'buys', label: 'Achats', icon: Icon.buy },
    { id: 'stock', label: 'Stock', icon: Icon.box },
    { id: 'prods', label: 'Produits', icon: Icon.prod },
    { id: 'todos', label: 'To do', icon: Icon.todo },
  ].filter((tab) => allowed.includes(tab.id));
  if (tabs.length < 2) return null;   // public: single tab — no nav needed
  const idx = tabs.findIndex((tab) => tab.id === value);
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: '8px 14px 28px',
      background: dark
        ? 'linear-gradient(180deg, transparent 0%, rgba(14,15,19,0.9) 50%, rgba(14,15,19,1) 80%)'
        : 'linear-gradient(180deg, transparent 0%, rgba(244,245,247,0.95) 50%, rgba(244,245,247,1) 80%)',
    }}>
      <div style={{
        position: 'relative',
        display: 'grid', gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
        background: c.panel, border: `1px solid ${c.border}`,
        borderRadius: 22, padding: 6, gap: 0,
        boxShadow: dark ? 'none' : '0 2px 10px rgba(16,19,26,0.05)',
      }}>
        <div style={{
          position: 'absolute', top: 6, left: `calc(6px + ${idx} * ((100% - 12px) / ${tabs.length}))`,
          width: `calc((100% - 12px) / ${tabs.length})`, height: 'calc(100% - 12px)',
          background: c.accent, borderRadius: 14, zIndex: 0,
          transition: 'left .35s cubic-bezier(.4,1.4,.5,1)',
        }} />
        {tabs.map((tab) => {
          const sel = value === tab.id;
          const T = tab.icon;
          return (
            <button key={tab.id} onClick={() => onChange(tab.id)} style={{
              position: 'relative', zIndex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '7px 0', border: 'none', background: 'transparent',
              cursor: 'pointer', color: sel ? '#ffffff' : c.muted,
              fontFamily: creaSans, fontSize: 10, fontWeight: 600,
              transition: 'color .2s',
            }}>
              <T />
              {tr(tab.label)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Add / Edit sheet (creative) ──────────────────────────────
function CreaAddSheet({ store, dark, t, kind, setKind, editing, onClose }) {
  const c = creaTheme(dark, t.accent);
  const ed = editing || null;
  const isEdit = !!(ed && ed.id);
  const [productId, setProductId] = React.useState(ed?.productId || store.products[0]?.id || '');
  const [materialId, setMaterialId] = React.useState(ed?.materialId || store.materials[0]?.id || '');
  const [qty, setQty] = React.useState(ed?.qty != null ? String(ed.qty) : '');
  const [price, setPrice] = React.useState(ed?.price != null ? String(ed.price) : '');
  const [note, setNote] = React.useState(ed?.note || ed?.who || '');
  const [label, setLabel] = React.useState(ed?.label || '');
  const [amount, setAmount] = React.useState(ed?.amount != null ? String(ed.amount) : '');
  // product create/edit
  const [npName, setNpName] = React.useState(ed && kind === 'product' ? ed.name : '');
  const [npPrice, setNpPrice] = React.useState(ed && kind === 'product' ? String(ed.unitPrice ?? '') : '');
  // material create/edit
  const [mName, setMName] = React.useState(ed && kind === 'material' ? ed.name : '');
  const [mUnit, setMUnit] = React.useState(ed && kind === 'material' ? ed.unit : 'g');
  const [mKind, setMKind] = React.useState(ed && kind === 'material' ? ed.kind : 'matière');
  const [mStock, setMStock] = React.useState(ed && kind === 'material' ? String(ed.stock0 ?? '') : '');
  const [mPrice, setMPrice] = React.useState('');
  const [mCat, setMCat] = React.useState(ed && kind === 'material' ? materialCat(ed) : 'other');
  const [mCatAdding, setMCatAdding] = React.useState(false);
  const [mCatDraft, setMCatDraft] = React.useState('');
  // Purchase: user enters quantity (in a chosen unit) + total price paid (IDR).
  // Stored values stay per BASE unit (g/ml/m/pièce); per-unit price is computed.
  // Buying a not-yet-existing material: pick "+ New material", name it, and the
  // purchase itself creates it — no separate material-creation step.
  const [newMatMode, setNewMatMode] = React.useState(false);
  const [newMatName, setNewMatName] = React.useState('');
  const [newMatUnit, setNewMatUnit] = React.useState('g');
  const selMatBase = newMatMode ? newMatUnit : (store.materialById[materialId]?.unit || 'g');
  const defBuyUnit = (b) => COMPONENT_UNITS.includes(b) ? b : 'g';
  const [buyUnit, setBuyUnit] = React.useState(defBuyUnit(ed?.buyUnit || selMatBase));
  const [buyTotal, setBuyTotal] = React.useState(ed && ed.qty != null && ed.price != null ? String(Math.round(ed.qty * ed.price)) : '');
  // keep buy unit aligned when the selected material (or new-material unit) changes
  React.useEffect(() => {
    if (kind === 'buy' && !ed) setBuyUnit(defBuyUnit(newMatMode ? newMatUnit : (store.materialById[materialId]?.unit || 'g')));
  }, [materialId, kind, newMatMode, newMatUnit]);
  // which organisation paid / cashed in this transaction
  const [org, setOrg] = React.useState(ed?.org || 'lumaya');
  // settlement: who pays whom
  const [settleFrom, setSettleFrom] = React.useState(ed?.from || 'gawah');

  // default price from selected product/material when creating
  React.useEffect(() => {
    if (ed) return;
    if (kind === 'sale' && productId) setPrice(String(store.productById[productId]?.unitPrice || ''));
    if (kind === 'buy' && materialId) setPrice(String(store.materialPrices[materialId] || ''));
  }, [productId, materialId, kind]);

  const selMat = newMatMode ? { unit: newMatUnit } : store.materialById[materialId];
  const canProduce = kind === 'production' ? store.producibleFor(productId) : null;
  const bottleneck = kind === 'production' ? store.bottleneckFor(productId) : null;

  const submit = () => {
    if (kind === 'sale') {
      if (!productId || !qty || !price) return;
      const payload = { productId, qty: Number(qty), price: Number(price), note, org };
      isEdit ? store.updateSale(ed.id, payload) : store.addSale(payload);
    } else if (kind === 'buy') {
      let matId = materialId, mm = store.materialById[materialId];
      if (newMatMode) {
        if (!newMatName.trim() || !qty || !buyTotal) return;
        mm = store.addMaterial({ name: newMatName.trim(), unit: newMatUnit, stock0: 0 });
        matId = mm.id;
      }
      if (!matId || !qty || !buyTotal) return;
      const base = mm?.unit || 'g';
      const baseQty = convertUnit(Number(qty), buyUnit, base, densityFor(mm));  // entered unit → base
      if (baseQty <= 0) return;
      const unitPrice = Number(buyTotal) / baseQty;             // computed price per base unit
      const payload = { materialId: matId, qty: baseQty, price: unitPrice, note, org, buyUnit };
      isEdit ? store.updatePurchase(ed.id, payload) : store.addPurchase(payload);
    } else if (kind === 'cost') {
      if (!label || !amount) return;
      const payload = { label, amount: Number(amount), who: note, org };
      isEdit ? store.updateCost(ed.id, payload) : store.addCost(payload);
    } else if (kind === 'production') {
      if (!productId || !qty) return;
      const payload = { productId, qty: Number(qty), who: note };
      isEdit ? store.updateProduction(ed.id, payload) : store.addProductionLot(payload);
    } else if (kind === 'product') {
      if (!npName) return;
      const payload = { name: npName, unitPrice: Number(npPrice) || 0 };
      isEdit ? store.updateProduct(ed.id, payload) : store.addProduct(payload);
    } else if (kind === 'material') {
      if (!mName) return;
      const base = { name: mName, unit: mUnit, kind: mKind, cat: mCat, stock0: Number(mStock) || 0 };
      if (isEdit) store.updateMaterial(ed.id, base);
      else store.addMaterial({ ...base, price: Number(mPrice) || 0 });
    } else if (kind === 'settlement') {
      if (!amount) return;
      const to = settleFrom === 'lumaya' ? 'gawah' : 'lumaya';
      const payload = { from: settleFrom, to, amount: Number(amount), note };
      isEdit ? store.updateSettlement(ed.id, payload) : store.addSettlement(payload);
    }
    onClose();
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'transparent', border: 'none',
    borderBottom: `1px solid ${c.border}`,
    padding: '10px 0', color: c.text,
    fontFamily: creaSans, fontSize: 16, outline: 'none',
  };
  const labelStyle = {
    fontSize: 10, letterSpacing: 0.9, textTransform: 'uppercase',
    color: c.muted, fontWeight: 600, fontFamily: creaSans,
  };
  const kinds = [
    { id: 'sale', label: 'Vente' },
    { id: 'buy', label: 'Achat' },
    { id: 'cost', label: 'Charge' },
    { id: 'production', label: 'Production' },
    { id: 'material', label: 'Matière' },
    { id: 'product', label: 'Produit' },
  ];
  const pill = (sel, tone) => ({
    padding: '7px 13px', borderRadius: 999,
    background: sel ? (tone || c.ink) : 'transparent',
    color: sel ? c.inkContrast : c.text,
    border: `1px solid ${sel ? (tone || c.ink) : c.border}`,
    fontFamily: creaSans, fontSize: 12, fontWeight: 600, cursor: 'pointer',
  });

  // Organisation qui a payé / encaissé — figée par transaction (remplace l'ancien toggle global).
  const orgSelector = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={labelStyle}>{kind === 'sale' ? tr('Encaissé par') : tr('Payé par')}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        {[['lumaya', 'Lumaya', c.accent], ['gawah', 'GawahBonga', c.purple]].map(([id, lab, tone]) => (
          <button key={id} onClick={() => setOrg(id)} style={pill(org === id, tone)}>{lab}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', background: c.bg2,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        border: `1px solid ${c.border}`, borderBottom: 'none',
        padding: '14px 22px 30px', display: 'flex', flexDirection: 'column', gap: 16,
        animation: 'sageSlideUp .3s cubic-bezier(.2,.8,.2,1)',
        maxHeight: '88%', overflow: 'auto',
      }}>
        <div style={{ width: 36, height: 4, background: c.border, borderRadius: 2, margin: '0 auto' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 10, color: c.muted, fontFamily: creaSans, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600 }}>{isEdit ? tr('Modifier') : tr('Nouvelle entrée')}</div>
            <div style={{ fontFamily: creaDisplay, fontStyle: 'normal', fontSize: 30, color: c.text, lineHeight: 1, marginTop: 2 }}>
              {tr(kind === 'settlement' ? 'Règlement' : kinds.find((k) => k.id === kind)?.label)}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: c.panel2, border: `1px solid ${c.border}`, color: c.muted,
            width: 32, height: 32, borderRadius: 999, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon.close /></button>
        </div>

        {!isEdit && kind !== 'settlement' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {kinds.map((k) => (
              <button key={k.id} onClick={() => setKind(k.id)} style={pill(kind === k.id)}>{tr(k.label)}</button>
            ))}
          </div>
        )}

        {kind === 'sale' && (
          <React.Fragment>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={labelStyle}>{tr('Produit')}</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {store.products.map((p) => (
                  <CreaProductChip key={p.id} p={p} dark={dark} t={t}
                    selected={productId === p.id} onClick={() => setProductId(p.id)} />
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={labelStyle}>{tr('Unités vendues')}</div>
                <input type="number" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} style={inputStyle} placeholder="0" />
              </div>
              <div>
                <div style={labelStyle}>{tr('Prix unité ({cur})', { cur: t.currency })}</div>
                <input type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} placeholder="0" />
              </div>
            </div>
            <div>
              <div style={labelStyle}>{tr('Note')}</div>
              <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} placeholder={tr('Optionnel')} />
            </div>
            {orgSelector}
            {qty && price && (() => {
              const uc = store.unitCostFor(productId);
              const marg = (Number(price) - uc) * Number(qty);
              return (
                <div style={{ padding: '14px 16px', borderRadius: 16, background: c.panel2, border: `1px dashed ${c.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={labelStyle}>{tr('Total vente')}</span>
                    <span style={{ fontFamily: creaMono, fontSize: 14, color: c.text }}>{fmtNum(Number(qty) * Number(price))} {t.currency}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={labelStyle}>{tr('Marge ({c}/u de coût)', { c: fmtNum(uc) })}</span>
                    <span style={{ fontFamily: creaDisplay, fontStyle: 'normal', fontSize: 24, color: marg >= 0 ? c.accent : c.rose }}>{marg >= 0 ? '+' : '−'}{fmtNum(Math.abs(marg))}</span>
                  </div>
                </div>
              );
            })()}
          </React.Fragment>
        )}

        {kind === 'buy' && (
          <React.Fragment>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={labelStyle}>{tr('Matière première')}</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => { setNewMatMode(true); setMaterialId(''); }} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px 7px 7px', borderRadius: 999,
                  background: newMatMode ? c.accent : c.panel2, color: newMatMode ? c.inkContrast : c.text,
                  border: `1px solid ${newMatMode ? c.accent : c.border}`,
                  cursor: 'pointer', fontFamily: creaSans, fontSize: 12, fontWeight: 600,
                }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: 999, background: newMatMode ? c.inkContrast : c.border,
                    color: newMatMode ? c.accent : c.muted, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Icon.plus width={12} height={12} /></span>
                  {tr('Nouvelle matière')}
                </button>
              </div>
              {newMatMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 12, background: c.panel2, border: `1px solid ${c.border}` }}>
                  <input value={newMatName} autoFocus onChange={(e) => setNewMatName(e.target.value)}
                    placeholder={tr('Nom de la matière')} style={{ ...inputStyle, background: 'transparent' }} />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['g', 'ml', 'goutte', 'm', 'pièce'].map((u) => (
                      <button key={u} onClick={() => setNewMatUnit(u)} style={pill(newMatUnit === u)}>{u}</button>
                    ))}
                  </div>
                  <div style={{ fontFamily: creaSans, fontSize: 11.5, color: c.mutedSoft }}>
                    {tr('Le prix de cet achat devient le prix de référence de la matière.')}
                  </div>
                </div>
              ) : (
                groupedMaterials(store.materials).map((g) => (
                  <div key={g.cat} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: c.mutedSoft, fontWeight: 700, fontFamily: creaSans }}>{tr(g.label)}</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {g.items.map((m) => (
                        <CreaMatChip key={m.id} m={m} c={c} selected={materialId === m.id} onClick={() => { setMaterialId(m.id); setNewMatMode(false); }} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div>
                <div style={labelStyle}>{tr('Quantité achetée')}</div>
                <input type="number" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} style={inputStyle} placeholder="0" />
              </div>
              <div>
                <div style={labelStyle}>{tr('Unité')}</div>
                <select value={buyUnit} onChange={(e) => setBuyUnit(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 4, background: c.panel, color: c.text }}>
                  {COMPONENT_UNITS.map((u) => (
                    <option key={u} value={u} style={{ background: c.panel, color: c.text }}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <div style={labelStyle}>{tr('Prix total payé ({cur})', { cur: t.currency })}</div>
              <input type="number" inputMode="decimal" value={buyTotal} onChange={(e) => setBuyTotal(e.target.value)} style={inputStyle} placeholder="0" />
            </div>
            <div>
              <div style={labelStyle}>{tr('Fournisseur / note')}</div>
              <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} placeholder={tr('Optionnel')} />
            </div>
            {orgSelector}
            {qty && buyTotal && (() => {
              const baseQty = convertUnit(Number(qty), buyUnit, selMatBase, densityFor(selMat));
              const unitPrice = baseQty > 0 ? Number(buyTotal) / baseQty : 0;
              return (
                <div style={{ padding: '14px 16px', borderRadius: 16, background: c.panel2, border: `1px dashed ${c.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={labelStyle}>{tr('Total facture')}</span>
                    <span style={{ fontFamily: creaDisplay, fontStyle: 'normal', fontSize: 24, color: c.text }}>{fmtNum(Number(buyTotal))} <span style={{ fontSize: 12, color: c.muted, fontFamily: creaMono, fontStyle: 'normal' }}>{t.currency}</span></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={labelStyle}>{tr('Prix calculé / {u}', { u: selMatBase })}</span>
                    <span style={{ fontFamily: creaMono, fontSize: 13, color: c.accent }}>{unitPrice >= 100 ? fmtNum(unitPrice) : unitPrice.toFixed(2)} {t.currency}</span>
                  </div>
                </div>
              );
            })()}
          </React.Fragment>
        )}

        {kind === 'cost' && (
          <React.Fragment>
            <div>
              <div style={labelStyle}>{tr('Description')}</div>
              <input value={label} onChange={(e) => setLabel(e.target.value)} style={inputStyle} placeholder={tr('Transport, loyer atelier…')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={labelStyle}>{tr('Montant ({cur})', { cur: t.currency })}</div>
                <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} placeholder="0" />
              </div>
              <div>
                <div style={labelStyle}>{tr('Qui / atelier')}</div>
                <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} placeholder={tr('Optionnel')} />
              </div>
            </div>
            {orgSelector}
          </React.Fragment>
        )}

        {kind === 'production' && (
          <React.Fragment>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={labelStyle}>{tr('Produit fabriqué')}</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {store.products.map((p) => (
                  <CreaProductChip key={p.id} p={p} dark={dark} t={t}
                    selected={productId === p.id} onClick={() => setProductId(p.id)} />
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={labelStyle}>{tr('Unités produites')}</div>
                <input type="number" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} style={inputStyle} placeholder="0" />
              </div>
              <div>
                <div style={labelStyle}>{tr('Produit par')}</div>
                <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} placeholder={tr('Atelier')} />
              </div>
            </div>
            {/* Informational only — production is never blocked; material stock may go negative. */}
            <div style={{
              padding: '12px 16px', borderRadius: 14,
              background: c.panel2, border: `1px solid ${c.border}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ color: c.muted, display: 'flex' }}><Icon.box width={18} height={18} /></span>
              <span style={{ fontFamily: creaSans, fontSize: 12.5, color: c.muted, flex: 1 }}>
                {tr('Info : {n} unités produisibles avec le stock actuel', { n: canProduce })}
                {Number(qty) > canProduce ? tr(' · le stock matières passera en négatif', {}) : ''}
              </span>
            </div>
          </React.Fragment>
        )}

        {kind === 'material' && (
          <React.Fragment>
            <div>
              <div style={labelStyle}>{tr('Nom de la matière')}</div>
              <input value={mName} onChange={(e) => setMName(e.target.value)} style={inputStyle} placeholder={tr('Ex: Beurre de karité')} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={labelStyle}>{tr('Unité de mesure')}</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['g', 'ml', 'goutte', 'm', 'pièce'].map((u) => (
                  <button key={u} onClick={() => setMUnit(u)} style={pill(mUnit === u)}>{u}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={labelStyle}>{tr('Type')}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['matière', 'Matière'], ['emballage', 'Emballage']].map(([id, lab]) => (
                  <button key={id} onClick={() => setMKind(id)} style={pill(mKind === id)}>{tr(lab)}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={labelStyle}>{tr('Catégorie')}</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {allMaterialCats(store.materials).map((c) => (
                  <button key={c} onClick={() => setMCat(c)} style={pill(mCat === c)}>{tr(catLabel(c))}</button>
                ))}
                {mCatAdding ? (
                  <input value={mCatDraft} autoFocus onChange={(e) => setMCatDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                    onBlur={() => {
                      const n = mCatDraft.trim();
                      if (n) setMCat(n);
                      setMCatDraft(''); setMCatAdding(false);
                    }}
                    placeholder={tr('Nouvelle catégorie…')}
                    style={{
                      width: 130, background: c.panel2, color: c.text, border: `1px dashed ${c.accent}`,
                      borderRadius: 999, padding: '6px 13px', fontFamily: creaSans, fontSize: 12.5, outline: 'none',
                    }} />
                ) : (
                  <button onClick={() => setMCatAdding(true)} style={pill(false)}>+ {tr('Nouvelle')}</button>
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={labelStyle}>{tr('Stock de départ ({u})', { u: mUnit })}</div>
                <input type="number" inputMode="decimal" value={mStock} onChange={(e) => setMStock(e.target.value)} style={inputStyle} placeholder="0" />
              </div>
              {!ed && (
                <div>
                  <div style={labelStyle}>{tr('Prix / {u} ({cur})', { u: mUnit, cur: t.currency })}</div>
                  <input type="number" inputMode="decimal" value={mPrice} onChange={(e) => setMPrice(e.target.value)} style={inputStyle} placeholder="0" />
                </div>
              )}
            </div>
          </React.Fragment>
        )}

        {kind === 'product' && (
          <React.Fragment>
            <div>
              <div style={labelStyle}>{tr('Nom du produit')}</div>
              <input value={npName} onChange={(e) => setNpName(e.target.value)} style={inputStyle} placeholder={tr('Ex: Savon noir')} />
            </div>
            <div>
              <div style={labelStyle}>{tr('Prix de vente ({cur})', { cur: t.currency })}</div>
              <input type="number" inputMode="decimal" value={npPrice} onChange={(e) => setNpPrice(e.target.value)} style={inputStyle} placeholder="0" />
            </div>
            {!ed && (
              <div style={{ fontFamily: creaSans, fontSize: 12, color: c.muted }}>
                {tr("La recette (matières + main d’œuvre) se définit ensuite dans la fiche produit.")}
              </div>
            )}
          </React.Fragment>
        )}

        {kind === 'settlement' && (
          <React.Fragment>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={labelStyle}>{tr('Qui paie')}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['gawah', 'GawahBonga', c.purple], ['lumaya', 'Lumaya', c.accent]].map(([id, lab, tone]) => (
                  <button key={id} onClick={() => setSettleFrom(id)} style={pill(settleFrom === id, tone)}>{lab}</button>
                ))}
              </div>
              <div style={{ fontFamily: creaSans, fontSize: 12, color: c.muted }}>
                {tr('→ reçu par {name}', { name: settleFrom === 'lumaya' ? 'GawahBonga' : 'Lumaya' })}
              </div>
            </div>
            <div>
              <div style={labelStyle}>{tr('Montant ({cur})', { cur: t.currency })}</div>
              <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} placeholder="0" autoFocus />
            </div>
            <div>
              <div style={labelStyle}>{tr('Note')}</div>
              <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} placeholder={tr('Optionnel')} />
            </div>
          </React.Fragment>
        )}

        <button onClick={submit} style={{
          marginTop: 6, padding: '15px 18px',
          background: c.ink, color: c.inkContrast, border: 'none',
          borderRadius: 999, cursor: 'pointer',
          fontFamily: creaSans, fontSize: 14, fontWeight: 600, letterSpacing: 0.4,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {isEdit ? tr('Enregistrer les modifications') : tr('Enregistrer')} →
        </button>
      </div>
    </div>
  );
}

// material chip for the buy picker
function CreaMatChip({ m, c, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '7px 12px 7px 7px', borderRadius: 999,
      background: selected ? `oklch(0.24 0.08 ${m.hue})` : c.panel2,
      border: `1px solid ${selected ? `oklch(0.55 0.12 ${m.hue})` : c.border}`,
      color: selected ? `oklch(0.92 0.12 ${m.hue})` : c.text,
      cursor: 'pointer', fontFamily: creaSans, fontSize: 12, fontWeight: 500,
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: 999,
        background: `oklch(0.6 0.15 ${m.hue})`, color: '#0c0c10',
        fontFamily: creaMono, fontSize: 9, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{m.name.slice(0, 1)}</span>
      {m.name}
      <span style={{ fontFamily: creaMono, fontSize: 9, opacity: 0.6 }}>/{m.unit}</span>
    </button>
  );
}

// ── Creative App root ────────────────────────────────────────
// Tabs each role may see. Staff: restricted to sales / stock / products.
const ALLOWED_TABS = {
  admin: ['dash', 'sales', 'buys', 'stock', 'prods', 'todos'],
  staff: ['sales', 'stock', 'prods', 'todos'],
  public: ['prods'],   // anonymous visitors: catalog + SOPs only, read-only
};
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

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: c.bg, color: c.text, fontFamily: creaSans,
      overflow: 'hidden',
    }}>
      <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', paddingTop: 56, paddingBottom: 120 }}>
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
    </div>
  );
}

Object.assign(window, { CreaApp, creaTheme, creaSans, creaMono, creaDisplay, CreaSection, CreaHero, CreaProductChip, OrgFilter });
