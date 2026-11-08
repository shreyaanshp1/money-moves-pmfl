"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Finance = require("./financial.js");

test("monthly income and essentials update checking accurately", () => {
  const month = Finance.startMonth(Finance.createInitialGame(), 1);
  assert.equal(month.checking, 2360);
  assert.equal(month.status, "event");
});

test("event choices and budgets preserve a single consistent set of balances", () => {
  let game = Finance.startMonth(Finance.createInitialGame(), 1);
  game = Finance.applyEventChoice(game, (state) => ({
    state: { ...state, debt: state.debt + 600, monthlySpending: state.monthlySpending + 600 },
    title: "Repair",
    summary: "Use a credit card"
  }));
  assert.throws(() => Finance.applyBudget(game, { optional: 0, savings: 0, debt: 0, investments: 3000 }), /larger than the money in checking/);
  assert.throws(() => Finance.applyBudget(game, { optional: 0, savings: 0, debt: 601, investments: 0 }), /cannot exceed your current debt/);
  game = Finance.applyBudget(game, { optional: 100, savings: 200, debt: 100, investments: 300 });
  assert.equal(game.checking, 1660);
  assert.equal(game.savings, 700);
  assert.equal(game.debt, 500);
  assert.equal(game.investments, 300);
  assert.equal(game.monthlySpending, 2740);
});

test("monthly interest and hypothetical market change use explicit rates", () => {
  let game = Finance.startMonth(Finance.createInitialGame(), 1);
  game = Finance.applyEventChoice(game, (state) => ({
    state: { ...state, debt: 600, investments: 200 },
    title: "Test event",
    summary: "Added balances"
  }));
  game = Finance.applyBudget(game, { optional: 0, savings: 0, debt: 0, investments: 0 });
  game = Finance.closeMonth(game);
  assert.equal(game.lastMonthSummary.debtInterest, 9);
  assert.equal(game.totalInterestPaid, 9);
  assert.equal(game.savings, 500.5);
  assert.equal(game.investments, 202);
  assert.equal(game.status, "ready");
});

test("a full game produces twelve saved months and a final state", () => {
  let game = Finance.createInitialGame();
  for (let month = 1; month <= 12; month += 1) {
    game = Finance.startMonth(game, month);
    game = Finance.applyEventChoice(game, (state) => ({
      state,
      title: `Event ${month}`,
      summary: "Keep current plan"
    }));
    game = Finance.applyBudget(game, { optional: 0, savings: 100, debt: 0, investments: 0 });
    game = Finance.closeMonth(game);
  }
  assert.equal(game.status, "complete");
  assert.equal(game.monthlyHistory.length, 12);
  assert.equal(game.events.length, 12);
  assert.equal(game.monthlyHistory[0].monthlySpending, 2040);
  assert.ok(game.savings > 1700);
  assert.ok(game.checking >= 0);
  assert.equal(Finance.financialWellnessScore(game), 83);
  assert.equal(Finance.netWorth(game), game.checking + game.savings + game.investments - game.debt);
});

test("invalid months are rejected", () => {
  assert.throws(() => Finance.startMonth(Finance.createInitialGame(), 13), /whole number from 1 to 12/);
});
