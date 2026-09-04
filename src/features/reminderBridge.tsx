import { createRoot, type Root } from "react-dom/client";
import RemindersScreen from "./RemindersScreen";

let root: Root | null = null;
let host: HTMLDivElement | null = null;
let button: HTMLButtonElement | null = null;

function closePage(){ root?.unmount(); root=null; host?.remove(); host=null; if(button) button.style.display="block"; }
function openPage(){ if(host)return; host=document.createElement("div"); host.style.position="fixed"; host.style.inset="0"; host.style.zIndex="10000"; document.body.appendChild(host); root=createRoot(host); root.render(<RemindersScreen onClose={closePage}/>); if(button)button.style.display="none"; }

export function installReminderBridge(){
 if(document.getElementById("anp-reminder-bridge"))return;
 const marker=document.createElement("span");marker.id="anp-reminder-bridge";marker.style.display="none";document.body.appendChild(marker);
 button=document.createElement("button");button.type="button";button.textContent="یادآورها";button.setAttribute("aria-label","باز کردن یادآورها");button.className="outline-button";
 Object.assign(button.style,{position:"fixed",right:"16px",bottom:"78px",zIndex:"9998",fontFamily:"Vazirmatn,sans-serif",fontWeight:"800",fontSize:"13px",padding:"10px 14px"});
 button.onclick=openPage;document.body.appendChild(button);
}
