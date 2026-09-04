import { BrowserMultiFormatReader } from "@zxing/browser";
import { Clipboard } from "@capacitor/clipboard";

let installed = false;
let activeOverlay: HTMLElement | null = null;

function setInputValue(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value")?.set;
  setter?.call(input, value);
  if (!setter) input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.focus();
}

function nearbyInput(button: HTMLElement): HTMLInputElement | HTMLTextAreaElement | null {
  const field = button.closest(".field-input, .wcs-otp-field, label, div");
  return (field?.querySelector("input:not([type='hidden']),textarea") || document.querySelector("input:focus,textarea:focus")) as HTMLInputElement | HTMLTextAreaElement | null;
}

async function readClipboardText() {
  try {
    const native = await Clipboard.read();
    if (native.value?.trim()) return native.value.trim();
  } catch {}
  try {
    return (await navigator.clipboard?.readText())?.trim() || "";
  } catch {
    return "";
  }
}

function showToast(text: string) {
  const old = document.getElementById("anp-device-toast");
  old?.remove();
  const el = document.createElement("div");
  el.id = "anp-device-toast";
  el.textContent = text;
  el.dir = "rtl";
  el.style.cssText = "position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:100005;background:rgba(0,20,30,.94);color:#fff;border:1px solid rgba(0,214,176,.45);border-radius:14px;padding:10px 16px;font:700 12px Vazirmatn,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.35);pointer-events:none";
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 1500);
}

async function pasteInto(button: HTMLElement) {
  const input = nearbyInput(button);
  if (!input) return;
  const value = await readClipboardText();
  if (!value) {
    showToast("متنی برای چسباندن در کلیپ‌بورد پیدا نشد");
    return;
  }
  const numeric = /کد|otp|authenticator|رمز|پویا/i.test(`${input.getAttribute("aria-label") || ""} ${input.getAttribute("placeholder") || ""}`);
  const finalValue = numeric ? value.replace(/\D/g, "").slice(0, 6) : value;
  if (!finalValue) {
    showToast("مقدار مناسب برای این فیلد در کلیپ‌بورد نیست");
    return;
  }
  setInputValue(input, finalValue);
  const original = button.textContent || "چسباندن";
  button.textContent = "✓ چسبانده شد";
  window.setTimeout(() => { if (button.isConnected) button.textContent = original; }, 1200);
}

function closeScanner() {
  activeOverlay?.remove();
  activeOverlay = null;
}

function openScanner(button: HTMLElement) {
  closeScanner();
  const target = nearbyInput(button);
  if (!target) return;

  const overlay = document.createElement("div");
  overlay.dir = "rtl";
  overlay.style.cssText = "position:fixed;inset:0;z-index:100004;background:#020e18;color:#fff;font-family:Vazirmatn,sans-serif;display:flex;flex-direction:column;align-items:center;overflow:hidden";
  overlay.innerHTML = `
    <div style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:calc(env(safe-area-inset-top,0px) + 14px) 16px 12px;box-sizing:border-box;background:rgba(0,0,0,.28);border-bottom:1px solid rgba(0,214,176,.12)">
      <button data-close style="border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;border-radius:12px;padding:9px 16px;font:700 13px Vazirmatn">بستن</button>
      <b style="font-size:15px">آن پرداز</b>
      <span style="width:64px"></span>
    </div>
    <div style="margin-top:34px;text-align:center;padding:0 22px">
      <strong data-title style="display:block;font-size:18px">اسکن کد در حال انجام است</strong>
      <span style="display:block;color:rgba(255,255,255,.58);font-size:12px;margin-top:7px">کد را داخل کادر روبروی دوربین قرار دهید</span>
    </div>
    <div data-camera style="position:relative;width:min(82vw,340px);aspect-ratio:1;margin-top:28px;border:2px solid #00d6b0;border-radius:26px;overflow:hidden;background:#000;box-shadow:0 0 42px rgba(0,214,176,.15)">
      <video data-video autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;display:block"></video>
      <div style="position:absolute;inset:22px;border:2px solid rgba(0,214,176,.85);border-radius:18px;pointer-events:none"></div>
      <div style="position:absolute;left:12%;right:12%;top:50%;height:2px;background:#00d6b0;box-shadow:0 0 12px #00d6b0;animation:anpScanLine 1.35s ease-in-out infinite"></div>
    </div>
    <p data-status style="color:rgba(255,255,255,.58);font-size:12px;margin:22px 24px;text-align:center;line-height:1.8">در حال فعال‌سازی دوربین...</p>
  `;
  const style = document.createElement("style");
  style.textContent = "@keyframes anpScanLine{0%,100%{transform:translateY(-85px);opacity:.35}50%{transform:translateY(85px);opacity:1}}";
  overlay.appendChild(style);
  document.body.appendChild(overlay);
  activeOverlay = overlay;
  overlay.querySelector<HTMLButtonElement>("[data-close]")!.onclick = closeScanner;

  const video = overlay.querySelector<HTMLVideoElement>("[data-video]")!;
  const status = overlay.querySelector<HTMLElement>("[data-status]")!;
  const title = overlay.querySelector<HTMLElement>("[data-title]")!;
  const reader = new BrowserMultiFormatReader();
  let controls: { stop: () => void } | undefined;
  let finished = false;

  const finish = (raw: string) => {
    if (finished) return;
    finished = true;
    controls?.stop();
    const isCard = /کارت|شماره کارت/.test(`${target.getAttribute("placeholder") || ""} ${target.getAttribute("aria-label") || ""}`);
    const clean = isCard ? raw.replace(/\D/g, "").slice(0, 16) : raw.replace(/^(bitcoin|ethereum|litecoin|ripple|tron|bnb):?/i, "").split("?")[0].trim();
    if ((isCard && clean.length !== 16) || (!isCard && clean.length < 8)) {
      finished = false;
      status.textContent = isCard ? "کد شناسایی شد اما شماره کارت ۱۶ رقمی نیست." : "کد شناسایی‌شده معتبر نیست.";
      return;
    }
    setInputValue(target, clean);
    showToast(isCard ? "شماره کارت مقصد وارد شد" : "آدرس مقصد وارد شد");
    window.setTimeout(closeScanner, 350);
  };

  reader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } }, video, (result, error) => {
    if (result) finish(result.getText());
    else if (error && !finished) status.textContent = "دوربین فعال است؛ کد را داخل کادر قرار دهید.";
  }).then(c => { controls = c; status.textContent = "دوربین فعال است؛ کد را داخل کادر قرار دهید."; })
    .catch(() => {
      title.textContent = "دسترسی به دوربین ممکن نشد";
      status.textContent = "مجوز دوربین را برای آن‌پرداز فعال کنید و دوباره تلاش کنید.";
    });
}

export function installExchangeDeviceFixes() {
  if (installed) return;
  installed = true;
  document.addEventListener("click", event => {
    const el = event.target as HTMLElement | null;
    const button = el?.closest("button") as HTMLButtonElement | null;
    if (!button) return;
    const text = (button.innerText || button.textContent || "").trim();
    if (text === "چسباندن") {
      event.preventDefault();
      event.stopImmediatePropagation();
      void pasteInto(button);
      return;
    }
    if (text.includes("اسکن") && /اسکن|scan/i.test(text)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openScanner(button);
    }
  }, true);
}
