const assert = require('node:assert/strict');
const test = require('node:test');
const { calculate, format, forScale } = require('../lumabonga-batch.js');

const recipe = {
  unit_weight: 45,
  reference_weight: 45,
  margin: 2,
  ingredients: [{ quantity: 44.999999999 }, { quantity: 0.000000001 }],
};

test('15 units of 45 g with 2% overhead yield 688.5 g', () => {
  const batch = calculate(recipe, 15);
  assert.equal(batch.net, 675);
  assert.equal(batch.total, 688.5);
  assert.ok(Math.abs(batch.quantities[0].quantity / 44.999999999 - 15.3) < 1e-12);
  assert.ok(Math.abs(batch.quantities[1].quantity / 0.000000001 - 15.3) < 1e-12);
  assert.notEqual(format(batch.quantities[1].quantity, 'id'), '0');
  assert.notEqual(format(batch.quantities[1].quantity, 'en'), '0');
});

test('scales a reference formula independently of serving weight and accepts 0% margin', () => {
  const batch = calculate({ ...recipe, reference_weight: 90, margin: 0 }, 10);
  assert.equal(batch.total, 450);
  assert.equal(batch.quantities[0].quantity, recipe.ingredients[0].quantity * 5);
});

test('rejects fractional, zero and unsafe counts', () => {
  for (const count of [0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(calculate(recipe, count), null);
  }
});

test('weighing rounds to half grams and preserves smaller doses and drops', () => {
  const quantities = [{ quantity: 18.36, unit: 'g' }, { quantity: 0.0051, unit: 'kg' },
    { quantity: 0.2, unit: 'g' }, { quantity: 5.1, unit: 'drop' }];
  assert.deepEqual(forScale(quantities, 0.5), [{ quantity: 18.5, unit: 'g' }, { quantity: 5, unit: 'g' },
    { quantity: 0.2, unit: 'g' }, { quantity: 5.1, unit: 'drop' }]);
});
