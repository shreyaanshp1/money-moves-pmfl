(function (root) {
  "use strict";

  const MONTHLY_EXPENSES = Object.freeze({
    rent: 1100,
    groceries: 350,
    transportation: 250,
    utilities: 160,
    essentials: 180
  });
  const MONTHLY_INCOME = 3200;
  const SAVINGS_APR = 0.012;
  const DEBT_APR = 0.18;
  const MARKET_RETURNS = Object.freeze([0.01, 0.015, -0.08, 0.02, 0.012, -0.035, 0.04, 0.01, -0.06, 0.025, -0.09, 0.05]);

  function roundMoney(amount) {
    if (!Number.isFinite(amount)) throw new TypeError("Money amounts must be finite numbers.");
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }

  function createInitialGame() {
    return {
      status: "ready",
      month: 0,
      checking: 1200,
      savings: 500,
      debt: 0,
      investments: 0,
      totalInterestPaid: 0,
      monthlySpending: 0,
      monthSavingsContribution: 0,
      goal: 3000,
      events: [],
      monthlyHistory: []
    };
  }

  function startMonth(state, month) {
    assertMonth(month);
    if (!state || state.status === "complete") throw new Error("Start a new game before adding a month.");
    const expenses = sum(Object.values(MONTHLY_EXPENSES));
    return {
      ...state,
      status: "event",
      month,
      checking: roundMoney(state.checking + MONTHLY_INCOME - expenses),
      monthlySpending: expenses,
      monthSavingsContribution: 0
    };
  }

  function applyEventChoice(state, choice) {
    if (!state || state.status !== "event") throw new Error("A life event is not waiting for a choice.");
    const next = { ...state, events: state.events.slice() };
    const result = choice(next);
    if (!result || !result.state || !result.summary) throw new TypeError("Event choices must return a state and a summary.");
    next.checking = roundMoney(result.state.checking);
    next.savings = roundMoney(result.state.savings);
    next.debt = roundMoney(result.state.debt);
    next.investments = roundMoney(result.state.investments);
    next.monthlySpending = roundMoney(result.state.monthlySpending ?? state.monthlySpending ?? 0);
    next.monthSavingsContribution = roundMoney(result.state.monthSavingsContribution ?? state.monthSavingsContribution ?? 0);
    next.events.push({ month: state.month, title: result.title, choice: result.summary });
    next.status = "budget";
    return next;
  }

  function applyBudget(state, allocation) {
    if (!state || state.status !== "budget") throw new Error("Resolve this month's event before budgeting.");
    const fields = ["optional", "savings", "debt", "investments"];
    for (const field of fields) {
      if (!Number.isFinite(allocation[field]) || allocation[field] < 0) throw new RangeError("Budget amounts must be zero or more.");
    }
    const total = roundMoney(sum(fields.map((field) => allocation[field])));
    if (total > state.checking + 0.001) throw new RangeError("Your budget is larger than the money in checking.");
    if (allocation.debt > state.debt + 0.001) throw new RangeError("A debt payment cannot exceed your current debt.");

    return {
      ...state,
      checking: roundMoney(state.checking - total),
      savings: roundMoney(state.savings + allocation.savings),
      monthSavingsContribution: roundMoney((state.monthSavingsContribution ?? 0) + allocation.savings),
      debt: roundMoney(state.debt - allocation.debt),
      investments: roundMoney(state.investments + allocation.investments),
      monthlySpending: roundMoney((state.monthlySpending ?? 0) + allocation.optional),
      status: "summary",
      lastAllocation: {
        optional: roundMoney(allocation.optional),
        savings: roundMoney(allocation.savings),
        debt: roundMoney(allocation.debt),
        investments: roundMoney(allocation.investments)
      }
    };
  }

  function closeMonth(state) {
    if (!state || state.status !== "summary") throw new Error("Finish the monthly budget before closing the month.");
    const savingsInterest = roundMoney(state.savings * (SAVINGS_APR / 12));
    const debtInterest = roundMoney(state.debt * (DEBT_APR / 12));
    const marketReturn = MARKET_RETURNS[state.month - 1];
    const investmentChange = roundMoney(state.investments * marketReturn);
    const next = {
      ...state,
      savings: roundMoney(state.savings + savingsInterest),
      debt: roundMoney(state.debt + debtInterest),
      investments: Math.max(0, roundMoney(state.investments + investmentChange)),
      totalInterestPaid: roundMoney(state.totalInterestPaid + debtInterest),
      lastMonthSummary: {
        savingsInterest,
        debtInterest,
        marketReturn,
        investmentChange
      },
      monthlyHistory: state.monthlyHistory.concat([{
        month: state.month,
        checking: state.checking,
        monthlySpending: state.monthlySpending,
        savings: roundMoney(state.savings + savingsInterest),
        savingsContribution: state.monthSavingsContribution ?? 0,
        debt: roundMoney(state.debt + debtInterest),
        investments: Math.max(0, roundMoney(state.investments + investmentChange)),
        netWorth: roundMoney(state.checking + state.savings + savingsInterest + state.investments + investmentChange - state.debt - debtInterest)
      }]),
      status: state.month === 12 ? "complete" : "ready"
    };
    return next;
  }

  function netWorth(state) {
    return roundMoney(state.checking + state.savings + state.investments - state.debt);
  }

  function financialWellnessScore(state) {
    const emergencyFundScore = Math.min(40, Math.round((state.savings / state.goal) * 40));
    const debtScore = state.debt === 0 ? 30 : Math.max(0, 30 - Math.round((state.debt / 100) * 2));
    const cashFlowScore = state.checking >= 0 ? 20 : 0;
    const habitScore = Math.min(10, Math.round(state.monthlyHistory.filter((month) => month.savingsContribution > 0).length / 12 * 10));
    return Math.max(0, Math.min(100, emergencyFundScore + debtScore + cashFlowScore + habitScore));
  }

  function assertMonth(month) {
    if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError("Month must be a whole number from 1 to 12.");
  }

  function sum(values) {
    return values.reduce((total, value) => total + value, 0);
  }

  const api = Object.freeze({
    MONTHLY_EXPENSES,
    MONTHLY_INCOME,
    SAVINGS_APR,
    DEBT_APR,
    MARKET_RETURNS,
    roundMoney,
    createInitialGame,
    startMonth,
    applyEventChoice,
    applyBudget,
    closeMonth,
    netWorth,
    financialWellnessScore
  });

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.FinancialEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
