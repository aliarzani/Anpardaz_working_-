import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const replacements = [
  {
    file: 'src/index.css',
    from: /^@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Vazirmatn:[^\n]+\);\n?/m,
    to: '',
  },
  {
    file: 'src/App.tsx',
    from: '},2200);return()=>clearTimeout(t)},[]);',
    to: '},900);return()=>clearTimeout(t)},[]);',
  },
  {
    file: 'src/App.tsx',
    from: 'setTimeout(()=>setHomeSkeleton(false),5000)',
    to: 'setTimeout(()=>setHomeSkeleton(false),600)',
  },
  {
    file: 'src/App.tsx',
    from: 'useEffect(()=>{fetchUSDTRate().then(r=>{setRate(r);setRateLoading(false)});const iv=setInterval(()=>fetchUSDTRate().then(setRate),60000);return()=>clearInterval(iv)},[]);',
    to: 'useEffect(()=>{let cancelled=false;const loadRate=()=>fetchUSDTRate().then(r=>{if(!cancelled){setRate(r);setRateLoading(false)}});const first=window.setTimeout(loadRate,1200);const iv=window.setInterval(loadRate,60000);return()=>{cancelled=true;window.clearTimeout(first);window.clearInterval(iv)}},[]);',
  },
];

for (const item of replacements) {
  if (!existsSync(item.file)) continue;
  const original = readFileSync(item.file, 'utf8');
  const updated = original.replace(item.from, item.to);
  if (updated !== original) writeFileSync(item.file, updated);
}
