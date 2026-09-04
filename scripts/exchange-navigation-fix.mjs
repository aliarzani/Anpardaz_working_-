import fs from 'node:fs';

// Kept as a validation-only compatibility step. Exchange navigation is now
// implemented directly in src/App.tsx; this script must never mutate source.
const path = 'src/App.tsx';
const s = fs.readFileSync(path, 'utf8');

if (!s.includes("selectCoin(c.symbol);go('spot')")) {
  throw new Error('Exchange navigation source check failed: Spot route is missing.');
}

if (!s.includes("view==='spot' ? <ExchangeProTrade")) {
  throw new Error('Exchange navigation source check failed: real Spot component is missing.');
}
