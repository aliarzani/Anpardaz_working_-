export type IncomeType = "salary" | "job1" | "job2" | "business" | "rent" | "other";
export type IncomeMode = "fixed" | "variable" | "approximate";
export type FinancialStatus = "normal" | "needs-attention" | "warning";

export interface IncomeSource {
  id: string;
  type: IncomeType;
  title: string;
  amount: number;
  mode: IncomeMode;
  minAmount?: number;
  maxAmount?: number;
  active: boolean;
}

export interface ExpenseItem {
  id?: string;
  amount: number;
  category?: string;
  date: string;
  source?: "pos" | "transfer" | "bill" | "recharge" | "exchange" | "other";
  merchant?: string;
}

export interface FinancialInsight {
  monthlyIncome: number;
  monthlyExpense: number;
  balance: number;
  expenseRatio: number;
  savingsRate: number;
  status: FinancialStatus;
  topCategories: Array<{ category: string; amount: number }>;
  expenseTrend: "up" | "down" | "stable";
  unusualExpenses: ExpenseItem[];
  recurringExpenses: Array<{ category: string; amount: number; count: number }>;
}

export function estimateMonthlyIncome(sources: IncomeSource[]) {
  return sources.filter((source) => source.active).reduce((sum, source) => {
    if (source.mode === "variable" && source.minAmount != null && source.maxAmount != null) {
      return sum + (source.minAmount + source.maxAmount) / 2;
    }
    return sum + Math.max(0, source.amount || 0);
  }, 0);
}

export function categorizeExpense(category?: string) {
  return category?.trim() || "متفرقه";
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export function buildFinancialInsight(
  incomeSources: IncomeSource[],
  expenses: ExpenseItem[],
  now = new Date(),
): FinancialInsight {
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthlyIncome = estimateMonthlyIncome(incomeSources);
  const validExpenses = expenses.filter((expense) => !Number.isNaN(new Date(expense.date).getTime()));
  const monthlyExpenses = validExpenses.filter((expense) => {
    const date = new Date(expense.date);
    return date.getFullYear() === year && date.getMonth() === month;
  });
  const monthlyExpense = monthlyExpenses.reduce((sum, item) => sum + Math.max(0, item.amount || 0), 0);
  const expenseRatio = monthlyIncome > 0 ? monthlyExpense / monthlyIncome : monthlyExpense > 0 ? 1 : 0;
  const savingsRate = monthlyIncome > 0 ? Math.max(0, (monthlyIncome - monthlyExpense) / monthlyIncome) : 0;

  const categoryTotals = new Map<string, number>();
  for (const expense of monthlyExpenses) {
    const category = categorizeExpense(expense.category);
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + Math.max(0, expense.amount || 0));
  }
  const topCategories = [...categoryTotals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const previousMonth = new Date(year, month - 1, 1);
  const previousExpense = validExpenses
    .filter((expense) => monthKey(new Date(expense.date)) === monthKey(previousMonth))
    .reduce((sum, item) => sum + Math.max(0, item.amount || 0), 0);
  const expenseTrend: FinancialInsight["expenseTrend"] =
    previousExpense === 0 ? (monthlyExpense > 0 ? "up" : "stable") : monthlyExpense > previousExpense * 1.1 ? "up" : monthlyExpense < previousExpense * 0.9 ? "down" : "stable";

  const averageExpense = monthlyExpenses.length ? monthlyExpense / monthlyExpenses.length : 0;
  const unusualExpenses = averageExpense > 0
    ? monthlyExpenses.filter((expense) => expense.amount >= averageExpense * 2.5).sort((a, b) => b.amount - a.amount).slice(0, 3)
    : [];

  const recurringMap = new Map<string, { amount: number; count: number }>();
  for (const expense of validExpenses) {
    const date = new Date(expense.date);
    const category = categorizeExpense(expense.category);
    const key = `${category}|${Math.round(expense.amount / 1000) * 1000}`;
    const item = recurringMap.get(key) ?? { amount: expense.amount, count: 0 };
    item.count += 1;
    item.amount = expense.amount;
    recurringMap.set(key, item);
  }
  const recurringExpenses = [...recurringMap.entries()]
    .filter(([, item]) => item.count >= 2)
    .map(([key, item]) => ({ category: key.split("|")[0], amount: item.amount, count: item.count }))
    .sort((a, b) => b.count - a.count || b.amount - a.amount)
    .slice(0, 5);

  let status: FinancialStatus = "normal";
  if (monthlyIncome <= 0 && monthlyExpense > 0) status = "warning";
  else if (expenseRatio >= 0.9) status = "warning";
  else if (expenseRatio >= 0.75 || savingsRate < 0.1) status = "needs-attention";

  return { monthlyIncome, monthlyExpense, balance: monthlyIncome - monthlyExpense, expenseRatio, savingsRate, status, topCategories, expenseTrend, unusualExpenses, recurringExpenses };
}
