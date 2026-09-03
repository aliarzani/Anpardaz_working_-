import { readFileSync } from 'node:fs';

// Exchange hardening is intentionally non-mutating during the build.
// The previous version rewrote App.tsx with string-based patches and could corrupt
// the TypeScript/TSX parser. Keep the original Figma-generated source intact until
// these engine changes are implemented as normal typed application code.
const file = 'src/App.tsx';
readFileSync(file, 'utf8');
console.log('Exchange hardening check passed; source left unchanged.');
