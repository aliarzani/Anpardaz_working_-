import { createRoot, type Root } from "react-dom/client";

const HINTS = [
  "بابت پرداخت قبض آب",
  "بابت پرداخت قبض برق",
  "بابت پرداخت قبض گاز",
  "بابت پرداخت قبض تلفن",
  "بابت پرداخت قبض اینترنت",
  "بابت پرداخت قبض همراه اول",
  "بابت پرداخت قبض ایرانسل",
  "بابت پرداخت قبض",
];

let scanRoot: Root | null = null;

function pageText() {
  return document.body?.innerText || "";
}

function isTransferPage() {
  const headings = Array.from(document.querySelectorAll("h1,h2,h3,[role='heading']"));
  return headings.some((el) => /انتقال\s*وجه/.test((el.textContent || "").trim()));
}

function findText(s: string) {
  return Array.from(document.querySelectorAll("input,textarea,button,[role=button]")).find((e) =>
    ((e as HTMLElement).innerText || e.getAttribute("placeholder") || e.getAttribute("aria-label") || "").includes(s),
  ) as HTMLElement | null;
}

function scrollFieldIntoView(el: HTMLElement) {
  const run = () => {
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    const vv = window.visualViewport;
    if (vv) {
      const rect = el.getBoundingClientRect();
      const visibleBottom = vv.height - 20;
      if (rect.bottom > visibleBottom) {
        window.scrollBy({ top: rect.bottom - visibleBottom + 24, behavior: "smooth" });
      }
    }
  };
  window.setTimeout(run, 80);
  window.setTimeout(run, 280);
  window.setTimeout(run, 600);
}

function installKeyboardScroll(el: HTMLInputElement | HTMLTextAreaElement) {
  if (el.dataset.anpKeyboardScroll) return;
  el.dataset.anpKeyboardScroll = "1";

  const sync = () => {
    const vv = window.visualViewport;
    const keyboardInset = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
    document.documentElement.style.setProperty("--anp-keyboard-inset", `${Math.round(keyboardInset)}px`);
    if (document.activeElement === el && keyboardInset > 80) scrollFieldIntoView(el);
  };

  el.addEventListener("focus", () => scrollFieldIntoView(el));
  el.addEventListener("click", () => scrollFieldIntoView(el));
  window.visualViewport?.addEventListener("resize", sync);
  window.visualViewport?.addEventListener("scroll", sync);
  window.addEventListener("resize", sync);
  sync();
}

function addDescriptionHints() {
  if (!isTransferPage()) return;

  const el = Array.from(document.querySelectorAll("textarea,input")).find((x) =>
    /توضیحات|شرح/.test(`${x.getAttribute("placeholder") || ""}${x.getAttribute("aria-label") || ""}`),
  ) as HTMLInputElement | HTMLTextAreaElement | undefined;

  if (!el) return;
  installKeyboardScroll(el);

  let box = el.parentElement?.querySelector(".anp-transfer-hints") as HTMLElement | null;
  if (!box) {
    box = document.createElement("div");
    box.className = "anp-transfer-hints";
    el.parentElement?.appendChild(box);
  }

  if (!el.dataset.anpHintsEvents) {
    el.dataset.anpHintsEvents = "1";
    const renderHints = () => {
      const query = (el.value || "").trim().replace(/\s+/g, " ");
      const tokens = query.split(" ").filter(Boolean);
      const filtered = tokens.length
        ? HINTS.filter((hint) => tokens.every((token) => hint.includes(token))).slice(0, 5)
        : HINTS.slice(0, 4);

      if (!filtered.length) {
        box!.innerHTML = "";
        box!.style.display = "none";
        return;
      }

      box!.style.display = "block";
      box!.innerHTML = `<div class="anp-hints-label">پیشنهاد توضیحات</div><div class="anp-hints-list">${filtered
        .map((text) => `<button type="button" class="anp-hint-chip">${text}</button>`)
        .join("")}</div>`;

      box!.querySelectorAll<HTMLButtonElement>(".anp-hint-chip").forEach((button) => {
        button.addEventListener("pointerdown", (event) => event.preventDefault());
        button.addEventListener("click", () => {
          el.value = button.textContent || "";
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          el.focus();
          scrollFieldIntoView(el);
        });
      });
    };

    el.addEventListener("input", renderHints);
    el.addEventListener("focus", renderHints);
    el.addEventListener("blur", () => {
      window.setTimeout(() => {
        if (!box!.contains(document.activeElement)) box!.style.display = "none";
      }, 180);
    });
    renderHints();
  }
}

function ScannerOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100001,
        background: "#020e18",
        color: "white",
        fontFamily: "Vazirmatn,sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <b style={{ fontSize: 22, marginBottom: 8 }}>آن پرداز</b>
      <strong style={{ fontSize: 17 }}>بارکد حساب بانکی مقصد را اسکن کنید</strong>
      <div
        style={{
          width: "min(78vw,330px)",
          aspectRatio: "1",
          border: "2px solid #00d6b0",
          borderRadius: 28,
          margin: "28px 0",
          boxShadow: "0 0 45px rgba(0,214,176,.18)",
        }}
      />
      <button
        onClick={onClose}
        style={{ padding: "12px 28px", border: 0, borderRadius: 14, background: "#12303b", color: "white", fontFamily: "inherit" }}
      >
        انصراف
      </button>
    </div>
  );
}

async function scan() {
  const host = document.createElement("div");
  host.id = "anp-scanner-overlay";
  document.body.appendChild(host);
  scanRoot = createRoot(host);
  const close = () => {
    scanRoot?.unmount();
    host.remove();
    scanRoot = null;
  };
  scanRoot.render(<ScannerOverlay onClose={close} />);

  try {
    const stream = await navigator.mediaDevices?.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
    if (stream) {
      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1";
      host.style.overflow = "hidden";
      host.appendChild(video);
    }
  } catch {
    // Camera permission is handled by the platform; keep the scanner UI available.
  }
}

function addScanner() {
  if (!isTransferPage()) return;
  const target = findText("کارت مقصد") || findText("شماره کارت مقصد") || findText("شماره کارت");
  if (!target || target.dataset.anpScanner) return;

  target.dataset.anpScanner = "1";
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = "▣ اسکن";
  b.setAttribute("aria-label", "اسکن بارکد حساب مقصد");
  b.style.cssText = "margin:7px 0;border:1px solid rgba(0,214,176,.35);border-radius:12px;background:rgba(0,214,176,.08);color:#00d6b0;padding:9px 13px;font:700 12px Vazirmatn,sans-serif";
  b.onclick = scan;
  target.parentElement?.appendChild(b);
}

export function installTransferEnhancements() {
  const run = () => {
    if (!isTransferPage()) return;
    addDescriptionHints();
    addScanner();
  };

  const observer = new MutationObserver(run);
  observer.observe(document.body, { childList: true, subtree: true });
  window.setTimeout(run, 350);
  window.setTimeout(run, 1000);
  void pageText();
}
