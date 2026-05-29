// lumabonga-sage.jsx
// Variation A — Sage: clean dark-tech, list-driven mobile accounting app.

const sageTheme = (dark, accent) => ({
  bg: dark ? '#0d1117' : '#fbfaf7',
  panel: dark ? '#161b22' : '#ffffff',
  panel2: dark ? '#1c2230' : '#f4f3ee',
  border: dark ? '#262d38' : '#e6e3d9',
  borderSoft: dark ? '#1f242c' : '#eeece4',
  text: dark ? '#e6edf3' : '#1a1e22',
  muted: dark ? '#7d8590' : '#65717a',
  mutedSoft: dark ? '#5d646e' : '#8c93a0',
  accent: accent || '#7dd3a0',
  accentDim: dark ? 'rgba(125,211,160,0.12)' : 'rgba(60,150,90,0.10)',
  danger: '#f97066',
  warning: '#f5c451',
  purple: '#a78bfa',
});

const sageFont = '-apple-system, "SF Pro Text", "Inter", system-ui, sans-serif';
const sageNumFont = '"SF Mono", "JetBrains Mono", "Geist Mono", ui-monospace, monospace';

// ── User switcher (segmented pill) ───────────────────────────
function SageUserSwitch({ value, onChange, dark, t }) {
  const c = sageTheme(dark, t.accent);
  const users = [
    { id: 'lumaya', label: 'Lumaya', dot: c.accent },
    { id: 'gawah',  label: 'GawahBonga', dot: c.purple },
  ];
  return (
    <div style={{
      display: 'inline-flex', padding: 3, gap: 2,
      background: c.panel2, border: `1px solid ${c.border}`,
      borderRadius: 999,
    }}>
      {users.map((u) => {
        const sel = value === u.id;
        return (
          <button key={u.id} onClick={() => onChange(u.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 999,
            background: sel ? c.panel : 'transparent',
            border: 'none', cursor: 'pointer',
            color: sel ? c.text : c.muted,
            fontFamily: sageFont, fontSize: 13, fontWeight: 600,
            boxShadow: sel ? `inset 0 0 0 1px ${c.border}` : 'none',
            transition: 'all .15s',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: u.dot, boxShadow: sel ? `0 0 8px ${u.dot}` : 'none' }} />
            {u.label}
          </button>
        );
      })}
    </div>
  );
}

// ── KPI tile ─────────────────────────────────────────────────
function SageKPI({ label, value, sub, delta, accent, dark, t }) {
  const c = sageTheme(dark, t.accent);
  const positive = (delta || 0) >= 0;
  return (
    <div style={{
      background: c.panel, border: `1px solid ${c.border}`,
      borderRadius: 14, padding: '14px 14px 16px',
      display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: c.muted, fontWeight: 600 }}>{label}</div>
        {accent && <div style={{ width: 6, height: 6, borderRadius: 999, background: accent }} />}
      </div>
      <div style={{
        fontFamily: sageNumFont, fontSize: 22, fontWeight: 600,
        color: c.text, letterSpacing: -0.4, lineHeight: 1.05,
      }}>
        <AnimatedNumber value={value} format={fmtShort} />
        <span style={{ fontSize: 11, color: c.muted, marginLeft: 4, fontWeight: 500, fontFamily: sageFont }}>{t.currency}</span>
      </div>
      {(sub || delta != null) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: c.muted, fontFamily: sageFont }}>
          {delta != null && (
            <span style={{
              color: positive ? c.accent : c.danger, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 2,
            }}>
              {positive ? '↑' : '↓'} {Math.abs(delta)}%
            </span>
          )}
          {sub && <span>{sub}</span>}
        </div>
      )}
    </div>
  );
}

// ── Profit split bar ─────────────────────────────────────────
function SageSplitBar({ profit, share, dark, t }) {
  const c = sageTheme(dark, t.accent);
  const lumaya = Math.max(0, Math.round(profit * share / 100));
  const gawah = Math.max(0, profit - lumaya);
  return (
    <div style={{
      background: c.panel, border: `1px solid ${c.border}`,
      borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: c.muted, fontWeight: 600 }}>
          Répartition des profits
        </div>
        <div style={{ fontFamily: sageNumFont, fontSize: 11, color: c.muted }}>{share}/{100 - share}</div>
      </div>
      <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', background: c.panel2 }}>
        <div style={{
          width: `${share}%`, background: `linear-gradient(90deg, ${c.accent}, ${c.accent})`,
          transition: 'width .5s cubic-bezier(.2,.8,.2,1)',
        }} />
        <div style={{
          flex: 1, background: c.purple,
          transition: 'width .5s cubic-bezier(.2,.8,.2,1)',
        }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: c.muted, fontSize: 12, fontFamily: sageFont }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: c.accent }} />
            Lumaya
          </div>
          <div style={{ fontFamily: sageNumFont, fontSize: 17, fontWeight: 600, color: c.text, marginTop: 4 }}>
            <AnimatedNumber value={lumaya} format={fmtNum} /> <span style={{ fontSize: 10, color: c.muted, fontFamily: sageFont }}>{t.currency}</span>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: c.muted, fontSize: 12, fontFamily: sageFont }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: c.purple }} />
            GawahBonga
          </div>
          <div style={{ fontFamily: sageNumFont, fontSize: 17, fontWeight: 600, color: c.text, marginTop: 4 }}>
            <AnimatedNumber value={gawah} format={fmtNum} /> <span style={{ fontSize: 10, color: c.muted, fontFamily: sageFont }}>{t.currency}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Transaction row ──────────────────────────────────────────
function SageRow({ children, dark, t, onDelete }) {
  const c = sageTheme(dark, t.accent);
  const [open, setOpen] = React.useState(false);
  return (
    <div
      onClick={() => setOpen((v) => !v)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px',
        borderBottom: `1px solid ${c.borderSoft}`,
        cursor: 'pointer',
      }}>
      {children}
      {onDelete && open && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{
          background: 'transparent', border: `1px solid ${c.border}`, color: c.danger,
          borderRadius: 8, padding: 6, cursor: 'pointer',
        }}>
          <Icon.trash />
        </button>
      )}
    </div>
  );
}

// ── Tabs (bottom nav) ────────────────────────────────────────
function SageTabBar({ value, onChange, dark, t }) {
  const c = sageTheme(dark, t.accent);
  const tabs = [
    { id: 'dash', label: 'Bureau', icon: Icon.dash },
    { id: 'sales', label: 'Ventes', icon: Icon.sale },
    { id: 'buys', label: 'Achats', icon: Icon.buy },
    { id: 'costs', label: 'Coûts', icon: Icon.cost },
    { id: 'prods', label: 'Produits', icon: Icon.prod },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: 28, paddingTop: 8,
      background: dark
        ? 'linear-gradient(180deg, rgba(13,17,23,0) 0%, rgba(13,17,23,0.9) 35%, rgba(13,17,23,1) 70%)'
        : 'linear-gradient(180deg, rgba(251,250,247,0) 0%, rgba(251,250,247,0.95) 40%, rgba(251,250,247,1) 70%)',
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        margin: '0 12px', padding: '6px',
        background: c.panel, border: `1px solid ${c.border}`,
        borderRadius: 18, gap: 2,
      }}>
        {tabs.map((tab) => {
          const sel = value === tab.id;
          const TabIcon = tab.icon;
          return (
            <button key={tab.id} onClick={() => onChange(tab.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '8px 0', border: 'none', background: 'transparent',
              color: sel ? c.accent : c.muted, cursor: 'pointer',
              fontFamily: sageFont, fontSize: 10, fontWeight: 600,
              position: 'relative',
            }}>
              {sel && <div style={{
                position: 'absolute', top: 0, width: 16, height: 2.5,
                background: c.accent, borderRadius: 4,
              }} />}
              <TabIcon />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Header with user switch ──────────────────────────────────
function SageHeader({ store, dark, t, title, onAdd }) {
  const c = sageTheme(dark, t.accent);
  return (
    <div style={{ padding: '4px 18px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <SageUserSwitch value={store.activeUser} onChange={store.setActiveUser} dark={dark} t={t} />
        <button onClick={onAdd} style={{
          width: 36, height: 36, borderRadius: 12,
          background: c.accent, border: 'none', color: dark ? '#0d1117' : '#0d2417',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          boxShadow: `0 4px 14px ${c.accent}40`,
        }}>
          <Icon.plus />
        </button>
      </div>
      <div style={{
        fontFamily: sageFont, fontSize: 28, fontWeight: 700, color: c.text,
        letterSpacing: -0.6,
      }}>{title}</div>
    </div>
  );
}

// ── Screen: Dashboard ────────────────────────────────────────
function SageDashboard({ store, dark, t }) {
  const c = sageTheme(dark, t.accent);
  const { totals } = store;
  // recent across all types
  const recent = React.useMemo(() => {
    const a = store.sales.map((x) => ({ ...x, kind: 'sale' }));
    const b = store.purchases.map((x) => ({ ...x, kind: 'buy' }));
    const d = store.costs.map((x) => ({ ...x, kind: 'cost' }));
    return [...a, ...b, ...d].sort((x, y) => (y.date > x.date ? 1 : -1)).slice(0, 5);
  }, [store.sales, store.purchases, store.costs]);

  return (
    <div style={{ padding: '0 18px 110px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <SageKPI label="Profit net" value={totals.profit} sub="ce mois" delta={12} accent={c.accent} dark={dark} t={t} />
        <SageKPI label="Ventes" value={totals.ventes} sub={`${store.sales.length} transactions`} dark={dark} t={t} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <SageKPI label="Achats" value={totals.achats} dark={dark} t={t} />
        <SageKPI label="Coûts prod." value={totals.couts} dark={dark} t={t} />
      </div>
      <SageSplitBar profit={totals.profit} share={t.lumayaShare} dark={dark} t={t} />

      <div style={{ marginTop: 22, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: c.muted, fontWeight: 600 }}>
          Activité récente
        </div>
        <div style={{ fontSize: 11, color: c.mutedSoft, fontFamily: sageNumFont }}>
          {recent.length} entrées
        </div>
      </div>
      <div style={{
        background: c.panel, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden',
      }}>
        {recent.map((r, i) => (
          <SageActivityRow key={r.id} item={r} store={store} dark={dark} t={t} isLast={i === recent.length - 1} />
        ))}
      </div>
    </div>
  );
}

function SageActivityRow({ item, store, dark, t, isLast }) {
  const c = sageTheme(dark, t.accent);
  const product = item.productId ? store.productById[item.productId] : null;
  const isCost = item.kind === 'cost';
  const isSale = item.kind === 'sale';
  const amount = isCost ? item.amount : item.qty * item.price;
  const sign = isSale ? '+' : '−';
  const color = isSale ? c.accent : isCost ? c.warning : c.purple;
  const tag = isSale ? 'Vente' : isCost ? 'Coût' : 'Achat';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      borderBottom: isLast ? 'none' : `1px solid ${c.borderSoft}`,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: dark ? `${color}1c` : `${color}22`,
        color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: sageNumFont, fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
      }}>
        {tag.slice(0, 1)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
          <span style={{ fontFamily: sageFont, fontSize: 14, color: c.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {product?.name || item.label}
          </span>
        </div>
        <div style={{ fontSize: 11, color: c.muted, fontFamily: sageFont, marginTop: 2 }}>
          {tag} · {fmtDate(item.date)}{item.qty ? ` · ${item.qty}u` : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: sageNumFont, fontSize: 14, fontWeight: 600, color }}>
          {sign}{fmtNum(amount)}
        </div>
        <div style={{ fontSize: 10, color: c.mutedSoft, fontFamily: sageFont }}>{t.currency}</div>
      </div>
    </div>
  );
}

// ── Screen: Transactions list (sales / buys) ────────────────
function SageTxList({ store, dark, t, kind }) {
  const c = sageTheme(dark, t.accent);
  const items = kind === 'sale' ? store.sales : store.purchases;
  const remove = kind === 'sale' ? store.removeSale : store.removePurchase;
  const total = items.reduce((a, s) => a + s.qty * s.price, 0);
  const color = kind === 'sale' ? c.accent : c.purple;

  // group by date
  const groups = React.useMemo(() => {
    const m = new Map();
    for (const it of items) {
      if (!m.has(it.date)) m.set(it.date, []);
      m.get(it.date).push(it);
    }
    return [...m.entries()].sort((a, b) => (b[0] > a[0] ? 1 : -1));
  }, [items]);

  return (
    <div style={{ padding: '0 18px 110px' }}>
      <div style={{
        background: c.panel, border: `1px solid ${c.border}`,
        borderRadius: 14, padding: 14, marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: c.muted, fontWeight: 600 }}>
          Total {kind === 'sale' ? 'ventes' : 'achats'}
        </div>
        <div style={{
          fontFamily: sageNumFont, fontSize: 28, fontWeight: 600, color: c.text,
          letterSpacing: -0.6, marginTop: 4,
        }}>
          <AnimatedNumber value={total} format={fmtNum} /> <span style={{ fontSize: 13, color: c.muted, fontFamily: sageFont, fontWeight: 500 }}>{t.currency}</span>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12, color: c.muted, fontFamily: sageFont }}>
          <div><span style={{ color: c.text, fontFamily: sageNumFont, fontWeight: 600 }}>{items.length}</span> transactions</div>
          <div><span style={{ color: c.text, fontFamily: sageNumFont, fontWeight: 600 }}>{items.reduce((a, s) => a + s.qty, 0)}</span> unités</div>
        </div>
      </div>

      {groups.map(([date, rows]) => (
        <div key={date} style={{ marginBottom: 14 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            margin: '0 4px 6px', fontSize: 11, color: c.muted, fontFamily: sageFont,
            textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600,
          }}>
            <span>{fmtDay(date)}</span>
            <span style={{ fontFamily: sageNumFont }}>{fmtNum(rows.reduce((a, r) => a + r.qty * r.price, 0))} {t.currency}</span>
          </div>
          <div style={{ background: c.panel, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
            {rows.map((it, i) => {
              const p = store.productById[it.productId];
              return (
                <div key={it.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${c.borderSoft}`,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: `oklch(0.22 0.06 ${p?.hue || 0})`,
                    color: `oklch(0.85 0.12 ${p?.hue || 0})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: sageNumFont, fontSize: 12, fontWeight: 600,
                  }}>{p?.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: sageFont, fontSize: 14, color: c.text, fontWeight: 500 }}>{p?.name}</div>
                    <div style={{ fontSize: 11, color: c.muted, fontFamily: sageFont, marginTop: 2 }}>
                      <span style={{ fontFamily: sageNumFont }}>{it.qty}</span> × <span style={{ fontFamily: sageNumFont }}>{fmtNum(it.price)}</span>{it.note ? ` · ${it.note}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: sageNumFont, fontSize: 14, fontWeight: 600, color }}>{fmtNum(it.qty * it.price)}</div>
                    <button onClick={() => remove(it.id)} style={{
                      background: 'transparent', border: 'none', color: c.mutedSoft, cursor: 'pointer',
                      padding: 2, marginTop: 2,
                    }}><Icon.trash /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Screen: Costs ────────────────────────────────────────────
function SageCosts({ store, dark, t }) {
  const c = sageTheme(dark, t.accent);
  const total = store.costs.reduce((a, c) => a + c.amount, 0);
  return (
    <div style={{ padding: '0 18px 110px' }}>
      <div style={{
        background: c.panel, border: `1px solid ${c.border}`,
        borderRadius: 14, padding: 14, marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: c.muted, fontWeight: 600 }}>
          Coûts de production
        </div>
        <div style={{
          fontFamily: sageNumFont, fontSize: 28, fontWeight: 600, color: c.text,
          letterSpacing: -0.6, marginTop: 4,
        }}>
          <AnimatedNumber value={total} format={fmtNum} /> <span style={{ fontSize: 13, color: c.muted, fontFamily: sageFont, fontWeight: 500 }}>{t.currency}</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: c.muted, fontFamily: sageFont }}>
          {store.costs.length} dépenses · main d&apos;œuvre, transport, conditionnement
        </div>
      </div>

      <div style={{ background: c.panel, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
        {store.costs.map((it, i) => (
          <div key={it.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px',
            borderBottom: i === store.costs.length - 1 ? 'none' : `1px solid ${c.borderSoft}`,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: dark ? `${c.warning}1f` : `${c.warning}28`,
              color: c.warning, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Icon.cost /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: sageFont, fontSize: 14, color: c.text, fontWeight: 500 }}>{it.label}</div>
              <div style={{ fontSize: 11, color: c.muted, fontFamily: sageFont, marginTop: 2 }}>
                {fmtDate(it.date)}{it.who ? ` · ${it.who}` : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: sageNumFont, fontSize: 14, fontWeight: 600, color: c.warning }}>−{fmtNum(it.amount)}</div>
              <button onClick={() => store.removeCost(it.id)} style={{
                background: 'transparent', border: 'none', color: c.mutedSoft, cursor: 'pointer',
                padding: 2, marginTop: 2,
              }}><Icon.trash /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Screen: Products ─────────────────────────────────────────
function SageProducts({ store, dark, t, onAdd }) {
  const c = sageTheme(dark, t.accent);
  return (
    <div style={{ padding: '0 18px 110px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {store.products.map((p) => {
          const soldQty = store.sales.filter((s) => s.productId === p.id).reduce((a, s) => a + s.qty, 0);
          const soldVal = store.sales.filter((s) => s.productId === p.id).reduce((a, s) => a + s.qty * s.price, 0);
          return (
            <div key={p.id} style={{
              background: c.panel, border: `1px solid ${c.border}`, borderRadius: 14,
              padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `oklch(0.25 0.08 ${p.hue})`,
                color: `oklch(0.88 0.14 ${p.hue})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: sageNumFont, fontSize: 14, fontWeight: 600,
              }}>{p.emoji}</div>
              <div>
                <div style={{ fontFamily: sageFont, fontSize: 13, color: c.text, fontWeight: 600, lineHeight: 1.2 }}>{p.name}</div>
                <div style={{ fontFamily: sageNumFont, fontSize: 11, color: c.muted, marginTop: 2 }}>
                  {fmtNum(p.unitPrice)} {t.currency}/u
                </div>
              </div>
              <div style={{
                paddingTop: 8, borderTop: `1px solid ${c.borderSoft}`,
                display: 'flex', justifyContent: 'space-between',
                fontFamily: sageNumFont, fontSize: 11, color: c.muted,
              }}>
                <span>{soldQty}u vendues</span>
                <span style={{ color: c.accent }}>{fmtShort(soldVal)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Add Modal (bottom sheet) ─────────────────────────────────
function SageAddSheet({ store, dark, t, kind, setKind, onClose }) {
  const c = sageTheme(dark, t.accent);
  const [productId, setProductId] = React.useState(store.products[0]?.id || '');
  const [qty, setQty] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [note, setNote] = React.useState('');
  // cost-specific
  const [label, setLabel] = React.useState('');
  const [amount, setAmount] = React.useState('');
  // new product
  const [npName, setNpName] = React.useState('');
  const [npPrice, setNpPrice] = React.useState('');
  const [npCost, setNpCost] = React.useState('');
  const [newProductMode, setNewProductMode] = React.useState(false);

  // Default the price field when product changes
  React.useEffect(() => {
    if (!productId) return;
    const p = store.productById[productId];
    if (!p) return;
    if (kind === 'sale')  setPrice(String(p.unitPrice));
    if (kind === 'buy')   setPrice(String(p.unitCost));
  }, [productId, kind]);

  const submit = () => {
    if (kind === 'sale' || kind === 'buy') {
      if (!productId || !qty || !price) return;
      const payload = { productId, qty: Number(qty), price: Number(price), note };
      if (kind === 'sale') store.addSale(payload);
      else store.addPurchase(payload);
    } else if (kind === 'cost') {
      if (!label || !amount) return;
      store.addCost({ label, amount: Number(amount), who: note });
    } else if (kind === 'product') {
      if (!npName) return;
      store.addProduct({ name: npName, unitPrice: Number(npPrice) || 0, unitCost: Number(npCost) || 0 });
    }
    onClose();
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: c.panel2, border: `1px solid ${c.border}`,
    borderRadius: 10, padding: '11px 12px',
    color: c.text, fontFamily: sageFont, fontSize: 14,
    outline: 'none',
  };
  const labelStyle = {
    fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase',
    color: c.muted, fontWeight: 600, marginBottom: 6,
    fontFamily: sageFont, display: 'block',
  };
  const kinds = [
    { id: 'sale', label: 'Vente' },
    { id: 'buy', label: 'Achat' },
    { id: 'cost', label: 'Coût' },
    { id: 'product', label: 'Produit' },
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', background: c.bg,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        border: `1px solid ${c.border}`, borderBottom: 'none',
        padding: '14px 18px 30px', display: 'flex', flexDirection: 'column', gap: 14,
        animation: 'sageSlideUp .25s cubic-bezier(.2,.8,.2,1)',
        maxHeight: '85%', overflow: 'auto',
      }}>
        <div style={{ width: 36, height: 4, background: c.border, borderRadius: 2, margin: '0 auto' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: c.text, fontFamily: sageFont, letterSpacing: -0.3 }}>
            Nouvelle entrée
          </div>
          <button onClick={onClose} style={{
            background: c.panel2, border: `1px solid ${c.border}`, color: c.muted,
            width: 30, height: 30, borderRadius: 999, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon.close /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, background: c.panel2, padding: 3, borderRadius: 12, border: `1px solid ${c.border}` }}>
          {kinds.map((k) => (
            <button key={k.id} onClick={() => setKind(k.id)} style={{
              padding: '8px 6px', borderRadius: 9, border: 'none',
              background: kind === k.id ? c.panel : 'transparent',
              color: kind === k.id ? c.text : c.muted,
              fontFamily: sageFont, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              boxShadow: kind === k.id ? `inset 0 0 0 1px ${c.border}` : 'none',
            }}>{k.label}</button>
          ))}
        </div>

        {(kind === 'sale' || kind === 'buy') && (
          <React.Fragment>
            <div>
              <label style={labelStyle}>Produit</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {store.products.slice(0, 8).map((p) => {
                  const sel = productId === p.id;
                  return (
                    <button key={p.id} onClick={() => setProductId(p.id)} style={{
                      padding: '7px 11px', borderRadius: 999,
                      background: sel ? c.accentDim : c.panel2,
                      border: `1px solid ${sel ? c.accent : c.border}`,
                      color: sel ? c.accent : c.text,
                      fontFamily: sageFont, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    }}>{p.name}</button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Unités</label>
                <input type="number" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} style={inputStyle} placeholder="0" />
              </div>
              <div>
                <label style={labelStyle}>Prix unitaire ({t.currency})</label>
                <input type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} placeholder="0" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Note</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} placeholder="Optionnel" />
            </div>
            {qty && price && (
              <div style={{
                background: c.panel, border: `1px solid ${c.border}`, borderRadius: 12,
                padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, color: c.muted, fontFamily: sageFont }}>Total</span>
                <span style={{ fontFamily: sageNumFont, fontSize: 18, fontWeight: 600, color: c.text }}>
                  {fmtNum(Number(qty) * Number(price))} {t.currency}
                </span>
              </div>
            )}
          </React.Fragment>
        )}

        {kind === 'cost' && (
          <React.Fragment>
            <div>
              <label style={labelStyle}>Description</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} style={inputStyle} placeholder="Main d’œuvre, transport, etc." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Montant ({t.currency})</label>
                <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} placeholder="0" />
              </div>
              <div>
                <label style={labelStyle}>Personne / atelier</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} placeholder="Optionnel" />
              </div>
            </div>
          </React.Fragment>
        )}

        {kind === 'product' && (
          <React.Fragment>
            <div>
              <label style={labelStyle}>Nom du produit</label>
              <input value={npName} onChange={(e) => setNpName(e.target.value)} style={inputStyle} placeholder="Ex: Savon noir" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Prix vente unitaire</label>
                <input type="number" inputMode="decimal" value={npPrice} onChange={(e) => setNpPrice(e.target.value)} style={inputStyle} placeholder="0" />
              </div>
              <div>
                <label style={labelStyle}>Coût d’achat unitaire</label>
                <input type="number" inputMode="decimal" value={npCost} onChange={(e) => setNpCost(e.target.value)} style={inputStyle} placeholder="0" />
              </div>
            </div>
          </React.Fragment>
        )}

        <button onClick={submit} style={{
          marginTop: 6, padding: '14px 18px',
          background: c.accent, color: dark ? '#0d1117' : '#0d2417', border: 'none',
          borderRadius: 14, cursor: 'pointer',
          fontFamily: sageFont, fontSize: 15, fontWeight: 700,
          boxShadow: `0 6px 20px ${c.accent}38`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Icon.check />
          Enregistrer
        </button>
      </div>
    </div>
  );
}

// ── Title per tab ────────────────────────────────────────────
const SAGE_TITLES = { dash: 'Tableau de bord', sales: 'Ventes', buys: 'Achats', costs: 'Coûts', prods: 'Produits' };

// ── Root: Sage App ───────────────────────────────────────────
function SageApp({ t, dark }) {
  const c = sageTheme(dark, t.accent);
  const store = useLumaStore();
  const [tab, setTab] = React.useState('dash');
  const [adding, setAdding] = React.useState(null); // null | 'sale' | 'buy' | 'cost' | 'product'

  const openAdd = () => {
    setAdding(tab === 'sales' ? 'sale' : tab === 'buys' ? 'buy' : tab === 'costs' ? 'cost' : tab === 'prods' ? 'product' : 'sale');
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: c.bg, color: c.text, fontFamily: sageFont,
      overflow: 'hidden',
    }}>
      <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', paddingTop: 56 }}>
        <SageHeader store={store} dark={dark} t={t} title={SAGE_TITLES[tab]} onAdd={openAdd} />
        {tab === 'dash'  && <SageDashboard store={store} dark={dark} t={t} />}
        {tab === 'sales' && <SageTxList store={store} dark={dark} t={t} kind="sale" />}
        {tab === 'buys'  && <SageTxList store={store} dark={dark} t={t} kind="buy" />}
        {tab === 'costs' && <SageCosts store={store} dark={dark} t={t} />}
        {tab === 'prods' && <SageProducts store={store} dark={dark} t={t} onAdd={() => setAdding('product')} />}
      </div>
      <SageTabBar value={tab} onChange={setTab} dark={dark} t={t} />
      {adding && <SageAddSheet store={store} dark={dark} t={t} kind={adding} setKind={setAdding} onClose={() => setAdding(null)} />}
    </div>
  );
}

Object.assign(window, { SageApp, sageTheme });
