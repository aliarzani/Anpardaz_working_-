import { BrowserMultiFormatReader } from "@zxing/browser";
import { Clipboard } from "@capacitor/clipboard";

let installed = false;
let overlay: HTMLElement | null = null;
let stop: (() => void) | null = null;

const valueOf = (el: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set;
  setter ? setter.call(el, value) : (el.value = value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.focus();
};

function targetFor(button: HTMLElement) {
  let p: HTMLElement | null = button;
  for (let i = 0; i < 10 && p; i++, p = p.parentElement) {
    const input = p.querySelector("input:not([type='hidden']),textarea") as HTMLInputElement | HTMLTextAreaElement | null;
    if (input) return input;
  }
  return document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement
    ? document.activeElement : null;
}

async function clipboardText() {
  try { const r = await Clipboard.read(); if (r.value?.trim()) return r.value.trim(); } catch {}
  try { return (await navigator.clipboard?.readText())?.trim() || ""; } catch { return ""; }
}

function message(text: string) {
  document.getElementById("anp-device-toast")?.remove();
  const el = document.createElement("div");
  el.id = "anp-device-toast"; el.dir = "rtl"; el.textContent = text;
  el.style.cssText = "position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:100006;background:#061a22;color:#fff;border:1px solid rgba(0,214,176,.5);border-radius:14px;padding:11px 17px;font:700 12px Vazirmatn,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.35);pointer-events:none";
  document.body.appendChild(el); setTimeout(() => el.remove(), 1700);
}

async function paste(button: HTMLElement) {
  const input = targetFor(button);
  if (!input) return message("فیلد کد پیدا نشد");
  const text = await clipboardText();
  if (!text) return message("متنی برای چسباندن در کلیپ‌بورد نیست");
  const meta = `${input.placeholder} ${input.getAttribute("aria-label") || ""}`;
  const code = /کد|otp|authenticator|رمز|پویا|تأیید|تایید/i.test(meta);
  const value = code ? text.replace(/\D/g, "").slice(0, 6) : text;
  if (!value) return message("مقدار مناسب برای این فیلد در کلیپ‌بورد نیست");
  valueOf(input, value);
  const old = button.innerHTML; button.innerHTML = "✓";
  setTimeout(() => { if (button.isConnected) button.innerHTML = old; }, 900);
}

function close() {
  try { stop?.(); } catch {}
  stop = null; overlay?.remove(); overlay = null;
}

async function scan(button: HTMLElement) {
  close();
  const target = targetFor(button);
  if (!target) return message("فیلد مقصد پیدا نشد");
  const label = `${target.placeholder} ${target.getAttribute("aria-label") || ""}`;
  const card = /کارت|شماره کارت/i.test(label);

  const root = document.createElement("div");
  root.dir = "rtl";
  root.style.cssText = "position:fixed;inset:0;z-index:100004;background:#020e18;color:#fff;font-family:Vazirmatn,sans-serif;display:flex;flex-direction:column;align-items:center;overflow:hidden";
  root.innerHTML = `<header style="width:100%;box-sizing:border-box;padding:calc(env(safe-area-inset-top,0px) + 14px) 16px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(0,214,176,.12)"><button data-close type="button" style="border:0;border-radius:12px;padding:9px 15px;background:rgba(255,255,255,.08);color:#fff;font:700 13px Vazirmatn">بستن</button><b>آن پرداز</b><span style="width:55px"></span></header><div style="margin-top:30px;text-align:center"><strong style="font-size:19px">${card ? "اسکن بارکد کارت مقصد" : "اسکن آدرس ارز دیجیتال"}</strong><p style="font-size:12px;color:#8fa2ad;margin-top:7px">اپلیکیشن آن پرداز</p></div><div style="position:relative;width:min(82vw,340px);aspect-ratio:1;margin-top:26px;border:2px solid #00d6b0;border-radius:26px;overflow:hidden;background:#000;box-shadow:0 0 45px rgba(0,214,176,.18)"><video data-video autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;display:block;background:#000"></video><div style="position:absolute;inset:24px;border:2px solid rgba(0,214,176,.85);border-radius:18px;pointer-events:none"></div><div style="position:absolute;left:12%;right:12%;top:50%;height:2px;background:#00d6b0;box-shadow:0 0 12px #00d6b0;pointer-events:none"></div></div><p data-status style="font-size:12px;color:#8fa2ad;margin:20px 24px;text-align:center">در حال فعال‌سازی دوربین...</p>`;
  document.body.appendChild(root); overlay = root;
  root.querySelector<HTMLButtonElement>("[data-close]")!.onclick = close;
  const video = root.querySelector<HTMLVideoElement>("[data-video]")!;
  const status = root.querySelector<HTMLElement>("[data-status]")!;

  try {
    const reader = new BrowserMultiFormatReader();
    let finished = false;
    const constraints = { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false };
    const controls = await reader.decodeFromConstraints(constraints, video, result => {
      if (finished || !result || overlay !== root) return;
      const raw = result.getText().trim();
      const value = card ? raw.replace(/\D/g, "").slice(0, 16) : raw.replace(/^(bitcoin|ethereum|tron|bnb|litecoin):?/i, "").split("?")[0].trim();
      if ((card && value.length !== 16) || (!card && value.length < 8)) { status.textContent = card ? "شماره کارت باید ۱۶ رقمی باشد." : "آدرس شناسایی‌شده معتبر نیست."; return; }
      finished = true; valueOf(target, value); status.textContent = "با موفقیت شناسایی شد";
      message(card ? "شماره کارت مقصد وارد شد" : "آدرس مقصد وارد شد");
      try { controls.stop(); } catch {} setTimeout(close, 350);
    });
    stop = () => { try { controls.stop(); } catch {} };
    status.textContent = "دوربین فعال است؛ کد را داخل کادر قرار دهید.";
  } catch (err) {
    try { stop?.(); } catch {} stop = null;
    const name = err instanceof DOMException ? err.name : "";
    status.textContent = name === "NotAllowedError" ? "مجوز دوربین رد شده است؛ دسترسی دوربین آن پرداز را فعال کنید." : name === "NotFoundError" ? "دوربین گوشی پیدا نشد." : "دوربین فعال نشد؛ دوباره تلاش کنید.";
  }
}

export function installExchangeDeviceFixesV2() {
  if (installed) return;
  installed = true;
  document.addEventListener("click", event => {
    const button = (event.target as HTMLElement | null)?.closest("button") as HTMLButtonElement | null;
    if (!button) return;
    const text = (button.innerText || button.textContent || "").trim();
    if (/چسباندن|paste/i.test(text)) { event.preventDefault(); event.stopImmediatePropagation(); void paste(button); return; }
    if (/اسکن/i.test(text)) { event.preventDefault(); event.stopImmediatePropagation(); void scan(button); }
  }, true);
}
