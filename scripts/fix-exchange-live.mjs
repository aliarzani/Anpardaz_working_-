import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/App.tsx';
let src = readFileSync(file, 'utf8');

// Keep live-rate implementation in prepare-build.mjs. This pass only
// normalizes legacy spot-order pair labels and must never rewrite functions.
src = src.replace(/pair:`\$\{asset\}\/USDT`/g, 'pair:`${asset}/TOMAN`');

writeFileSync(file, src);
