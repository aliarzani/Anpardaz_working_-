import fs from 'node:fs';

// Validation-only compatibility step. Exchange navigation is implemented
// directly in src/App.tsx; this script must never mutate source.
const path = 'src/App.tsx';
const s = fs.readFileSync(path, 'utf8');

// Keep validation resilient to harmless formatting changes in App.tsx.
if (!s.includes('selectCoin') || !s.includes("go('spot')")) {
  throw new Error('Exchange navigation source check failed: Spot navigation is missing.');
}

if (!s.includes('<ExchangeProTrade') || !s.includes('view===\'spot\'')) {
  throw new Error('Exchange navigation source check failed: real Spot component is missing.');
}

console.log('Exchange navigation source check passed; source left unchanged.');
