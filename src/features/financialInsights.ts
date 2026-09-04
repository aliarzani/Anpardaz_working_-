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
  amount: number;
  category?: string;
  date: string;
  source?: "pos" | "transfer" | "bill" | "recharge" | "exchange" | "other";
}

export interface FinancialInsight {
  monthlyIncome: number;
  monthlyExpense: number;
  balance: number;
  expenseRatio: number;
  savingsRate: number;
  status: FinancialStatus;
  topCategories: Array<{ category: string; amount: number }>;
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

export function buildFinancialInsight(
  incomeSources: IncomeSource[],
  expenses: ExpenseItem[],
  now = new Date(),
): FinancialInsight {
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthlyIncome = estimateMonthlyIncome(incomeSources);
  const monthlyExpenses = expenses.filter((expense) => {
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

  let status: FinancialStatus = "normal";
  if (monthlyIncome <= 0 && monthlyExpense > 0) status = "warning";
  else if (expenseRatio >= 0.9) status = "warning";
  else if (expenseRatio >= 0.75 || savingsRate < 0.1) status = "needs-attention";

  return {
    monthlyIncome,
    monthlyExpense,
    balance: monthlyIncome - monthlyExpense,
    expenseRatio,
    savingsRate,
    status,
    topCategories,
  };
}
