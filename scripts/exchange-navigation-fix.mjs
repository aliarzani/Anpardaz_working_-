import fs from 'node:fs';

// Validation-only compatibility step. Exchange navigation is implemented
// directly in src/App.tsx; this script must never mutate source.
const path = 'src/App.tsx';
const s = fs.readFileSync(path, 'utf8');

if (!s.includes("selectCoin(c.symbol);go('spot')")) {
  throw new Error('Exchange navigation source check failed: Spot route is missing.');
}

// Keep this check resilient to formatting changes in App.tsx.
if (!s.includes('<ExchangeProTrade') || !s.includes('view===\'spot\'')) {
  throw new Error('Exchange navigation source check failed: real Spot component is missing.');
}
