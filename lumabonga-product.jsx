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
function ProdAddMaterialSheet({ store, dark, t, productId, used, onClose, draft }) {
  const c = prodTheme(dark, t.accent);
  const groups = groupedMaterials(store.materials);
  const defaultQty = (m) => m.unit === 'pièce' ? 1 : m.unit === 'm' ? 1 : m.unit === 'goutte' ? 4 : 10;
  // Two-step: pick a material, then enter the quantity needed per unit produced.
  const [pick, setPick] = React.useState(null);
  const [qty, setQty] = React.useState('');
  // Category folds — all collapsed until tapped (long material list).
  const [openCats, setOpenCats] = React.useState(() => new Set());
  const toggleCat = foldToggle(setOpenCats);

  const choose = (m) => { setPick(m); setQty(String(defaultQty(m))); };
  const confirm = () => {
    if (!pick) return;
    const q = Number(qty);
    if (!(q > 0)) return;
    if (draft) store.addDraftIngredient(productId, pick.id, q);
    else store.addIngredient(productId, pick.id, q);
    onClose();
  };

  if (pick) {
    return (
      <ProdSheet title={tr('Quantité du composant')} c={c} onClose={onClose}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 999, background: `oklch(0.6 0.15 ${pick.hue})`, color: '#0c0c10',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: prodMono, fontSize: 12, fontWeight: 700,
          }}>{pick.name.slice(0, 1)}</span>
          <span style={{ fontFamily: prodSans, fontSize: 15, color: c.text, fontWeight: 500 }}>{pick.name}</span>
        </div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 0.9, textTransform: 'uppercase', color: c.muted, fontWeight: 600, fontFamily: prodSans }}>
            {tr('Quantité par unité produite ({u})', { u: pick.unit })}
          </div>
          <input type="number" inputMode="decimal" value={qty} autoFocus
            onChange={(e) => setQty(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') confirm(); }}
            style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', borderBottom: `1px solid ${c.border}`, padding: '10px 0', color: c.text, fontFamily: prodSans, fontSize: 18, outline: 'none' }}
            placeholder="0" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setPick(null)} style={{
            flex: 1, padding: '13px', borderRadius: 999, cursor: 'pointer',
            background: 'transparent', color: c.muted, border: `1px solid ${c.border}`,
            fontFamily: prodSans, fontSize: 14, fontWeight: 600,
          }}>{tr('Retour')}</button>
          <button onClick={confirm} style={{
            flex: 2, padding: '13px', borderRadius: 999, cursor: 'pointer', border: 'none',
            background: c.ink, color: c.inkContrast, fontFamily: prodSans, fontSize: 14, fontWeight: 600,
          }}>{tr('Ajouter')} →</button>
        </div>
      </ProdSheet>
    );
  }

  return (
    <ProdSheet title={tr('Ajouter un composant')} c={c} onClose={onClose}>
      {groups.map((g) => (
        <CreaFold key={g.cat} label={tr(g.label)} count={g.items.length} c={c} dark={dark}
          open={openCats.has(g.cat)} onToggle={() => toggleCat(g.cat)}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 6 }}>
            {g.items.map((m) => {
              const isUsed = used.has(m.id);
              return (
                <button key={m.id} disabled={isUsed}
                  onClick={() => choose(m)}
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
        </CreaFold>
      ))}
    </ProdSheet>
  );
}

// ── Add-labor bottom sheet ───────────────────────────────────
function ProdAddLaborSheet({ store, dark, t, productId, onClose }) {
  const c = prodTheme(dark, t.accent);
  return (
    <ProdSheet title={tr('Ajouter de la main d’œuvre')} c={c} onClose={onClose}>
      <div style={{ fontSize: 12, color: c.muted, fontFamily: prodSans, marginTop: -4 }}>
        {tr('Une tâche par défaut à 5 min · 1 000 {cur}/h. Ajuste ensuite la durée et le taux.', { cur: t.currency })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {LABOR_PRESETS.map((task) => (
          <button key={task}
            onClick={() => { store.addLabor(productId, { task: tr(task), who: tr('Atelier'), minutes: 5, rate: 1000 }); onClose(); }}
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
          <div style={{ fontFamily: prodDisplay, fontStyle: 'normal', fontSize: 26, color: c.text }}>{title}</div>
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
      <div style={{ fontFamily: prodDisplay, fontStyle: 'normal', fontSize: 20, color: c.text }}>{title}</div>
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
  const stepFor = (unit) => unit === 'pièce' ? 1 : unit === 'm' ? 0.5 : unit === 'goutte' ? 1 : 5;
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
      <div style={{ fontFamily: prodDisplay, fontStyle: 'normal', fontSize: big ? 26 : 22, color: color || c.text, letterSpacing: -0.4, lineHeight: 1 }}>
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
          <Icon.back width={16} height={16} /> {tr('Produits')}
        </button>
        <span style={{ fontFamily: prodSans, fontSize: 10, color: c.muted, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600 }}>
          {tr('Fiche produit')}
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
          <div style={{ fontFamily: prodDisplay, fontStyle: 'normal', fontSize: 30, color: c.text, lineHeight: 1.05, letterSpacing: -0.5 }}>{product.name}</div>
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
                {tr('Vente {x} {cur}', { x: fmtNum(sell), cur: t.currency })}
                <span style={{ color: c.mutedSoft, display: 'flex' }}><Icon.edit width={13} height={13} /></span>
              </button>
            )}
            <span style={{ fontFamily: prodMono, fontSize: 12, color: c.mutedSoft }}>{tr(' · {n} composants', { n: recipe.ingredients.length })}</span>
          </div>
        </div>
      </div>

      {/* margin tiles */}
      <div style={{ display: 'flex', gap: 10, padding: '18px 22px 0' }}>
        <Tile label={tr('Coût / unité')} value={cost.total} />
        <Tile label={tr('Marge nette')} value={margin} color={margin >= 0 ? c.accent : c.rose} big />
        <Tile label={tr('Marge %')} value={Math.round(marginPct)} color={margin >= 0 ? c.accent : c.rose} suffix="%" />
      </div>

      {/* stock + production strip */}
      <div style={{
        margin: '12px 22px 0', padding: '13px 15px', borderRadius: 16,
        background: c.panel2, border: `1px solid ${c.border}`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase', color: c.muted, fontWeight: 600, fontFamily: prodSans }}>{tr('En stock')}</span>
          <span style={{ fontFamily: prodDisplay, fontStyle: 'normal', fontSize: 22, color: c.text, lineHeight: 1 }}>{stock} <span style={{ fontFamily: prodMono, fontSize: 11, color: c.muted, fontStyle: 'normal' }}>u</span></span>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: c.border }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase', color: c.muted, fontWeight: 600, fontFamily: prodSans }}>{tr('Produisibles')}</span>
          <span style={{ fontFamily: prodDisplay, fontStyle: 'normal', fontSize: 22, color: can === 0 ? c.rose : c.text, lineHeight: 1 }}>{can} <span style={{ fontFamily: prodMono, fontSize: 11, color: c.muted, fontStyle: 'normal' }}>u</span></span>
          {bn && <span style={{ fontFamily: prodMono, fontSize: 9.5, color: c.mutedSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tr('limité par {name}', { name: store.materialById[bn.materialId]?.name })}</span>}
        </div>
        <button onClick={onProduce} style={{
          padding: '11px 16px', borderRadius: 999, border: 'none',
          background: c.accent, color: '#0c0c10', cursor: 'pointer',
          fontFamily: prodSans, fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>{tr('Produire')}</button>
      </div>

      {/* chart */}
      <div style={{ margin: '14px 22px 0', padding: '14px 14px 12px', borderRadius: 18, background: c.panel, border: `1px solid ${c.border}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', color: c.muted, fontWeight: 600, fontFamily: prodSans }}>
            {tr('Coût de production · 1 unité')}
          </div>
          <div style={{ fontFamily: prodMono, fontSize: 11, color: trend >= 0 ? c.rose : c.accent, fontWeight: 600 }}>
            {trend >= 0 ? '↑' : '↓'} {tr('{x}% / 6 mois', { x: Math.abs(Math.round(trend)) })}
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
        <ProdRowSection title={tr('Matières & emballage')} total={cost.materials} t={t} c={c} />
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
                <span style={{ fontFamily: prodDisplay, fontStyle: 'normal', fontSize: 17, color: c.text, flexShrink: 0 }}>{fmtNum(ln.cost)} <span style={{ fontFamily: prodMono, fontSize: 10, color: c.muted, fontStyle: 'normal' }}>{t.currency}</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <ProdStepper value={ln.qty} step={stepFor(ln.material?.unit)} suffix={ln.material?.unit}
                  onChange={(v) => store.updateIngredientQty(product.id, ln.id, v)} c={c} />
                <button onClick={() => store.removeIngredient(product.id, ln.id)} style={{ background: 'transparent', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 0, display: 'flex' }}><Icon.trash /></button>
              </div>
            </div>
          ))}
          <button onClick={() => setSheet('material')} style={{
            width: '100%', padding: '12px', border: 'none', borderTop: `1px solid ${c.borderSoft}`,
            background: 'transparent', color: c.muted, cursor: 'pointer',
            fontFamily: prodSans, fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}><Icon.plus width={16} height={16} /> {tr('Ajouter un composant')}</button>
        </div>
      </div>

      {/* labor */}
      <div style={{ padding: '0 22px' }}>
        <ProdRowSection title={tr('Main d’œuvre')} total={cost.labor} t={t} c={c} />
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
                <span style={{ fontFamily: prodDisplay, fontStyle: 'normal', fontSize: 17, color: c.amber, flexShrink: 0 }}>{fmtNum(ln.cost)}</span>
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
          }}><Icon.plus width={16} height={16} /> {tr('Ajouter une tâche')}</button>
        </div>
      </div>

      {/* recap */}
      <div style={{ margin: '24px 22px 0', padding: 18, borderRadius: 18, background: c.panel2, border: `1px dashed ${c.border}` }}>
        {[
          { k: tr('Matières & emballage'), v: cost.materials, col: c.text },
          { k: tr('Main d’œuvre'), v: cost.labor, col: c.amber },
        ].map((r) => (
          <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontFamily: prodSans, fontSize: 13, color: c.muted }}>{r.k}</span>
            <span style={{ fontFamily: prodMono, fontSize: 14, color: r.col, fontWeight: 600 }}>{fmtNum(r.v)} {t.currency}</span>
          </div>
        ))}
        <div style={{ height: 1, background: c.border, margin: '4px 0 12px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <span style={{ fontFamily: prodSans, fontSize: 13, color: c.text, fontWeight: 600 }}>{tr('Coût total / unité')}</span>
          <span style={{ fontFamily: prodDisplay, fontStyle: 'normal', fontSize: 22, color: c.text }}>{fmtNum(cost.total)} <span style={{ fontFamily: prodMono, fontSize: 12, color: c.muted, fontStyle: 'normal' }}>{t.currency}</span></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontFamily: prodSans, fontSize: 13, color: c.text, fontWeight: 600 }}>{tr('Marge par unité')}</span>
          <span style={{ fontFamily: prodDisplay, fontStyle: 'normal', fontSize: 22, color: margin >= 0 ? c.accent : c.rose }}>
            {margin >= 0 ? '+' : '−'}{fmtNum(Math.abs(margin))} <span style={{ fontFamily: prodMono, fontSize: 12, color: c.muted, fontStyle: 'normal' }}>{t.currency} · {Math.round(marginPct)}%</span>
          </span>
        </div>
      </div>

      {sheet === 'material' && <ProdAddMaterialSheet store={store} dark={dark} t={t} productId={product.id} used={usedIds} onClose={() => setSheet(null)} />}
      {sheet === 'labor' && <ProdAddLaborSheet store={store} dark={dark} t={t} productId={product.id} onClose={() => setSheet(null)} />}
    </div>
  );
}

// ── SOP: helpers ─────────────────────────────────────────────
// Display quantity of one SOP item: recipe qty × pct × batch, in the display unit.
// `recipe` is passed in (rather than looked up here) so callers can choose
// base vs. draft — the sole caller, ProdSopViewerSheet, needs both depending
// on its `draft` prop.
function sopItemQty(store, pid, item, batch, recipe) {
  const ing = (recipe.ingredients || []).find((i) => i.materialId === item.materialId);
  const mat = store.materialById[item.materialId];
  if (!ing || !mat) return null;
  const base = mat.unit || 'g';
  const du = (typeof COMPONENT_UNITS !== 'undefined' && COMPONENT_UNITS.includes(ing.unit)) ? ing.unit : base;
  const pct = (item.pct == null ? 100 : Number(item.pct)) / 100;
  const qty = (Number(ing.qty) || 0) * pct * (batch || 1);
  return { name: mat.name, hue: mat.hue, qty: convertUnit(qty, base, du, densityFor(mat)), unit: du, pct: Math.round(pct * 100) };
}

// ── SOP: one step's editor UI (text + optional ingredient/% tags) ───────────
// Pure/presentational — no internal state. Used by both the single-version
// SOP editor (ProdSopEditorSheet, local-state-backed) and the draft compare
// sheet (ProdSopCompareSheet, store-backed): both supply their own callbacks.
function ProdSopStepEditor({ step, index, ingredients, materialById, c, canRemove, hasError, onPatchText, onToggleItem, onSetPct, onRemove }) {
  return (
    <div style={{ padding: 14, borderRadius: 14, background: c.panel, border: `1px solid ${c.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: prodSans, fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: c.accent }}>
          {tr('Étape {n}', { n: index + 1 })}
        </span>
        {canRemove && (
          <button onClick={onRemove} aria-label={tr('Supprimer cette étape')} style={{
            background: 'none', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 2, display: 'flex',
          }}><Icon.close width={15} height={15} /></button>
        )}
      </div>
      <textarea value={step.text} onChange={(e) => onPatchText(e.target.value)}
        placeholder={tr('Décris cette étape…')} rows={2}
        style={{
          width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 48,
          background: c.panel2, color: c.text, border: `1px solid ${(!step.text.trim() && hasError) ? c.rose : c.border}`,
          borderRadius: 10, padding: '10px 12px', fontFamily: prodSans, fontSize: 14, outline: 'none', lineHeight: 1.45,
        }} />
      {ingredients.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase', color: c.mutedSoft, fontWeight: 600, fontFamily: prodSans, marginBottom: 6 }}>
            {tr('Ingrédients concernés (optionnel)')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {ingredients.map((ing) => {
              const mat = materialById[ing.materialId];
              if (!mat) return null;
              const sel = step.items.find((it) => it.materialId === ing.materialId);
              return (
                <span key={ing.materialId} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <button onClick={() => onToggleItem(ing.materialId)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px',
                    borderRadius: sel ? '999px 0 0 999px' : 999,
                    border: `1px solid ${sel ? c.accent : c.border}`,
                    background: sel ? c.accent : c.panel2, color: sel ? c.inkContrast : c.text,
                    cursor: 'pointer', fontFamily: prodSans, fontSize: 12.5, fontWeight: 600,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: `oklch(0.62 0.16 ${mat.hue || 0})`, flexShrink: 0 }} />
                    {mat.name}
                  </button>
                  {sel && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      border: `1px solid ${c.accent}`, borderLeft: 'none', borderRadius: '0 999px 999px 0',
                      background: c.panel2, padding: '4px 9px 4px 6px', gap: 1,
                    }}>
                      <input type="number" inputMode="numeric" min="0" max="100" value={sel.pct}
                        onChange={(e) => onSetPct(ing.materialId, e.target.value)}
                        style={{
                          width: 34, background: 'transparent', border: 'none', outline: 'none',
                          color: c.text, fontFamily: prodMono, fontSize: 12.5, fontWeight: 600, textAlign: 'right',
                        }} />
                      <span style={{ fontFamily: prodMono, fontSize: 11, color: c.muted }}>%</span>
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SOP: editor bottom sheet ─────────────────────────────────
// One or more steps; each step = required text + optional multi-select of the
// product's recipe ingredients, each with a % of the recipe quantity (default 100).
function ProdSopEditorSheet({ store, dark, t, product, onClose, draft = false }) {
  const c = prodTheme(dark, t.accent);
  const pid = product.id;
  const recipe = draft ? (store.draftFor(pid) || store.recipeFor(pid)) : store.recipeFor(pid);
  const ingredients = recipe.ingredients || [];
  const newStep = () => ({ id: 'ss_' + Math.random().toString(36).slice(2, 8), text: '', items: [] });
  const [steps, setSteps] = React.useState(() => {
    const cur = (draft ? store.sopDraftFor(pid) : store.sops[pid])?.steps;
    return (cur && cur.length) ? cur.map((s) => ({ ...s, items: (s.items || []).map((i) => ({ ...i })) })) : [newStep()];
  });
  const [err, setErr] = React.useState('');

  const patchStep = (id, patch) => setSteps((xs) => xs.map((s) => s.id === id ? { ...s, ...patch } : s));
  const toggleItem = (sid, materialId) => setSteps((xs) => xs.map((s) => {
    if (s.id !== sid) return s;
    const has = s.items.some((i) => i.materialId === materialId);
    return { ...s, items: has ? s.items.filter((i) => i.materialId !== materialId) : [...s.items, { materialId, pct: 100 }] };
  }));
  const setPct = (sid, materialId, pct) => setSteps((xs) => xs.map((s) => s.id === sid
    ? { ...s, items: s.items.map((i) => i.materialId === materialId ? { ...i, pct: Math.max(0, Math.min(100, Number(pct) || 0)) } : i) }
    : s));
  const removeStep = (id) => setSteps((xs) => xs.length > 1 ? xs.filter((s) => s.id !== id) : xs);

  const save = () => {
    if (steps.some((s) => !s.text.trim())) { setErr(tr('Chaque étape doit avoir une description.')); return; }

    // Guard rail: every recipe ingredient must be fully accounted for across
    // all steps — the % shares must add up to exactly 100, no more, no less.
    // Deliberately skipped for the draft editor: a recipe draft has its own
    // independent lifecycle (may be mid-edit, ingredients still changing),
    // so % coverage doesn't cleanly apply to it — same scoping the old SOP
    // compare sheet used.
    if (!draft) {
      const totals = {};
      for (const ing of ingredients) totals[ing.materialId] = 0;
      for (const s of steps) for (const it of s.items) {
        if (totals[it.materialId] == null) continue;
        totals[it.materialId] += Number(it.pct) || 0;
      }
      const problems = ingredients
        .map((ing) => ({ ing, total: Math.round((totals[ing.materialId] || 0) * 10) / 10 }))
        .filter(({ total }) => Math.abs(total - 100) > 0.5);
      if (problems.length) {
        const lines = problems.map(({ ing, total }) => {
          const name = store.materialById[ing.materialId]?.name || '—';
          return total <= 0
            ? tr('{name} : manquant (0%)', { name })
            : tr('{name} : {pct}% (doit faire 100%)', { name, pct: total });
        });
        setErr([tr('Attention : la SOP ne couvre pas 100% de chaque ingrédient.'), ...lines].join('\n'));
        return;
      }
    }

    const clean = steps.map((s) => ({ id: s.id, text: s.text.trim(), items: s.items }));
    if (draft) store.setSopDraftSteps(pid, clean);
    else store.setSop(pid, clean);
    onClose();
  };

  return (
    <ProdSheet title={draft ? tr('Procédure (SOP) — Test') : tr('Procédure (SOP)')} c={c} onClose={onClose}>
      <div style={{ fontFamily: prodSans, fontSize: 13, color: c.muted, marginTop: -8 }}>{product.name}</div>
      {steps.map((s, i) => (
        <ProdSopStepEditor key={s.id} step={s} index={i} ingredients={ingredients} materialById={store.materialById} c={c}
          canRemove={steps.length > 1} hasError={!!err}
          onPatchText={(text) => patchStep(s.id, { text })}
          onToggleItem={(materialId) => toggleItem(s.id, materialId)}
          onSetPct={(materialId, pct) => setPct(s.id, materialId, pct)}
          onRemove={() => removeStep(s.id)} />
      ))}
      {err && (
        <div style={{
          padding: '10px 13px', borderRadius: 12,
          background: `${c.rose}18`, border: `1px solid ${c.rose}55`,
          color: c.rose, fontSize: 12.5, fontFamily: prodSans, lineHeight: 1.6,
          whiteSpace: 'pre-line',
        }}>{err}</div>
      )}
      <button onClick={() => { setErr(''); setSteps((xs) => [...xs, newStep()]); }} style={{
        width: '100%', padding: '11px', borderRadius: 12, cursor: 'pointer',
        border: `1px dashed ${c.border}`, background: 'transparent', color: c.muted,
        fontFamily: prodSans, fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}><Icon.plus width={15} height={15} /> {tr('Ajouter une étape')}</button>
      <button onClick={save} style={{
        width: '100%', padding: '14px', borderRadius: 999, cursor: 'pointer', border: 'none',
        background: draft ? c.testAccent : c.accent, color: c.inkContrast, fontFamily: prodSans, fontSize: 15, fontWeight: 700,
      }}>{tr('Enregistrer')}</button>
    </ProdSheet>
  );
}

// ── SOP: viewer bottom sheet ─────────────────────────────────
// Opens with a batch-size prompt (in units OR in grams — one unit's weight is
// derived from the recipe), then shows every step with quantities scaled.
function ProdSopViewerSheet({ store, dark, t, product, onClose, draft = false }) {
  const c = prodTheme(dark, t.accent);
  const pid = product.id;
  const steps = (draft ? store.sopDraftFor(pid) : store.sops[pid])?.steps || [];
  // Ingredient quantities shown per step should resolve against whichever
  // recipe this viewer represents: the draft recipe (if one exists) when
  // viewing the test SOP, otherwise the base recipe — matches the old SOP
  // compare sheet's ingredient-resolution preference.
  const recipe = draft ? (store.draftFor(pid) || store.recipeFor(pid)) : store.recipeFor(pid);
  const [batchDraft, setBatchDraft] = React.useState('1');
  const [mode, setMode] = React.useState('u');      // 'u' = units | 'g' = grams
  const [batch, setBatch] = React.useState(null);   // scale factor, null until confirmed

  // Weight of ONE unit: every convertible ingredient of the recipe, in grams.
  const unitWeight = React.useMemo(() => {
    let g = 0;
    for (const ing of (recipe.ingredients || [])) {
      const mat = store.materialById[ing.materialId];
      if (!mat) continue;
      const base = mat.unit || 'g';
      if (!isMassUnit(base) && !isVolUnit(base)) continue;   // pièce/m: no mass
      g += convertUnit(Number(ing.qty) || 0, base, 'g', densityFor(mat));
    }
    return g;
  }, [store, pid, recipe]);

  if (batch == null) {
    const go = () => {
      const n = Number(batchDraft);
      if (!(n > 0)) return;
      if (mode === 'g' && !(unitWeight > 0)) return;
      setBatch(mode === 'g' ? n / unitWeight : n);
    };
    const modeBtn = (id, label) => (
      <button key={id} onClick={() => setMode(id)} style={{
        flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer',
        border: `1px solid ${mode === id ? c.accent : c.border}`,
        background: mode === id ? c.accent : c.panel2,
        color: mode === id ? c.inkContrast : c.text,
        fontFamily: prodSans, fontSize: 13, fontWeight: 700,
      }}>{label}</button>
    );
    return (
      <ProdSheet title={draft ? tr('Procédure (SOP) — Test') : tr('Procédure (SOP)')} c={c} onClose={onClose}>
        <div style={{ fontFamily: prodSans, fontSize: 13, color: c.muted, marginTop: -8 }}>{product.name}</div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 0.9, textTransform: 'uppercase', color: c.muted, fontWeight: 600, fontFamily: prodSans }}>
            {tr('Quantité à produire')}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <input type="number" inputMode="decimal" min="1" value={batchDraft} autoFocus
              onChange={(e) => setBatchDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') go(); }}
              style={{
                flex: 1, minWidth: 0, boxSizing: 'border-box', background: 'transparent', border: 'none',
                borderBottom: `1px solid ${c.border}`, padding: '10px 0', color: c.text,
                fontFamily: prodDisplay, fontSize: 30, outline: 'none',
              }} />
            <div style={{ display: 'flex', gap: 6, width: 148, flexShrink: 0 }}>
              {modeBtn('u', tr('unités'))}
              {modeBtn('g', 'g')}
            </div>
          </div>
          <div style={{ fontFamily: prodSans, fontSize: 12, color: c.mutedSoft, marginTop: 8 }}>
            {unitWeight > 0 && <span style={{ color: c.muted, fontWeight: 600 }}>{tr('1 unité ≈ {x} g', { x: fmtQty(unitWeight) })} · </span>}
            {tr('Les quantités de la SOP s’adaptent automatiquement.')}
          </div>
        </div>
        <button onClick={go} style={{
          width: '100%', padding: '14px', borderRadius: 999, cursor: 'pointer', border: 'none',
          background: c.accent, color: c.inkContrast, fontFamily: prodSans, fontSize: 15, fontWeight: 700,
        }}>{tr('Continuer')} →</button>
      </ProdSheet>
    );
  }

  const batchLabel = mode === 'g'
    ? tr('Pour {x} g (~{n} unités)', { x: fmtQty(Number(batchDraft)), n: fmtQty(batch) })
    : tr('Pour {n} unité(s)', { n: batch });

  return (
    <ProdSheet title={draft ? tr('Procédure (SOP) — Test') : tr('Procédure (SOP)')} c={c} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: -8 }}>
        <span style={{ fontFamily: prodSans, fontSize: 13, color: c.muted }}>{product.name}</span>
        <span style={{ fontFamily: prodMono, fontSize: 12, color: c.accent, fontWeight: 600 }}>{batchLabel}</span>
      </div>
      {steps.map((s, i) => (
        <div key={s.id} style={{ padding: 14, borderRadius: 14, background: c.panel, border: `1px solid ${c.border}` }}>
          <div style={{ fontFamily: prodSans, fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: c.accent, marginBottom: 6 }}>
            {tr('Étape {n}', { n: i + 1 })}
          </div>
          <div style={{ fontFamily: prodSans, fontSize: 14.5, color: c.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{s.text}</div>
          {(s.items || []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
              {s.items.map((it) => {
                const q = sopItemQty(store, pid, it, batch, recipe);
                if (!q) return null;
                return (
                  <span key={it.materialId} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px',
                    borderRadius: 999, border: `1px solid ${c.border}`, background: c.panel2,
                    fontFamily: prodSans, fontSize: 12.5, fontWeight: 600, color: c.text,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: `oklch(0.62 0.16 ${q.hue || 0})`, flexShrink: 0 }} />
                    {q.name}
                    <span style={{ fontFamily: prodMono, fontSize: 12, color: c.accent }}>{fmtQty(q.qty)} {q.unit}</span>
                    {q.pct !== 100 && <span style={{ fontFamily: prodMono, fontSize: 10.5, color: c.mutedSoft }}>({q.pct}%)</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </ProdSheet>
  );
}

// ── Formula suggestion: one draft ingredient row (editable, diff-colored) ────
function ProdDraftRow({ pid, ing, mat, diff, store, c }) {
  const base = mat?.unit || 'g';
  const dens = densityFor(mat);
  const unit = COMPONENT_UNITS.includes(ing.unit) ? ing.unit : (COMPONENT_UNITS.includes(base) ? base : 'g');
  const [val, setVal] = React.useState(String(Math.round(convertUnit(ing.qty, base, unit, dens) * 10) / 10));
  React.useEffect(() => { setVal(String(Math.round(convertUnit(ing.qty, base, unit, dens) * 10) / 10)); }, [ing.qty, unit]);
  const commit = (raw, u) => {
    const q = Number(raw);
    if (!isFinite(q)) return;
    store.updateDraftIngredient(pid, ing.id, { qty: convertUnit(q, u, base, dens), unit: u });
  };
  const dot = diff === 'added' ? c.accent : diff === 'changed' ? c.amber : (mat?.hue != null ? `oklch(0.62 0.16 ${mat.hue})` : c.mutedSoft);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 0',
      borderTop: `1px solid ${c.borderSoft}`,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: dot, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0, fontFamily: prodSans, fontSize: 11.5, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mat?.name || '—'}</span>
      <input type="number" inputMode="decimal" value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={(e) => commit(e.target.value, unit)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
        style={{ width: 44, textAlign: 'right', background: c.panel2, color: c.text, border: `1px solid ${c.border}`, borderRadius: 6, padding: '4px 5px', fontFamily: prodMono, fontSize: 11.5, outline: 'none' }} />
      <span style={{ fontFamily: prodMono, fontSize: 10, color: c.mutedSoft, flexShrink: 0 }}>{unit}</span>
      <button onClick={() => store.removeDraftIngredient(pid, ing.id)} style={{ background: 'transparent', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}>
        <Icon.close width={13} height={13} />
      </button>
    </div>
  );
}

// ── Formula suggestion sheet: Tested (base) vs To test (draft), side by side.
// The base is read-only reference; only the draft column is editable. Nothing
// touches the base recipe until a draft is explicitly approved.
function ProdFormulaCompareSheet({ store, dark, t, product, onClose }) {
  const c = prodTheme(dark, t.accent);
  const pid = product.id;
  const base = store.recipeFor(pid);
  const draft = store.draftFor(pid);
  const [addOpen, setAddOpen] = React.useState(false);

  if (!draft) {
    return (
      <ProdSheet title={tr('Suggérer une correction')} c={c} onClose={onClose}>
        <div style={{ fontFamily: prodSans, fontSize: 13, color: c.muted, marginTop: -8 }}>{product.name}</div>
        <div style={{ fontSize: 10, letterSpacing: 0.9, textTransform: 'uppercase', color: c.muted, fontWeight: 600, fontFamily: prodSans }}>{tr('Formule testée (actuelle)')}</div>
        {base.ingredients.length === 0 && <div style={{ fontFamily: prodSans, fontSize: 12, color: c.muted }}>{tr('Aucun composant')}</div>}
        {base.ingredients.map((ing) => {
          const mat = store.materialById[ing.materialId];
          const du = COMPONENT_UNITS.includes(ing.unit) ? ing.unit : (mat?.unit || 'g');
          return (
            <div key={ing.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: `1px solid ${c.borderSoft}` }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: `oklch(0.62 0.16 ${mat?.hue || 0})`, flexShrink: 0 }} />
              <span style={{ flex: 1, fontFamily: prodSans, fontSize: 13, color: c.text }}>{mat?.name || '—'}</span>
              <span style={{ fontFamily: prodMono, fontSize: 12, color: c.muted }}>{fmtQty(convertUnit(ing.qty, mat?.unit || 'g', du, densityFor(mat)))} {du}</span>
            </div>
          );
        })}
        <div style={{ fontFamily: prodSans, fontSize: 12, color: c.mutedSoft, lineHeight: 1.5 }}>
          {tr('Une suggestion part d’une copie de la formule testée : ajuste les quantités, ajoute ou retire des composants, sans jamais modifier la formule actuelle tant qu’elle n’est pas approuvée.')}
        </div>
        <button onClick={() => store.startDraft(pid)} style={{
          width: '100%', padding: '14px', borderRadius: 999, cursor: 'pointer', border: 'none',
          background: c.amber, color: '#1a1400', fontFamily: prodSans, fontSize: 15, fontWeight: 700,
        }}>{tr('Démarrer une suggestion')}</button>
      </ProdSheet>
    );
  }

  // Union of ingredient ids from both sides, base order first.
  const ids = [
    ...base.ingredients.map((i) => i.materialId),
    ...draft.ingredients.map((i) => i.materialId).filter((id) => !base.ingredients.some((i) => i.materialId === id)),
  ];
  const usedInDraft = new Set(draft.ingredients.map((i) => i.materialId));

  return (
    <ProdSheet title={tr('Suggérer une correction')} c={c} onClose={onClose}>
      <div style={{ fontFamily: prodSans, fontSize: 13, color: c.muted, marginTop: -8 }}>{product.name}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: 0.7, textTransform: 'uppercase', color: c.mutedSoft, fontWeight: 700, fontFamily: prodSans, marginBottom: 2 }}>{tr('Testée')}</div>
          {ids.map((id) => {
            const ing = base.ingredients.find((i) => i.materialId === id);
            const mat = store.materialById[id];
            const removed = !usedInDraft.has(id);
            if (!ing) return <div key={id} style={{ padding: '7px 0', borderTop: `1px solid ${c.borderSoft}` }} />; // added-in-draft: blank spacer to keep rows aligned
            const du = COMPONENT_UNITS.includes(ing.unit) ? ing.unit : (mat?.unit || 'g');
            return (
              <div key={id} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 0',
                borderTop: `1px solid ${c.borderSoft}`, opacity: removed ? 0.5 : 1,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: `oklch(0.62 0.16 ${mat?.hue || 0})`, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, fontFamily: prodSans, fontSize: 11.5, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: removed ? 'line-through' : 'none' }}>{mat?.name || '—'}</span>
                <span style={{ fontFamily: prodMono, fontSize: 11, color: c.muted, flexShrink: 0 }}>{fmtQty(convertUnit(ing.qty, mat?.unit || 'g', du, densityFor(mat)))} {du}</span>
              </div>
            );
          })}
        </div>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: 0.7, textTransform: 'uppercase', color: c.amber, fontWeight: 700, fontFamily: prodSans, marginBottom: 2 }}>{tr('À tester')}</div>
          {ids.map((id) => {
            const ing = draft.ingredients.find((i) => i.materialId === id);
            const baseIng = base.ingredients.find((i) => i.materialId === id);
            const mat = store.materialById[id];
            if (!ing) return <div key={id} style={{ padding: '7px 0', borderTop: `1px solid ${c.borderSoft}` }} />; // removed-in-draft: blank spacer
            const diff = !baseIng ? 'added' : (ing.qty !== baseIng.qty ? 'changed' : 'same');
            return <ProdDraftRow key={id} pid={pid} ing={ing} mat={mat} diff={diff} store={store} c={c} />;
          })}
        </div>
      </div>

      <button onClick={() => setAddOpen(true)} style={{
        width: '100%', padding: '9px', borderRadius: 10, cursor: 'pointer',
        border: `1px dashed ${c.border}`, background: 'transparent', color: c.muted,
        fontFamily: prodSans, fontSize: 12, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}><Icon.plus width={15} height={15} /> {tr('Ajouter un composant')}</button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        <button onClick={() => { store.approveDraftAsReady(pid); onClose(); }} style={{
          width: '100%', padding: '14px', borderRadius: 999, cursor: 'pointer', border: 'none',
          background: c.pos || c.accent, color: c.inkContrast, fontFamily: prodSans, fontSize: 15, fontWeight: 700,
        }}>{tr('Approuver comme formule Ready')}</button>
        <button onClick={() => { store.approveDraftAsBase(pid); onClose(); }} style={{
          width: '100%', padding: '13px', borderRadius: 999, cursor: 'pointer',
          background: 'transparent', color: c.text, border: `1px solid ${c.border}`,
          fontFamily: prodSans, fontSize: 14, fontWeight: 600,
        }}>{tr('Approuver comme nouvelle base à tester')}</button>
        <button onClick={() => { store.discardDraft(pid); onClose(); }} style={{
          width: '100%', padding: '11px', borderRadius: 999, cursor: 'pointer',
          background: 'transparent', color: c.rose, border: `1px solid ${c.rose}55`,
          fontFamily: prodSans, fontSize: 13, fontWeight: 600,
        }}>{tr('Supprimer la suggestion')}</button>
      </div>

      {addOpen && <ProdAddMaterialSheet store={store} dark={dark} t={t} productId={pid} draft
        used={usedInDraft} onClose={() => setAddOpen(false)} />}
    </ProdSheet>
  );
}

// ── SOP suggestion sheet: Tested (base) vs To test (draft), side by side.
// Mirrors ProdFormulaCompareSheet but fully independent: no "approve as
// Ready" here (SOPs have no status of their own — only the product does,
// owned by the recipe side). Draft edits commit straight to the store on
// every change (setSopDraftSteps), no local buffer and no Save button —
// see the Global Constraints note on why (recipe drafts' onBlur commit
// once silently dropped edits under scripted input).
function ProdSopCompareSheet({ store, dark, t, product, onClose }) {
  const c = prodTheme(dark, t.accent);
  const pid = product.id;
  const baseSteps = store.sops[pid]?.steps || [];
  const draft = store.sopDraftFor(pid);
  // Ingredient chips in the step editor should reflect whichever recipe is
  // "current" for testing purposes: the recipe draft if one exists (that's
  // almost always why you're drafting new SOP steps), else the base recipe.
  const ingredients = (store.draftFor(pid) || store.recipeFor(pid)).ingredients || [];
  // Blocks approving a draft that has a blank step; mirrors ProdSopEditorSheet's
  // save() validation (text required per step). Ingredient-coverage validation
  // is deliberately not ported here — the draft's ingredient list can come from
  // an independent recipe draft with its own lifecycle, so % coverage doesn't
  // cleanly apply.
  const [approveErr, setApproveErr] = React.useState('');

  if (!draft) {
    return (
      <ProdSheet title={tr('Suggérer une correction (SOP)')} c={c} onClose={onClose}>
        <div style={{ fontFamily: prodSans, fontSize: 13, color: c.muted, marginTop: -8 }}>{product.name}</div>
        <div style={{ fontSize: 10, letterSpacing: 0.9, textTransform: 'uppercase', color: c.muted, fontWeight: 600, fontFamily: prodSans }}>{tr('Étapes testées (actuelles)')}</div>
        {baseSteps.length === 0 && <div style={{ fontFamily: prodSans, fontSize: 12, color: c.muted }}>{tr('Aucune étape')}</div>}
        {baseSteps.map((s, i) => (
          <div key={s.id} style={{ padding: '8px 0', borderTop: i === 0 ? 'none' : `1px solid ${c.borderSoft}` }}>
            <div style={{ fontFamily: prodSans, fontSize: 11, fontWeight: 700, color: c.mutedSoft, marginBottom: 2 }}>{tr('Étape {n}', { n: i + 1 })}</div>
            <div style={{ fontFamily: prodSans, fontSize: 13, color: c.text, lineHeight: 1.45 }}>{s.text}</div>
          </div>
        ))}
        <div style={{ fontFamily: prodSans, fontSize: 12, color: c.mutedSoft, lineHeight: 1.5 }}>
          {tr('Une suggestion part d’une copie des étapes testées : ajuste, ajoute ou retire des étapes, sans jamais modifier la version actuelle tant qu’elle n’est pas approuvée.')}
        </div>
        <button onClick={() => store.startSopDraft(pid)} style={{
          width: '100%', padding: '14px', borderRadius: 999, cursor: 'pointer', border: 'none',
          background: c.amber, color: '#1a1400', fontFamily: prodSans, fontSize: 15, fontWeight: 700,
        }}>{tr('Démarrer une suggestion')}</button>
      </ProdSheet>
    );
  }

  const newStep = () => ({ id: 'ss_' + Math.random().toString(36).slice(2, 8), text: '', items: [] });
  const patchDraft = (fn) => store.setSopDraftSteps(pid, fn(draft.steps));
  const patchStep = (id, patch) => patchDraft((xs) => xs.map((s) => s.id === id ? { ...s, ...patch } : s));
  const toggleItem = (sid, materialId) => patchDraft((xs) => xs.map((s) => {
    if (s.id !== sid) return s;
    const has = s.items.some((it) => it.materialId === materialId);
    return { ...s, items: has ? s.items.filter((it) => it.materialId !== materialId) : [...s.items, { materialId, pct: 100 }] };
  }));
  const setPct = (sid, materialId, pct) => patchDraft((xs) => xs.map((s) => s.id === sid
    ? { ...s, items: s.items.map((it) => it.materialId === materialId ? { ...it, pct: Math.max(0, Math.min(100, Number(pct) || 0)) } : it) }
    : s));
  const removeStep = (id) => patchDraft((xs) => xs.length > 1 ? xs.filter((s) => s.id !== id) : xs);
  const addStep = () => patchDraft((xs) => [...xs, newStep()]);

  // Blocks the approve action when any step is left blank/whitespace-only.
  // Trimming of the committed text happens in approveSopDraftAsBase itself
  // (data layer) rather than via a second setSopDraftSteps call here, so the
  // commit never reads a stale pre-trim draft (the exact "onBlur commit
  // silently dropped edits" trap this feature already hit once for recipe
  // drafts — see the note atop this component).
  const handleApprove = () => {
    if (draft.steps.some((s) => !s.text.trim())) {
      setApproveErr(tr('Chaque étape doit avoir une description.'));
      return;
    }
    setApproveErr('');
    store.approveSopDraftAsBase(pid);
    onClose();
  };

  // Which base steps are still present in the draft — drives the left
  // ("Testée") column's struck-through "removed" treatment. No union/spacer
  // array is needed any more: the two columns no longer try to align
  // row-for-row (the right column renders full step-editor cards of varying
  // height, so a blank spacer div can't keep rows lined up — see Finding 4
  // in the SOP-draft-versioning final review).
  const usedInDraft = new Set(draft.steps.map((s) => s.id));

  return (
    <ProdSheet title={tr('Suggérer une correction (SOP)')} c={c} onClose={onClose}>
      <div style={{ fontFamily: prodSans, fontSize: 13, color: c.muted, marginTop: -8 }}>{product.name}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: 0.7, textTransform: 'uppercase', color: c.mutedSoft, fontWeight: 700, fontFamily: prodSans, marginBottom: 2 }}>{tr('Testée')}</div>
          {baseSteps.length === 0 && <div style={{ fontFamily: prodSans, fontSize: 12, color: c.muted }}>{tr('Aucune étape')}</div>}
          {baseSteps.map((s) => {
            const removed = !usedInDraft.has(s.id);
            return (
              <div key={s.id} style={{ padding: '7px 0', borderTop: `1px solid ${c.borderSoft}`, opacity: removed ? 0.5 : 1 }}>
                <div style={{ fontFamily: prodSans, fontSize: 11.5, color: c.text, lineHeight: 1.4, textDecoration: removed ? 'line-through' : 'none' }}>{s.text}</div>
              </div>
            );
          })}
        </div>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: 0.7, textTransform: 'uppercase', color: c.amber, fontWeight: 700, fontFamily: prodSans, marginBottom: 2 }}>{tr('À tester')}</div>
          {draft.steps.map((s, idx) => {
            const baseS = baseSteps.find((x) => x.id === s.id);
            const diff = !baseS ? 'added' : (s.text !== baseS.text || JSON.stringify(s.items) !== JSON.stringify(baseS.items)) ? 'changed' : 'same';
            const dot = diff === 'added' ? c.accent : diff === 'changed' ? c.amber : c.mutedSoft;
            return (
              <div key={s.id} style={{ position: 'relative', paddingLeft: 10, marginBottom: 6 }}>
                <span style={{ position: 'absolute', left: 0, top: 20, width: 6, height: 6, borderRadius: 999, background: dot }} />
                <ProdSopStepEditor step={s} index={idx} ingredients={ingredients} materialById={store.materialById} c={c}
                  canRemove={draft.steps.length > 1} hasError={!!approveErr}
                  onPatchText={(text) => patchStep(s.id, { text })}
                  onToggleItem={(materialId) => toggleItem(s.id, materialId)}
                  onSetPct={(materialId, pct) => setPct(s.id, materialId, pct)}
                  onRemove={() => removeStep(s.id)} />
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={addStep} style={{
        width: '100%', padding: '9px', borderRadius: 10, cursor: 'pointer',
        border: `1px dashed ${c.border}`, background: 'transparent', color: c.muted,
        fontFamily: prodSans, fontSize: 12, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}><Icon.plus width={15} height={15} /> {tr('Ajouter une étape')}</button>

      {approveErr && (
        <div style={{
          padding: '10px 13px', borderRadius: 12,
          background: `${c.rose}18`, border: `1px solid ${c.rose}55`,
          color: c.rose, fontSize: 12.5, fontFamily: prodSans, lineHeight: 1.6,
          whiteSpace: 'pre-line',
        }}>{approveErr}</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        <button onClick={handleApprove} style={{
          width: '100%', padding: '13px', borderRadius: 999, cursor: 'pointer',
          background: 'transparent', color: c.text, border: `1px solid ${c.border}`,
          fontFamily: prodSans, fontSize: 14, fontWeight: 600,
        }}>{tr('Approuver comme nouvelle base à tester')}</button>
        <button onClick={() => { store.discardSopDraft(pid); onClose(); }} style={{
          width: '100%', padding: '11px', borderRadius: 999, cursor: 'pointer',
          background: 'transparent', color: c.rose, border: `1px solid ${c.rose}55`,
          fontFamily: prodSans, fontSize: 13, fontWeight: 600,
        }}>{tr('Supprimer la suggestion')}</button>
      </div>
    </ProdSheet>
  );
}

Object.assign(window, { CreaProductDetail, ProdAddMaterialSheet, ProdCostChart, ProdSopEditorSheet, ProdSopViewerSheet, ProdFormulaCompareSheet, ProdSopCompareSheet, ProdDraftRow });
