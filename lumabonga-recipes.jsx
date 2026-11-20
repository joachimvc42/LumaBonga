const recipeLabels = {
  id: {
    title: 'Pembuatan', testing: 'Untuk diuji', validated: 'Resep tervalidasi', empty: 'Belum ada resep.',
    signout: 'Keluar', units: 'Jumlah unit', net: 'Berat bersih', total: 'Total yang disiapkan',
    ingredients: 'Bahan', begin: 'Mulai pembuatan', back: 'Kembali', previous: 'Sebelumnya',
    next: 'Selanjutnya', done: 'Langkah selesai', finish: 'Selesai', complete: 'Pembuatan selesai',
    loadError: 'Resep tidak dapat dimuat.', retry: 'Coba lagi', step: 'Langkah',
    filters: 'Status resep',
    weighedTotal: 'Total bahan yang ditimbang',
    belowMinimum: 'Terlalu kecil untuk ditimbang',
    minimumUnits: (n) => `Siapkan setidaknya ${n} unit agar semua bahan dapat ditimbang.`,
    emptyTesting: 'Resep uji akan muncul setelah admin mengirimkannya untuk diuji.',
    emptyValidated: 'Resep siap produksi akan muncul setelah divalidasi oleh admin.',
    reviewPending: 'Menunggu verifikasi untuk produksi',
  },
  en: {
    title: 'Preparation', testing: 'To test', validated: 'Validated recipes', empty: 'No recipes yet.',
    signout: 'Sign out', units: 'Number of units', net: 'Net weight', total: 'Total to prepare',
    ingredients: 'Ingredients', begin: 'Start preparation', back: 'Back', previous: 'Previous',
    next: 'Next', done: 'Step complete', finish: 'Finish', complete: 'Preparation complete',
    loadError: 'Recipes could not be loaded.', retry: 'Try again', step: 'Step',
    filters: 'Recipe status',
    weighedTotal: 'Total weighed ingredients',
    belowMinimum: 'Below scale minimum',
    minimumUnits: (n) => `Prepare at least ${n} units so every weighed ingredient can be measured.`,
    emptyTesting: 'Recipes appear here when an admin sends them for testing.',
    emptyValidated: 'Recipes appear here when an admin validates them for production.',
    reviewPending: 'Awaiting checks for guided preparation',
  },
};

const recipeStatusLabels = { draft: 'Draft', testing: 'To test', validated: 'Validated', archived: 'Archived' };

function RecipeWorkbench({ admin = false, dark, theme, t, onSignOut, onVersionsLoaded }) {
  const [rows, setRows] = React.useState(null);
  const [legacy, setLegacy] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [lang, setLang] = React.useState('id');
  const [error, setError] = React.useState(false);
  const [filter, setFilter] = React.useState(null);
  const [saveNotice, setSaveNotice] = React.useState('');
  const labels = recipeLabels[admin ? 'en' : lang];
  const reload = React.useCallback(async () => {
    setError(false);
    const sb = window.__sb;
    const [versions, historical] = await Promise.all([
      sb.from('recipe_versions').select('*').order('name').order('version', { ascending: false }),
      sb.from('recipe_legacy_index').select('*').order('name'),
    ]);
    if (versions.error || historical.error) {
      setRows(null);
      setError(true);
      return;
    }
    setLegacy(historical.data);
    setRows(versions.data);
    if (onVersionsLoaded) onVersionsLoaded(versions.data);
    if (!admin) setSelected((current) =>
      current && versions.data.some((row) => row.id === current.id) ? current : null);
  }, [admin, onVersionsLoaded]);
  React.useEffect(() => {
    reload();
    window.addEventListener('focus', reload);
    return () => window.removeEventListener('focus', reload);
  }, [reload]);

  const versions = rows || [];
  const integrated = new Set(versions
    .filter((row) => admin || row.status === 'validated')
    .map((row) => row.legacy_source_key));
  const entries = [...versions, ...legacy.filter((row) => !integrated.has(row.source_key))]
    .sort((left, right) => left.name.localeCompare(right.name, admin ? 'en' : lang));
  const open = (row) => {
    setSaveNotice('');
    if (!row.source_key) {
      setSelected(row);
      return;
    }
    setSelected({ ...recipeFromLedger(row.product_id, row.working_copy),
      legacy_source_key: row.source_key, legacyStatus: row.status });
  };
  const counts = {
    draft: entries.filter((row) => row.status === 'draft').length,
    testing: entries.filter((row) => row.status === 'testing').length,
    validated: entries.filter((row) => row.status === 'validated').length,
    archived: entries.filter((row) => row.status === 'archived').length,
  };
  const activeStatus = filter || (admin ? 'draft' : counts.validated || !counts.testing ? 'validated' : 'testing');
  const headings = { draft: 'Drafts', testing: labels.testing, validated: labels.validated, archived: 'Archived versions' };
  const filters = admin ? ['draft', 'testing', 'validated', ...(counts.archived ? ['archived'] : [])] : ['validated', 'testing'];
  const visible = entries.filter((row) => row.status === activeStatus);
  const adminColors = admin ? {
    '--recipe-panel': theme.panel, '--recipe-panel-alt': theme.panel2, '--recipe-border': theme.border,
    '--recipe-text': theme.text, '--recipe-muted': theme.muted,
    '--recipe-accent': theme.accent, '--recipe-contrast': theme.inkContrast, '--recipe-font': creaSans,
  } : undefined;
  return (
    <main className={admin ? 'recipe-workbench recipe-admin' : 'recipe-workbench recipe-producer'}
      style={adminColors} lang={admin ? 'en' : lang}>
      {!admin && <header>
        <div className="recipe-brand">
          <span aria-hidden="true">LB</span><strong>LumaBonga</strong>
        </div>
        <select aria-label="Language" value={lang} onChange={(event) => setLang(event.target.value)}>
          <option value="id">Bahasa Indonesia</option><option value="en">English</option>
        </select>
        <button onClick={onSignOut}>{labels.signout}</button>
      </header>}
      {admin && !selected && <>
        <CreaSection title="Recipe versions" dark={dark} t={t} />
        {saveNotice && <p className="recipe-save-notice" role="status">{saveNotice}</p>}
      </>}
      {!admin && !selected && <h1>{labels.title}</h1>}
      {error ? <p role="alert">{labels.loadError} <button onClick={reload}>{labels.retry}</button></p>
        : !rows ? <progress />
        : selected && !admin ? <RecipePreparation key={selected.id} recipe={selected} language={lang} onClose={() => setSelected(null)} />
        : <>
          <div className="recipe-status-picker" role="group" aria-label={labels.filters}>
            {filters.map((status) => (
              <button key={status} aria-pressed={status === activeStatus} onClick={() => { setFilter(status); setSelected(null); }}>
                {headings[status]} <span>{counts[status]}</span>
              </button>
            ))}
          </div>
          {admin && selected ? <div className="recipe-admin-editor">
            <RecipeVersionEditor key={selected.id || selected.legacy_source_key || 'new'} initial={selected}
              rows={versions} onOpen={setSelected} onSaved={reload} onStatusSaved={(name, status) => {
                setSaveNotice(`${name} saved as ${recipeStatusLabels[status]}.`);
                setFilter(null);
                setSelected(null);
              }} />
          </div> : <>
            <section key={activeStatus} aria-label={headings[activeStatus]} className="recipe-status-list">
              {visible.map((row) =>
                !admin && row.source_key ? (
                  <div className="recipe-list-item recipe-legacy-card" key={row.source_key}>
                    {row.name}<small>{labels.reviewPending}</small>
                  </div>
                ) : (
                  <button className="recipe-list-item" key={row.id || row.source_key} onClick={() => open(row)}>
                    {row.name} <small>{row.source_key ? 'Catalogue' : `v${row.version}`}</small>
                  </button>
                )
              )}
              {!visible.length && (admin ? <p className="recipe-admin-empty">{labels.empty}</p> :
                <div className="recipe-empty">
                  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="5" y="4" width="14" height="16" rx="2" />
                    <path d="M9 9h6m-6 4h6m-6 4h3" />
                  </svg>
                  <strong>{labels.empty}</strong>
                  <p>{activeStatus === 'testing' ? labels.emptyTesting : labels.emptyValidated}</p>
                </div>)}
            </section>
          {admin && <button className="recipe-admin-new" onClick={() => setSelected(emptyRecipe())}>+ New draft</button>}
          </>}
        </>}
    </main>
  );
}

function RecipePreparation({ recipe, language, onClose }) {
  const labels = recipeLabels[language];
  const [units, setUnits] = React.useState('1');
  const [index, setIndex] = React.useState(-1);
  const [checked, setChecked] = React.useState({});
  const count = Number(units);
  const batch = LumaBatch.calculate(recipe, count);
  const format = (quantity) => LumaBatch.format(quantity, language);
  const measured = batch && LumaBatch.forScale(batch.quantities, count, 0.5);
  const ready = measured && measured.minimumUnits <= count;
  const weighed = measured && LumaBatch.massSummary(measured.ingredients);
  const step = recipe.steps[index];
  return <>
    <button onClick={onClose}>{labels.back}</button>
    <h2>{recipe.name} <small>v{recipe.version}</small></h2>
    {index === -1 ? <>
      <label>{labels.units}
        <input type="number" inputMode="numeric" min="1" step="1" value={units}
          onChange={(event) => { setUnits(event.target.value); setChecked({}); }} />
      </label>
      {batch && <>
        {weighed.complete && <p>{labels.net} <strong>{format(batch.net)} g</strong></p>}
        {ready ? <p>{weighed.complete ? labels.total : labels.weighedTotal} <strong>{format(weighed.grams)} g</strong></p>
          : <p role="status" className="recipe-safety">{labels.minimumUnits(format(measured.minimumUnits))}</p>}
        <h3>{labels.ingredients}</h3>
        <ul>{measured.ingredients.map((item, i) => <li key={i}>
          <span>{item[language] || item.en}</span>
          <strong>{item.belowMinimum ? labels.belowMinimum : `${format(item.quantity)} ${recipeUnit(item.unit)}`}</strong>
        </li>)}</ul>
      </>}
      <button className="recipe-primary" disabled={!ready} onClick={() => setIndex(0)}>{labels.begin}</button>
    </> : step ? <>
      <p>{labels.step} {index + 1} / {recipe.steps.length}</p>
      <p className="recipe-instruction">{step[language]}</p>
      {step.safetyId && <p className="recipe-safety">{language === 'id' ? step.safetyId : step.safetyEn}</p>}
      <label className="recipe-check"><input type="checkbox" checked={!!checked[index]}
        onChange={(event) => setChecked({ ...checked, [index]: event.target.checked })} />{labels.done}</label>
      <nav>
        <button onClick={() => setIndex(index - 1)}>{labels.previous}</button>
        <button className="recipe-primary"
          disabled={index === recipe.steps.length - 1 && !recipe.steps.every((_, i) => checked[i])}
          onClick={() => setIndex(index + 1)}>{index === recipe.steps.length - 1 ? labels.finish : labels.next}</button>
      </nav>
    </> : <><p role="status">{labels.complete}</p><button onClick={() => setIndex(index - 1)}>{labels.previous}</button></>}
  </>;
}

function emptyRecipe() {
  return { name: '', unit_weight: '', reference_weight: '', margin: 2, ingredients: [], steps: [],
    translations_reviewed: false, status: 'draft' };
}

function recipeFromLedger(productId, useTest) {
  const ledger = window.__LUMA_INITIAL;
  const product = (ledger.products || []).find((item) => item.id === productId);
  const formula = (useTest && ledger.recipeDrafts?.[productId]) || ledger.recipes?.[productId];
  const sop = (useTest && ledger.sopDrafts?.[productId]) || ledger.sops?.[productId];
  const ingredients = (formula?.ingredients || []).map((item) => {
    const material = (ledger.materials || []).find((entry) => entry.id === item.materialId);
    return { id: '', en: material?.name || '', quantity: Number(item.qty), unit: material?.unit || '' };
  });
  const allGrams = ingredients.length && ingredients.every((item) => item.unit === 'g');
  const weight = allGrams ? ingredients.reduce((sum, item) => sum + item.quantity, 0) : '';
  return { ...emptyRecipe(), name: product?.name || '', unit_weight: weight, reference_weight: weight, ingredients,
    steps: (sop?.steps || []).map((step) => ({ id: '', en: step.text || '', safetyId: '', safetyEn: '' })) };
}

function RecipeVersionEditor({ initial, rows, onOpen, onSaved, onStatusSaved }) {
  const [editingName, setEditingName] = React.useState(!initial.name);
  const [form, setForm] = React.useState(() => {
    const ratio = initial.unit_weight && initial.reference_weight ? initial.unit_weight / initial.reference_weight : 1;
    return ratio === 1 ? initial : { ...initial, ingredients: initial.ingredients.map((item) =>
      ({ ...item, quantity: item.quantity * ratio })) };
  });
  const [nextStatus, setNextStatus] = React.useState(null);
  const [source, setSource] = React.useState('');
  const [observations, setObservations] = React.useState([]);
  const [note, setNote] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const editable = form.status === 'draft' || form.status === 'testing';
  const table = () => window.__sb.from('recipe_versions');
  const observationTable = () => window.__sb.from('recipe_observations');
  React.useEffect(() => {
    if (!form.id) return;
    let active = true;
    observationTable().select('*').eq('recipe_id', form.id).order('created_at').then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage(error.message);
      else setObservations(data);
    });
    return () => { active = false; };
  }, [form.id]);

  const run = async (operation) => {
    setBusy(true);
    setMessage('');
    try { await operation(); }
    catch (error) { setMessage(error.message || 'Could not save this recipe. Please try again.'); }
    finally { setBusy(false); }
  };
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const changeList = (key, value) => setForm((current) =>
    ({ ...current, [key]: value, translations_reviewed: false }));
  const write = (status) => run(async () => {
    const { name, margin, ingredients, steps } = form;
    const payload = { name: name.trim(), unit_weight: mass.grams || null,
      reference_weight: mass.grams || null,
      margin: Number(margin), ingredients: ingredients.map((item) => ({
        ...item, id: item.id?.trim() || item.en || '', unit: recipeUnit(item.unit),
      })), steps: steps.map((step) => ({
        ...step, id: step.id?.trim() || step.en || '',
        safetyId: step.safetyId?.trim() || step.safetyEn || '',
        safetyEn: step.safetyEn?.trim() || step.safetyId || '',
      })),
      translations_reviewed: status === 'testing' || status === 'validated', status };
    const linked = { ...payload, legacy_source_key: form.legacy_source_key || null };
    const { data, error } = form.id
      ? await table().update(form.status === 'validated' ? { status } : payload)
          .eq('id', form.id).eq('updated_at', form.updated_at).select().maybeSingle()
      : status === 'testing'
        ? await window.__sb.rpc('create_recipe_for_testing', { payload: linked }).single()
        : await table().insert(linked).select().single();
    if (error) throw error;
    if (!data) throw new Error('This version changed elsewhere. Reopen it before saving.');
    setForm(data);
    setNextStatus(null);
    await onSaved();
    if (data.status !== currentStatus) onStatusSaved(data.name, data.status);
    else setMessage(`Saved as ${recipeStatusLabels[data.status]}.`);
  });
  const duplicate = () => run(async () => {
    const { family_id, name, margin, unit_weight, reference_weight, ingredients, steps, legacy_source_key } = form;
    const version = Math.max(...rows.filter((row) => row.family_id === family_id).map((row) => row.version)) + 1;
    const { data, error } = await table().insert({ family_id, version, name, margin, unit_weight,
      reference_weight, ingredients, steps, legacy_source_key }).select().single();
    if (error) throw error;
    await onSaved();
    onOpen(data);
  });
  const remove = () => {
    if (!window.confirm('Delete this version and its observations?')) return;
    run(async () => {
      const { data, error } = await table().delete().eq('id', form.id).eq('updated_at', form.updated_at).select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('This version changed elsewhere. Reopen it before deleting.');
      await onSaved();
      onOpen(null);
    });
  };
  const addNote = () => run(async () => {
    const { data, error } = await observationTable().insert({ recipe_id: form.id, note: note.trim() }).select().single();
    if (error) throw error;
    setObservations((items) => [...items, data]);
    setNote('');
  });
  const save = (event) => {
    event.preventDefault();
    if (!canSave || busy) return;
    if (!form.name.trim()) {
      setEditingName(true);
      setMessage('Enter a recipe name.');
      return;
    }
    if (status !== 'draft' && editable && !mass.grams) {
      setMessage('Enter at least one ingredient by weight (g or kg) before publishing.');
      return;
    }
    write(status);
  };
  const mass = LumaBatch.massSummary(form.ingredients);
  const marginFactor = 1 + Number(form.margin) / 100;
  const netWeight = mass.grams ? `${LumaBatch.format(mass.grams, 'en')} g` : '— g';
  const ledgerProducts = window.__LUMA_INITIAL?.products || [];
  const hasPending = rows.some((row) => row.id !== form.id && row.family_id === form.family_id && ['draft', 'testing'].includes(row.status));
  const currentStatus = form.legacyStatus || form.status;
  const status = nextStatus || currentStatus;
  const options = currentStatus === 'draft' ? ['draft', 'testing']
    : currentStatus === 'testing' ? ['draft', 'testing', ...(form.id ? ['validated'] : [])]
    : currentStatus === 'validated' && !hasPending ? ['draft', 'testing', 'validated'] : [currentStatus];
  const canSave = editable ? !(form.legacyStatus === 'validated' && status === 'validated')
    : form.status === 'validated' && status !== currentStatus && !hasPending;
  return <>
    {!form.id && !form.legacy_source_key && ledgerProducts.length > 0 && <div className="recipe-import">
      <label>Copy an existing formula
        <select value={source} onChange={(event) => setSource(event.target.value)}>
          <option value="">Select a formula</option>
          {ledgerProducts.map((item) => <React.Fragment key={item.id}>
            <option value={JSON.stringify([item.id, false])}>{item.name}</option>
            {window.__LUMA_INITIAL.recipeDrafts?.[item.id] &&
              <option value={JSON.stringify([item.id, true])}>{item.name} · test</option>}
          </React.Fragment>)}
        </select>
      </label>
      <button type="button" disabled={!source} onClick={() => setForm(recipeFromLedger(...JSON.parse(source)))}>Copy</button>
    </div>}
    <form onInvalidCapture={(event) => {
      const panel = event.target.closest('details');
      if (panel) panel.open = true;
    }} onSubmit={save}>
      <div className="recipe-editor-heading">
        <div className="recipe-editor-identity">
          {editingName ? <input aria-label="Recipe name" value={form.name} required autoFocus disabled={busy}
            onChange={(event) => change('name', event.target.value)}
            onBlur={() => { if (form.name.trim()) setEditingName(false); }} />
            : <h2>{form.name || 'New draft'}</h2>}
          {editable && !editingName && <button type="button" className="recipe-edit-name" aria-label="Edit recipe name"
            disabled={busy} onClick={() => setEditingName(true)}>✏️</button>}
          <small className="recipe-net-weight" title={mass.complete ? 'Net weight per unit' : 'Measured weight per unit'}>{netWeight}</small>
        </div>
        <div className="recipe-status-control">
          <select aria-label="Status" value={status} disabled={busy || options.length < 2} onChange={(e) => setNextStatus(e.target.value)}>
            {options.map((value) => <option key={value} value={value}>{recipeStatusLabels[value]}</option>)}
          </select>
          <button type="submit" className="recipe-primary" disabled={busy || !canSave}>Save</button>
          <button className="recipe-editor-close" type="button" aria-label="Close recipe" disabled={busy} onClick={() => onOpen(null)}>×</button>
        </div>
      </div>
      {message && <p role="status">{message}</p>}
      {form.status === 'validated' && hasPending && <p>Finish or remove the pending version before changing this validated version’s status.</p>}
      <fieldset disabled={busy || !editable}>
        <h3>Ingredients <small>Per unit · includes {form.margin}% extra</small></h3>
        <IngredientTable values={form.ingredients} marginFactor={marginFactor} onChange={(value) => changeList('ingredients', value)} />
        <h3>Instructions</h3>
        <RecipeLines values={form.steps} onChange={(value) => changeList('steps', value)} />
      </fieldset>
    </form>
    {form.id && <details className="recipe-admin-details">
      <summary>Version actions</summary>
      <nav>
        {form.status === 'validated' && <button disabled={busy || hasPending} onClick={duplicate}>Create a new draft version</button>}
        <button disabled={busy} onClick={remove}>Delete version</button>
      </nav>
    </details>}
    {form.id && form.status !== 'draft' && <section>
      <h3>Test observations</h3>
      {observations.map((item) => <p key={item.id}>{item.note}</p>)}
      <label>Observation<textarea value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <button disabled={busy || !note.trim()} onClick={addNote}>Record observation</button>
    </section>}
  </>;
}

function recipeUnit(unit) {
  return /^gouttes?$/i.test(unit || '') ? 'drop' : unit || '';
}

function IngredientTable({ values, marginFactor, onChange }) {
  const [editingQuantity, setEditingQuantity] = React.useState(null);
  const update = (index, key, value) =>
    onChange(values.map((row, i) => i === index ? { ...row, [key]: value } : row));
  return <div className="recipe-lines">
    <table className="recipe-ingredients">
      <thead><tr><th scope="col">Ingredient</th><th scope="col">Quantity</th></tr></thead>
      <tbody>{values.map((row, index) => {
        const suffix = index + 1;
        const quantity = row.quantity === '' || row.quantity == null
          ? '' : Number((Number(row.quantity) * marginFactor).toPrecision(12));
        const gramsPerUnit = row.unit === 'kg' ? 1000 : row.unit === 'g' ? 1 : 0;
        const displayedQuantity = index !== editingQuantity && gramsPerUnit && quantity * gramsPerUnit >= 0.5
          ? Math.round(quantity * gramsPerUnit * 2) / (2 * gramsPerUnit) : quantity;
        return <tr key={index}>
          <td><input aria-label={`Ingredient ${suffix}`} placeholder="Ingredient" value={row.en || ''}
            onChange={(event) => update(index, 'en', event.target.value)} /></td>
          <td><div className="recipe-ingredient-quantity">
            <input aria-label={`Quantity including extra for ingredient ${suffix}`}
              type="number" step="any" min="0" inputMode="decimal" placeholder="Qty" value={displayedQuantity}
              onFocus={() => setEditingQuantity(index)} onBlur={() => setEditingQuantity(null)}
              onChange={(event) => update(index, 'quantity',
                event.target.value === '' ? '' : Number(event.target.value) / marginFactor)} />
            <input aria-label={`Unit for ingredient ${suffix}`} placeholder="Unit" value={recipeUnit(row.unit)}
              onChange={(event) => update(index, 'unit', event.target.value)} />
            <button type="button" aria-label={`Remove ingredient ${suffix}`}
              onClick={() => onChange(values.filter((_, i) => i !== index))}>×</button>
          </div></td>
        </tr>;
      })}</tbody>
    </table>
    <button type="button" onClick={() => onChange([...values, {}])}>+ Add ingredient</button>
  </div>;
}

function RecipeLines({ values, onChange }) {
  const update = (index, key, value) =>
    onChange(values.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const move = (index, offset) => {
    const items = [...values];
    [items[index], items[index + offset]] = [items[index + offset], items[index]];
    onChange(items);
  };
  return <div className="recipe-lines">
    {values.map((row, index) => {
      const suffix = index + 1;
      return <div className="recipe-line" key={index}>
        <div className="recipe-line-main recipe-line-step">
          <span aria-hidden="true">{suffix}.</span>
          <textarea rows="1" aria-label={`Step ${suffix}`} placeholder="Instruction" value={row.en || ''}
            onChange={(event) => update(index, 'en', event.target.value)} />
          <div className="recipe-line-order">
            <button type="button" aria-label={`Move step ${suffix} up`} disabled={!index} onClick={() => move(index, -1)}>↑</button>
            <button type="button" aria-label={`Move step ${suffix} down`} disabled={index === values.length - 1} onClick={() => move(index, 1)}>↓</button>
            <button type="button" aria-label={`Remove step ${suffix}`}
              onClick={() => onChange(values.filter((_, i) => i !== index))}>×</button>
          </div>
        </div>
      </div>;
    })}
    <button type="button" onClick={() => onChange([...values, {}])}>+ Add step</button>
  </div>;
}
