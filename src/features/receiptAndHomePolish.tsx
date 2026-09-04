function isCashbackPage() {
  return /بازگشت\s*هزینه/.test(document.body?.innerText || "");
}

function copyText(value: string) {
  if (!value) return Promise.resolve(false);
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value).then(() => true).catch(() => fallbackCopy(value));
  return fallbackCopy(value);
}

function fallbackCopy(value: string) {
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return Promise.resolve(ok);
  } catch {
    return Promise.resolve(false);
  }
}

function receiptRoot() {
  const hit = Array.from(document.querySelectorAll("body *")).find((e) =>
    /تراکنش\s+با\s+موفقیت\s+تکمیل\s+شد/.test((e as HTMLElement).innerText || ""),
  ) as HTMLElement | undefined;
  if (!hit) return null;
  let node: HTMLElement | null = hit;
  for (let i = 0; i < 7 && node?.parentElement; i++) {
    const r = node.getBoundingClientRect();
    if (r.width > window.innerWidth * .65 && r.height > 300) node = node.parentElement;
    else break;
  }
  return node || hit;
}

function addReceiptCopies() {
  const root = receiptRoot();
  if (!root || root.dataset.anpReceiptCopies === "1") return;
  root.dataset.anpReceiptCopies = "1";
  root.classList.add("anp-fast-receipt");

  const labels = ["تاریخ و ساعت", "شناسه تراکنش", "توضیحات", "مبلغ", "شماره کارت", "شماره موبایل", "شماره پیگیری", "کارمزد", "وضعیت"];
  const labelEls = Array.from(root.querySelectorAll("div,span,p,td,strong,b")).filter((e) => labels.some((x) => (e.textContent || "").trim() === x)) as HTMLElement[];
  labelEls.forEach((label) => {
    let row: HTMLElement | null = label.parentElement;
    for (let i = 0; i < 3 && row; i++, row = row.parentElement) {
      const text = (row.innerText || "").trim();
      if (text.length > (label.innerText || "").trim().length && text.length < 240) break;
    }
    if (!row || row.querySelector(".anp-row-copy")) return;
    const value = (row.innerText || "").replace((label.innerText || "").trim(), "").replace(/^[:：\s]+/, "").trim();
    if (!value) return;
    row.style.position = row.style.position || "relative";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "anp-row-copy";
    btn.setAttribute("aria-label", `کپی ${label.innerText}`);
    btn.innerHTML = "⧉";
    btn.title = "کپی";
    btn.onclick = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const ok = await copyText(value);
      btn.innerHTML = ok ? "✓" : "!";
      window.setTimeout(() => { btn.innerHTML = "⧉"; }, 900);
    };
    row.appendChild(btn);
  });
}

function polishHomeFinance() {
  const finance = document.getElementById("anp-home-enhancements") as HTMLElement | null;
  if (finance) {
    finance.style.cssText = "grid-column:1 / -1 !important;width:100% !important;min-height:58px !important;height:auto !important;box-sizing:border-box !important;display:flex !important;flex-direction:row !important;align-items:center !important;justify-content:center !important;gap:10px !important;padding:10px 16px !important;border:1px solid rgba(0,214,176,.38) !important;background:linear-gradient(135deg,rgba(0,214,176,.16),rgba(0,214,176,.045)) !important;color:inherit !important;border-radius:18px !important;font:800 15px Vazirmatn,sans-serif !important;order:-1 !important}";
    const small = finance.querySelector("small") as HTMLElement | null;
    if (small) small.style.cssText = "font-size:11px !important;font-weight:600 !important;color:#91a9b2 !important;margin:0 !important";
    const icon = finance.querySelector("b") as HTMLElement | null;
    if (icon) icon.style.cssText = "font-size:16px !important";
  }
}

function hideFinanceOnCashback() {
  if (!isCashbackPage()) return;
  document.querySelectorAll("button,[role=button]").forEach((el) => {
    const text = ((el as HTMLElement).innerText || "").replace(/\s+/g, " ").trim();
    if (text.includes("مرکز مالی")) (el as HTMLElement).style.display = "none";
  });
}

function ensureReceiptStyles() {
  if (document.getElementById("anp-receipt-home-polish")) return;
  const style = document.createElement("style");
  style.id = "anp-receipt-home-polish";
  style.textContent = `
    .anp-fast-receipt *, .anp-fast-receipt *::before, .anp-fast-receipt *::after { animation-duration: .42s !important; animation-delay: 0s !important; transition-duration: .24s !important; }
    .anp-fast-receipt .anp-row-copy { position:absolute !important; left:8px !important; top:50% !important; transform:translateY(-50%) !important; width:34px !important; height:34px !important; border-radius:10px !important; border:1px solid rgba(0,214,176,.28) !important; background:rgba(0,214,176,.08) !important; color:#00d6b0 !important; font:800 17px sans-serif !important; display:grid !important; place-items:center !important; z-index:5 !important; }
    .anp-fast-receipt .anp-row-copy:active { transform:translateY(-50%) scale(.94) !important; }
  `;
  document.head.appendChild(style);
}

export function installReceiptAndHomePolish() {
  ensureReceiptStyles();
  const run = () => {
    polishHomeFinance();
    hideFinanceOnCashback();
    addReceiptCopies();
  };
  const observer = new MutationObserver(run);
  observer.observe(document.body, { childList: true, subtree: true });
  window.setTimeout(run, 400);
  window.setTimeout(run, 1200);
  window.setTimeout(run, 2200);
}
