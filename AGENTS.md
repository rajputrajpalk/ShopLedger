# ShopLedger

## Stack
- Node.js CommonJS app using Express 4 and body-parser; browser UI uses HTML, CSS, and JavaScript.
- Persistence is a JSON file at `data/db.json`, accessed by `lib/store.js`.

## Module map
- `routes/customers.js` — lists customers and settlements; records Khata settlements.
- `routes/orders.js` — lists, fetches, creates, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons.
- `lib/dates.js` — provides today’s date, normalized date keys, and fiscal year.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reservation/release, and summary.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — customer lookup/listing, Khata charges/reversals, and settlements.
- `lib/orders.js` — adds, gets, cancels, and filters orders.
- `lib/pricing.js` — calculates order subtotal, discount, tax, and total.
- `lib/reports.js` — builds dashboard summary and compares stored totals with invoice figures.
- `lib/store.js` — reads/writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves item GST rates and splits tax into CGST and SGST.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test`.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
