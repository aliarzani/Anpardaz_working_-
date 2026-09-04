import { createRoot, type Root } from "react-dom/client";
import NotificationSettings from "./NotificationSettings";
import RemindersScreen from "./RemindersScreen";
import FinancialCenter from "./FinancialCenter";

type Feature = "notifications" | "reminders" | "finance";
let root: Root | null = null;
let host: HTMLDivElement | null = null;
let dock: HTMLDivElement | null = null;

function closeFeature() {
  root?.unmount();
  root = null;
  host?.remove();
  host = null;
  if (dock) dock.style.display = "flex";
}

function openFeature(feature: Feature) {
  if (host) return;
  host = document.createElement("div");
  host.id = "anp-feature-root";
  host.style.position = "fixed";
  host.style.inset = "0";
  host.style.zIndex = "10000";
  document.body.appendChild(host);
  root = createRoot(host);
  if (feature === "notifications") root.render(<NotificationSettings onClose={closeFeature} />);
  if (feature === "reminders") root.render(<RemindersScreen onClose={closeFeature} />);
  if (feature === "finance") root.render(<FinancialCenter onClose={closeFeature} />);
  if (dock) dock.style.display = "none";
}

function existingEntryClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (!target) return;
  const reminder = target.closest("[data-reminders-entry], button[aria-label=\"یادآورها\"], button[aria-label=\"باز کردن یادآورها\"]");
  if (reminder) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openFeature("reminders");
    return;
  }
  const notification = target.closest("button[aria-label=\"فعال یا غیرفعال کردن اعلان‌ها\"]");
  if (notification) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openFeature("notifications");
  }
}

export function installAppFeaturesBridge() {
  if (document.getElementById("anp-feature-dock")) return;
  document.addEventListener("click", existingEntryClick, true);

  const style = document.createElement("style");
  style.id = "anp-feature-dock-style";
  style.textContent = `
    #anp-feature-dock{position:fixed;right:14px;bottom:88px;z-index:9997;display:flex;gap:7px;direction:rtl;padding:6px;border:1px solid rgba(0,214,176,.22);border-radius:15px;background:var(--card-bg,#071a24);box-shadow:0 10px 28px rgba(0,0,0,.22);font-family:Vazirmatn,sans-serif}
    #anp-feature-dock button{border:0;background:transparent;color:var(--text-primary,#fff);font:700 12px Vazirmatn,sans-serif;padding:8px 9px;border-radius:10px;white-space:nowrap;cursor:pointer}
    #anp-feature-dock button:hover,#anp-feature-dock button:focus-visible{background:rgba(0,214,176,.12);outline:none}
    #anp-feature-dock .primary{color:#00d6b0}
    @media(max-width:390px){#anp-feature-dock{right:8px;left:8px;justify-content:space-around}#anp-feature-dock button{flex:1;padding-inline:5px;font-size:11px}}
  `;
  document.head.appendChild(style);

  dock = document.createElement("div");
  dock.id = "anp-feature-dock";
  dock.innerHTML = `
    <button type="button" data-feature="finance" class="primary" aria-label="مرکز مالی">مرکز مالی</button>
    <button type="button" data-feature="reminders" aria-label="یادآورها">یادآورها</button>
    <button type="button" data-feature="notifications" aria-label="تنظیمات اعلان‌ها">اعلان‌ها</button>
  `;
  dock.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest("button[data-feature]") as HTMLButtonElement | null;
    if (!button) return;
    openFeature(button.dataset.feature as Feature);
  });
  document.body.appendChild(dock);
}
