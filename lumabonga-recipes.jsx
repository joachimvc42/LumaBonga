const recipeLabels = {
  id: {
    title: 'Pembuatan', testing: 'Untuk diuji', validated: 'Resep tervalidasi', empty: 'Belum ada resep.',
    signout: 'Keluar', units: 'Jumlah unit', net: 'Berat bersih', total: 'Total yang disiapkan',
    ingredients: 'Bahan', begin: 'Mulai pembuatan', back: 'Kembali', previous: 'Sebelumnya',
    next: 'Selanjutnya', done: 'Langkah selesai', finish: 'Selesai', complete: 'Pembuatan selesai',
    loadError: 'Resep tidak dapat dimuat.', retry: 'Coba lagi', step: 'Langkah',
    filters: 'Status resep',
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
    emptyTesting: 'Recipes appear here when an admin sends them for testing.',
    emptyValidated: 'Recipes appear here when an admin validates them for production.',
    reviewPending: 'Awaiting checks for guided preparation',
  },
};

const recipeStatusLabels = { draft: 'Draft', testing: 'To test', validated: 'Validated', archived: 'Archived' };

function RecipeWorkbench({ admin = false, onClose, onSignOut, onVersionsLoaded }) {
  const [rows, setRows] = React.useState(null);
  const [legacy, setLegacy] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [lang, setLang] = React.useState('id');
  const [error, setError] = React.useState(false);
  const [filter, setFilter] = React.useState(null);
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
    if (!row.source_key) {
      setSelected(row);
      return;
    }
    setSelected({ ...recipeFromLedger(row.product_id, row.working_copy),
      legacy_source_key: row.source_key, legacyStatus: row.status });
  };
  const counts = {
    testing: entries.filter((row) => row.status === 'testing').length,
    validated: entries.filter((row) => row.status === 'validated').length,
  };
  const activeStatus = filter || (counts.validated || !counts.testing ? 'validated' : 'testing');
  const statuses = admin ? ['draft', 'testing', 'validated', 'archived'] : [activeStatus];
  const headings = { draft: 'Drafts', testing: labels.testing, validated: labels.validated, archived: 'Archived versions' };
  return (
    <main className={admin ? 'recipe-workbench' : 'recipe-workbench recipe-producer'} lang={admin ? 'en' : lang}>
      <header>
        {admin ? <h1>Recipe versions</h1> : <div className="recipe-brand">
          <span aria-hidden="true">LB</span><strong>LumaBonga</strong>
        </div>}
        {admin ? <button onClick={onClose}>Back to administration</button> : <>
          <select aria-label="Language" value={lang} onChange={(event) => setLang(event.target.value)}>
            <option value="id">Bahasa Indonesia</option><option value="en">English</option>
          </select>
          <button onClick={onSignOut}>{labels.signout}</button>
        </>}
      </header>
      {!admin && !selected && <h1>{labels.title}</h1>}
      {error ? <p role="alert">{labels.loadError} <button onClick={reload}>{labels.retry}</button></p>
        : !rows ? <progress />
        : selected ? (admin
          ? <RecipeVersionEditor key={selected.id || 'new'} initial={selected} rows={versions}
              onOpen={setSelected} onSaved={reload} />
          : <RecipePreparation key={selected.id} recipe={selected} language={lang} onClose={() => setSelected(null)} />)
        : <>
          {admin && <button onClick={() => setSelected(emptyRecipe())}>New draft</button>}
          {!admin && <div className="recipe-status-picker" role="group" aria-label={labels.filters}>
            {['validated', 'testing'].map((status) => (
              <button key={status} aria-pressed={status === activeStatus} onClick={() => setFilter(status)}>
                {headings[status]} <span>{counts[status]}</span>
              </button>
            ))}
          </div>}
          {statuses.map((status) => (
            <section key={status} aria-label={headings[status]}>
              {admin && <h2>{headings[status]}</h2>}
              {entries.filter((row) => row.status === status).map((row) =>
                !admin && row.source_key ? (
                  <div className="recipe-list-item recipe-legacy-card" key={row.source_key}>
                    {row.name}<small>{labels.reviewPending}</small>
                  </div>
                ) : (
                  <button className="recipe-list-item" key={row.id || row.source_key} onClick={() => open(row)}>
                    {row.name} <small>{row.source_key ? 'From catalogue' : `v${row.version}`}</small>
                  </button>
                )
              )}
              {!entries.some((row) => row.status === status) && (admin ? <p>{labels.empty}</p> :
                <div className="recipe-empty">
                  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="5" y="4" width="14" height="16" rx="2" />
                    <path d="M9 9h6m-6 4h6m-6 4h3" />
                  </svg>
                  <strong>{labels.empty}</strong>
                  <p>{status === 'testing' ? labels.emptyTesting : labels.emptyValidated}</p>
                </div>)}
            </section>
          ))}
        </>}
    </main>
  );
}

function RecipePreparation({ recipe, language, onClose }) {
  const labels = recipeLabels[language];
  const [units, setUnits] = React.useState('1');
  const [index, setIndex] = React.useState(-1);
  const [checked, setChecked] = React.useState({});
  const batch = LumaBatch.calculate(recipe, Number(units));
  const format = (quantity) => LumaBatch.format(quantity, language);
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
        <p>{labels.net} <strong>{format(batch.net)} g</strong></p>
        <p>{labels.total} <strong>{format(batch.total)} g</strong></p>
        <h3>{labels.ingredients}</h3>
        <ul>{batch.quantities.map((item, i) => <li key={i}>
          <span>{item[language]}</span><strong>{format(item.quantity)} {item.unit}</strong>
        </li>)}</ul>
      </>}
      <button className="recipe-primary" disabled={!batch} onClick={() => setIndex(0)}>{labels.begin}</button>
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

function RecipeVersionEditor({ initial, rows, onOpen, onSaved }) {
  const [form, setForm] = React.useState(initial);
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
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const changeList = (key, value) => setForm((current) =>
    ({ ...current, [key]: value, translations_reviewed: false }));
  const write = (status) => run(async () => {
    const { name, unit_weight, reference_weight, margin, ingredients, steps, translations_reviewed } = form;
    const payload = { name: name.trim(), unit_weight: unit_weight ? Number(unit_weight) : null,
      reference_weight: reference_weight ? Number(reference_weight) : null,
      margin: Number(margin), ingredients, steps, translations_reviewed, status };
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
    await onSaved();
    setMessage(`Saved as ${recipeStatusLabels[data.status]}.`);
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
  const saveAs = (status) => (event) => {
    if (!event.currentTarget.form.reportValidity()) return;
    if (status === 'testing' && (!Number(form.unit_weight) || !Number(form.reference_weight))) {
      setMessage('Enter the net and reference weights before sending this recipe for testing.');
      return;
    }
    const current = form.legacyStatus || form.status;
    if (current === 'validated' && !window.confirm('Withdraw this recipe from validated production?')) return;
    write(status);
  };
  const ingredients = [['id', 'Ingredient · Bahasa Indonesia'], ['en', 'Ingredient · English'],
    ['quantity', 'Reference quantity'], ['unit', 'Unit']];
  const steps = [['id', 'Instruction · Bahasa Indonesia'], ['en', 'Instruction · English'],
    ['safetyId', 'Safety instruction · Bahasa Indonesia'], ['safetyEn', 'Safety instruction · English']];
  const ledgerProducts = window.__LUMA_INITIAL?.products || [];
  const hasPending = rows.some((row) => row.family_id === form.family_id && ['draft', 'testing'].includes(row.status));
  return <>
    <button onClick={() => onOpen(null)}>Back to recipe versions</button>
    <h2>{form.name || 'New draft'} {form.version && <small>v{form.version}</small>}</h2>
    <p className="recipe-current-status">Status <strong>{recipeStatusLabels[form.legacyStatus || form.status]}</strong></p>
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
    <form onSubmit={(event) => {
      event.preventDefault();
      if (!editable) return;
      if (form.legacyStatus === 'validated' && !window.confirm('Withdraw this recipe from validated production?')) return;
      write(form.status);
    }}>
      <fieldset disabled={busy || !editable}>
        <label>Recipe name<input required value={form.name} onChange={(e) => change('name', e.target.value)} /></label>
        <label>Net weight per unit (g)<input type="number" min="0.000001" step="any"
          value={form.unit_weight} onChange={(e) => change('unit_weight', e.target.value)} /></label>
        <label>Weight represented by the ingredient list (g)<input type="number" min="0.000001" step="any"
          value={form.reference_weight} onChange={(e) => change('reference_weight', e.target.value)} /></label>
        <label>Manufacturing margin (%)<input required type="number" min="0" max="100" step="any"
          value={form.margin} onChange={(e) => change('margin', e.target.value)} /></label>
        <RecipeFields title="Ingredients" fields={ingredients} values={form.ingredients}
          onChange={(value) => changeList('ingredients', value)} />
        <RecipeFields title="Instructions and safety" fields={steps} values={form.steps}
          onChange={(value) => changeList('steps', value)} />
        <label className="recipe-check"><input type="checkbox" checked={form.translations_reviewed}
          onChange={(e) => change('translations_reviewed', e.target.checked)} />
          I reviewed the ingredient names, instructions and safety information in both languages.
        </label>
      </fieldset>
      {editable && <nav>
        <button type="submit" disabled={busy}>{form.legacyStatus === 'validated' ? 'Move to Draft' : form.status === 'draft' ? 'Save draft' : 'Save test version'}</button>
        {form.status === 'testing' && <button type="button" disabled={busy} onClick={saveAs('draft')}>Move to Draft</button>}
        <button type="button" className="recipe-primary" disabled={busy || !form.translations_reviewed}
          onClick={saveAs(form.status === 'draft' ? 'testing' : 'validated')}>
          {form.status === 'draft' ? 'Send to To test' : 'Validate for production'}
        </button>
        {form.status === 'draft' && !form.translations_reviewed && <p>Review both languages to make this recipe available for testing.</p>}
      </nav>}
      {form.status === 'validated' && <>
        <nav>
          <button type="button" disabled={busy || hasPending} onClick={saveAs('testing')}>Move to To test</button>
          <button type="button" disabled={busy || hasPending} onClick={saveAs('draft')}>Move to Draft</button>
          <button type="button" disabled={busy || hasPending} onClick={duplicate}>Create a new draft version</button>
        </nav>
        {hasPending && <p>Finish or remove the pending version before changing this validated version’s status.</p>}
      </>}
    </form>
    {form.id && <button disabled={busy} onClick={remove}>Delete version</button>}
    {form.id && form.status !== 'draft' && <section>
      <h3>Test observations</h3>
      {observations.map((item) => <p key={item.id}>{item.note}</p>)}
      <label>Observation<textarea value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <button disabled={busy || !note.trim()} onClick={addNote}>Record observation</button>
    </section>}
    {message && <p role="status">{message}</p>}
  </>;
}

function RecipeFields({ title, fields, values, onChange }) {
  const update = (index, key, value) =>
    onChange(values.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const move = (index, offset) => {
    const items = [...values];
    [items[index], items[index + offset]] = [items[index + offset], items[index]];
    onChange(items);
  };
  return <section>
    <h3>{title}</h3>
    {values.map((row, index) => <div className="recipe-field-row" key={index}>
      {fields.map(([key, label]) => <label key={key}>{label}
        {title === 'Instructions and safety'
          ? <textarea value={row[key] || ''} onChange={(e) => update(index, key, e.target.value)} />
          : <input type={key === 'quantity' ? 'number' : 'text'} step={key === 'quantity' ? 'any' : undefined}
              value={row[key] ?? ''} onChange={(e) => update(index, key,
                key === 'quantity' && e.target.value ? Number(e.target.value) : e.target.value)} />}
      </label>)}
      <nav>
        <button type="button" disabled={!index} onClick={() => move(index, -1)}>Move up</button>
        <button type="button" disabled={index === values.length - 1} onClick={() => move(index, 1)}>Move down</button>
        <button type="button" onClick={() => onChange(values.filter((_, i) => i !== index))}>Remove</button>
      </nav>
    </div>)}
    <button type="button" onClick={() => onChange([...values, {}])}>Add {title === 'Ingredients' ? 'ingredient' : 'step'}</button>
  </section>;
}
