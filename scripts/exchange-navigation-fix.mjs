import fs from 'node:fs';

const path = 'src/App.tsx';
let s = fs.readFileSync(path, 'utf8');

// Exchange pair cards must enter the existing display selector instead of
// mounting the heavy Spot screen without a display context.
s = s.replace(
  "onClick={()=>{selectCoin(c.symbol);go('instant')}}><PairLogos base={c.symbol} baseSize={28} quoteSize={16}/><b>{c.fa}</b><small>{c.symbol}/TMN</small>",
  "onClick={()=>{selectCoin(c.symbol);go('trade-display-select')}}><PairLogos base={c.symbol} baseSize={28} quoteSize={16}/><b>{c.fa}</b><small>{c.symbol}/TMN</small>",
);

// Market-row taps use the same selector so the user can choose Order Book or Chart.
s = s.replace(
  "onClick={()=>{selectCoin(c.symbol);go('trade-type-select')}}><span className={favorite.includes(c.symbol)?\"star on\":\"star\"}",
  "onClick={()=>{selectCoin(c.symbol);go('trade-display-select')}}><span className={favorite.includes(c.symbol)?\"star on\":\"star\"}",
);

// Any remaining direct Spot/Margin entry points are normalized to the existing
// selector. Do not replace the real Spot/Margin components themselves.
s = s.replace(/go\(\s*[\"']spot[\"']\s*\)/g, "go('trade-display-select')");
s = s.replace(/go\(\s*[\"']margin[\"']\s*\)/g, "go('trade-display-select')");

fs.writeFileSync(path, s);
