// lumabonga-creative.jsx
// Variation B — Créatif: sculptural mobile UI with display type, vessels, and beads.

const creaTheme = (dark, accent) => ({
  bg: dark ? '#08080b' : '#f6f4ef',
  bg2: dark ? '#0e0f14' : '#ffffff',
  panel: dark ? '#13141b' : '#ffffff',
  panel2: dark ? '#1a1c25' : '#f0eee6',
  border: dark ? '#23252f' : '#e2dfd4',
  borderSoft: dark ? '#1a1c25' : '#ece9df',
  text: dark ? '#f3f1ea' : '#15171c',
  muted: dark ? '#8c8f9a' : '#5a5e68',
  mutedSoft: dark ? '#5d6068' : '#9aa0a8',
  accent: accent || '#7dd3a0',
  purple: '#c4a8ff',
  amber: '#f5c451',
  rose: '#f48fb1',
  ink: dark ? '#f3f1ea' : '#15171c',
  inkContrast: dark ? '#08080b' : '#f6f4ef',
});

const creaSerif = '"Fraunces", "Playfair Display", "Source Serif Pro", Georgia, serif';
const creaSans = '-apple-system, "Inter", "SF Pro Text", system-ui, sans-serif';
const creaMono = '"JetBrains Mono", "SF Mono", "Geist Mono", ui-monospace, monospace';

// Actually per default-aesthetic guidance avoid Fraunces. Switch hero to a clean grotesque.
const creaDisplay = '"Instrument Serif", "Bodoni Moda", Georgia, serif'; // editorial display
// fallback: this loads from google later but if not loaded, falls back to Georgia. We can also try a strong sans.

// ── Top bar ──────────────────────────────────────────────────
function CreaTopBar({ store, dark, t, onAdd }) {
  const c = creaTheme(dark, t.accent);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 20px 14px',
    }}>
      {/* spacer to keep the title centred (mirrors the + button width) */}
      <div style={{ width: 34, height: 34 }} />
      <div style={{ fontFamily: creaSans, fontSize: 11, color: c.muted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
        Luma · Bonga
      </div>
      <button onClick={onAdd} style={{
        width: 34, height: 34, borderRadius: 999,
        background: c.ink, color: c.inkContrast, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon.plus />
      </button>
    </div>
  );
}

// ── Profit vessels (two columns filling) ─────────────────────
function CreaVessels({ profit, share, t, dark }) {
  const c = creaTheme(dark, t.accent);
  const lumaya = Math.max(0, Math.round(profit * share / 100));
  const gawah = Math.max(0, profit - lumaya);
  const max = Math.max(lumaya, gawah, 1);
  // height percentages
  const hL = Math.max(8, (lumaya / max) * 100);
  const hG = Math.max(8, (gawah / max) * 100);

  const Vessel = ({ amount, pct, color, name, h }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        fontFamily: creaMono, fontSize: 10, color: c.muted,
        letterSpacing: 0.6, textTransform: 'uppercase',
      }}>{name}</div>
      <div style={{
        position: 'relative', width: '100%', height: 120,
        borderRadius: 14, overflow: 'hidden',
        background: c.panel2, border: `1px solid ${c.border}`,
      }}>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: `${h}%`,
          background: `linear-gradient(180deg, ${color}88, ${color})`,
          transition: 'height .8s cubic-bezier(.2,.8,.2,1)',
        }}>
          {/* moving shimmer */}
          <div style={{
            position: 'absolute', top: -8, left: 0, right: 0, height: 16,
            background: `linear-gradient(180deg, ${color}, ${color}00)`,
            opacity: 0.5, filter: 'blur(4px)',
          }} />
        </div>
        {/* pct label */}
        <div style={{
          position: 'absolute', top: 8, right: 10,
          fontFamily: creaMono, fontSize: 11, color: c.ink, opacity: 0.7,
        }}>{pct}%</div>
      </div>
      <div style={{ fontFamily: creaSans, fontSize: 14, fontWeight: 600, color: c.text }}>
        <AnimatedNumber value={amount} format={fmtShort} />
        <span style={{ fontSize: 10, color: c.muted, marginLeft: 2, fontWeight: 500 }}>{t.currency}</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 12, padding: '0 22px' }}>
      <Vessel amount={lumaya} pct={share} color={c.accent} name="Lumaya" h={hL} />
      <Vessel amount={gawah} pct={100 - share} color={c.purple} name="GawahBonga" h={hG} />
    </div>
  );
}

// ── Hero (display number with halo) ──────────────────────────
function CreaHero({ label, value, sub, t, dark, color }) {
  const c = creaTheme(dark, t.accent);
  const k = color || c.accent;
  return (
    <div style={{
      position: 'relative', padding: '14px 22px 14px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* halo */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 80% 60% at 30% 50%, ${k}22, transparent 70%)`,
        filter: 'blur(6px)',
      }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: k }} />
        <span style={{ fontFamily: creaSans, fontSize: 11, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div style={{
        position: 'relative',
        fontFamily: creaDisplay,
        fontSize: 56, lineHeight: 0.95, color: c.text,
        letterSpacing: -2, fontWeight: 400, fontStyle: 'italic',
      }}>
        <AnimatedNumber value={value} format={fmtNum} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: creaMono, fontSize: 12, color: c.muted, letterSpacing: 0.5 }}>{t.currency}</span>
        {sub && <span style={{ fontFamily: creaSans, fontSize: 12, color: c.muted }}>{sub}</span>}
      </div>
    </div>
  );
}

// ── Section header ───────────────────────────────────────────
function CreaSection({ title, right, dark, t }) {
  const c = creaTheme(dark, t.accent);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 22px', marginTop: 24, marginBottom: 10,
    }}>
      <div style={{
        fontFamily: creaDisplay, fontSize: 22, fontStyle: 'italic',
        color: c.text, letterSpacing: -0.4,
      }}>{title}</div>
      {right && <div style={{ fontFamily: creaMono, fontSize: 11, color: c.muted }}>{right}</div>}
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
          <span style={{ fontFamily: creaDisplay, fontSize: 18, fontStyle: 'italic', color }}>
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

// ── Screen: Dashboard ────────────────────────────────────────
function CreaDashboard({ store, dark, t }) {
  const c = creaTheme(dark, t.accent);
  const { totals } = store;
  const recent = React.useMemo(() => {
    const a = store.sales.map((x) => ({ ...x, kind: 'sale' }));
    const b = store.purchases.map((x) => ({ ...x, kind: 'buy' }));
    const d = store.costs.map((x) => ({ ...x, kind: 'cost' }));
    const e = store.production.map((x) => ({ ...x, kind: 'prod' }));
    return [...a, ...b, ...d, ...e].sort((x, y) => (y.date > x.date ? 1 : -1)).slice(0, 7);
  }, [store.sales, store.purchases, store.costs, store.production]);

  // low-stock alerts: products that can no longer be produced much
  const alerts = React.useMemo(() => {
    return store.products
      .map((p) => ({ p, can: store.producibleFor(p.id) }))
      .filter((x) => x.can <= 8)
      .sort((a, b) => a.can - b.can)
      .slice(0, 3);
  }, [store.products, store.producibleFor]);

  return (
    <div>
      <CreaHero label={tr('Profit net')} value={totals.profit} sub={tr('marge {p}%', { p: Math.round(totals.marge) })} t={t} dark={dark} />
      <CreaVessels profit={totals.profit} share={t.lumayaShare} t={t} dark={dark} />

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
        padding: '20px 22px 0',
      }}>
        {[
          { label: tr('Ventes'), value: totals.ventes, color: c.accent },
          { label: tr('Coût prod.'), value: totals.cogs, color: c.amber },
          { label: tr('Valeur stock'), value: totals.valStock, color: c.purple },
        ].map((k) => (
          <div key={k.label} style={{
            padding: '12px 12px', borderRadius: 14,
            background: c.panel, border: `1px solid ${c.border}`,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 10, color: c.muted, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: k.color }} />
              {k.label}
            </div>
            <div style={{
              fontFamily: creaDisplay, fontSize: 22, fontStyle: 'italic', color: c.text,
              letterSpacing: -0.4,
            }}>
              <AnimatedNumber value={k.value} format={fmtShort} />
            </div>
          </div>
        ))}
      </div>

      {alerts.length > 0 && (
        <React.Fragment>
          <CreaSection title={tr('Stock faible')} right={tr('à produire')} dark={dark} t={t} />
          <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map(({ p, can }) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 14,
                background: c.panel, border: `1px solid ${can === 0 ? c.rose : c.border}`,
              }}>
                <span style={{ color: can === 0 ? c.rose : c.amber, display: 'flex' }}><Icon.alert /></span>
                <span style={{ flex: 1, fontFamily: creaSans, fontSize: 14, color: c.text, fontWeight: 500 }}>{p.name}</span>
                <span style={{ fontFamily: creaMono, fontSize: 12, color: c.muted }}>{tr('{n} en stock', { n: store.finishedStock[p.id] ?? 0 })}</span>
                <span style={{
                  fontFamily: creaMono, fontSize: 11, fontWeight: 600,
                  color: can === 0 ? c.rose : c.amber,
                  padding: '3px 8px', borderRadius: 999,
                  background: can === 0 ? `${c.rose}22` : `${c.amber}1c`,
                }}>{can === 0 ? tr('rupture matières') : tr('{n} produisibles', { n: can })}</span>
              </div>
            ))}
          </div>
        </React.Fragment>
      )}

      <CreaSection title={tr('Mouvements')} right={tr('{n} récents', { n: recent.length })} dark={dark} t={t} />
      <div>
        {recent.map((r, i) => (
          <CreaBead key={r.id} item={r} store={store} dark={dark} t={t} isLast={i === recent.length - 1} />
        ))}
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

// ── Screen: Ventes ───────────────────────────────────────────
function CreaTxScreen({ store, dark, t, kind, onEdit }) {
  const c = creaTheme(dark, t.accent);
  const items = store.sales;
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
      <CreaHero label={tr('Total ventes')} value={total} sub={tr('{n} transactions', { n: items.length })} color={color} t={t} dark={dark} />

      <div style={{ padding: '6px 22px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {topProducts.map((tp) => (
          <div key={tp.product?.id} style={{
            padding: '8px 12px', borderRadius: 12,
            background: c.panel, border: `1px solid ${c.border}`,
            display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0,
          }}>
            <div style={{ fontSize: 10, color: c.muted, fontFamily: creaSans, fontWeight: 500 }}>{tp.product?.name}</div>
            <div style={{ fontFamily: creaMono, fontSize: 13, fontWeight: 600, color }}>{fmtShort(tp.value)}</div>
          </div>
        ))}
      </div>

      <CreaSection title={tr('Ventes')} right={tr('{n} entrées', { n: items.length })} dark={dark} t={t} />

      <div style={{ padding: '0 22px' }}>
        {items.map((it, i) => {
          const p = store.productById[it.productId];
          const unitCost = store.unitCostFor(it.productId);
          const margin = (it.price - unitCost) * it.qty;
          return (
            <div key={it.id} style={{
              padding: '14px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${c.borderSoft}`,
              display: 'flex', gap: 14, alignItems: 'center',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `oklch(0.22 0.08 ${p?.hue || 0})`,
                color: `oklch(0.88 0.14 ${p?.hue || 0})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: creaMono, fontSize: 14, fontWeight: 700, flexShrink: 0,
              }}>{p?.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: creaSans, fontSize: 14, color: c.text, fontWeight: 500 }}>{p?.name}</div>
                <div style={{ fontSize: 11, color: c.muted, fontFamily: creaSans, marginTop: 2 }}>
                  <span style={{ fontFamily: creaMono }}>{it.qty}</span> × <span style={{ fontFamily: creaMono }}>{fmtNum(it.price)}</span> {t.currency} · {tr('marge')} <span style={{ color: margin >= 0 ? c.accent : c.rose, fontFamily: creaMono }}>{margin >= 0 ? '+' : '−'}{fmtShort(Math.abs(margin))}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div style={{ fontFamily: creaDisplay, fontSize: 18, fontStyle: 'italic', color }}>
                  {fmtShort(it.qty * it.price)}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => onEdit && onEdit('sale', it)} style={{ background: 'transparent', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 0, display: 'flex' }}><Icon.edit /></button>
                  <button onClick={() => remove(it.id)} style={{ background: 'transparent', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 0, display: 'flex' }}><Icon.trash /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Screen: Products ─────────────────────────────────────────
function CreaProducts({ store, dark, t, onOpen, onAdd }) {
  const c = creaTheme(dark, t.accent);
  return (
    <div>
      <CreaHero label={tr('Catalogue')} value={store.products.length} sub={tr('produits actifs')} color={c.rose} t={t} dark={dark} />
      <CreaSection title={tr('Produits')} right={`${store.products.length}`} dark={dark} t={t} />
      <div style={{ padding: '0 22px', display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
        {store.products.map((p) => {
          const unitCost = store.unitCostFor(p.id);
          const margin = (p.unitPrice || 0) - unitCost;
          const stock = store.finishedStock[p.id] ?? 0;
          const can = store.producibleFor(p.id);
          return (
            <div key={p.id} onClick={() => onOpen && onOpen(p)} style={{
              position: 'relative', overflow: 'hidden',
              padding: 16, borderRadius: 18,
              background: c.panel, border: `1px solid ${c.border}`,
              display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
            }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, width: 4,
                background: `oklch(0.6 0.18 ${p.hue})`,
              }} />
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: `oklch(0.22 0.08 ${p.hue})`,
                color: `oklch(0.92 0.14 ${p.hue})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: creaMono, fontSize: 18, fontWeight: 700,
              }}>{p.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: creaDisplay, fontStyle: 'italic', fontSize: 18, color: c.text }}>{p.name}</div>
                <div style={{ fontSize: 11, color: c.muted, fontFamily: creaMono, marginTop: 2 }}>
                  {fmtNum(p.unitPrice)} − {fmtNum(unitCost)} = <span style={{ color: margin >= 0 ? c.accent : c.rose }}>{margin >= 0 ? '+' : '−'}{fmtNum(Math.abs(margin))}</span> {t.currency}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
                  <span style={{ fontFamily: creaMono, fontSize: 10, color: c.text, padding: '3px 7px', borderRadius: 999, background: c.panel2, border: `1px solid ${c.border}` }}>{stock} en stock</span>
                  <span style={{ fontFamily: creaMono, fontSize: 10, color: can === 0 ? c.rose : c.muted, padding: '3px 7px', borderRadius: 999, background: c.panel2, border: `1px solid ${can === 0 ? c.rose : c.border}` }}>{can} produisibles</span>
                </div>
              </div>
              <span style={{ color: c.mutedSoft, display: 'flex', marginLeft: 2 }}><Icon.arrow /></span>
            </div>
          );
        })}
      </div>
      <div style={{ padding: '14px 22px 0' }}>
        <button onClick={() => onAdd && onAdd('product')} style={{
          width: '100%', padding: '13px', borderRadius: 14,
          border: `1px dashed ${c.border}`, background: 'transparent', color: c.muted,
          cursor: 'pointer', fontFamily: creaSans, fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}><Icon.plus width={16} height={16} /> {tr('Nouveau produit')}</button>
      </div>
    </div>
  );
}

// ── Bottom nav (creative — blob style) ──────────────────────
function CreaNav({ value, onChange, dark, t }) {
  const c = creaTheme(dark, t.accent);
  const tabs = [
    { id: 'dash', label: 'Profit', icon: Icon.dash },
    { id: 'sales', label: 'Ventes', icon: Icon.sale },
    { id: 'buys', label: 'Achats', icon: Icon.buy },
    { id: 'stock', label: 'Stock', icon: Icon.box },
    { id: 'prods', label: 'Produits', icon: Icon.prod },
  ];
  const idx = tabs.findIndex((tab) => tab.id === value);
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: '8px 14px 28px',
      background: dark
        ? 'linear-gradient(180deg, transparent 0%, rgba(8,8,11,0.9) 50%, rgba(8,8,11,1) 80%)'
        : 'linear-gradient(180deg, transparent 0%, rgba(246,244,239,0.95) 50%, rgba(246,244,239,1) 80%)',
    }}>
      <div style={{
        position: 'relative',
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        background: c.panel, border: `1px solid ${c.border}`,
        borderRadius: 22, padding: 6, gap: 0,
      }}>
        <div style={{
          position: 'absolute', top: 6, left: `calc(6px + ${idx} * ((100% - 12px) / 5))`,
          width: `calc((100% - 12px) / 5)`, height: 'calc(100% - 12px)',
          background: c.ink, borderRadius: 16, zIndex: 0,
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
              cursor: 'pointer', color: sel ? c.inkContrast : c.muted,
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
  // which organisation paid / cashed in this transaction
  const [org, setOrg] = React.useState(ed?.org || 'lumaya');

  // default price from selected product/material when creating
  React.useEffect(() => {
    if (ed) return;
    if (kind === 'sale' && productId) setPrice(String(store.productById[productId]?.unitPrice || ''));
    if (kind === 'buy' && materialId) setPrice(String(store.materialPrices[materialId] || ''));
  }, [productId, materialId, kind]);

  const selMat = store.materialById[materialId];
  const canProduce = kind === 'production' ? store.producibleFor(productId) : null;
  const bottleneck = kind === 'production' ? store.bottleneckFor(productId) : null;

  const submit = () => {
    if (kind === 'sale') {
      if (!productId || !qty || !price) return;
      const payload = { productId, qty: Number(qty), price: Number(price), note, org };
      isEdit ? store.updateSale(ed.id, payload) : store.addSale(payload);
    } else if (kind === 'buy') {
      if (!materialId || !qty || !price) return;
      const payload = { materialId, qty: Number(qty), price: Number(price), note, org };
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
      const base = { name: mName, unit: mUnit, kind: mKind, stock0: Number(mStock) || 0 };
      if (isEdit) store.updateMaterial(ed.id, base);
      else store.addMaterial({ ...base, price: Number(mPrice) || 0 });
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
            <div style={{ fontFamily: creaDisplay, fontStyle: 'italic', fontSize: 30, color: c.text, lineHeight: 1, marginTop: 2 }}>
              {tr(kinds.find((k) => k.id === kind)?.label)}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: c.panel2, border: `1px solid ${c.border}`, color: c.muted,
            width: 32, height: 32, borderRadius: 999, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon.close /></button>
        </div>

        {!isEdit && (
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
                    <span style={{ fontFamily: creaDisplay, fontStyle: 'italic', fontSize: 24, color: marg >= 0 ? c.accent : c.rose }}>{marg >= 0 ? '+' : '−'}{fmtNum(Math.abs(marg))}</span>
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
              {store.materials.length === 0 && (
                <span style={{ fontFamily: creaSans, fontSize: 12, color: c.muted }}>{tr("Crée d’abord une matière (onglet Matière).")}</span>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {store.materials.map((m) => (
                  <CreaMatChip key={m.id} m={m} c={c} selected={materialId === m.id} onClick={() => setMaterialId(m.id)} />
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={labelStyle}>{tr('Quantité ({u})', { u: selMat?.unit || '' })}</div>
                <input type="number" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} style={inputStyle} placeholder="0" />
              </div>
              <div>
                <div style={labelStyle}>{tr('Prix / {u} ({cur})', { u: selMat?.unit || tr('unité'), cur: t.currency })}</div>
                <input type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} placeholder="0" />
              </div>
            </div>
            <div>
              <div style={labelStyle}>{tr('Fournisseur / note')}</div>
              <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} placeholder={tr('Optionnel')} />
            </div>
            {orgSelector}
            {qty && price && (
              <div style={{ padding: '14px 16px', borderRadius: 16, background: c.panel2, border: `1px dashed ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={labelStyle}>{tr('Total facture')}</span>
                <span style={{ fontFamily: creaDisplay, fontStyle: 'italic', fontSize: 26, color: c.text }}>{fmtNum(Number(qty) * Number(price))} <span style={{ fontSize: 13, color: c.muted, fontFamily: creaMono, fontStyle: 'normal' }}>{t.currency}</span></span>
              </div>
            )}
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
                <div style={labelStyle}>{tr('Unités à produire')}</div>
                <input type="number" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} style={inputStyle} placeholder="0" />
              </div>
              <div>
                <div style={labelStyle}>{tr('Responsable')}</div>
                <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} placeholder={tr('Atelier')} />
              </div>
            </div>
            <div style={{
              padding: '12px 16px', borderRadius: 14,
              background: c.panel2, border: `1px solid ${Number(qty) > canProduce ? c.rose : c.border}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ color: Number(qty) > canProduce ? c.rose : c.accent, display: 'flex' }}>
                {Number(qty) > canProduce ? <Icon.alert /> : <Icon.check />}
              </span>
              <span style={{ fontFamily: creaSans, fontSize: 12.5, color: c.text, flex: 1 }}>
                {tr('Stock matières : {n} unités produisibles', { n: canProduce })}
                {bottleneck && canProduce >= 0 ? tr(' · limité par {name}', { name: store.materialById[bottleneck.materialId]?.name }) : ''}
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
                {['g', 'ml', 'm', 'pièce'].map((u) => (
                  <button key={u} onClick={() => setMUnit(u)} style={pill(mUnit === u)}>{u}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={labelStyle}>{tr('Catégorie')}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['matière', 'Matière'], ['emballage', 'Emballage']].map(([id, lab]) => (
                  <button key={id} onClick={() => setMKind(id)} style={pill(mKind === id)}>{tr(lab)}</button>
                ))}
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
function CreaApp({ t, dark }) {
  const c = creaTheme(dark, t.accent);
  const store = useLumaStore();
  const [tab, setTab] = React.useState('dash');
  const [adding, setAdding] = React.useState(null);      // kind string
  const [editing, setEditing] = React.useState(null);    // entry data being edited
  const [openProduct, setOpenProduct] = React.useState(null);

  const defaultKind = (tb) => ({ sales: 'sale', buys: 'buy', stock: 'production', prods: 'product' }[tb] || 'sale');
  const openAdd = (k) => { setEditing(null); setAdding(typeof k === 'string' ? k : defaultKind(tab)); };
  const openEdit = (k, data) => { setEditing(data); setAdding(k); };
  const closeSheet = () => { setAdding(null); setEditing(null); };
  const goTab = (id) => { setOpenProduct(null); setTab(id); };

  if (openProduct) {
    const live = store.productById[openProduct.id] || openProduct;
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: c.bg, color: c.text, fontFamily: creaSans, overflow: 'hidden',
      }}>
        <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', paddingTop: 56 }}>
          <CreaProductDetail store={store} dark={dark} t={t} product={live}
            onBack={() => setOpenProduct(null)}
            onProduce={() => openEdit('production', { productId: live.id, qty: '', who: '' })} />
        </div>
        {adding && <CreaAddSheet store={store} dark={dark} t={t} kind={adding} setKind={setAdding} editing={editing} onClose={closeSheet} />}
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: c.bg, color: c.text, fontFamily: creaSans,
      overflow: 'hidden',
    }}>
      <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', paddingTop: 56, paddingBottom: 120 }}>
        <CreaTopBar store={store} dark={dark} t={t} onAdd={() => openAdd()} />
        {tab === 'dash' && <CreaDashboard store={store} dark={dark} t={t} />}
        {tab === 'sales' && <CreaTxScreen store={store} dark={dark} t={t} kind="sale" onEdit={openEdit} />}
        {tab === 'buys' && <CreaPurchases store={store} dark={dark} t={t} onEdit={openEdit} onAdd={openAdd} />}
        {tab === 'stock' && <CreaStock store={store} dark={dark} t={t} onEdit={openEdit} onAdd={openAdd} onOpen={setOpenProduct} />}
        {tab === 'prods' && <CreaProducts store={store} dark={dark} t={t} onOpen={setOpenProduct} onAdd={openAdd} />}
      </div>
      <CreaNav value={tab} onChange={goTab} dark={dark} t={t} />
      {adding && <CreaAddSheet store={store} dark={dark} t={t} kind={adding} setKind={setAdding} editing={editing} onClose={closeSheet} />}
    </div>
  );
}

Object.assign(window, { CreaApp, creaTheme, creaSans, creaMono, creaDisplay, CreaSection, CreaHero, CreaProductChip });
