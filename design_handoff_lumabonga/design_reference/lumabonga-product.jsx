// lumabonga-product.jsx
// Créatif — fiche produit détaillée : recette (matières + main d'œuvre),
// coût de production par unité dans le temps, et marge exacte.
// Unique names (prod*) so top-level consts never collide with creative.jsx.

const prodTheme = (dark, accent) => window.creaTheme(dark, accent);
const prodSans = '-apple-system, "Inter", "SF Pro Text", system-ui, sans-serif';
const prodMono = '"JetBrains Mono", "SF Mono", "Geist Mono", ui-monospace, monospace';
const prodDisplay = '"Instrument Serif", "Bodoni Moda", Georgia, serif';

// ── Stepper ──────────────────────────────────────────────────
function ProdStepper({ value, step = 1, suffix = '', onChange, c }) {
  const btn = {
    width: 28, height: 28, borderRadius: 9,
    border: `1px solid ${c.border}`, background: c.panel2, color: c.text,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  };
  const dec = Math.round((value - step) * 100) / 100;
  const inc = Math.round((value + step) * 100) / 100;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button style={btn} onClick={() => onChange(Math.max(0, dec))}><Icon.minus width={15} height={15} /></button>
      <span style={{ fontFamily: prodMono, fontSize: 13, fontWeight: 600, color: c.text, minWidth: 58, textAlign: 'center' }}>
        {fmtNum(value)}{suffix ? ` ${suffix}` : ''}
      </span>
      <button style={btn} onClick={() => onChange(inc)}><Icon.plus width={15} height={15} /></button>
    </div>
  );
}

// ── Cost-over-time line chart ────────────────────────────────
function ProdCostChart({ series, c }) {
  const W = 358, H = 116, padL = 6, padR = 6, padT = 14, padB = 6;
  const vals = series.map((p) => p.total);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = Math.max(1, max - min);
  const lo = min - span * 0.35, hi = max + span * 0.35;
  const x = (i) => padL + (i / (series.length - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const line = series.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.total).toFixed(1)}`).join(' ');
  const area = `${line} L${x(series.length - 1).toFixed(1)},${H - padB} L${x(0).toFixed(1)},${H - padB} Z`;
  const accent = c.accent;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="prodFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#prodFill)" />
      <path d={line} fill="none" stroke={accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {series.map((p, i) => {
        const last = i === series.length - 1;
        return (
          <circle key={i} cx={x(i)} cy={y(p.total)} r={last ? 4 : 2.6}
            fill={last ? accent : c.bg} stroke={accent} strokeWidth={last ? 0 : 1.6} />
        );
      })}
    </svg>
  );
}

// ── Add-material bottom sheet ────────────────────────────────
function ProdAddMaterialSheet({ store, dark, t, productId, used, onClose }) {
  const c = prodTheme(dark, t.accent);
  const groups = [
    { kind: 'matière', title: 'Matières premières' },
    { kind: 'emballage', title: 'Emballage' },
  ];
  const defaultQty = (m) => m.unit === 'pièce' ? 1 : m.unit === 'm' ? 1 : 10;
  return (
    <ProdSheet title="Ajouter un composant" c={c} onClose={onClose}>
      {groups.map((g) => (
        <div key={g.kind} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, letterSpacing: 0.9, textTransform: 'uppercase', color: c.muted, fontWeight: 600, fontFamily: prodSans }}>{g.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {store.materials.filter((m) => m.kind === g.kind).map((m) => {
              const isUsed = used.has(m.id);
              return (
                <button key={m.id} disabled={isUsed}
                  onClick={() => { store.addIngredient(productId, m.id, defaultQty(m)); onClose(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px 7px 7px',
                    borderRadius: 999, border: `1px solid ${c.border}`,
                    background: isUsed ? 'transparent' : c.panel2,
                    color: isUsed ? c.mutedSoft : c.text,
                    opacity: isUsed ? 0.45 : 1, cursor: isUsed ? 'default' : 'pointer',
                    fontFamily: prodSans, fontSize: 13, fontWeight: 500,
                  }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 999,
                    background: `oklch(0.6 0.15 ${m.hue})`, color: '#0c0c10',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: prodMono, fontSize: 10, fontWeight: 700,
                  }}>{m.name.slice(0, 1)}</span>
                  {m.name}
                  <span style={{ fontFamily: prodMono, fontSize: 10, color: c.mutedSoft }}>/{m.unit}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </ProdSheet>
  );
}

// ── Add-labor bottom sheet ───────────────────────────────────
function ProdAddLaborSheet({ store, dark, t, productId, onClose }) {
  const c = prodTheme(dark, t.accent);
  return (
    <ProdSheet title="Ajouter de la main d’œuvre" c={c} onClose={onClose}>
      <div style={{ fontSize: 12, color: c.muted, fontFamily: prodSans, marginTop: -4 }}>
        Une tâche par défaut à 5 min · 1 000 {t.currency}/h. Ajuste ensuite la durée et le taux.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {LABOR_PRESETS.map((task) => (
          <button key={task}
            onClick={() => { store.addLabor(productId, { task, who: 'Atelier', minutes: 5, rate: 1000 }); onClose(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 13px',
              borderRadius: 999, border: `1px solid ${c.border}`, background: c.panel2,
              color: c.text, cursor: 'pointer', fontFamily: prodSans, fontSize: 13, fontWeight: 500,
            }}>
            <span style={{ color: c.amber, display: 'flex' }}><Icon.clock width={15} height={15} /></span>
            {task}
          </button>
        ))}
      </div>
    </ProdSheet>
  );
}

// ── Generic bottom sheet shell ───────────────────────────────
function ProdSheet({ title, c, onClose, children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 120,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', background: c.bg2,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        border: `1px solid ${c.border}`, borderBottom: 'none',
        padding: '14px 22px 30px', display: 'flex', flexDirection: 'column', gap: 16,
        animation: 'sageSlideUp .3s cubic-bezier(.2,.8,.2,1)', maxHeight: '80%', overflow: 'auto',
      }}>
        <div style={{ width: 36, height: 4, background: c.border, borderRadius: 2, margin: '0 auto' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: prodDisplay, fontStyle: 'italic', fontSize: 26, color: c.text }}>{title}</div>
          <button onClick={onClose} style={{
            background: c.panel2, border: `1px solid ${c.border}`, color: c.muted,
            width: 32, height: 32, borderRadius: 999, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon.close /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Small section label with action ──────────────────────────
function ProdRowSection({ title, total, t, c, onAdd }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      marginTop: 22, marginBottom: 6,
    }}>
      <div style={{ fontFamily: prodDisplay, fontStyle: 'italic', fontSize: 20, color: c.text }}>{title}</div>
      <div style={{ fontFamily: prodMono, fontSize: 12, color: c.muted }}>{fmtNum(total)} {t.currency}</div>
    </div>
  );
}

// ── Product detail screen ────────────────────────────────────
function CreaProductDetail({ store, dark, t, product, onBack, onProduce }) {
  const c = prodTheme(dark, t.accent);
  const [sheet, setSheet] = React.useState(null); // 'material' | 'labor'
  const [editPrice, setEditPrice] = React.useState(false);
  const recipe = store.recipeFor(product.id);
  const cost = recipeCost(recipe, store.materialById, store.purchases);
  const series = costSeries(recipe, store.materialById, store.purchases, 6);
  const sell = product.unitPrice || 0;
  const margin = sell - cost.total;
  const marginPct = sell > 0 ? (margin / sell) * 100 : 0;
  const first = series[0]?.total || 0;
  const trend = first > 0 ? ((cost.total - first) / first) * 100 : 0;
  const usedIds = new Set(recipe.ingredients.map((i) => i.materialId));
  const stepFor = (unit) => unit === 'pièce' ? 1 : unit === 'm' ? 0.5 : 5;
  const stock = store.finishedStock[product.id] ?? 0;
  const can = store.producibleFor(product.id);
  const bn = store.bottleneckFor(product.id);

  const Tile = ({ label, value, color, big, suffix }) => (
    <div style={{
      flex: 1, padding: '12px 13px', borderRadius: 14,
      background: c.panel, border: `1px solid ${c.border}`,
      display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0,
    }}>
      <div style={{ fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase', color: c.muted, fontWeight: 600, fontFamily: prodSans }}>{label}</div>
      <div style={{ fontFamily: prodDisplay, fontStyle: 'italic', fontSize: big ? 26 : 22, color: color || c.text, letterSpacing: -0.4, lineHeight: 1 }}>
        <AnimatedNumber value={value} format={fmtNum} />{suffix}
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom: 36 }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 18px 10px' }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px 7px 8px',
          borderRadius: 999, border: `1px solid ${c.border}`, background: c.panel2,
          color: c.text, cursor: 'pointer', fontFamily: prodSans, fontSize: 13, fontWeight: 500,
        }}>
          <Icon.back width={16} height={16} /> Produits
        </button>
        <span style={{ fontFamily: prodSans, fontSize: 10, color: c.muted, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600 }}>
          Fiche produit
        </span>
      </div>

      {/* hero */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 22px 0' }}>
        <div style={{
          width: 60, height: 60, borderRadius: 16, flexShrink: 0,
          background: `oklch(0.24 0.09 ${product.hue})`, color: `oklch(0.92 0.14 ${product.hue})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: prodMono, fontSize: 20, fontWeight: 700,
        }}>{product.emoji}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: prodDisplay, fontStyle: 'italic', fontSize: 30, color: c.text, lineHeight: 1.05, letterSpacing: -0.5 }}>{product.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
            {editPrice ? (
              <input autoFocus type="number" inputMode="decimal" defaultValue={sell}
                onBlur={(e) => { store.updateProduct(product.id, { unitPrice: Number(e.target.value) || 0 }); setEditPrice(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                style={{ width: 90, background: 'transparent', border: 'none', borderBottom: `1px solid ${c.accent}`, color: c.text, fontFamily: prodMono, fontSize: 13, outline: 'none', padding: '2px 0' }} />
            ) : (
              <button onClick={() => setEditPrice(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: 0,
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: prodMono, fontSize: 12, color: c.muted,
              }}>
                Vente {fmtNum(sell)} {t.currency}
                <span style={{ color: c.mutedSoft, display: 'flex' }}><Icon.edit width={13} height={13} /></span>
              </button>
            )}
            <span style={{ fontFamily: prodMono, fontSize: 12, color: c.mutedSoft }}>· {recipe.ingredients.length} composants</span>
          </div>
        </div>
      </div>

      {/* margin tiles */}
      <div style={{ display: 'flex', gap: 10, padding: '18px 22px 0' }}>
        <Tile label="Coût / unité" value={cost.total} />
        <Tile label="Marge nette" value={margin} color={margin >= 0 ? c.accent : c.rose} big />
        <Tile label="Marge %" value={Math.round(marginPct)} color={margin >= 0 ? c.accent : c.rose} suffix="%" />
      </div>

      {/* stock + production strip */}
      <div style={{
        margin: '12px 22px 0', padding: '13px 15px', borderRadius: 16,
        background: c.panel2, border: `1px solid ${c.border}`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase', color: c.muted, fontWeight: 600, fontFamily: prodSans }}>En stock</span>
          <span style={{ fontFamily: prodDisplay, fontStyle: 'italic', fontSize: 22, color: c.text, lineHeight: 1 }}>{stock} <span style={{ fontFamily: prodMono, fontSize: 11, color: c.muted, fontStyle: 'normal' }}>u</span></span>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: c.border }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase', color: c.muted, fontWeight: 600, fontFamily: prodSans }}>Produisibles</span>
          <span style={{ fontFamily: prodDisplay, fontStyle: 'italic', fontSize: 22, color: can === 0 ? c.rose : c.text, lineHeight: 1 }}>{can} <span style={{ fontFamily: prodMono, fontSize: 11, color: c.muted, fontStyle: 'normal' }}>u</span></span>
          {bn && <span style={{ fontFamily: prodMono, fontSize: 9.5, color: c.mutedSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>limité par {store.materialById[bn.materialId]?.name}</span>}
        </div>
        <button onClick={onProduce} style={{
          padding: '11px 16px', borderRadius: 999, border: 'none',
          background: c.accent, color: '#0c0c10', cursor: 'pointer',
          fontFamily: prodSans, fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>Produire</button>
      </div>

      {/* chart */}
      <div style={{ margin: '14px 22px 0', padding: '14px 14px 12px', borderRadius: 18, background: c.panel, border: `1px solid ${c.border}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', color: c.muted, fontWeight: 600, fontFamily: prodSans }}>
            Coût de production · 1 unité
          </div>
          <div style={{ fontFamily: prodMono, fontSize: 11, color: trend >= 0 ? c.rose : c.accent, fontWeight: 600 }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(Math.round(trend))}% / 6 mois
          </div>
        </div>
        <ProdCostChart series={series} c={c} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          {series.map((p, i) => (
            <span key={i} style={{ fontFamily: prodMono, fontSize: 9.5, color: i === series.length - 1 ? c.text : c.mutedSoft }}>{p.label}</span>
          ))}
        </div>
      </div>

      {/* materials */}
      <div style={{ padding: '0 22px' }}>
        <ProdRowSection title="Matières & emballage" total={cost.materials} t={t} c={c} />
        <div style={{ background: c.panel, border: `1px solid ${c.border}`, borderRadius: 16, overflow: 'hidden' }}>
          {cost.ingredientLines.map((ln, i) => (
            <div key={ln.id} style={{
              padding: '12px 14px',
              borderTop: i === 0 ? 'none' : `1px solid ${c.borderSoft}`,
              display: 'flex', flexDirection: 'column', gap: 9,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: `oklch(0.62 0.16 ${ln.material?.hue || 0})`, flexShrink: 0 }} />
                  <span style={{ fontFamily: prodSans, fontSize: 14, color: c.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ln.material?.name || '—'}</span>
                </div>
                <span style={{ fontFamily: prodDisplay, fontStyle: 'italic', fontSize: 17, color: c.text, flexShrink: 0 }}>{fmtNum(ln.cost)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <ProdStepper value={ln.qty} step={stepFor(ln.material?.unit)} suffix={ln.material?.unit}
                  onChange={(v) => store.updateIngredientQty(product.id, ln.id, v)} c={c} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: prodMono, fontSize: 11, color: c.muted }}>{ln.price} {t.currency}/{ln.material?.unit}</span>
                  <button onClick={() => store.removeIngredient(product.id, ln.id)} style={{ background: 'transparent', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 0, display: 'flex' }}><Icon.trash /></button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setSheet('material')} style={{
            width: '100%', padding: '12px', border: 'none', borderTop: `1px solid ${c.borderSoft}`,
            background: 'transparent', color: c.muted, cursor: 'pointer',
            fontFamily: prodSans, fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}><Icon.plus width={16} height={16} /> Ajouter un composant</button>
        </div>
      </div>

      {/* labor */}
      <div style={{ padding: '0 22px' }}>
        <ProdRowSection title="Main d’œuvre" total={cost.labor} t={t} c={c} />
        <div style={{ background: c.panel, border: `1px solid ${c.border}`, borderRadius: 16, overflow: 'hidden' }}>
          {cost.laborLines.map((ln, i) => (
            <div key={ln.id} style={{
              padding: '12px 14px',
              borderTop: i === 0 ? 'none' : `1px solid ${c.borderSoft}`,
              display: 'flex', flexDirection: 'column', gap: 9,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  <span style={{ color: c.amber, display: 'flex', flexShrink: 0 }}><Icon.clock width={16} height={16} /></span>
                  <span style={{ fontFamily: prodSans, fontSize: 14, color: c.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ln.task}</span>
                </div>
                <span style={{ fontFamily: prodDisplay, fontStyle: 'italic', fontSize: 17, color: c.amber, flexShrink: 0 }}>{fmtNum(ln.cost)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <ProdStepper value={ln.minutes} step={1} suffix="min"
                  onChange={(v) => store.updateLabor(product.id, ln.id, { minutes: v })} c={c} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: prodMono, fontSize: 11, color: c.muted }}>{fmtNum(ln.rate)}/h · {ln.who}</span>
                  <button onClick={() => store.removeLabor(product.id, ln.id)} style={{ background: 'transparent', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 0, display: 'flex' }}><Icon.trash /></button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setSheet('labor')} style={{
            width: '100%', padding: '12px', border: 'none', borderTop: `1px solid ${c.borderSoft}`,
            background: 'transparent', color: c.muted, cursor: 'pointer',
            fontFamily: prodSans, fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}><Icon.plus width={16} height={16} /> Ajouter une tâche</button>
        </div>
      </div>

      {/* recap */}
      <div style={{ margin: '24px 22px 0', padding: 18, borderRadius: 18, background: c.panel2, border: `1px dashed ${c.border}` }}>
        {[
          { k: 'Matières & emballage', v: cost.materials, col: c.text },
          { k: 'Main d’œuvre', v: cost.labor, col: c.amber },
        ].map((r) => (
          <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontFamily: prodSans, fontSize: 13, color: c.muted }}>{r.k}</span>
            <span style={{ fontFamily: prodMono, fontSize: 14, color: r.col, fontWeight: 600 }}>{fmtNum(r.v)} {t.currency}</span>
          </div>
        ))}
        <div style={{ height: 1, background: c.border, margin: '4px 0 12px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <span style={{ fontFamily: prodSans, fontSize: 13, color: c.text, fontWeight: 600 }}>Coût total / unité</span>
          <span style={{ fontFamily: prodDisplay, fontStyle: 'italic', fontSize: 22, color: c.text }}>{fmtNum(cost.total)} <span style={{ fontFamily: prodMono, fontSize: 12, color: c.muted, fontStyle: 'normal' }}>{t.currency}</span></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontFamily: prodSans, fontSize: 13, color: c.text, fontWeight: 600 }}>Marge par unité</span>
          <span style={{ fontFamily: prodDisplay, fontStyle: 'italic', fontSize: 22, color: margin >= 0 ? c.accent : c.rose }}>
            {margin >= 0 ? '+' : '−'}{fmtNum(Math.abs(margin))} <span style={{ fontFamily: prodMono, fontSize: 12, color: c.muted, fontStyle: 'normal' }}>{t.currency} · {Math.round(marginPct)}%</span>
          </span>
        </div>
      </div>

      {sheet === 'material' && <ProdAddMaterialSheet store={store} dark={dark} t={t} productId={product.id} used={usedIds} onClose={() => setSheet(null)} />}
      {sheet === 'labor' && <ProdAddLaborSheet store={store} dark={dark} t={t} productId={product.id} onClose={() => setSheet(null)} />}
    </div>
  );
}

Object.assign(window, { CreaProductDetail });
