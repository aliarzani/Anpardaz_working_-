import fs from 'node:fs';

const path = 'src/App.tsx';
let s = fs.readFileSync(path, 'utf8');

// Pair cards on the exchange home screen should open the normal Spot order-book view.
s = s.replace(
  "onClick={()=>{selectCoin(c.symbol);go('instant')}}><PairLogos base={c.symbol} baseSize={28} quoteSize={16}/><b>{c.fa}</b><small>{c.symbol}/TMN</small>",
  "onClick={()=>{selectCoin(c.symbol);go('spot')}}><PairLogos base={c.symbol} baseSize={28} quoteSize={16}/><b>{c.fa}</b><small>{c.symbol}/TMN</small>",
);

// A market-row tap should open Spot with the order book directly.
s = s.replace(
  "onClick={()=>{selectCoin(c.symbol);go('trade-type-select')}}><span className={favorite.includes(c.symbol)?\"star on\":\"star\"}",
  "onClick={()=>{selectCoin(c.symbol);go('spot')}}><span className={favorite.includes(c.symbol)?\"star on\":\"star\"}",
);

fs.writeFileSync(path, s);
