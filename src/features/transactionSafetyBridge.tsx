import { createRoot, type Root } from "react-dom/client";
import { buildTransactionSafetyMessage, detectSimilarTransaction, type TransactionCandidate } from "./transactionSafety";

type SafetyModalProps = {
  status: "duplicate" | "pending";
  match?: TransactionCandidate & { ageMs?: number };
  onContinue: () => void;
  onClose: () => void;
};

function SafetyModal({ status, match, onContinue, onClose }: SafetyModalProps) {
  const pending = status === "pending";
  const message = buildTransactionSafetyMessage({ status, match: match as never });
  const previous = match?.createdAt ? new Date(match.createdAt) : null;
  const previousLabel = previous && Number.isFinite(previous.getTime())
    ? new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(previous)
    : "";

  return (
    <div dir="rtl" style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,.62)", fontFamily: "Vazirmatn, sans-serif" }} onClick={onClose}>
      <div role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} style={{ width: "min(430px,100%)", background: "var(--card-bg2,#131e27)", color: "var(--text-primary,#fff)", border: "1px solid var(--border-color,rgba(255,255,255,.1))", borderRadius: 20, padding: 20, boxShadow: "0 24px 70px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, display: "grid", placeItems: "center", background: pending ? "rgba(245,166,35,.14)" : "rgba(0,214,176,.13)", color: pending ? "#f5a623" : "#00D6B0", fontSize: 21, fontWeight: 800 }}>{pending ? "!" : "✓"}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{pending ? "انتقال مشابه در حال بررسی است" : "تراکنش مشابه پیدا شد"}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted,#8b98a5)", marginTop: 3 }}>برای جلوگیری از پرداخت دوباره</div>
          </div>
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 14, lineHeight: 1.9 }}>{message}</p>
        {match && (
          <div style={{ background: "var(--input-bg,rgba(255,255,255,.04))", border: "1px solid var(--border-color,rgba(255,255,255,.08))", borderRadius: 14, padding: "12px 14px", marginBottom: 16, fontSize: 12, lineHeight: 1.9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><span>مبلغ</span><b>{new Intl.NumberFormat("fa-IR").format(match.amount)} ریال</b></div>
            {previousLabel && <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><span>زمان تراکنش قبلی</span><b>{previousLabel}</b></div>}
            {match.destinationCard && <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><span>مقصد</span><b dir="ltr">•••• {match.destinationCard.replace(/\D/g, "").slice(-4)}</b></div>}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
          <button type="button" onClick={onContinue} style={{ border: 0, borderRadius: 12, padding: "12px 10px", background: "var(--accent,#00D6B0)", color: "#001b17", fontFamily: "Vazirmatn", fontWeight: 800, cursor: "pointer" }}>ادامه انتقال</button>
          <button type="button" onClick={onClose} style={{ border: "1px solid var(--border-color,rgba(255,255,255,.12))", borderRadius: 12, padding: "12px 10px", background: "transparent", color: "var(--text-primary,#fff)", fontFamily: "Vazirmatn", fontWeight: 700, cursor: "pointer" }}>بررسی تراکنش قبلی</button>
        </div>
      </div>
    </div>
  );
}

function findTransferContinueButton(target: Element | null): HTMLButtonElement | null {
  const button = target?.closest("button") as HTMLButtonElement | null;
  if (!button) return null;
  const text = (button.textContent || "").replace(/\s+/g, " ").trim();
  if (!/^(ادامه|انتقال)$/.test(text)) return null;
  const screen = button.closest(".subscreen");
  if (!screen || !(screen.textContent || "").includes("انتقال وجه")) return null;
  return button;
}

function readDigits(value: string) {
  const map: Record<string, string> = { "۰":"0","۱":"1","۲":"2","۳":"3","۴":"4","۵":"5","۶":"6","۷":"7","۸":"8","۹":"9" };
  return value.replace(/[۰-۹]/g, c => map[c] || c).replace(/\D/g, "");
}

function readTransferCandidate(screen: Element): TransactionCandidate | null {
  const inputs = Array.from(screen.querySelectorAll("input"));
  const values = inputs.map(i => readDigits(i.value || ""));
  const sixteen = values.find(v => v.length === 16);
  const numericAmounts = values.filter(v => v.length > 0 && v.length < 16).map(v => Number(v)).filter(Number.isFinite);
  const amount = numericAmounts.find(v => v > 0) || 0;
  if (!sixteen || !amount) return null;
  const cards = Array.from(screen.querySelectorAll("button")).map(b => readDigits(b.textContent || "")).filter(v => v.length === 16);
  const source = cards.find(v => v !== sixteen) || undefined;
  return { sourceCard: source, destinationCard: sixteen, amount, createdAt: new Date().toISOString(), status: "done" };
}

function mountSafety(props: SafetyModalProps) {
  const host = document.createElement("div");
  host.dataset.anpSafetyModal = "true";
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const close = () => { root.unmount(); host.remove(); };
  root.render(<SafetyModal {...props} onClose={close} onContinue={() => { close(); props.onContinue(); }} />);
}

export function installTransactionSafetyBridge() {
  const handler = (event: MouseEvent) => {
    const button = findTransferContinueButton(event.target as Element | null);
    if (!button || button.dataset.anpSafetyBypass === "1") return;
    const screen = button.closest(".subscreen");
    if (!screen) return;
    const candidate = readTransferCandidate(screen);
    if (!candidate) return;
    const phone = localStorage.getItem("anp_current") || "";
    let history: TransactionCandidate[] = [];
    try {
      const raw = JSON.parse(localStorage.getItem(`anp_tx_${phone}`) || "[]") as Array<Record<string, unknown>>;
      history = raw.map(tx => ({ id: String(tx.id || ""), sourceCard: String(tx.fromCard || ""), destinationCard: String(tx.toAddress || ""), amount: Number(tx.amount) || 0, createdAt: String(tx.createdAt || ""), status: tx.status === "pending" ? "pending" : tx.status === "failed" ? "failed" : "done" }));
    } catch { history = []; }
    const result = detectSimilarTransaction(candidate, history);
    if (result.status === "clear") return;
    event.preventDefault();
    event.stopPropagation();
    button.dataset.anpSafetyBlocked = "1";
    mountSafety({ status: result.status, match: result.match, onContinue: () => {
      button.dataset.anpSafetyBypass = "1";
      button.click();
      window.setTimeout(() => delete button.dataset.anpSafetyBypass, 0);
    }, onClose: () => undefined });
  };
  document.addEventListener("click", handler, true);
}
