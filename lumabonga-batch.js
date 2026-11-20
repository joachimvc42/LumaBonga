(function (root) {
  function calculate(recipe, count) {
    const net = count * Number(recipe.unit_weight);
    const total = net * (1 + Number(recipe.margin) / 100);
    const factor = total / Number(recipe.reference_weight);
    if (!Number.isSafeInteger(count) || count < 1 || !Number.isFinite(factor) || factor <= 0) return null;
    const quantities = recipe.ingredients.map((item) => ({ ...item, quantity: item.quantity * factor }));
    if (quantities.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)) return null;
    return { net, total, quantities };
  }

  function format(quantity, language) {
    return new Intl.NumberFormat(language, { maximumSignificantDigits: 12 }).format(quantity);
  }

  function massSummary(ingredients) {
    let grams = 0;
    let complete = ingredients.length > 0;
    for (const item of ingredients) {
      const quantity = Number(item.quantity);
      if (!(quantity > 0) || !Number.isFinite(quantity) || !['g', 'kg'].includes(item.unit)) {
        complete = false;
      } else {
        grams += item.unit === 'kg' ? quantity * 1000 : quantity;
      }
    }
    return { grams, complete };
  }

  const batch = { calculate, format, massSummary };
  if (typeof module !== 'undefined') module.exports = batch;
  else root.LumaBatch = batch;
})(globalThis);
