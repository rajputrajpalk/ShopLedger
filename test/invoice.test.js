'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, price, qty, hsn, gstRate) {
  return { name, sku: name.toUpperCase().replace(/\s+/g, '-'), price, qty, hsn, gstRate };
}

function compareOrder(id, items, coupon) {
  const order = { id, items, coupon };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(items, coupon);
  return { invoiceFigures, checkoutFigures };
}

test('Invoice matches checkout slabs and capped discount before tax', () => {
  const items = [
    item('Rice', 1000, 1, '1006'),
    item('Ghee', 1240, 1, '0405')
  ];
  const { invoiceFigures, checkoutFigures } = compareOrder(1004, items, 'SAVE10');

  assert.deepEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total
  }, {
    subtotal: checkoutFigures.subtotal,
    discount: checkoutFigures.discount,
    tax: checkoutFigures.tax,
    cgst: checkoutFigures.cgst,
    sgst: checkoutFigures.sgst,
    total: checkoutFigures.total
  });
  assert.deepEqual(invoiceFigures.rows.map(row => ({ gstPercent: row.gstPercent, lineTax: row.lineTax })), [
    { gstPercent: 5, lineTax: 46.65 },
    { gstPercent: 12, lineTax: 138.84 }
  ]);
});

test('CURRENT BEHAVIOUR: #1001 mixed 5% and 12% items without a coupon', () => {
  const items = [
    item('Rice', 640, 1, '1006', 5),
    item('Ghee', 450, 1, '0405', 12)
  ];
  const { invoiceFigures, checkoutFigures } = compareOrder(1001, items, '');

  assert.deepEqual(invoiceFigures, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'Ghee', sku: 'GHEE', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  });
  assert.equal(checkoutFigures.subtotal, 1090);
  assert.equal(checkoutFigures.tax, 86);
  assert.equal(checkoutFigures.total, 1176);
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 invoice uses checkout discount and post-discount tax', () => {
  const items = [item('Rice', 1000, 1, '1006', 5)];
  const { invoiceFigures, checkoutFigures } = compareOrder(1002, items, 'SAVE10');

  assert.equal(invoiceFigures.subtotal, 1000);
  assert.equal(invoiceFigures.discount, 100);
  assert.equal(invoiceFigures.tax, 45);
  assert.equal(invoiceFigures.cgst, 22.5);
  assert.equal(invoiceFigures.sgst, 22.5);
  assert.equal(invoiceFigures.total, 945);
  assert.equal(invoiceFigures.rows[0].gstPercent, 5);
  assert.equal(invoiceFigures.rows[0].lineTax, 45);
  assert.equal(checkoutFigures.discount, 100);
  assert.equal(checkoutFigures.tax, 45);
  assert.equal(checkoutFigures.total, 945);
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 invoice applies ₹150 cap before tax on ₹2,240 subtotal', () => {
  const items = [item('Ghee', 2240, 1, '0405', 12)];
  const { invoiceFigures, checkoutFigures } = compareOrder(1004, items, 'SAVE10');

  assert.equal(invoiceFigures.subtotal, 2240);
  assert.equal(invoiceFigures.discount, 150);
  assert.equal(invoiceFigures.tax, 250.8);
  assert.equal(invoiceFigures.cgst, 125.4);
  assert.equal(invoiceFigures.sgst, 125.4);
  assert.equal(invoiceFigures.total, 2340.8);
  assert.equal(invoiceFigures.rows[0].lineTax, 250.8);
  assert.equal(checkoutFigures.discount, 150);
  assert.equal(checkoutFigures.tax, 250.8);
  assert.equal(checkoutFigures.total, 2340.8);
});

test('CURRENT BEHAVIOUR: #1008 all 18% items without a coupon match checkout', () => {
  const items = [item('Tea', 140, 2, '0902', 18)];
  const { invoiceFigures, checkoutFigures } = compareOrder(1008, items, '');

  assert.equal(invoiceFigures.subtotal, 280);
  assert.equal(invoiceFigures.discount, 0);
  assert.equal(invoiceFigures.tax, 50.4);
  assert.equal(invoiceFigures.cgst, 25.2);
  assert.equal(invoiceFigures.sgst, 25.2);
  assert.equal(invoiceFigures.total, 330.4);
  assert.equal(invoiceFigures.rows[0].gstPercent, 18);
  assert.equal(checkoutFigures.tax, 50.4);
  assert.equal(checkoutFigures.total, 330.4);
});
