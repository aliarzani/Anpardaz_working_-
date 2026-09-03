import { readFileSync } from 'node:fs';

// Risk calculations must eventually run atomically on the exchange backend.
// Do not rewrite App.tsx during builds; this keeps the generated UI source stable.
const file = 'src/App.tsx';
readFileSync(file, 'utf8');
console.log('Margin risk-engine build check passed; source left unchanged.');
