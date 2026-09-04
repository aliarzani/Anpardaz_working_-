import fs from 'node:fs';
const path='src/features/transferEnhancements.tsx';
let s=fs.readFileSync(path,'utf8');
s=s.replace('const findText=(s:string)=>Array.from(document.querySelectorAll("input,textarea,button,[role=button]")).find(e=>((e as HTMLElement).innerText||e.getAttribute("placeholder")||e.getAttribute("aria-label")||"").includes(s)) as HTMLElement|null;','const findText=(s:string)=>Array.from(document.querySelectorAll("input,textarea")).find(e=>((e as HTMLElement).getAttribute("placeholder")||e.getAttribute("aria-label")||"").includes(s)) as HTMLElement|null;');
s=s.replace('width:"42px",height:"42px"','width:"32px",height:"32px"');
s=s.replace('borderRadius:"12px",background:"rgba(0,214,176,.10)"','borderRadius:"9px",background:"rgba(0,214,176,.10)"');
s=s.replace('font-size:20px">اسکن بارکد کارت مقصد','font-size:19px">اسکن بارکد کارت مقصد");
s=s.replace('b.innerHTML="<span style=\'font-size:19px;line-height:1\'>⌗</span>"','b.innerHTML="<span style=\'font-size:17px;line-height:1\'>▣</span>"');
fs.writeFileSync(path,s);
