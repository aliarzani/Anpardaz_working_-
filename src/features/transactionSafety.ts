export type TransactionSafetyStatus = "clear" | "duplicate" | "pending";

export interface TransactionCandidate {
  id?: string;
  sourceCard?: string;
  destinationCard?: string;
  amount: number;
  createdAt?: string;
  status?: "pending" | "done" | "failed";
}

export interface TransactionSafetyMatch extends TransactionCandidate {
  matchedOn: string[];
  ageMs: number;
}

export interface TransactionSafetyResult {
  status: TransactionSafetyStatus;
  match?: TransactionSafetyMatch;
}

const DEFAULT_WINDOW_MS = 2 * 60 * 1000;
const DEFAULT_AMOUNT_TOLERANCE = 0;

function normalizeCard(value?: string) {
  return (value ?? "").replace(/\D/g, "");
}

function normalizeTimestamp(value?: string) {
  if (!value) return NaN;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function sameCard(a?: string, b?: string) {
  const left = normalizeCard(a);
  const right = normalizeCard(b);
  return !!left && !!right && left === right;
}

function sameAmount(a: number, b: number, tolerance: number) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= tolerance;
}

/**
 * Finds a recent transaction that could be the same transfer.
 * This is deliberately a client-side UX guard only; the backend must enforce
 * idempotency and balance reservation atomically before a real-money transfer.
 */
export function detectSimilarTransaction(
  candidate: TransactionCandidate,
  history: TransactionCandidate[],
  options: { windowMs?: number; amountTolerance?: number } = {},
): TransactionSafetyResult {
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const amountTolerance = options.amountTolerance ?? DEFAULT_AMOUNT_TOLERANCE;
  const now = normalizeTimestamp(candidate.createdAt) || Date.now();

  let best: TransactionSafetyMatch | undefined;

  for (const tx of history) {
    if (candidate.id && tx.id && candidate.id === tx.id) continue;
    if (tx.status !== "pending" && tx.status !== "done") continue;

    const txTime = normalizeTimestamp(tx.createdAt);
    if (!Number.isFinite(txTime)) continue;
    const ageMs = Math.abs(now - txTime);
    if (ageMs > windowMs) continue;

    const matchedOn: string[] = [];
    if (sameCard(candidate.sourceCard, tx.sourceCard)) matchedOn.push("sourceCard");
    if (sameCard(candidate.destinationCard, tx.destinationCard)) matchedOn.push("destinationCard");
    if (sameAmount(candidate.amount, tx.amount, amountTolerance)) matchedOn.push("amount");

    // A useful duplicate requires the amount plus the known card endpoints.
    // When an endpoint is unavailable, amount alone is intentionally not enough.
    const sourceKnown = !!normalizeCard(candidate.sourceCard) && !!normalizeCard(tx.sourceCard);
    const destinationKnown = !!normalizeCard(candidate.destinationCard) && !!normalizeCard(tx.destinationCard);
    const endpointsMatch =
      (sourceKnown && destinationKnown && matchedOn.includes("sourceCard") && matchedOn.includes("destinationCard")) ||
      (sourceKnown && !destinationKnown && matchedOn.includes("sourceCard")) ||
      (!sourceKnown && destinationKnown && matchedOn.includes("destinationCard"));

    if (!matchedOn.includes("amount") || !endpointsMatch) continue;

    const match = { ...tx, matchedOn, ageMs };
    if (!best || ageMs < best.ageMs) best = match;
  }

  if (!best) return { status: "clear" };
  return { status: best.status === "pending" ? "pending" : "duplicate", match: best };
}

export function buildTransactionSafetyMessage(result: TransactionSafetyResult) {
  if (result.status === "pending") {
    return "این انتقال هنوز در حال بررسی است. برای جلوگیری از پرداخت دوباره، بهتر است تا مشخص شدن نتیجه صبر کنید.";
  }
  if (result.status === "duplicate") {
    return "به نظر می‌رسد این پرداخت را قبلاً انجام داده‌اید.";
  }
  return "";
}

export const TRANSACTION_SAFETY_WINDOW_MS = DEFAULT_WINDOW_MS;
