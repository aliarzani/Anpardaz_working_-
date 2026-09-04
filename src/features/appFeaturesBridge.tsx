import { createRoot, type Root } from "react-dom/client";
import NotificationSettings from "./NotificationSettings";
import RemindersScreen from "./RemindersScreen";
import FinancialCenter from "./FinancialCenter";

type Feature = "notifications" | "reminders" | "finance";
let root: Root | null = null;
let host: HTMLDivElement | null = null;
let dock: HTMLDivElement | null = null;
let observer: MutationObserver | null = null;
let profileActive = false;

function closeFeature() {
  root?.unmount();
  root = null;
  host?.remove();
  host = null;
  if (dock) dock.style.display = profileActive ? "flex" : "none";
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

function textOf(el: Element) {
  return ((el as HTMLElement).innerText || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim();
}

function isProfileControl(el: Element) {
  const text = textOf(el);
  return text === "پروفایل" || text === "حساب کاربری" || text === "پروفایل کاربری" || text.includes("پروفایل");
}

function detectProfileState() {
  const controls = Array.from(document.querySelectorAll("button, [role=button], a"));
  const active = controls.some((el) => {
    if (!isProfileControl(el)) return false;
    const node = el as HTMLElement;
    return node.getAttribute("aria-current") === "page" || node.classList.contains("active") || node.classList.contains("selected") || node.dataset.active === "true";
  });
  if (active !== profileActive) {
    profileActive = active;
    if (dock && !host) dock.style.display = active ? "flex" : "none";
  }
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
    #anp-feature-dock{position:fixed;right:14px;left:14px;bottom:78px;z-index:9997;display:none;align-items:center;gap:7px;direction:rtl;padding:8px;border:1px solid rgba(0,214,176,.16);border-radius:14px;background:var(--card-bg,#071a24);box-shadow:0 8px 24px rgba(0,0,0,.16);font-family:Vazirmatn,sans-serif}
    #anp-feature-dock .feature-label{font-size:11px;color:var(--text-muted,#8ca0aa);font-weight:600;padding:0 5px;white-space:nowrap}
    #anp-feature-dock button{border:1px solid rgba(255,255,255,.06);background:transparent;color:var(--text-primary,#fff);font:700 12px Vazirmatn,sans-serif;padding:8px 10px;border-radius:9px;white-space:nowrap;cursor:pointer;flex:1}
    #anp-feature-dock button:hover,#anp-feature-dock button:focus-visible{background:rgba(0,214,176,.08);outline:none}
    #anp-feature-dock .primary{color:#00d6b0;border-color:rgba(0,214,176,.16)}
    @media(max-width:390px){#anp-feature-dock{right:8px;left:8px;padding:6px;gap:4px}#anp-feature-dock .feature-label{display:none}#anp-feature-dock button{padding:7px 5px;font-size:11px}}
  `;
  document.head.appendChild(style);

  dock = document.createElement("div");
  dock.id = "anp-feature-dock";
  dock.setAttribute("aria-label", "دسترسی سریع امکانات مالی");
  dock.innerHTML = `
    <span class="feature-label">دسترسی سریع</span>
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

  observer = new MutationObserver(() => detectProfileState());
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "aria-current", "data-active"] });
  window.setTimeout(detectProfileState, 0);
  window.setTimeout(detectProfileState, 300);
}
