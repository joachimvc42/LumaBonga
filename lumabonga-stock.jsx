// lumabonga-stock.jsx
// Créatif — Achats (matières premières + charges) et Stock (matières,
// produits finis, production). Relies on globals from creative.jsx
// (creaTheme, creaSans/Mono/Display, CreaSection, CreaHero) and data.jsx.

// ── Segmented control ────────────────────────────────────────
function StkSegment({ value, onChange, options, c }) {
  const idx = options.findIndex((o) => o.id === value);
  return (
    <div style={{ padding: '6px 22px 0' }}>
      <div style={{
        position: 'relative', display: 'grid',
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
        background: c.panel2, border: `1px solid ${c.border}`,
        borderRadius: 14, padding: 4,
      }}>
        <div style={{
          position: 'absolute', top: 4, left: `calc(4px + ${idx} * ((100% - 8px) / ${options.length}))`,
          width: `calc((100% - 8px) / ${options.length})`, height: 'calc(100% - 8px)',
          background: c.ink, borderRadius: 10, zIndex: 0,
          transition: 'left .3s cubic-bezier(.4,1.2,.5,1)',
        }} />
        {options.map((o) => (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            position: 'relative', zIndex: 1, padding: '8px 0', border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: value === o.id ? c.inkContrast : c.muted,
            fontFamily: creaSans, fontSize: 12.5, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {o.label}
            {o.count != null && (
              <span style={{
                fontFamily: creaMono, fontSize: 10,
                color: value === o.id ? c.inkContrast : c.mutedSoft, opacity: 0.8,
              }}>{o.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function StkRowActions({ onEdit, onDelete, c }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <button onClick={onEdit} style={{ background: 'transparent', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 0, display: 'flex' }}><Icon.edit /></button>
      <button onClick={onDelete} style={{ background: 'transparent', border: 'none', color: c.mutedSoft, cursor: 'pointer', padding: 0, display: 'flex' }}><Icon.trash /></button>
    </div>
  );
}

// ── Screen: Achats (matières premières + charges) ────────────
function CreaPurchases({ store, dark, t, onEdit, onAdd }) {
  const c = creaTheme(dark, t.accent);
  const [seg, setSeg] = React.useState('mat');
  const [orgF, setOrgF] = React.useState('all');
  const orgOf = (x) => (x && x.org === 'gawah') ? 'gawah' : 'lumaya';
  const periodScoped = store.period && store.period !== 'all';
  const inPeriod = (d) => !periodScoped || (d || '').slice(0, 7) === store.period;
  const purchases = store.purchases.filter((p) => inPeriod(p.date)).filter((p) => orgF === 'all' || orgOf(p) === orgF);
  const costs = store.costs.filter((x) => inPeriod(x.date)).filter((x) => orgF === 'all' || orgOf(x) === orgF);
  const matTotal = purchases.reduce((a, p) => a + (Number(p.qty) || 0) * (Number(p.price) || 0), 0);
  const chTotal = costs.reduce((a, x) => a + x.amount, 0);

  return (
    <div>
      <CreaHero label={seg === 'mat' ? tr('Achats matières') : tr('Charges')} value={seg === 'mat' ? matTotal : chTotal}
        sub={seg === 'mat' ? tr('{n} factures', { n: purchases.length }) : tr('{n} charges', { n: costs.length })}
        color={seg === 'mat' ? c.purple : c.amber} t={t} dark={dark} />

      <StkSegment value={seg} onChange={setSeg} c={c} options={[
        { id: 'mat', label: tr('Matières'), count: purchases.length },
        { id: 'ch', label: tr('Charges'), count: costs.length },
      ]} />

      <OrgFilter value={orgF} onChange={setOrgF} c={c} />

      {seg === 'mat' && (
        <React.Fragment>
          <CreaSection title={tr('Factures d’achat')} right={tr('matières premières')} dark={dark} t={t} />
          <div style={{ padding: '0 22px' }}>
            {purchases.map((it, i) => {
              const m = store.materialById[it.materialId];
              const base = m?.unit || 'g';
              // Show the quantity in the unit it was bought in (consistency with entry).
              const du = COMPONENT_UNITS.includes(it.buyUnit) ? it.buyUnit : base;
              const qtyShown = convertUnit(it.qty, base, du, densityFor(m));
              return (
                <div key={it.id} style={{
                  padding: '8px 0', borderTop: i === 0 ? 'none' : `1px solid ${c.borderSoft}`,
                  display: 'flex', gap: 10, alignItems: 'center',
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: `oklch(0.62 0.16 ${m?.hue || 0})`, flexShrink: 0 }} />
                  {/* Name + total price */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontFamily: creaSans, fontSize: 13.5, color: c.text, fontWeight: 500, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m?.name || tr('Matière supprimée')}</span>
                      <span style={{ fontFamily: creaMono, fontSize: 13, color: c.purple, fontWeight: 600, marginLeft: 'auto', flexShrink: 0 }}>−{fmtNum(it.qty * it.price)} {t.currency}</span>
                    </div>
                    <div style={{ fontFamily: creaMono, fontSize: 11, color: c.muted, marginTop: 1 }}>{fmtQty(qtyShown)} {du}</div>
                  </div>
                  {/* Date cell */}
                  <div style={{ flexShrink: 0, textAlign: 'center', padding: '2px 8px', borderRadius: 8, background: c.panel2, border: `1px solid ${c.border}` }}>
                    <span style={{ fontFamily: creaMono, fontSize: 10.5, color: c.muted }}>{fmtDate(it.date)}</span>
                  </div>
                  {/* Actions cell */}
                  <StkRowActions c={c} onEdit={() => onEdit('buy', it)} onDelete={() => store.removePurchase(it.id)} />
                </div>
              );
            })}
          </div>
          <div style={{ padding: '14px 22px 0' }}>
            <AddRowButton c={c} label={tr('Nouvelle facture d’achat')} onClick={() => onAdd('buy')} />
          </div>
        </React.Fragment>
      )}

      {seg === 'ch' && (
        <React.Fragment>
          <CreaSection title={tr('Charges')} right={tr('hors matières')} dark={dark} t={t} />
          <div style={{ padding: '0 22px' }}>
            {costs.map((it, i) => (
              <div key={it.id} style={{
                padding: '8px 0', borderTop: i === 0 ? 'none' : `1px solid ${c.borderSoft}`,
                display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <span style={{ color: c.amber, display: 'flex', flexShrink: 0 }}><Icon.cost width={18} height={18} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontFamily: creaSans, fontSize: 13.5, color: c.text, fontWeight: 500, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>
                    <span style={{ fontFamily: creaMono, fontSize: 13, color: c.amber, fontWeight: 600, marginLeft: 'auto', flexShrink: 0 }}>−{fmtNum(it.amount)} {t.currency}</span>
                  </div>
                  {it.who && <div style={{ fontFamily: creaMono, fontSize: 11, color: c.muted, marginTop: 1 }}>{it.who}</div>}
                </div>
                <div style={{ flexShrink: 0, textAlign: 'center', padding: '2px 8px', borderRadius: 8, background: c.panel2, border: `1px solid ${c.border}` }}>
                  <span style={{ fontFamily: creaMono, fontSize: 10.5, color: c.muted }}>{fmtDate(it.date)}</span>
                </div>
                <StkRowActions c={c} onEdit={() => onEdit('cost', it)} onDelete={() => store.removeCost(it.id)} />
              </div>
            ))}
          </div>
          <div style={{ padding: '14px 22px 0' }}>
            <AddRowButton c={c} label={tr('Nouvelle charge')} onClick={() => onAdd('cost')} />
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

function AddRowButton({ c, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '13px', borderRadius: 14,
      border: `1px dashed ${c.border}`, background: 'transparent', color: c.muted,
      cursor: 'pointer', fontFamily: creaSans, fontSize: 13, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    }}><Icon.plus width={16} height={16} /> {label}</button>
  );
}

// ── Screen: Stock (matières + produits finis) ────────────────
function CreaStock({ store, dark, t, onEdit, onAdd, onOpen, role }) {
  const c = creaTheme(dark, t.accent);
  const [seg, setSeg] = React.useState('mat');
  // Staff (level-1 pass) sees stock levels to do their job, never the $ value.
  const restricted = role === 'staff';
  // Category folds — both lists start fully collapsed: pick the category
  // first, then the item (long catalogs stay scannable).
  const [openMatCats, setOpenMatCats] = React.useState(() => new Set());
  const [openProdCats, setOpenProdCats] = React.useState(() => new Set());
  const toggleMatCat = foldToggle(setOpenMatCats);
  const toggleProdCat = foldToggle(setOpenProdCats);

  return (
    <div>
      {!restricted && (
        <CreaHero label={seg === 'mat' ? tr('Valeur matières') : tr('Valeur produits finis')}
          value={seg === 'mat' ? store.totals.valMatieres : store.totals.valProduits}
          sub={tr('au coût de revient')} color={seg === 'mat' ? c.purple : c.accent} t={t} dark={dark} />
      )}

      <StkSegment value={seg} onChange={setSeg} c={c} options={[
        { id: 'mat', label: tr('Matières'), count: store.materials.length },
        { id: 'prod', label: tr('Produits finis'), count: store.products.length },
      ]} />

      {seg === 'mat' && (
        <React.Fragment>
          <CreaSection title={tr('Stock matières')} right={tr('restant')} dark={dark} t={t} />
          {groupedMaterials(store.materials).map((g) => (
            <div key={g.cat} style={{ padding: '0 22px', marginBottom: 2 }}>
              <CreaFold label={tr(g.label)} count={g.items.length} c={c} dark={dark}
                open={openMatCats.has(g.cat)} onToggle={() => toggleMatCat(g.cat)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 6 }}>
                {g.items.map((m) => {
                  const stock = store.materialStock[m.id] ?? 0;
                  const price = store.materialPrices[m.id] ?? 0;
                  const low = stock <= (m.unit === 'pièce' ? 30 : m.unit === 'm' ? 5 : 800);
                  return (
                    <div key={m.id} style={{
                      padding: '5px 10px', borderRadius: 10,
                      background: c.panel, border: `1px solid ${c.border}`,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: creaSans, fontSize: 12, color: c.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                        <div style={{ fontFamily: creaMono, fontSize: 9.5, color: c.muted }}>
                          {fmtNum(price)} {t.currency}/{m.unit} · {tr(m.kind)}
                        </div>
                      </div>
                      <button onClick={() => {
                        const cur = store.materialStock[m.id] ?? 0;
                        const v = window.prompt(tr('Stock réel pour {name} (u)', { name: m.name }).replace('(u)', `(${m.unit})`), String(cur));
                        if (v === null) return;
                        if (v.trim() === '') store.clearMaterialStockManual(m.id);
                        else store.setMaterialStockManual(m.id, Number(v));
                      }} title={tr('Corriger le stock')} style={{
                        background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <span style={{ fontFamily: creaDisplay, fontStyle: 'normal', fontSize: 14, color: store.materialAdj[m.id] != null ? c.accent : (low ? c.amber : c.text) }}>
                          {fmtNum(stock)} <span style={{ fontFamily: creaMono, fontSize: 9.5, fontStyle: 'normal', color: c.muted }}>{m.unit}</span>
                        </span>
                        <span style={{ color: c.mutedSoft, display: 'flex' }}><Icon.edit width={10} height={10} /></span>
                      </button>
                      <StkRowActions c={c} onEdit={() => onEdit('material', m)} onDelete={() => store.removeMaterial(m.id)} />
                    </div>
                  );
                })}
              </div>
              </CreaFold>
            </div>
          ))}
          <div style={{ padding: '10px 22px 0', fontFamily: creaSans, fontSize: 11.5, color: c.mutedSoft }}>
            {tr('Une nouvelle matière se crée depuis Achats, au moment du premier achat.')}
          </div>
        </React.Fragment>
      )}

      {seg === 'prod' && (
        <React.Fragment>
          <CreaSection title={tr('Produits finis')} right={tr('en stock')} dark={dark} t={t} />
          {groupedProducts(store.products).map((g) => (
            <div key={g.cat} style={{ padding: '0 22px', marginBottom: 2 }}>
              <CreaFold label={tr(g.label)} count={g.items.length} c={c} dark={dark}
                open={openProdCats.has(g.cat)} onToggle={() => toggleProdCat(g.cat)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 6 }}>
            {g.items.map((p) => {
              const stock = store.finishedStock[p.id] ?? 0;
              const can = store.producibleFor(p.id);
              // If this product is driving a shortage on the To-purchase list,
              // match that row's exact color (worst-covered material wins) so
              // the two screens read as one system. Otherwise fall back to a
              // simple stock-level read: red = can produce < 3, orange = < 10
              // finished in stock, green = fine.
              const shortages = store.toPurchase.filter((x) => x.productId === p.id);
              const levelHue = shortages.length
                ? Math.min(...shortages.map((x) => purchaseHue(x.need > 0 ? Math.floor(10 * x.have / x.need) : 0)))
                : (can < 3 ? 25 : stock < 10 ? 60 : 155);
              return (
                <div key={p.id} style={{
                  padding: '5px 10px', borderRadius: 10,
                  ...softTintBar(dark, levelHue),
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div onClick={() => onOpen && onOpen(p)} style={{
                      fontFamily: creaSans, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      ...softTint(dark, levelHue), display: 'inline-block', maxWidth: '100%', boxSizing: 'border-box',
                      padding: '3px 9px', borderRadius: 8,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{p.name}</div>
                    <div style={{ fontFamily: creaMono, fontSize: 9.5, color: can === 0 ? c.rose : c.muted, marginTop: 2 }}>
                      {tr('{n} produisibles', { n: can })}
                    </div>
                  </div>
                  <button onClick={() => {
                    const cur = store.finishedStock[p.id] ?? 0;
                    const v = window.prompt(tr('Stock réel pour {name} (u)', { name: p.name }), String(cur));
                    if (v === null) return;
                    if (v.trim() === '') store.clearProductStockManual(p.id);
                    else store.setProductStockManual(p.id, Number(v));
                  }} title={tr('Corriger le stock')} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{ fontFamily: creaDisplay, fontStyle: 'normal', fontSize: 14, color: store.productAdj[p.id] != null ? c.accent : (stock <= 5 ? c.amber : c.text) }}>
                      {stock} <span style={{ fontFamily: creaMono, fontSize: 9.5, fontStyle: 'normal', color: c.muted }}>u</span>
                    </span>
                    <span style={{ color: c.mutedSoft, display: 'flex' }}><Icon.edit width={11} height={11} /></span>
                  </button>
                  <button onClick={() => onEdit('production', { productId: p.id, qty: '', who: '' })} style={{
                    padding: '5px 10px', borderRadius: 999, border: 'none',
                    background: c.ink, color: c.inkContrast, cursor: 'pointer',
                    fontFamily: creaSans, fontSize: 10, fontWeight: 600, flexShrink: 0,
                  }}>{tr('Produire')}</button>
                </div>
              );
            })}
              </div>
              </CreaFold>
            </div>
          ))}

          <CreaSection title={tr('Production')} right={tr('{n} lots', { n: store.production.length })} dark={dark} t={t} />
          <div style={{ padding: '0 22px' }}>
            {store.production.map((it, i) => {
              const p = store.productById[it.productId];
              return (
                <div key={it.id} style={{
                  padding: '13px 0', borderTop: i === 0 ? 'none' : `1px solid ${c.borderSoft}`,
                  display: 'flex', gap: 12, alignItems: 'center',
                }}>
                  <span style={{ color: c.rose, display: 'flex' }}><Icon.prod width={18} height={18} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: creaSans, fontSize: 13.5, color: c.text, fontWeight: 500 }}>{p?.name || '—'}</div>
                    <div style={{ fontFamily: creaMono, fontSize: 10.5, color: c.muted, marginTop: 1 }}>{fmtDate(it.date)}{it.who ? ` · ${it.who}` : ''}</div>
                  </div>
                  <div style={{ fontFamily: creaDisplay, fontStyle: 'normal', fontSize: 17, color: c.rose }}>+{it.qty} u</div>
                  <StkRowActions c={c} onEdit={() => onEdit('production', it)} onDelete={() => store.removeProduction(it.id)} />
                </div>
              );
            })}
          </div>
          <div style={{ padding: '14px 22px 0' }}>
            <AddRowButton c={c} label={tr('Lancer une production')} onClick={() => onAdd('production')} />
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

Object.assign(window, { CreaPurchases, CreaStock });
