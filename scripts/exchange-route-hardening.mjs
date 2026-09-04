import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");
let source = fs.readFileSync(appPath, "utf8");
const before = source;

// Home/market entry points historically used direct Spot/Margin routes. Those
// routes can render the heavy trading screen before the selected market/display
// context exists. The existing trade selector is the safe entry point and keeps
// the real Spot/Margin components intact.
const replacements = [
  [/(go\(\s*["']spot["']\s*\))/g, 'go("trade-display-select")'],
  [/(go\(\s*["']margin["']\s*\))/g, 'go("trade-display-select")'],
];

for (const [pattern, replacement] of replacements) {
  source = source.replace(pattern, replacement);
}

if (source !== before) {
  fs.writeFileSync(appPath, source);
  console.log("[exchange-route-hardening] normalized direct Spot/Margin entries to trade-display-select");
} else {
  console.log("[exchange-route-hardening] no direct Spot/Margin entries required normalization");
}
