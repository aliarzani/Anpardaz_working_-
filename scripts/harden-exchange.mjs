import { readFileSync } from 'node:fs';

// Exchange hardening is intentionally non-mutating during the build.
// This guard prevents future build scripts from silently replacing the real
// exchange implementation with placeholders or incomplete pages.
const file = 'src/App.tsx';
const source = readFileSync(file, 'utf8');

const required = [
  'MarginChartPage',
  'ExchangeProTrade',
  'trade-type-select',
];

const missing = required.filter((token) => !source.includes(token));
if (missing.length) {
  throw new Error(`Exchange source integrity check failed. Missing: ${missing.join(', ')}`);
}

console.log('Exchange source integrity check passed; source left unchanged.');
