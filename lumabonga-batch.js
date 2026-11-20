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

  function scalePerUnit(recipe, count) {
    const margin = Number(recipe.margin);
    if (!Number.isSafeInteger(count) || count < 1 || !Number.isFinite(margin) || margin < 0 || margin > 100) return null;
    const factor = count * (1 + margin / 100);
    const quantities = recipe.ingredients.map((item) => ({
      ...item, quantity: Number(item.quantity) * factor,
    }));
    return quantities.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)
      ? null : { quantities };
  }

  const batch = { calculate, format, scalePerUnit };
  if (typeof module !== 'undefined') module.exports = batch;
  else root.LumaBatch = batch;
})(globalThis);
