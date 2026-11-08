(function () {
  "use strict";

  const Engine = window.FinancialEngine;
  const STORAGE_KEY = "money-moves-progress-v1";
  const TODAY = localDateKey(new Date());
  const LESSON_ID = "gross-net-pay";
  const SECTION_LIST = [
    { number: "01", title: "Paycheck to Savings", description: "Earn it, plan it, keep a little for later.", lessons: [
      { id: LESSON_ID, title: "Gross Pay vs. Net Pay", icon: "$", status: "current", duration: "3 min" },
      { id: "paycheck-deductions", title: "Paycheck Deductions", icon: "↘", status: "next", duration: "4 min" },
      { id: "budgeting-basics", title: "Budgeting Basics", icon: "▤", status: "locked", duration: "5 min" },
      { id: "needs-wants", title: "Needs vs. Wants", icon: "♡", status: "locked", duration: "4 min" },
      { id: "savings-challenge", title: "Savings Challenge", icon: "★", status: "challenge", duration: "6 min" }
    ] },
    { number: "02", title: "Credit & Loans", description: "Understand borrowing before you sign.", lessons: [
      { id: "credit-basics", title: "Credit Basics", icon: "▣", status: "locked" },
      { id: "interest", title: "How Interest Works", icon: "%" , status: "locked" },
      { id: "credit-cards", title: "Credit Cards", icon: "▤", status: "locked" },
      { id: "loans", title: "Borrowing Wisely", icon: "★", status: "challenge" }
    ] },
    { number: "03", title: "Risk & Money Safety", description: "Prepare for surprises and protect your money.", lessons: [
      { id: "emergency-fund", title: "Emergency Funds", icon: "⌂", status: "locked" },
      { id: "insurance", title: "Insurance Basics", icon: "◇", status: "locked" },
      { id: "identity-safety", title: "Protect Your Identity", icon: "◈", status: "locked" },
      { id: "money-safety", title: "Money Safety Check", icon: "★", status: "challenge" }
    ] },
    { number: "04", title: "Investing & Scams", description: "Think long term, spot red flags.", lessons: [
      { id: "investing", title: "Investing 101", icon: "↗", status: "locked" },
      { id: "risk-return", title: "Risk & Return", icon: "⌁", status: "locked" },
      { id: "scam-signs", title: "Spot the Scam", icon: "!", status: "locked" },
      { id: "money-moves-final", title: "Money Moves Challenge", icon: "★", status: "challenge" }
    ] }
  ];

  const GAME_EVENTS = [
    {
      title: "A first-day essential",
      description: "Your new job asks you to wear a plain uniform shirt. A new one costs $80; a secondhand one is $35.",
      concept: "Compare costs before you buy.",
      choices: [
        { icon: "🛍", title: "Buy it new", detail: "Pay $80 from checking.", cost: -80, apply: (s) => ({ ...s, checking: s.checking - 80, monthlySpending: s.monthlySpending + 80 }) },
        { icon: "♻", title: "Find it secondhand", detail: "Get what you need and keep $45 more.", cost: -35, apply: (s) => ({ ...s, checking: s.checking - 35, monthlySpending: s.monthlySpending + 35 }) },
        { icon: "↗", title: "Borrow one for now", detail: "Spend $0 and revisit the purchase later.", cost: 0, apply: (s) => s },
        { icon: "◎", title: "Save $100 first", detail: "Put a little of this paycheck toward your cushion.", cost: "−$100 checking · +$100 savings", apply: (s) => ({ ...s, checking: s.checking - 100, savings: s.savings + 100, monthSavingsContribution: s.monthSavingsContribution + 100 }) }
      ]
    },
    {
      title: "A subscription trial",
      description: "A streaming service offers a free trial that becomes $15 a month. The first charge is due today.",
      concept: "Small recurring costs can add up.",
      choices: [
        { icon: "✕", title: "Cancel the trial", detail: "Keep your money for other priorities.", cost: "$0", apply: (s) => s },
        { icon: "▶", title: "Keep the subscription", detail: "Enjoy it, and spend $15 this month.", cost: -15, apply: (s) => ({ ...s, checking: s.checking - 15, monthlySpending: s.monthlySpending + 15 }) },
        { icon: "◷", title: "Set a cancel reminder", detail: "Use the free trial, then cancel before the bill.", cost: "$0 today", apply: (s) => s },
        { icon: "⇄", title: "Split a family plan", detail: "Share the cost and pay $8 this month.", cost: -8, apply: (s) => ({ ...s, checking: s.checking - 8, monthlySpending: s.monthlySpending + 8 }) }
      ]
    },
    {
      title: "Unexpected car trouble",
      description: "A repair will cost $600. You can use your emergency savings, put it on a credit card, or take the bus while you plan.",
      concept: "An emergency fund can help you avoid borrowing.",
      choices: [
        { icon: "◎", title: "Use your savings", detail: "Pay what you can from savings; borrow any shortfall.", cost: (s) => s.savings >= 600 ? "Savings −$600" : `Savings −${formatMoney(s.savings)} · debt +${formatMoney(600 - s.savings)}`, apply: (s) => ({ ...s, savings: Math.max(0, s.savings - 600), debt: s.debt + Math.max(0, 600 - s.savings), monthlySpending: s.monthlySpending + 600 }) },
        { icon: "↓", title: "Use a credit card", detail: "Borrow $600; interest may add up each month.", cost: "Debt +$600", apply: (s) => ({ ...s, debt: s.debt + 600, monthlySpending: s.monthlySpending + 600 }) },
        { icon: "↗", title: "Take the bus for now", detail: "Spend $125 on transit and delay the repair.", cost: -125, apply: (s) => ({ ...s, checking: s.checking - 125, monthlySpending: s.monthlySpending + 125 }) },
        { icon: "$", title: "Pay from checking", detail: "Cover the full repair bill with cash.", cost: -600, apply: (s) => ({ ...s, checking: s.checking - 600, monthlySpending: s.monthlySpending + 600 }) }
      ]
    },
    {
      title: "A credit card offer",
      description: "A card advertises rewards if you spend $180 on new headphones. A purchase is not free just because it earns points.",
      concept: "Credit is borrowed money that must be repaid.",
      choices: [
        { icon: "✕", title: "Decline the offer", detail: "Keep your current plan and avoid new debt.", cost: "$0", apply: (s) => s },
        { icon: "↓", title: "Charge the headphones", detail: "Add $180 to your card balance.", cost: "Debt +$180", apply: (s) => ({ ...s, debt: s.debt + 180, monthlySpending: s.monthlySpending + 180 }) },
        { icon: "$", title: "Buy them with cash", detail: "Spend $180 now; avoid a card balance.", cost: -180, apply: (s) => ({ ...s, checking: s.checking - 180, monthlySpending: s.monthlySpending + 180 }) },
        { icon: "◎", title: "Wait and save", detail: "Skip the impulse buy and keep your cash.", cost: "$0", apply: (s) => s }
      ]
    },
    {
      title: "A savings goal",
      description: "You are building a cushion for surprises. Would you like to move an extra $100 into savings now?",
      concept: "Saving regularly can make future surprises easier to handle.",
      choices: [
        { icon: "◎", title: "Save $100", detail: "Transfer $100 from checking to savings.", cost: "−$100 checking · +$100 savings", apply: (s) => ({ ...s, checking: s.checking - 100, savings: s.savings + 100, monthSavingsContribution: s.monthSavingsContribution + 100 }) },
        { icon: "◎", title: "Save $200", detail: "Build your cushion a little faster.", cost: "−$200 checking · +$200 savings", apply: (s) => ({ ...s, checking: s.checking - 200, savings: s.savings + 200, monthSavingsContribution: s.monthSavingsContribution + 200 }) },
        { icon: "$", title: "Keep it in checking", detail: "Leave the money ready for monthly plans.", cost: "$0", apply: (s) => s },
        { icon: "↗", title: "Set a smaller goal", detail: "Save $50 and keep the rest flexible.", cost: "−$50 checking · +$50 savings", apply: (s) => ({ ...s, checking: s.checking - 50, savings: s.savings + 50, monthSavingsContribution: s.monthSavingsContribution + 50 }) }
      ]
    },
    {
      title: "An unexpected medical bill",
      description: "A fictional clinic bill arrives for $250. You can use savings or put it on a card.",
      concept: "Plan for costs that do not arrive every month.",
      choices: [
        { icon: "◎", title: "Use your savings", detail: "Use up to $250; borrow any shortfall.", cost: (s) => s.savings >= 250 ? "Savings −$250" : `Savings −${formatMoney(s.savings)} · debt +${formatMoney(250 - s.savings)}`, apply: (s) => ({ ...s, savings: Math.max(0, s.savings - 250), debt: s.debt + Math.max(0, 250 - s.savings), monthlySpending: s.monthlySpending + 250 }) },
        { icon: "↓", title: "Use a credit card", detail: "Borrow $250 and account for interest.", cost: "Debt +$250", apply: (s) => ({ ...s, debt: s.debt + 250, monthlySpending: s.monthlySpending + 250 }) },
        { icon: "$", title: "Pay from checking", detail: "Spend $250 from this month's cash.", cost: -250, apply: (s) => ({ ...s, checking: s.checking - 250, monthlySpending: s.monthlySpending + 250 }) },
        { icon: "↻", title: "Ask about a payment plan", detail: "Pay $50 now and add $200 to debt.", cost: "−$50 checking · debt +$200", apply: (s) => ({ ...s, checking: s.checking - 50, debt: s.debt + 200, monthlySpending: s.monthlySpending + 50 }) }
      ]
    },
    {
      title: "An investment opportunity",
      description: "You have the option to invest $200 in a broad, hypothetical fund. Its value can go up or down.",
      concept: "Investments involve risk and are not guaranteed to grow.",
      choices: [
        { icon: "↗", title: "Invest $200", detail: "Move $200 from checking into a hypothetical fund.", cost: "−$200 checking · +$200 invested", apply: (s) => ({ ...s, checking: s.checking - 200, investments: s.investments + 200 }) },
        { icon: "$", title: "Keep it in checking", detail: "Stay flexible while you learn more.", cost: "$0", apply: (s) => s },
        { icon: "↗", title: "Start with $100", detail: "Try a smaller amount; value can still move.", cost: "−$100 checking · +$100 invested", apply: (s) => ({ ...s, checking: s.checking - 100, investments: s.investments + 100 }) },
        { icon: "◎", title: "Build emergency savings", detail: "Put $100 into savings before investing.", cost: "−$100 checking · +$100 savings", apply: (s) => ({ ...s, checking: s.checking - 100, savings: s.savings + 100, monthSavingsContribution: s.monthSavingsContribution + 100 }) }
      ]
    },
    {
      title: "Your monthly costs rise",
      description: "A household bill rises by $120 this month. You can pay it or make a temporary change to lower costs.",
      concept: "A flexible budget helps you respond when costs change.",
      choices: [
        { icon: "$", title: "Pay the higher bill", detail: "Spend $120 from checking.", cost: -120, apply: (s) => ({ ...s, checking: s.checking - 120, monthlySpending: s.monthlySpending + 120 }) },
        { icon: "↻", title: "Adjust your plans", detail: "Cook at home and pause a service.", cost: "$0 extra", apply: (s) => s },
        { icon: "◎", title: "Cover it with savings", detail: "Use savings first, then checking if needed.", cost: (s) => s.savings >= 120 ? "Savings −$120" : `Savings −${formatMoney(s.savings)} · checking −${formatMoney(120 - s.savings)}`, apply: (s) => ({ ...s, savings: Math.max(0, s.savings - 120), checking: s.checking - Math.max(0, 120 - s.savings), monthlySpending: s.monthlySpending + 120 }) },
        { icon: "↓", title: "Put it on a card", detail: "Borrow $120 and pay interest later.", cost: "Debt +$120", apply: (s) => ({ ...s, debt: s.debt + 120, monthlySpending: s.monthlySpending + 120 }) }
      ]
    },
    {
      title: "A suspicious money message",
      description: "A message says your account will be frozen unless you share a password through its link. Real institutions should not ask for your password that way.",
      concept: "Pause, verify using an official channel, and never share a password.",
      choices: [
        { icon: "⚑", title: "Report the message", detail: "Do not click or share personal information.", cost: "$0", apply: (s) => s },
        { icon: "☎", title: "Verify with your bank", detail: "Use the number on your card or official app.", cost: "$0", apply: (s) => s },
        { icon: "✕", title: "Delete and block it", detail: "Keep your login details private.", cost: "$0", apply: (s) => s },
        { icon: "!", title: "Click the suspicious link", detail: "In this fictional game, you lose $200. Never try this in real life.", cost: -200, apply: (s) => ({ ...s, checking: s.checking - 200, monthlySpending: s.monthlySpending + 200 }) }
      ]
    },
    {
      title: "Extra shifts are available",
      description: "Your manager offers extra shifts this month. You can take them for $200 more take-home pay, or keep your current schedule.",
      concept: "Extra income can help, but time and energy matter too.",
      choices: [
        { icon: "+$", title: "Take both extra shifts", detail: "Add $200 to this month's take-home pay.", cost: "+$200", apply: (s) => ({ ...s, checking: s.checking + 200 }) },
        { icon: "+", title: "Take one extra shift", detail: "Add $100 and keep some free time.", cost: "+$100", apply: (s) => ({ ...s, checking: s.checking + 100 }) },
        { icon: "◎", title: "Save $100 from your pay", detail: "Move $100 from checking to savings.", cost: "−$100 checking · +$100 savings", apply: (s) => ({ ...s, checking: s.checking - 100, savings: s.savings + 100, monthSavingsContribution: s.monthSavingsContribution + 100 }) },
        { icon: "♡", title: "Keep your current schedule", detail: "No extra hours; make time for yourself.", cost: "$0", apply: (s) => s }
      ]
    },
    {
      title: "The market has a rough month",
      description: "Your hypothetical investments may lose value. Selling moves money to checking now; holding keeps it exposed to future ups and downs.",
      concept: "Investment values fluctuate, and past performance cannot promise future results.",
      choices: [
        { icon: "⌛", title: "Stay the course", detail: "Keep investments through this month's ups and downs.", cost: "No transfer", apply: (s) => s },
        { icon: "$", title: "Sell 25% of your portfolio", detail: "Move a quarter of its value to checking, if invested.", cost: (s) => `Checking +${formatMoney(s.investments * 0.25)}`, apply: (s) => ({ ...s, investments: s.investments * 0.75, checking: s.checking + s.investments * 0.25 }) },
        { icon: "↗", title: "Invest another $100", detail: "Add money while remembering its value can fall.", cost: "−$100 checking · +$100 invested", apply: (s) => ({ ...s, checking: s.checking - 100, investments: s.investments + 100 }) },
        { icon: "◎", title: "Build your cash cushion", detail: "Move $100 into savings instead.", cost: "−$100 checking · +$100 savings", apply: (s) => ({ ...s, checking: s.checking - 100, savings: s.savings + 100, monthSavingsContribution: s.monthSavingsContribution + 100 }) }
      ]
    },
    {
      title: "A year-end choice",
      description: "You have worked toward your goals all year. A celebration costs $300; keeping that money protects your cushion.",
      concept: "A spending choice can be okay when it fits your priorities and budget.",
      choices: [
        { icon: "🎉", title: "Plan a $300 celebration", detail: "Spend $300 from checking.", cost: -300, apply: (s) => ({ ...s, checking: s.checking - 300, monthlySpending: s.monthlySpending + 300 }) },
        { icon: "♡", title: "Choose a $100 treat", detail: "Celebrate simply and keep more for later.", cost: -100, apply: (s) => ({ ...s, checking: s.checking - 100, monthlySpending: s.monthlySpending + 100 }) },
        { icon: "◎", title: "Add $200 to savings", detail: "Give next year's goals a head start.", cost: "−$200 checking · +$200 savings", apply: (s) => ({ ...s, checking: s.checking - 200, savings: s.savings + 200, monthSavingsContribution: s.monthSavingsContribution + 200 }) },
        { icon: "$", title: "Keep the money flexible", detail: "Leave it in checking for next year's plans.", cost: "$0", apply: (s) => s }
      ]
    }
  ];

  function defaultStore() {
    return {
      version: 1,
      route: "learn",
      xp: 0,
      lessonComplete: false,
      streak: { activityDates: [] },
      simulator: null,
      simulatorAwarded: false
    };
  }

  let store = loadStore();
  let lesson = null;
  let previewNode = null;
  let toastTimer = null;
  let toastMessage = "";
  let toastKind = "";
  const app = document.getElementById("app");
  const overlayRoot = document.getElementById("overlay-root");

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultStore();
      const parsed = JSON.parse(raw);
      if (parsed.version !== 1 || !Number.isSafeInteger(parsed.xp) || parsed.xp < 0 ||
          typeof parsed.lessonComplete !== "boolean" ||
          !Array.isArray(parsed.streak?.activityDates) ||
          !parsed.streak.activityDates.every((date) => typeof date === "string")) {
        throw new TypeError("Saved progress has an unsupported format.");
      }
      const restored = { ...defaultStore(), ...parsed };
      if (restored.simulator?.status === "budget") {
        restored.simulator = Engine.applyBudget(restored.simulator, { optional: 0, savings: 0, debt: 0, investments: 0 });
      }
      if (restored.simulator?.status === "summary") {
        restored.simulator = Engine.closeMonth(restored.simulator);
      }
      return restored;
    } catch (error) {
      console.error("Could not read saved Money Moves progress from browser storage:", error);
      setTimeout(() => showToast("Saved progress could not be read, so this session starts fresh.", "error"), 0);
      return defaultStore();
    }
  }

  function saveStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
      console.error("Could not save Money Moves progress:", error);
      showToast("Your browser could not save this update. Check your storage settings.", "error");
    }
    updateStatus();
  }

  function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatMoneyWhole(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.round(value));
  }

  function formatMoney(value) {
    return formatMoneyWhole(value);
  }

  function formatTrackedMoney(value) {
    return Number.isFinite(value) ? formatMoney(value) : "Not tracked";
  }

  function currentStreak() {
    const days = new Set(store.streak.activityDates);
    const today = new Date();
    const todayKey = localDateKey(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (!days.has(todayKey) && !days.has(localDateKey(yesterday))) return 0;
    let count = 0;
    const cursor = new Date(today);
    if (!days.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
    while (days.has(localDateKey(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }

  function recordActivity() {
    if (!store.streak.activityDates.includes(TODAY)) {
      store.streak.activityDates.push(TODAY);
      store.streak.activityDates.sort();
    }
  }

  function earnedBadges() {
    return {
      first: store.lessonComplete,
      saver: Boolean(store.simulator?.status === "complete" && store.simulator.savings >= store.simulator.goal),
      strategist: Boolean(store.simulator?.status === "complete" && store.simulator.debt === 0),
      finisher: Boolean(store.simulator?.status === "complete")
    };
  }

  function updateStatus() {
    document.body.dataset.route = store.route;
    document.getElementById("xp-total").textContent = String(store.xp);
    document.getElementById("streak-total").textContent = String(currentStreak());
    document.getElementById("avatar-initial").textContent = "M";
    document.querySelectorAll("button[data-route], a[data-route]").forEach((button) => {
      const active = button.dataset.route === store.route;
      button.classList.toggle("active", active);
      if (button.classList.contains("nav-link") || button.classList.contains("mobile-nav-link")) {
        if (active) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
      }
    });
  }

  function render() {
    updateStatus();
    if (store.route === "learn") app.innerHTML = `<div class="screen-enter">${renderLearn()}</div>`;
    else if (store.route === "simulator") app.innerHTML = `<div class="screen-enter">${renderSimulator()}</div>`;
    else if (store.route === "profile") app.innerHTML = `<div class="screen-enter">${renderProfile()}</div>`;
    else if (store.route === "achievements") app.innerHTML = `<div class="screen-enter">${renderAchievements()}</div>`;
    else if (store.route === "about") app.innerHTML = `<div class="screen-enter">${renderAbout()}</div>`;
    else {
      store.route = "learn";
      app.innerHTML = renderLearn();
    }
    renderOverlay();
  }

  function renderLearn() {
    const completedCount = store.lessonComplete ? 1 : 0;
    const totalLessons = SECTION_LIST.reduce((count, section) => count + section.lessons.length, 0);
    const progress = Math.round(completedCount / totalLessons * 100);
    const week = weekActivity();
    const sections = SECTION_LIST.map((section, sectionIndex) => {
      const nodes = section.lessons.map((node, nodeIndex) => {
        const isFirst = sectionIndex === 0 && nodeIndex === 0;
        const isSecond = sectionIndex === 0 && nodeIndex === 1;
        const completed = isFirst && store.lessonComplete;
        const unlockedNext = isSecond && store.lessonComplete;
        const available = isFirst || unlockedNext;
        const status = completed ? "Completed" : isFirst ? "START · 3 MIN" : unlockedNext ? "Unlocked · coming soon" : node.status === "challenge" ? "Unit challenge · locked" : "Locked";
        const className = completed ? "complete" : isFirst && !store.lessonComplete ? "current" : node.status === "challenge" ? "special" : "";
        const glyph = completed ? "✓" : node.status === "challenge" ? "★" : available ? node.icon : "🔒";
        return `<div class="lesson-node-wrap">
          <button class="lesson-node ${className}" data-node="${node.id}" aria-label="${node.title}, ${status}" ${available ? "" : "disabled"}>
            <span aria-hidden="true">${glyph}</span>${node.status === "challenge" && !completed ? `<span class="node-lock" aria-hidden="true">🔒</span>` : ""}
          </button>
          <div class="lesson-label"><strong>${node.title}</strong><span class="${completed || (isFirst && !store.lessonComplete) ? "node-status" : ""}">${status}</span></div>
        </div>`;
      }).join("");
      return `<section class="pathway-section" aria-label="${section.title}">
        <div class="pathway-section-header"><span class="section-number">${section.number}</span><div><h3>${section.title}</h3><p>${section.description}</p></div></div>
        <div class="pathway">${nodes}</div>
      </section>`;
    }).join("");

    return `<header class="learn-topbar">
      <a class="brand" href="#" data-route="learn"><span class="brand-mark" aria-hidden="true"><span></span></span><span class="brand-name">money<span>moves</span></span></a>
      <a class="learn-about-link" href="#about-us">About us <span aria-hidden="true">↓</span></a>
      <div class="learn-top-stats"><span>✦ <strong>${store.xp}</strong> XP</span><span>🔥 <strong>${currentStreak()}</strong></span></div>
      <button class="primary-btn small-btn" data-route="simulator">Play Money Moves <span aria-hidden="true">→</span></button>
    </header>
    <div class="page-intro">
      <div><p class="eyebrow">YOUR MONEY JOURNEY</p><h1>Learn money by doing.</h1><p>Short lessons, real-life choices, and little wins that add up. Pick up where you left off.</p></div>
      <button class="primary-btn" data-route="simulator">Play Money Moves <span aria-hidden="true">→</span></button>
    </div>
    <div class="learning-layout">
      <div>
        <section class="course-banner">
          <div class="course-banner-copy"><p class="eyebrow">SECTION 01 · MONEY FOUNDATIONS</p><h2>Paycheck to Savings</h2><p>Learn how to earn, manage, and save your money—one step at a time.</p></div>
          <div class="mascot" aria-label="Pip the coin guide"><span class="mascot-smile"></span></div>
        </section>
        <div class="section-heading"><h2>Your learning path</h2><span>${completedCount} lesson${completedCount === 1 ? "" : "s"} complete</span></div>
        ${sections}
        <div class="pathway-progress"><span>Course progress</span><div class="progress-track" role="progressbar" aria-label="Course progress" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style="width:${progress}%"></div></div><strong>${progress}%</strong></div>
        <p class="disclaimer">MVP preview: only “Gross Pay vs. Net Pay” is playable. Future lessons are labeled as upcoming or locked. Lesson example is provisional and based on the project brief; the source presentations have not been imported.</p>
        ${renderAboutSection()}
      </div>
      <aside class="side-column" aria-label="Your learning status">
        <section class="card side-card"><h3>Your progress</h3><div class="mini-progress"><span>Lessons completed</span><strong>${completedCount} / ${totalLessons}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
          <div class="streak-box"><span class="streak-flame" aria-hidden="true">🔥</span><div><strong>${currentStreak()} day${currentStreak() === 1 ? "" : "s"}</strong><span>learning streak</span></div></div>
          <div class="week-row">${week}</div>
        </section>
        <section class="card side-card"><h3>Your first goal</h3><p>Finish one short lesson and see the next step on your pathway unlock.</p><button class="secondary-btn small-btn" data-node="${LESSON_ID}">${store.lessonComplete ? "Replay first lesson" : "Start first lesson"} <span aria-hidden="true">→</span></button></section>
        <section class="card quick-game"><h3>Your life. Your money.</h3><p>Make 12 months of choices in the Money Moves simulator.</p><button class="secondary-btn" data-route="simulator">Explore the simulator →</button></section>
      </aside>
    </div>`;
  }

  function renderAboutSection() {
    return `<section class="about-section" id="about-us">
      <div class="about-orbit" aria-hidden="true"><span>MM</span><i>✦</i><i>↗</i><i>$</i></div>
      <div class="about-copy"><p class="eyebrow">OUR PMFL PROJECT</p><h2>Money skills are life skills.</h2><p>Money Moves is our DECA Personal Financial Literacy (PMFL) project. We’re making money basics feel less intimidating and more hands-on, so students can practice real-life decisions before they face them for real.</p>
        <div class="about-values"><div><strong>Learn</strong><span>Small lessons that make big ideas clear.</span></div><div><strong>Practice</strong><span>Fictional scenarios, judgment-free choices.</span></div><div><strong>Grow</strong><span>Build confidence one money move at a time.</span></div></div>
        <div class="about-team"><p class="eyebrow">MADE BY</p><div class="about-team-list"><span>Prakhar Pandey</span><span>Shreyaansh Purohit</span><span>Sreevatsav Gande</span></div></div>
        <p class="about-footnote">All simulator figures are fictional. This project is for financial education—not financial advice. Progress stays in your browser.</p>
      </div>
    </section>`;
  }

  function renderAbout() {
    return `<div class="page-intro"><div><p class="eyebrow">A LITTLE ABOUT US</p><h1>Money skills are life skills.</h1><p>We’re making financial literacy feel approachable, practical, and a little more fun.</p></div><button class="primary-btn" data-route="learn">Explore the learning path <span aria-hidden="true">→</span></button></div>
      ${renderAboutSection()}
      <section class="about-why card"><span class="about-why-icon">✦</span><div><p class="eyebrow">OUR APPROACH</p><h2>Learn it. Try it. Make it yours.</h2><p>Money Moves combines short lessons with a fictional life simulator, giving students a safe place to explore everyday choices around paychecks, saving, credit, emergencies, investing, and money safety.</p></div></section>`;
  }

  function weekActivity() {
    const activeDays = new Set(store.streak.activityDates);
    const today = new Date();
    const mondayOffset = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const label = ["M", "T", "W", "T", "F", "S", "S"][index];
      const active = activeDays.has(localDateKey(date));
      return `<span class="day-dot ${active ? "active" : ""}" aria-label="${date.toLocaleDateString("en-US", { weekday: "long" })}${active ? ", activity complete" : ""}"><i>${active ? "✓" : "·"}</i>${label}</span>`;
    }).join("");
  }

  function renderPreview() {
    if (!previewNode) return "";
    const node = SECTION_LIST.flatMap((section) => section.lessons).find((item) => item.id === previewNode);
    if (!node) return "";
    const playable = node.id === LESSON_ID;
    const unlocked = node.id === "paycheck-deductions" && store.lessonComplete;
    return `<div class="overlay preview-overlay" data-action="close-preview">
      <section class="preview-card card" role="dialog" aria-modal="true" aria-labelledby="preview-title">
        <div class="preview-top"><div class="preview-icon" aria-hidden="true">${node.icon}</div><button class="preview-close" data-action="close-preview" aria-label="Close preview">×</button></div>
        <p class="eyebrow">${playable ? "SECTION 01 · LESSON 01" : unlocked ? "UP NEXT · COMING SOON" : "LOCKED LESSON"}</p>
        <h2 id="preview-title">${node.title}</h2>
        <p>${playable ? "Understand how the money you earn compares with what lands in your bank account." : unlocked ? "This lesson is unlocked on your path, but its learning activities are still in development." : "Complete the lessons before this one to unlock the next step."}</p>
        <div class="preview-objective"><strong>Learning objective</strong><span>${playable ? "Calculate gross pay and net pay using a simple paycheck example." : unlocked ? "Upcoming content—not playable in this MVP." : "Keep moving along the learning path to get here."}</span></div>
        <div class="preview-meta"><span>◷ ${node.duration || "Coming soon"}</span><span>✦ ${playable ? "10 XP" : "—"}</span></div>
        ${playable ? `<button class="primary-btn" data-action="start-lesson">Start lesson <span aria-hidden="true">→</span></button>` : `<div class="coming-soon">${unlocked ? "Thanks for learning! More lessons will be added after this first working vertical slice." : "This content is coming later. No lesson is hidden behind this lock."}</div>`}
      </section>
    </div>`;
  }

  function renderSimulator() {
    const game = store.simulator;
    if (!game || (game.status === "ready" && game.month === 0)) return renderSimulatorWelcome();
    if (game.status === "complete") return renderResults(game);
    const heading = `<div class="page-intro"><div><p class="eyebrow">MONEY MOVES · YOUR 12-MONTH STORY</p><h1>Make a plan. See what happens.</h1><p>One money decision each month. All numbers are fictional and for learning only.</p></div><button class="quiet-btn" data-action="reset-game">↻ Start over</button></div>`;
    let step = "";
    if (game.status === "event") step = renderEvent(game);
    else if (game.status === "ready") step = renderReadyMonth(game);
    else step = `<div class="empty-state">This game state is not available. Start a new game to continue.</div>`;
    return `${heading}${renderGameDashboard(game)}${step}`;
  }

  function renderSimulatorWelcome() {
    return `<div class="page-intro"><div><p class="eyebrow">THE 12-MONTH MONEY GAME</p><h1>Your life. Your money. Your decisions.</h1><p>Practice real-life money choices in a fictional, judgment-free scenario.</p></div></div>
      <section class="sim-hero"><div class="sim-hero-copy"><p class="eyebrow">MONEY MOVES · SIMULATOR</p><h1>Make your money work for you.</h1><p>One year. Twelve months. Your choices shape what happens next.</p></div><div class="mascot" aria-label="Pip the coin guide"><span class="mascot-smile"></span></div></section>
      <div class="sim-content game-intro-grid">
        <section class="card game-intro-card"><p class="eyebrow">YOUR SCENARIO</p><h2>A first year on your own</h2><p>You have a full-time job and a place to live. Each month, you will receive take-home pay, cover basic expenses, respond to a life event, and decide what to do with the money left over. There are no perfect scores—just trade-offs to explore.</p>
          <div class="scenario-stat-list"><div class="scenario-stat"><span>Monthly take-home pay</span><strong>${formatMoney(Engine.MONTHLY_INCOME)}</strong></div><div class="scenario-stat"><span>Starting checking</span><strong>${formatMoney(1200)}</strong></div><div class="scenario-stat"><span>Starting emergency savings</span><strong>${formatMoney(500)}</strong></div><div class="scenario-stat"><span>Starting debt & investments</span><strong>${formatMoney(0)}</strong></div><div class="scenario-stat"><span>Emergency savings goal</span><strong>${formatMoney(3000)}</strong></div></div>
        </section>
        <section class="card game-intro-card"><p class="eyebrow">HOW IT WORKS</p><h2>One choice, four options.</h2><p>Each month, your paycheck arrives and essential bills are covered. Pick one of four money moves, then see what changed. The game runs for 12 months and saves as you play.</p><p class="disclaimer">All amounts, interest rates, and market changes are hypothetical. Savings earns 1.2% APR and debt accrues 18% APR (monthly compounding). Investments can rise or fall; this is not a forecast or guarantee.</p>
          <button class="primary-btn" data-action="start-game">Start your 12 months <span aria-hidden="true">→</span></button>
        </section>
      </div>
      <p class="disclaimer">No account or real financial information is needed. This is an educational simulation, not financial advice. Monthly essential expenses: rent ${formatMoney(1100)}, groceries ${formatMoney(350)}, transportation ${formatMoney(250)}, utilities ${formatMoney(160)}, and other needs ${formatMoney(180)}.</p>`;
  }

  function renderGameDashboard(game) {
    const monthLabel = game.status === "complete" ? "Year complete" : game.month === 0 ? "Not started" : `Month ${game.month} of 12`;
    const items = [
      ["$", "Checking", formatMoney(game.checking)],
      ["◎", "Savings", formatMoney(game.savings)],
      ["↓", "Debt", formatMoney(game.debt)],
      ["↗", "Invested", formatMoney(game.investments)],
      ["◇", "Net worth", formatMoney(Engine.netWorth(game))],
      ["↘", "Spent this month", formatTrackedMoney(game.monthlySpending)]
    ];
    return `<section class="card game-status-card"><div class="game-status-head"><h2>Your money</h2><span class="month-pill">${monthLabel}</span></div><div class="dashboard-grid">${items.map(([icon, label, amount]) => `<div class="dashboard-item"><span><i aria-hidden="true">${icon}</i>${label}</span><strong>${amount}</strong></div>`).join("")}</div></section>`;
  }

  function renderReadyMonth(game) {
    const nextMonth = game.month + 1;
    const lastEvent = game.events.find((event) => event.month === game.month);
    return `<section class="card month-summary month-checkin">
      <div class="checkin-badge" aria-hidden="true">✓</div><p class="eyebrow">MONTH ${game.month} COMPLETE</p>
      <h2>Nice move: ${lastEvent ? lastEvent.choice : "your plan is in motion"}.</h2>
      <p>Your balances updated. Savings earned ${formatMoney(game.lastMonthSummary?.savingsInterest || 0)} interest${game.debt ? `, and debt added ${formatMoney(game.lastMonthSummary?.debtInterest || 0)} in interest` : ""}. Your next month is saved automatically.</p>
      <div class="checkin-balances"><span>$ <strong>${formatMoney(game.checking)}</strong><small>checking</small></span><span>◎ <strong>${formatMoney(game.savings)}</strong><small>savings</small></span><span>↓ <strong>${formatMoney(game.debt)}</strong><small>debt</small></span></div>
      <button class="primary-btn" data-action="next-month">Let’s go to month ${nextMonth} <span aria-hidden="true">→</span></button>
    </section>`;
  }

  function renderEvent(game) {
    const event = GAME_EVENTS[game.month - 1];
    return `<section class="card event-card">
      <p class="event-kicker">MONTH ${game.month} · YOUR MONEY MOVE</p><h2>${event.title}</h2><p>${event.description}</p>
      <div class="choice-instruction"><span>Choose your move</span><strong>4 options · no wrong way to learn</strong></div>
      <div class="choice-list">${event.choices.map((choice, index) => {
        const disabled = typeof choice.disabled === "function" && choice.disabled(game);
        const cost = typeof choice.cost === "function" ? choice.cost(game) : choice.cost;
        const impact = typeof cost === "number" ? (cost > 0 ? `+${formatMoney(cost)}` : cost < 0 ? `−${formatMoney(Math.abs(cost))}` : formatMoney(0)) : cost;
        return `<button class="choice-button" data-action="event-choice" data-choice="${index}" ${disabled ? "disabled" : ""}><span class="choice-icon" aria-hidden="true">${choice.icon || "$"}</span><span class="choice-copy"><strong>${choice.title}</strong><small>${choice.detail}</small><em>${impact}</em></span><span class="choice-arrow" aria-hidden="true">→</span></button>`;
      }).join("")}</div>
      <p class="disclaimer"><strong>Money skill:</strong> ${event.concept}</p>
    </section>`;
  }

  function renderBudget(game) {
    const fields = [
      ["optional", "Optional spending", "Fun and personal spending this month."],
      ["savings", "Savings contribution", "Move money from checking to savings."],
      ["debt", "Debt payment", `Pay down your ${formatMoney(game.debt)} debt balance.`],
      ["investments", "Investment contribution", "Investing can gain or lose value."]
    ];
    return `<form class="card budget-form" id="budget-form">
      <p class="eyebrow">MONTH ${game.month} · YOUR PLAN</p><h2>Give your money a job.</h2><p>Choose amounts for this month. You can leave money unallocated in checking. Optional spending is spent; savings, debt, and investments move to those balances.</p>
      <div class="available-row"><span>Available in checking</span><strong>${formatMoney(game.checking)}</strong></div>
      <div class="allocation-grid">${fields.map(([id, label, help]) => `<div class="allocation-field"><label for="allocation-${id}">${label}</label><div class="allocation-input-wrap"><span>$</span><input id="allocation-${id}" class="allocation-input" name="${id}" type="number" min="0" step="1" value="0" inputmode="decimal" aria-describedby="help-${id}"></div><small class="allocation-help" id="help-${id}">${help}</small></div>`).join("")}</div>
      <div class="budget-footer"><div class="budget-remaining" id="budget-remaining">Remaining in checking: <strong>${formatMoney(game.checking)}</strong></div><button class="primary-btn" type="submit">Review this month <span aria-hidden="true">→</span></button></div>
      <div class="disclaimer" id="budget-error" role="alert" hidden></div>
    </form>`;
  }

  function renderMonthSummary(game) {
    const marketReturn = Engine.MARKET_RETURNS[game.month - 1];
    const interest = {
      savingsInterest: Engine.roundMoney(game.savings * (Engine.SAVINGS_APR / 12)),
      debtInterest: Engine.roundMoney(game.debt * (Engine.DEBT_APR / 12)),
      marketReturn,
      investmentChange: Engine.roundMoney(game.investments * marketReturn)
    };
    const allocation = game.lastAllocation || { optional: 0, savings: 0, debt: 0, investments: 0 };
    const investmentText = interest.investmentChange >= 0 ? `increased ${formatMoney(interest.investmentChange)}` : `decreased ${formatMoney(Math.abs(interest.investmentChange))}`;
    return `<section class="card month-summary">
      <p class="eyebrow">MONTH ${game.month} · CHECK-IN</p><h2>Every choice adds up.</h2><p>This month, you put ${formatMoney(allocation.savings)} into savings and ${formatMoney(allocation.debt)} toward debt. Your investment value ${investmentText} (${Math.round(interest.marketReturn * 100)}% illustrative monthly change).</p>
      <div class="summary-numbers"><div class="summary-number"><span>Checking</span><strong>${formatMoney(game.checking)}</strong></div><div class="summary-number"><span>Savings</span><strong>${formatMoney(game.savings)}</strong></div><div class="summary-number"><span>Debt</span><strong>${formatMoney(game.debt)}</strong></div><div class="summary-number"><span>Net worth</span><strong>${formatMoney(Engine.netWorth(game))}</strong></div><div class="summary-number"><span>Monthly spending</span><strong>${formatMoney(game.monthlySpending)}</strong></div></div>
      <p class="disclaimer">This month: savings interest +${formatMoney(interest.savingsInterest)}; debt interest +${formatMoney(interest.debtInterest)}. Interest is calculated on the balance at month-end using the stated annual rates divided by 12.</p>
      <div class="game-actions"><button class="secondary-btn" data-action="view-timeline">View decision timeline</button><button class="primary-btn" data-action="close-month">${game.month === 12 ? "See your year-end report" : `Continue to month ${game.month + 1}`} <span aria-hidden="true">→</span></button></div>
    </section>`;
  }

  function renderResults(game) {
    const score = Engine.financialWellnessScore(game);
    const goalMet = game.savings >= game.goal;
    const debtFree = game.debt === 0;
    const rows = game.monthlyHistory.map((month) => {
      const event = game.events.find((item) => item.month === month.month);
      const spending = formatTrackedMoney(month.monthlySpending);
      return `<div class="timeline-row"><span class="timeline-month">MONTH ${month.month}</span><span class="timeline-copy">${event ? event.choice : "Monthly budget completed"}</span><span class="timeline-balance">${spending === "Not tracked" ? "Spending not tracked · " : `Spent ${spending} · `}worth ${formatMoney(month.netWorth)}</span></div>`;
    }).join("");
    const finalItems = [
      ["Checking", formatMoney(game.checking)],
      ["Savings", formatMoney(game.savings)],
      ["Outstanding debt", formatMoney(game.debt)],
      ["Investments", formatMoney(game.investments)],
      ["Net worth", formatMoney(Engine.netWorth(game))],
      ["Month 12 spending", formatTrackedMoney(game.monthlySpending)],
      ["Total debt interest", formatMoney(game.totalInterestPaid)]
    ];
    return `<div class="page-intro"><div><p class="eyebrow">MONEY MOVES · YOUR YEAR IN REVIEW</p><h1>You made it through 12 months.</h1><p>Here is what your decisions added up to. Your report stays on this device.</p></div><button class="quiet-btn" data-action="reset-game">↻ Replay scenario</button></div>
      <div class="game-intro-grid">
        <section class="results-hero"><div class="score-ring" aria-label="Financial wellness score ${score} out of 100">${score}</div><h2>Your money habits score</h2><p>This score measures progress toward savings, debt, positive cash flow, and saving consistency. It does not rank your wealth or predict your real-life financial future.</p></section>
        <section class="card game-intro-card"><p class="eyebrow">YEAR-END REPORT</p><h2>Your final snapshot</h2><div class="scenario-stat-list">${finalItems.map(([label, amount]) => `<div class="scenario-stat"><span>${label}</span><strong>${amount}</strong></div>`).join("")}</div></section>
      </div>
      <section class="card game-status-card"><div class="game-status-head"><h2>Goals & takeaways</h2><span class="month-pill">12 months</span></div><div class="scenario-stat-list">
        <div class="scenario-stat"><span>Emergency savings goal (${formatMoney(game.goal)})</span><strong>${goalMet ? "Reached" : "Not reached yet"}</strong></div>
        <div class="scenario-stat"><span>Debt-free at year end</span><strong>${debtFree ? "Yes" : "Not yet"}</strong></div>
        <div class="scenario-stat"><span>Wellness score ingredients</span><strong>40 savings · 30 debt · 20 cash flow · 10 consistency</strong></div>
      </div><p class="disclaimer">Score formula: savings = min(40, round(40 × savings ÷ ${formatMoneyWhole(game.goal)})); debt = max(0, 30 − round(2 × debt ÷ $100)); checking = 20 if non-negative; saving consistency = round(10 × months with a savings contribution ÷ 12). This is an instructional rubric, not a financial standard.</p></section>
      <section class="card game-status-card"><div class="game-status-head"><h2>Your decision timeline</h2><span class="month-pill">${game.events.length} choices</span></div><div class="results-timeline">${rows}</div></section>
      <div class="game-actions"><button class="secondary-btn" data-action="go-learn">Back to learning</button><button class="primary-btn" data-action="reset-game">Replay the 12 months <span aria-hidden="true">↻</span></button></div>`;
  }

  function renderProfile() {
    const completed = store.lessonComplete ? 1 : 0;
    const completedGame = store.simulator?.status === "complete";
    return `<div class="page-intro"><div><p class="eyebrow">YOUR PERSONAL PROGRESS</p><h1>Look how far you've come.</h1><p>Your learning progress is saved only in this browser. No account needed.</p></div></div>
      <div class="stats-grid">
        <section class="metric-card"><span class="metric-icon">✦</span><div class="metric-label">Total XP</div><div class="metric-value">${store.xp}</div></section>
        <section class="metric-card"><span class="metric-icon">🔥</span><div class="metric-label">Current streak</div><div class="metric-value">${currentStreak()} day${currentStreak() === 1 ? "" : "s"}</div></section>
        <section class="metric-card"><span class="metric-icon">✓</span><div class="metric-label">Lessons complete</div><div class="metric-value">${completed}</div></section>
        <section class="metric-card"><span class="metric-icon">↗</span><div class="metric-label">Simulator status</div><div class="metric-value" style="font-size:19px">${completedGame ? "12 months done" : store.simulator?.month ? `Month ${store.simulator.month} of 12` : "Not started"}</div></section>
        <section class="metric-card"><span class="metric-icon">◎</span><div class="metric-label">Emergency savings goal</div><div class="metric-value" style="font-size:19px">${completedGame ? (store.simulator.savings >= store.simulator.goal ? "Reached" : "In progress") : "Practice it"}</div></section>
        <section class="metric-card"><span class="metric-icon">◷</span><div class="metric-label">Activity days</div><div class="metric-value">${store.streak.activityDates.length}</div></section>
      </div>
      <section class="card page-card"><p class="eyebrow">KEEP GOING</p><h2>Your next step</h2><p class="muted">${store.lessonComplete ? "Your first lesson is complete. Paycheck Deductions is unlocked as upcoming content." : "Start with gross pay vs. net pay, then use Money Moves to practice your choices."}</p><div class="game-actions"><button class="secondary-btn" data-route="learn">Go to learning path</button><button class="primary-btn" data-route="simulator">Open Money Moves</button></div></section>
      <p class="disclaimer">Progress can be cleared by clearing this site's browser storage. There is no account synchronization or leaderboard.</p>`;
  }

  function renderAchievements() {
    const earned = earnedBadges();
    const badges = [
      ["first", "First Paycheck", "Finish your first learning lesson.", "✦"],
      ["saver", "Savings Builder", "Reach your emergency savings goal in the simulator.", "◎"],
      ["strategist", "Debt Detective", "Finish the simulation with no debt.", "⌕"],
      ["finisher", "12-Month Finisher", "Complete all 12 months of Money Moves.", "★"]
    ];
    return `<div class="page-intro"><div><p class="eyebrow">YOUR MILESTONES</p><h1>Celebrate the little wins.</h1><p>Badges recognize learning milestones—not how much money you have.</p></div></div>
      <div class="achievement-grid">${badges.map(([id, title, description, icon]) => `<article class="badge-card ${earned[id] ? "earned" : ""}"><div class="badge-icon" aria-hidden="true">${earned[id] ? icon : "◇"}</div><strong>${title}</strong><p>${earned[id] ? "Earned!" : description}</p></article>`).join("")}</div>
      <p class="disclaimer">Badges are private to this browser and are not displayed on a leaderboard.</p>`;
  }

  function lessonScreen() {
    if (!lesson) return "";
    const stepsCount = 6;
    const currentProgress = lesson.step === 6 ? 100 : Math.round((lesson.step / stepsCount) * 100);
    const header = `<header class="lesson-player-header"><button class="close-lesson" data-action="close-lesson" aria-label="Exit lesson">×</button><div class="lesson-progress" role="progressbar" aria-label="Lesson progress" aria-valuenow="${currentProgress}" aria-valuemin="0" aria-valuemax="100"><div class="lesson-progress-fill" style="width:${currentProgress}%"></div></div><span class="lesson-step-count">${lesson.step === 6 ? "DONE" : `${lesson.step + 1} / 6`}</span></header>`;
    if (lesson.step === 6) {
      return `<section class="overlay lesson-overlay"><div class="lesson-player" role="dialog" aria-modal="true" aria-labelledby="lesson-title">${header}
        <div class="lesson-content"><div class="completion-mark" aria-hidden="true">✓</div><p class="eyebrow">LESSON COMPLETE</p><h1 id="lesson-title">You earned your first money win!</h1><p class="lesson-text">You can tell the difference between what you earn and what you take home—and use that number to make a plan.</p>
          <div class="lesson-complete-stats"><div class="lesson-complete-stat"><strong>${lesson.awarded ? "+10 XP" : "+0 XP"}</strong><span>${lesson.awarded ? "earned" : "replay"}</span></div><div class="lesson-complete-stat"><strong>${lesson.correct} / 3</strong><span>answers correct</span></div></div>
          <div class="lesson-takeaway"><strong>Remember:</strong> Gross pay is before deductions. Net pay is what you take home after deductions.</div></div>
        <footer class="lesson-footer"><span class="lesson-footer-hint">Next lesson unlocked: Paycheck Deductions</span><button class="primary-btn" data-action="finish-lesson">Back to path <span aria-hidden="true">→</span></button></footer></div></section>`;
    }

    const content = lessonContent(lesson);
    const isInformationStep = lesson.step === 0 || lesson.step === 1 || lesson.step === 3;
    const checkDisabled = !lesson.answerState && (lesson.step === 2 || lesson.step === 5 ? !lesson.selected : lesson.step === 4 ? !lesson.numberValue.trim() : false);
    return `<section class="overlay lesson-overlay"><div class="lesson-player" role="dialog" aria-modal="true" aria-labelledby="lesson-title">${header}<div class="lesson-content lesson-content-enter">${content}</div><footer class="lesson-footer"><span class="lesson-footer-hint">${lesson.answerState ? (lesson.answerState.correct ? "Nice work!" : "Keep learning—mistakes help.") : "One step at a time. You've got this."}</span>${isInformationStep ? `<button class="primary-btn" data-action="lesson-continue">${lesson.step === 0 ? "Let's go" : lesson.step === 1 ? "Got it" : "Continue"} <span aria-hidden="true">→</span></button>` : `<button class="primary-btn" data-action="${lesson.answerState ? "lesson-continue" : "lesson-check"}" ${checkDisabled ? "disabled" : ""}>${lesson.answerState ? "Continue" : "Check"} <span aria-hidden="true">→</span></button>`}</footer></div></section>`;
  }

  function lessonContent(attempt) {
    if (attempt.step === 0) return `<div class="lesson-illustration" aria-hidden="true">▤</div><p class="eyebrow">YOUR FIRST PAYCHECK</p><h1 id="lesson-title">Ready for your first payday?</h1><p class="lesson-text">You just got your first job. You earn $15 an hour and work 20 hours this week. Let's see where your money goes.</p><div class="paycheck-card"><div class="paycheck-line"><span>Hourly pay</span><strong>${formatMoney(15)}/hr</strong></div><div class="paycheck-line"><span>Hours worked</span><strong>20 hours</strong></div></div>`;
    if (attempt.step === 1) return `<div class="lesson-illustration" aria-hidden="true">＋</div><p class="eyebrow">THE AMOUNT YOU EARN</p><h1 id="lesson-title">Meet gross pay.</h1><p class="lesson-text"><strong>Gross pay</strong> is the total money you earn before taxes and other deductions come out.</p><div class="paycheck-card"><div class="paycheck-line"><span>$15 per hour × 20 hours</span><strong>${formatMoney(300)}</strong></div><div class="paycheck-line total"><span>Gross pay</span><strong>${formatMoney(300)}</strong></div></div>`;
    if (attempt.step === 2) {
      const options = ["$200", "$250", "$300", "$350"];
      return `<p class="eyebrow">QUICK CHECK · GROSS PAY</p><h1 id="lesson-title">Your turn.</h1><p class="question-prompt">You earn $15 per hour and work 20 hours. What is your gross pay?</p><div class="answer-options" role="group" aria-label="Choose your answer">${options.map((option) => `<button class="answer-option ${attempt.selected === option ? "selected" : ""} ${attempt.answerState ? (option === "$300" ? "correct" : attempt.selected === option ? "incorrect" : "") : ""}" data-action="select-answer" data-answer="${option}" aria-pressed="${attempt.selected === option}" ${attempt.answerState ? "disabled" : ""}>${option}</button>`).join("")}</div>${renderAnswerFeedback(attempt.answerState, "Correct! $15 × 20 hours = $300 in gross pay.", "Not quite. Multiply hourly pay by hours worked: $15 × 20 = $300.")}`;
    }
    if (attempt.step === 3) return `<div class="lesson-illustration" aria-hidden="true">↓</div><p class="eyebrow">WHAT LANDS IN YOUR ACCOUNT</p><h1 id="lesson-title">Now, meet net pay.</h1><p class="lesson-text"><strong>Net pay</strong> is the money you actually take home after taxes and other deductions. It is often less than your gross pay.</p><div class="paycheck-card"><div class="paycheck-line"><span>Gross pay</span><strong>${formatMoney(300)}</strong></div><div class="paycheck-line"><span>Illustrative deductions</span><strong>−${formatMoney(45)}</strong></div><div class="paycheck-line total"><span>Net pay</span><strong>${formatMoney(255)}</strong></div></div>`;
    if (attempt.step === 4) return `<p class="eyebrow">QUICK CHECK · TAKE-HOME PAY</p><h1 id="lesson-title">Do the math.</h1><p class="question-prompt">Your gross pay is $300 and your deductions total $45. How much is your net pay?</p><label class="sr-only" for="lesson-number">Your answer in dollars</label><input id="lesson-number" class="number-answer" type="number" min="0" step="1" placeholder="$ amount" value="${attempt.numberValue || ""}" ${attempt.answerState ? "disabled" : ""}>${renderAnswerFeedback(attempt.answerState, "That's it! $300 − $45 = $255 take-home pay.", "Net pay is gross pay minus deductions: $300 − $45 = $255.")}`;
    return `<p class="eyebrow">PUT IT INTO PRACTICE</p><h1 id="lesson-title">A small savings goal.</h1><p class="question-prompt">You take home $255 and want to save $50. How much remains for other expenses?</p><div class="answer-options" role="group" aria-label="Choose your answer">${["$205", "$200", "$210"].map((option) => `<button class="answer-option ${attempt.selected === option ? "selected" : ""} ${attempt.answerState ? (option === "$205" ? "correct" : attempt.selected === option ? "incorrect" : "") : ""}" data-action="select-answer" data-answer="${option}" aria-pressed="${attempt.selected === option}" ${attempt.answerState ? "disabled" : ""}>${option}</button>`).join("")}</div>${renderAnswerFeedback(attempt.answerState, "Great plan! $255 − $50 in savings = $205 for other expenses.", "Subtract your savings goal from take-home pay: $255 − $50 = $205.")}`;
  }

  function renderAnswerFeedback(answerState, correct, incorrect) {
    if (!answerState) return "";
    return `<div class="answer-feedback ${answerState.correct ? "" : "wrong"}" role="status">${answerState.correct ? correct : incorrect}</div>`;
  }

  function renderOverlay() {
    overlayRoot.innerHTML = lesson ? lessonScreen() : renderPreview();
    if (lesson) {
      const numberInput = document.getElementById("lesson-number");
      if (numberInput && lesson.numberValue) numberInput.value = lesson.numberValue;
    }
  }

  function startLesson() {
    previewNode = null;
    lesson = { step: 0, selected: null, numberValue: "", answerState: null, correct: 0, awarded: false };
    renderOverlay();
  }

  function closeLesson() {
    if (!lesson) return;
    lesson = null;
    render();
  }

  function selectAnswer(value) {
    if (!lesson || lesson.answerState) return;
    lesson.selected = value;
    renderOverlay();
  }

  function checkLessonAnswer() {
    if (!lesson) return;
    let isCorrect = false;
    if (lesson.step === 2) {
      if (!lesson.selected) return showToast("Choose an answer before you check.", "error");
      isCorrect = lesson.selected === "$300";
    } else if (lesson.step === 4) {
      const input = document.getElementById("lesson-number");
      lesson.numberValue = input?.value.trim() || "";
      const numericAnswer = Number(lesson.numberValue.replace(/[$,\s]/g, ""));
      if (!lesson.numberValue || !Number.isFinite(numericAnswer)) return showToast("Enter a number before you check.", "error");
      isCorrect = Math.abs(numericAnswer - 255) < 0.001;
    } else if (lesson.step === 5) {
      if (!lesson.selected) return showToast("Choose an answer before you check.", "error");
      isCorrect = lesson.selected === "$205";
    }
    if (isCorrect) lesson.correct += 1;
    lesson.answerState = { correct: isCorrect };
    renderOverlay();
  }

  function advanceLesson() {
    if (!lesson) return;
    if (lesson.step === 5) {
      if (!store.lessonComplete) {
        store.lessonComplete = true;
        store.xp += 10;
        lesson.awarded = true;
      } else {
        lesson.awarded = false;
      }
      recordActivity();
      saveStore();
      lesson.step = 6;
    } else {
      lesson.step += 1;
      lesson.answerState = null;
      lesson.selected = null;
      lesson.numberValue = "";
    }
    renderOverlay();
  }

  function showToast(message, kind) {
    toastMessage = message;
    toastKind = kind || "";
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      document.body.append(toast);
    }
    toast.textContent = toastMessage;
    toast.className = `toast ${toastKind}`;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.remove(), 3300);
  }

  function getCurrentEvent() {
    if (!store.simulator || store.simulator.status !== "event") throw new Error("No life event is currently active.");
    return GAME_EVENTS[store.simulator.month - 1];
  }

  function handleEventChoice(index) {
    const game = store.simulator;
    const event = getCurrentEvent();
    const choice = event.choices[index];
    if (!choice) throw new RangeError("That life-event choice is unavailable.");
    if (typeof choice.disabled === "function" && choice.disabled(game)) return showToast("There is not enough money in that balance for this choice.", "error");
    const nextState = Engine.applyEventChoice(game, (current) => ({
      state: choice.apply({ ...current }),
      title: event.title,
      summary: choice.title
    }));
    const monthComplete = Engine.applyBudget(nextState, {
      optional: 0,
      savings: 0,
      debt: 0,
      investments: 0
    });
    store.simulator = monthComplete;
    closeMonth();
  }

  function submitBudget(form) {
    const game = store.simulator;
    const data = new FormData(form);
    const allocation = Object.fromEntries(["optional", "savings", "debt", "investments"].map((field) => [field, Number(data.get(field))]));
    const error = document.getElementById("budget-error");
    try {
      store.simulator = Engine.applyBudget(game, allocation);
      saveStore();
      render();
    } catch (problem) {
      error.textContent = problem.message;
      error.hidden = false;
      error.style.color = "#a94c42";
      error.style.background = "#fff3ef";
    }
  }

  function resetGame() {
    store.simulator = Engine.startMonth(Engine.createInitialGame(), 1);
    store.simulatorAwarded = false;
    saveStore();
    render();
  }

  function closeMonth() {
    const next = Engine.closeMonth(store.simulator);
    store.simulator = next;
    if (next.status === "complete") {
      recordActivity();
      if (!store.simulatorAwarded) {
        store.xp += 20;
        store.simulatorAwarded = true;
      }
    }
    saveStore();
    render();
  }

  function monthValueInputs() {
    const inputs = document.querySelectorAll(".allocation-input");
    if (!inputs.length) return;
    const total = Array.from(inputs).reduce((sum, input) => sum + Math.max(0, Number(input.value) || 0), 0);
    const remaining = store.simulator.checking - total;
    const summary = document.getElementById("budget-remaining");
    if (summary) {
      summary.innerHTML = `Remaining in checking: <strong>${formatMoney(remaining)}</strong>`;
      summary.style.color = remaining < 0 ? "#a94c42" : "";
    }
  }

  document.addEventListener("click", (event) => {
    const routeTarget = event.target.closest("button[data-route], a[data-route]");
    if (routeTarget) {
      event.preventDefault();
      store.route = routeTarget.dataset.route;
      previewNode = null;
      lesson = null;
      saveStore();
      render();
      return;
    }

    const node = event.target.closest("[data-node]");
    if (node) {
      previewNode = node.dataset.node;
      renderOverlay();
      return;
    }

    if (event.target.classList.contains("preview-overlay")) {
      previewNode = null;
      renderOverlay();
      return;
    }

    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "close-preview") { previewNode = null; renderOverlay(); }
    else if (action === "start-lesson") startLesson();
    else if (action === "close-lesson" || action === "finish-lesson") closeLesson();
    else if (action === "select-answer") selectAnswer(button.dataset.answer);
    else if (action === "lesson-check") checkLessonAnswer();
    else if (action === "lesson-continue") advanceLesson();
    else if (action === "start-game") { store.simulator = Engine.startMonth(Engine.createInitialGame(), 1); saveStore(); render(); }
    else if (action === "reset-game") resetGame();
    else if (action === "next-month") {
      try { store.simulator = Engine.startMonth(store.simulator, store.simulator.month + 1); saveStore(); render(); }
      catch (error) { showToast(error.message, "error"); }
    }
    else if (action === "event-choice") {
      try { handleEventChoice(Number(button.dataset.choice)); }
      catch (error) { showToast(error.message, "error"); }
    }
    else if (action === "close-month") {
      try { closeMonth(); }
      catch (error) { showToast(error.message, "error"); }
    }
    else if (action === "view-timeline") {
      const list = store.simulator.events.map((item) => `Month ${item.month}: ${item.choice}`).join("\n");
      showToast(list || "Your first event is up next.", "");
    }
    else if (action === "go-learn") { store.route = "learn"; saveStore(); render(); }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "lesson-number" && lesson) {
      lesson.numberValue = event.target.value;
      const checkButton = document.querySelector('[data-action="lesson-check"]');
      if (checkButton) checkButton.disabled = !lesson.numberValue.trim();
    }
    if (event.target.classList.contains("allocation-input")) monthValueInputs();
  });

  document.addEventListener("submit", (event) => {
    if (event.target.id !== "budget-form") return;
    event.preventDefault();
    submitBudget(event.target);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lesson) closeLesson();
    else if (event.key === "Escape" && previewNode) { previewNode = null; renderOverlay(); }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      store = loadStore();
      render();
      showToast("Progress updated in another tab.", "");
    }
  });

  render();
})();
