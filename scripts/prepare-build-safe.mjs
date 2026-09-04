import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Run the existing build preparation without the exchange replacement that
// currently produces invalid TSX in CI. The source remains untouched; this
// wrapper removes only that one transformation before executing the script.
const sourcePath = 'scripts/prepare-build.mjs';
const original = readFileSync(sourcePath, 'utf8');
const lines = original.split('\n');
const filtered = lines.filter((line) => !line.includes('const toggleFavorite=()=>onToggleFavorite(asset);const place=()=>qty&&setConfirm(true);'));
const tempPath = '.prepare-build-ci.mjs';
writeFileSync(tempPath, filtered.join('\n'));
try {
  await import(pathToFileURL(tempPath).href + `?t=${Date.now()}`);
} finally {
  try { writeFileSync(tempPath, ''); } catch {}
}
