/* =========================================================
   TVM CALCULATOR — APPLICATION LOGIC
   Organised in four parts:
   1. Configuration (per calculation-type field/label data)
   2. Pure calculation functions (the actual maths)
   3. Validation
   4. DOM / rendering (form, result, table, chart)
   ========================================================= */

/* ---------------------------------------------------------
   1. CONFIGURATION
   --------------------------------------------------------- */

const FREQUENCY_OPTIONS = [
  { value: 1, label: "Annually" },
  { value: 2, label: "Semi-annually" },
  { value: 4, label: "Quarterly" },
  { value: 12, label: "Monthly" },
];

const TENURE_UNIT_OPTIONS = [
  { value: 12, label: "Years" },
  { value: 1, label: "Months" },
];

// Every calculation type the app supports, and the exact inputs it needs.
const CALC_TYPES = {
  fv: {
    title: "Future Value",
    formula: "FV = PV × (1 + r)ⁿ",
    legend: [
      ["PV", "Present Value — the amount you invest today"],
      ["r", "Interest rate for one compounding period"],
      ["n", "Total number of compounding periods"],
    ],
    fields: [
      { id: "presentValue", label: "Present Value", unit: "₹", kind: "amount", placeholder: "10,000", hint: "The lump sum you invest today" },
      { id: "rate", label: "Interest Rate", unit: "% p.a.", kind: "rate", placeholder: "8" },
      { id: "years", label: "Number of Periods", unit: "years", kind: "years", placeholder: "5" },
      { id: "freq", label: "Compounding Frequency", kind: "freq" },
    ],
  },
  pv: {
    title: "Present Value",
    formula: "PV = FV / (1 + r)ⁿ",
    legend: [
      ["FV", "Future Value — the amount you will receive later"],
      ["r", "Interest (discount) rate for one compounding period"],
      ["n", "Total number of compounding periods"],
    ],
    fields: [
      { id: "futureValue", label: "Future Value", unit: "₹", kind: "amount", placeholder: "20,000", hint: "The amount you expect to receive later" },
      { id: "rate", label: "Interest Rate", unit: "% p.a.", kind: "rate", placeholder: "8" },
      { id: "years", label: "Number of Periods", unit: "years", kind: "years", placeholder: "5" },
      { id: "freq", label: "Compounding Frequency", kind: "freq" },
    ],
  },
  ci: {
    title: "Compound Interest",
    formula: "CI = P × (1 + r)ⁿ − P",
    legend: [
      ["P", "Principal — the amount invested"],
      ["r", "Interest rate for one compounding period"],
      ["n", "Total number of compounding periods"],
    ],
    fields: [
      { id: "principal", label: "Principal Amount", unit: "₹", kind: "amount", placeholder: "10,000" },
      { id: "rate", label: "Interest Rate", unit: "% p.a.", kind: "rate", placeholder: "8" },
      { id: "years", label: "Number of Periods", unit: "years", kind: "years", placeholder: "5" },
      { id: "freq", label: "Compounding Frequency", kind: "freq" },
    ],
  },
  fva: {
    title: "Future Value of Annuity",
    formula: "FV = PMT × [((1 + r)ⁿ − 1) / r]",
    legend: [
      ["PMT", "Amount invested at the end of every period"],
      ["r", "Interest rate for one period"],
      ["n", "Total number of payments"],
    ],
    fields: [
      { id: "payment", label: "Payment per Period", unit: "₹", kind: "amount", placeholder: "5,000", hint: "Amount invested at the end of each period" },
      { id: "rate", label: "Interest Rate", unit: "% p.a.", kind: "rate", placeholder: "8" },
      { id: "years", label: "Number of Periods", unit: "years", kind: "years", placeholder: "5" },
      { id: "freq", label: "Payment Frequency", kind: "freq" },
    ],
  },
  pva: {
    title: "Present Value of Annuity",
    formula: "PV = PMT × [(1 − (1 + r)⁻ⁿ) / r]",
    legend: [
      ["PMT", "Amount received at the end of every period"],
      ["r", "Interest rate for one period"],
      ["n", "Total number of payments"],
    ],
    fields: [
      { id: "payment", label: "Payment per Period", unit: "₹", kind: "amount", placeholder: "5,000" },
      { id: "rate", label: "Interest Rate", unit: "% p.a.", kind: "rate", placeholder: "8" },
      { id: "years", label: "Number of Periods", unit: "years", kind: "years", placeholder: "5" },
      { id: "freq", label: "Payment Frequency", kind: "freq" },
    ],
  },
  emi: {
    title: "EMI Calculator",
    formula: "EMI = P × r × (1 + r)ⁿ / [(1 + r)ⁿ − 1]",
    legend: [
      ["P", "Loan (principal) amount"],
      ["r", "Interest rate for one month"],
      ["n", "Total number of monthly instalments"],
    ],
    fields: [
      { id: "loanAmount", label: "Loan Amount", unit: "₹", kind: "amount", placeholder: "5,00,000" },
      { id: "rate", label: "Interest Rate", unit: "% p.a.", kind: "rate", placeholder: "9" },
      { id: "years", label: "Loan Tenure", kind: "years", placeholder: "5" },
      { id: "tenureUnit", label: "Tenure In", kind: "tenureUnit" },
    ],
  },
  amort: {
    title: "Loan Amortization",
    formula: "Interest = Opening Balance × r   ·   Principal = EMI − Interest   ·   Closing = Opening − Principal",
    legend: [
      ["EMI", "Fixed monthly instalment = P × r × (1 + r)ⁿ / [(1 + r)ⁿ − 1]"],
      ["P", "Loan (principal) amount"],
      ["r", "Interest rate for one month"],
      ["n", "Total number of monthly instalments"],
      ["Extra", "Optional amount paid on top of the EMI each month — it goes entirely to principal"],
    ],
    fields: [
      { id: "loanAmount", label: "Loan Amount", unit: "₹", kind: "amount", placeholder: "5,00,000" },
      { id: "rate", label: "Interest Rate", unit: "% p.a.", kind: "rate", placeholder: "9" },
      { id: "years", label: "Loan Tenure", kind: "years", placeholder: "5" },
      { id: "tenureUnit", label: "Tenure In", kind: "tenureUnit" },
      { id: "extraPayment", label: "Extra Monthly Payment (optional)", unit: "₹", kind: "optionalAmount", placeholder: "2,000", hint: "Paid on top of the EMI every month to close the loan sooner" },
    ],
  },
  si: {
    title: "Simple Interest",
    formula: "SI = (P × r × t) / 100",
    legend: [
      ["P", "Principal — the amount invested or borrowed"],
      ["r", "Annual interest rate, as a percentage"],
      ["t", "Time period, in years"],
    ],
    fields: [
      { id: "principal", label: "Principal Amount", unit: "₹", kind: "amount", placeholder: "10,000" },
      { id: "rate", label: "Interest Rate", unit: "% p.a.", kind: "rate", placeholder: "8" },
      { id: "years", label: "Time Period", unit: "years", kind: "years", placeholder: "5" },
    ],
  },
  scenario: {
    title: "Scenario Analysis",
    isScenario: true,
    formula: "FV = A × (1 + r)ⁿ — evaluated at three different rates",
    legend: [
      ["A", "The amount you invest today"],
      ["r", "Interest rate — tested at three different levels"],
      ["n", "Total number of compounding periods"],
    ],
    fields: [
      { id: "baseAmount", label: "Investment Amount", unit: "₹", kind: "amount", placeholder: "50,000", hint: "The amount you plan to invest today" },
      { id: "years", label: "Time Period", unit: "years", kind: "years", placeholder: "10" },
      { id: "freq", label: "Compounding Frequency", kind: "freq" },
      { id: "rateConservative", label: "Conservative Rate", unit: "%", kind: "rate", placeholder: "5" },
      { id: "rateModerate", label: "Moderate Rate", unit: "%", kind: "rate", placeholder: "8" },
      { id: "rateOptimistic", label: "Optimistic Rate", unit: "%", kind: "rate", placeholder: "12" },
    ],
  },
};

// Two separate domains: the Time Value of Money calculations (tabbed) and the standalone EMI calculator.
const DOMAINS = {
  tvm: {
    title: "Time Value of Money Calculator",
    intro: "Pick a calculation, fill in three or four numbers, and see exactly how your money moves through time — with the table and chart to back it up.",
  },
  emi: {
    title: "EMI Calculator",
    intro: "Enter a loan amount, rate and tenure to see your monthly instalment and how much of what you repay is interest.",
  },
};

// Application state
let state = {
  domain: "tvm",
  type: "fv",
  lastTvmType: "fv", // remembered so switching back to the TVM domain restores the tab
  lastResult: null,
  lastRaw: null,
  scheduleView: "yearly",
};

/* ---------------------------------------------------------
   2. PURE CALCULATION FUNCTIONS
   All rates come in as an annual percentage (e.g. 8 for 8%).
   `freq` is compounding periods per year.
   --------------------------------------------------------- */

function calculateFutureValue(presentValue, ratePercent, years, freq) {
  const r = ratePercent / 100 / freq;
  const n = years * freq;
  const futureValue = presentValue * Math.pow(1 + r, n);
  return { futureValue, interest: futureValue - presentValue, r, n };
}

function calculatePresentValue(futureValue, ratePercent, years, freq) {
  const r = ratePercent / 100 / freq;
  const n = years * freq;
  const presentValue = futureValue / Math.pow(1 + r, n);
  return { presentValue, interest: futureValue - presentValue, r, n };
}

function calculateCompoundInterest(principal, ratePercent, years, freq) {
  const r = ratePercent / 100 / freq;
  const n = years * freq;
  const amount = principal * Math.pow(1 + r, n);
  return { amount, interest: amount - principal, r, n };
}

function calculateAnnuityFutureValue(payment, ratePercent, years, freq) {
  const r = ratePercent / 100 / freq;
  const n = years * freq;
  const futureValue = r === 0 ? payment * n : payment * ((Math.pow(1 + r, n) - 1) / r);
  const totalContributions = payment * n;
  return { futureValue, totalContributions, interest: futureValue - totalContributions, r, n };
}

function calculateAnnuityPresentValue(payment, ratePercent, years, freq) {
  const r = ratePercent / 100 / freq;
  const n = years * freq;
  const presentValue = r === 0 ? payment * n : payment * ((1 - Math.pow(1 + r, -n)) / r);
  const totalPayments = payment * n;
  return { presentValue, totalPayments, discount: totalPayments - presentValue, r, n };
}

function calculateEMI(loanAmount, ratePercent, months) {
  const r = ratePercent / 100 / 12;
  const n = months;
  const emi = r === 0 ? loanAmount / n : (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = emi * n;
  return { emi, totalPayment, totalInterest: totalPayment - loanAmount, r, n };
}

function calculateSimpleInterest(principal, ratePercent, years) {
  const interest = (principal * ratePercent * years) / 100;
  return { interest, amount: principal + interest };
}

/**
 * Full month-by-month loan amortisation, with an optional extra payment each month.
 * Each month: interest = opening balance × r; principal = payment − interest.
 * The loan ends early if extra payments clear the balance before `totalMonths`.
 */
function calculateAmortization(principal, ratePercent, totalMonths, extraPayment = 0) {
  const base = calculateEMI(principal, ratePercent, totalMonths);
  const r = base.r;
  const monthlyRows = [];
  let balance = principal;
  let totalInterest = 0;

  for (let m = 1; m <= totalMonths && balance > 0.005; m++) {
    const opening = balance;
    const interestPortion = balance * r;
    // The final scheduled month pays off whatever is left, absorbing rounding drift.
    const payment = m === totalMonths ? balance + interestPortion : Math.min(base.emi + extraPayment, balance + interestPortion);
    const principalPortion = payment - interestPortion;
    balance = Math.max(balance - principalPortion, 0);
    if (balance < 0.005) balance = 0;
    totalInterest += interestPortion;
    monthlyRows.push({ period: m, starting: opening, payment, principalPaid: principalPortion, interestPaid: interestPortion, ending: balance });
  }

  // Yearly rows aggregated from the monthly schedule so both views always agree.
  const years = Math.ceil(monthlyRows.length / 12);
  const rows = [];
  for (let year = 1; year <= years; year++) {
    const chunk = monthlyRows.slice((year - 1) * 12, year * 12);
    rows.push({
      year,
      starting: chunk[0].starting,
      payment: chunk.reduce((s, x) => s + x.payment, 0),
      principalPaid: chunk.reduce((s, x) => s + x.principalPaid, 0),
      interestPaid: chunk.reduce((s, x) => s + x.interestPaid, 0),
      ending: chunk[chunk.length - 1].ending,
    });
  }

  return {
    emi: base.emi,
    baseTotalInterest: base.totalInterest,
    totalInterest,
    totalPayment: principal + totalInterest,
    payoffMonths: monthlyRows.length,
    principal,
    rows,
    monthlyRows,
    columns: ["Year", "Opening Balance", "Payment", "Principal Paid", "Interest Paid", "Closing Balance"],
    monthlyColumns: ["Month", "Opening Balance", "Payment", "Principal Paid", "Interest Paid", "Closing Balance"],
  };
}

/* ---------------------------------------------------------
   3. VALIDATION
   --------------------------------------------------------- */

function validateInputs(type, raw) {
  const errors = {};
  const config = CALC_TYPES[type];

  const hasTenureUnit = config.fields.some((f) => f.kind === "tenureUnit");

  config.fields.forEach((field) => {
    if (field.kind === "freq" || field.kind === "tenureUnit") return; // select always has a valid value
    const value = raw[field.id];

    if (field.kind === "optionalAmount") {
      if (value === "" || value === null || value === undefined) return; // blank = 0
      const num = Number(value);
      if (Number.isNaN(num)) errors[field.id] = "Please enter a valid number.";
      else if (num < 0) errors[field.id] = "Extra payment cannot be negative.";
      return;
    }

    if (value === "" || value === null || value === undefined) {
      errors[field.id] = "This field is required.";
      return;
    }
    const num = Number(value);
    if (Number.isNaN(num)) {
      errors[field.id] = "Please enter a valid number.";
      return;
    }
    if (field.kind === "amount" && num <= 0) {
      errors[field.id] = "Please enter an amount greater than zero.";
    }
    if (field.kind === "rate") {
      if (num < 0) errors[field.id] = "Interest rate cannot be negative.";
      else if (num > 100) errors[field.id] = "Please enter a realistic interest rate.";
    }
    if (field.kind === "years") {
      const inMonths = hasTenureUnit && raw.tenureUnit === "1";
      if (num <= 0) errors[field.id] = "Number of periods must be greater than zero.";
      else if (inMonths && !Number.isInteger(num)) errors[field.id] = "Please enter whole months.";
      else if (inMonths && num > 1200) errors[field.id] = "Please enter a tenure of 1,200 months or fewer.";
      else if (!inMonths && num > 100) errors[field.id] = "Please enter a period of 100 years or fewer.";
      else if (hasTenureUnit && Math.round(num * Number(raw.tenureUnit)) < 1) errors[field.id] = "Tenure must be at least 1 month.";
    }
  });

  return { valid: Object.keys(errors).length === 0, errors };
}

/* ---------------------------------------------------------
   4. DOM / RENDERING
   --------------------------------------------------------- */

const els = {
  tabs: document.getElementById("calc-tabs"),
  fields: document.getElementById("input-fields"),
  form: document.getElementById("calc-form"),
  formError: document.getElementById("form-error"),
  calculateBtn: document.getElementById("calculate-btn"),
  resetBtn: document.getElementById("reset-btn"),
  formulaExpr: document.getElementById("formula-expr"),
  formulaLegend: document.getElementById("formula-legend"),
  formulaToggle: document.getElementById("formula-toggle"),
  formulaContent: document.getElementById("formula-content"),
  resultEmpty: document.getElementById("result-empty"),
  resultContent: document.getElementById("result-content"),
  resultLabel: document.getElementById("result-label"),
  resultValue: document.getElementById("result-value"),
  resultKind: document.getElementById("result-kind"),
  resultSentence: document.getElementById("result-sentence"),
  resultStats: document.getElementById("result-stats"),
  copyBtn: document.getElementById("copy-btn"),
  tableChartGrid: document.getElementById("table-chart-grid"),
  tableTitle: document.getElementById("table-title"),
  tableHead: document.getElementById("growth-table-head"),
  tableBody: document.getElementById("growth-table-body"),
  chartCanvas: document.getElementById("growth-chart"),
  scheduleToggle: document.getElementById("schedule-toggle"),
  chartLegend: document.getElementById("chart-legend"),
  chartTitle: document.getElementById("chart-title"),
  domainSwitch: document.getElementById("domain-switch"),
  calcTitle: document.getElementById("calc-title"),
  calcSubtitle: document.getElementById("calc-subtitle"),
  amortLinkBtn: document.getElementById("amort-link-btn"),
};

/** Format a number as Indian Rupees, e.g. ₹1,00,000.00 */
function formatINR(amount) {
  if (!Number.isFinite(amount)) return "—";
  return "₹" + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 60 -> "5 year(s)", 18 -> "18 months" */
function formatTenure(months) {
  return months % 12 === 0 ? months / 12 + " year(s)" : months + " months";
}

/** 47 -> "3 years 11 months", 12 -> "1 year", 5 -> "5 months" */
function formatDuration(months) {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y) parts.push(y + (y === 1 ? " year" : " years"));
  if (m) parts.push(m + (m === 1 ? " month" : " months"));
  return parts.join(" ") || "0 months";
}

function formatPercent(rate) {
  const pct = rate * 100;
  return (Number.isInteger(pct) ? pct : Math.round(pct * 100) / 100) + "%";
}

/** Build the input fields for the currently-selected calculation type. */
function renderFields(type) {
  const config = CALC_TYPES[type];
  els.fields.innerHTML = "";

  config.fields.forEach((field) => {
    const wrap = document.createElement("div");
    wrap.className = "field";

    if (field.kind === "freq" || field.kind === "tenureUnit") {
      const options = field.kind === "freq" ? FREQUENCY_OPTIONS : TENURE_UNIT_OPTIONS;
      wrap.innerHTML = `
        <label for="f-${field.id}">${field.label}</label>
        <select id="f-${field.id}" name="${field.id}">
          ${options.map((o) => `<option value="${o.value}">${o.label}</option>`).join("")}
        </select>
        <span class="field-error"></span>`;
    } else {
      wrap.innerHTML = `
        <label for="f-${field.id}">${field.label}</label>
        ${field.hint ? `<span class="field-hint">${field.hint}</span>` : ""}
        <div class="field-input-wrap">
          <input type="number" step="any" inputmode="decimal" id="f-${field.id}" name="${field.id}"
                 class="${field.unit ? "has-unit" : ""}" placeholder="e.g. ${field.placeholder}" />
          ${field.unit ? `<span class="unit">${field.unit}</span>` : ""}
        </div>
        <span class="field-error"></span>`;
    }
    els.fields.appendChild(wrap);
  });
}

/** Update the collapsible formula section for the current type. */
function renderFormula(type) {
  const config = CALC_TYPES[type];
  els.formulaExpr.textContent = config.formula;
  els.formulaLegend.innerHTML = config.legend
    .map(([sym, desc]) => `<li><b>${sym}</b> = ${desc}</li>`)
    .join("");
}

/** Read raw string values out of the current form. */
function readRawInputs(type) {
  const raw = {};
  CALC_TYPES[type].fields.forEach((field) => {
    const el = document.getElementById(`f-${field.id}`);
    raw[field.id] = field.kind === "freq" || field.kind === "tenureUnit" ? el.value : el.value.trim();
  });
  return raw;
}

/** Paint per-field error messages and highlight invalid inputs. */
function paintFieldErrors(type, errors) {
  CALC_TYPES[type].fields.forEach((field) => {
    const input = document.getElementById(`f-${field.id}`);
    const errorEl = input.closest(".field").querySelector(".field-error");
    if (errors[field.id]) {
      input.classList.add("is-invalid");
      errorEl.textContent = errors[field.id];
    } else {
      input.classList.remove("is-invalid");
      errorEl.textContent = "";
    }
  });
}

/** Run the correct maths for the current type, given validated numeric inputs. */
function runCalculation(type, values) {
  switch (type) {
    case "fv": {
      const r = calculateFutureValue(values.presentValue, values.rate, values.years, values.freq);
      return {
        main: r.futureValue,
        mainLabel: "Future Value",
        sentence: `An investment of ${formatINR(values.presentValue)} at an annual interest rate of ${values.rate}% for ${values.years} year(s) grows to approximately ${formatINR(r.futureValue)}.`,
        stats: [
          ["Initial Amount", formatINR(values.presentValue)],
          ["Interest Earned", formatINR(r.interest)],
          ["Interest Rate", values.rate + "% p.a."],
          ["Time Period", values.years + " year(s)"],
        ],
        chart: buildLumpSumSeries(values.presentValue, r.r, r.n, values.freq, values.years),
      };
    }
    case "pv": {
      const r = calculatePresentValue(values.futureValue, values.rate, values.years, values.freq);
      return {
        main: r.presentValue,
        mainLabel: "Present Value",
        sentence: `To have ${formatINR(values.futureValue)} in ${values.years} year(s) at an annual interest rate of ${values.rate}%, you would need to invest approximately ${formatINR(r.presentValue)} today.`,
        stats: [
          ["Future Value Target", formatINR(values.futureValue)],
          ["Interest Earned", formatINR(r.interest)],
          ["Interest Rate", values.rate + "% p.a."],
          ["Time Period", values.years + " year(s)"],
        ],
        chart: buildLumpSumSeries(r.presentValue, r.r, r.n, values.freq, values.years),
      };
    }
    case "ci": {
      const r = calculateCompoundInterest(values.principal, values.rate, values.years, values.freq);
      return {
        main: r.interest,
        mainLabel: "Interest Earned",
        sentence: `A principal of ${formatINR(values.principal)} at an annual interest rate of ${values.rate}% for ${values.years} year(s) earns ${formatINR(r.interest)} in compound interest, growing to ${formatINR(r.amount)}.`,
        stats: [
          ["Principal", formatINR(values.principal)],
          ["Total Amount", formatINR(r.amount)],
          ["Interest Rate", values.rate + "% p.a."],
          ["Time Period", values.years + " year(s)"],
        ],
        chart: buildLumpSumSeries(values.principal, r.r, r.n, values.freq, values.years),
      };
    }
    case "fva": {
      const r = calculateAnnuityFutureValue(values.payment, values.rate, values.years, values.freq);
      return {
        main: r.futureValue,
        mainLabel: "Future Value",
        sentence: `Investing ${formatINR(values.payment)} at the end of every period for ${values.years} year(s) at ${values.rate}% p.a. grows to approximately ${formatINR(r.futureValue)}.`,
        stats: [
          ["Total Contributions", formatINR(r.totalContributions)],
          ["Interest Earned", formatINR(r.interest)],
          ["Interest Rate", values.rate + "% p.a."],
          ["Time Period", values.years + " year(s)"],
        ],
        chart: buildAnnuitySeries(values.payment, r.r, r.n, values.freq, values.years, "fva"),
      };
    }
    case "pva": {
      const r = calculateAnnuityPresentValue(values.payment, values.rate, values.years, values.freq);
      return {
        main: r.presentValue,
        mainLabel: "Present Value",
        sentence: `A series of ${formatINR(values.payment)} received at the end of every period for ${values.years} year(s), discounted at ${values.rate}% p.a., is worth approximately ${formatINR(r.presentValue)} today.`,
        stats: [
          ["Total Payments", formatINR(r.totalPayments)],
          ["Discount Applied", formatINR(r.discount)],
          ["Interest Rate", values.rate + "% p.a."],
          ["Time Period", values.years + " year(s)"],
        ],
        chart: buildAnnuitySeries(values.payment, r.r, r.n, values.freq, values.years, "pva"),
      };
    }
    case "emi": {
      const months = Math.round(values.years * values.tenureUnit);
      const r = calculateEMI(values.loanAmount, values.rate, months);
      const tenureText = formatTenure(months);
      const interestPct = (r.totalInterest / r.totalPayment) * 100;
      return {
        main: r.emi,
        mainLabel: "Monthly EMI",
        sentence: `A loan of ${formatINR(values.loanAmount)} at ${values.rate}% p.a. for ${tenureText} results in a monthly instalment of approximately ${formatINR(r.emi)}.`,
        stats: [
          ["Loan Amount", formatINR(values.loanAmount)],
          ["Total Interest Payable", formatINR(r.totalInterest)],
          ["Total Payment", formatINR(r.totalPayment)],
          ["Number of EMIs", String(months)],
          ["Tenure", tenureText],
        ],
        split: { principalPct: 100 - interestPct, interestPct },
        chart: buildLoanSeries(values.loanAmount, r.r, r.n, Math.ceil(months / 12)),
      };
    }
    case "amort": {
      const months = Math.round(values.years * values.tenureUnit);
      const extra = values.extraPayment || 0;
      const a = calculateAmortization(values.loanAmount, values.rate, months, extra);
      const interestPct = (a.totalInterest / a.totalPayment) * 100;
      const interestSaved = a.baseTotalInterest - a.totalInterest;
      const hasExtra = extra > 0;
      const stats = [
        ["Loan Amount", formatINR(values.loanAmount)],
        ["Monthly EMI", formatINR(a.emi)],
      ];
      if (hasExtra) stats.push(["Extra Monthly Payment", formatINR(extra)]);
      stats.push(["Total Payment", formatINR(a.totalPayment)]);
      stats.push(["Loan Paid Off In", formatDuration(a.payoffMonths)]);
      if (hasExtra && interestSaved > 0.005) stats.push(["Interest Saved", formatINR(interestSaved)]);
      return {
        main: a.totalInterest,
        mainLabel: "Total Interest Payable",
        sentence:
          `A loan of ${formatINR(values.loanAmount)} at ${values.rate}% p.a. over ${formatTenure(months)} has a monthly EMI of ${formatINR(a.emi)}` +
          (hasExtra ? `; paying ${formatINR(extra)} extra each month clears it in ${formatDuration(a.payoffMonths)} and saves ${formatINR(Math.max(interestSaved, 0))} in interest.` : `, and you pay ${formatINR(a.totalInterest)} in interest over the full term.`),
        stats,
        split: { principalPct: 100 - interestPct, interestPct },
        amort: a,
      };
    }
    case "si": {
      const r = calculateSimpleInterest(values.principal, values.rate, values.years);
      return {
        main: r.interest,
        mainLabel: "Simple Interest",
        sentence: `A principal of ${formatINR(values.principal)} at a simple interest rate of ${values.rate}% for ${values.years} year(s) earns ${formatINR(r.interest)}, growing to a total of ${formatINR(r.amount)}.`,
        stats: [
          ["Principal", formatINR(values.principal)],
          ["Total Amount", formatINR(r.amount)],
          ["Interest Rate", values.rate + "% p.a."],
          ["Time Period", values.years + " year(s)"],
        ],
        chart: buildSimpleInterestSeries(values.principal, values.rate, values.years),
      };
    }
    case "scenario":
      return runScenarioAnalysis(values);
    default:
      throw new Error("Unknown calculation type");
  }
}

/** Compare the same investment at three different rates of return. */
function runScenarioAnalysis(values) {
  const scenarioDefs = [
    { key: "conservative", label: "Conservative", rate: values.rateConservative, color: "#c9922f" },
    { key: "moderate", label: "Moderate", rate: values.rateModerate, color: "#0f6e5c" },
    { key: "optimistic", label: "Optimistic", rate: values.rateOptimistic, color: "#3457d5" },
  ];
  const scenarios = scenarioDefs.map((s) => {
    const r = calculateFutureValue(values.baseAmount, s.rate, values.years, values.freq);
    return { ...s, futureValue: r.futureValue, interest: r.interest };
  });
  const moderate = scenarios.find((s) => s.key === "moderate");
  const conservative = scenarios.find((s) => s.key === "conservative");
  const optimistic = scenarios.find((s) => s.key === "optimistic");

  return {
    isScenario: true,
    main: moderate.futureValue,
    mainLabel: "Future Value (Moderate Scenario)",
    sentence: `Investing ${formatINR(values.baseAmount)} for ${values.years} year(s) could grow to anywhere between ${formatINR(conservative.futureValue)} at ${conservative.rate}% and ${formatINR(optimistic.futureValue)} at ${optimistic.rate}%, depending on the rate of return achieved.`,
    stats: scenarios.map((s) => [`${s.label} (${s.rate}%)`, formatINR(s.futureValue)]),
    scenarios,
    years: values.years,
    freq: values.freq,
    baseAmount: values.baseAmount,
  };
}

/* ---- Series builders used by both the table and the chart ---- */

function buildLumpSumSeries(startValue, r, totalPeriods, freq, years) {
  const rows = [];
  for (let year = 0; year <= years; year++) {
    const periodsElapsed = Math.min(year * freq, totalPeriods);
    const ending = startValue * Math.pow(1 + r, periodsElapsed);
    const starting = year === 0 ? ending : rows[year - 1].ending;
    rows.push({ year, starting, interest: ending - starting, ending });
  }
  return { rows, columns: ["Year", "Starting Value", "Interest", "Ending Value"] };
}

function buildAnnuitySeries(payment, r, totalPeriods, freq, years, mode) {
  const rows = [];
  let balance = 0;
  for (let year = 0; year <= years; year++) {
    if (year === 0) {
      rows.push({ year, starting: 0, contribution: 0, interest: 0, ending: 0 });
      continue;
    }
    const contribution = payment * freq;
    const periodsElapsed = year * freq;
    let newBalance;
    if (mode === "fva") {
      // Future value if contributions had run for `periodsElapsed` periods.
      newBalance = r === 0 ? payment * periodsElapsed : payment * ((Math.pow(1 + r, periodsElapsed) - 1) / r);
    } else {
      // Present value of an annuity of `periodsElapsed` payments — telescopes
      // exactly to the full annuity's present value once year === years.
      newBalance = r === 0 ? payment * periodsElapsed : payment * ((1 - Math.pow(1 + r, -periodsElapsed)) / r);
    }
    const interest = newBalance - balance - contribution;
    rows.push({ year, starting: balance, contribution, interest, ending: newBalance });
    balance = newBalance;
  }
  const columns =
    mode === "fva"
      ? ["Year", "Starting Balance", "Contribution", "Interest", "Ending Balance"]
      : ["Year", "Present Value So Far", "Payments This Year", "Present Value Added", "Cumulative Present Value"];
  return { rows, columns };
}

function buildSimpleInterestSeries(principal, ratePercent, years) {
  const rows = [];
  const interestPerYear = (principal * ratePercent) / 100;
  for (let year = 0; year <= years; year++) {
    const ending = principal + interestPerYear * year;
    const starting = year === 0 ? ending : rows[year - 1].ending;
    rows.push({ year, starting, interest: year === 0 ? 0 : interestPerYear, ending });
  }
  return { rows, columns: ["Year", "Starting Value", "Interest", "Ending Value"] };
}

function buildLoanSeries(principal, monthlyRate, totalMonths, years) {
  const emi =
    monthlyRate === 0
      ? principal / totalMonths
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);

  // Full month-by-month amortisation, computed once and reused for both views.
  const monthlyRows = [];
  let balance = principal;
  for (let m = 1; m <= totalMonths; m++) {
    const opening = balance;
    const interestPortion = balance * monthlyRate;
    const principalPortion = Math.min(emi - interestPortion, balance);
    balance = Math.max(balance - principalPortion, 0);
    monthlyRows.push({ period: m, starting: opening, principalPaid: principalPortion, interestPaid: interestPortion, ending: balance });
  }

  // Yearly rows, aggregated from the monthly schedule so the two views always agree.
  const rows = [{ year: 0, starting: principal, principalPaid: 0, interestPaid: 0, ending: principal }];
  for (let year = 1; year <= years; year++) {
    const monthsThisYear = monthlyRows.slice((year - 1) * 12, year * 12);
    if (monthsThisYear.length === 0) break;
    rows.push({
      year,
      starting: monthsThisYear[0].starting,
      principalPaid: monthsThisYear.reduce((sum, m) => sum + m.principalPaid, 0),
      interestPaid: monthsThisYear.reduce((sum, m) => sum + m.interestPaid, 0),
      ending: monthsThisYear[monthsThisYear.length - 1].ending,
    });
  }

  return {
    rows,
    monthlyRows,
    columns: ["Year", "Opening Balance", "Principal Paid", "Interest Paid", "Closing Balance"],
    monthlyColumns: ["Month", "Opening Balance", "Principal Paid", "Interest Paid", "Closing Balance"],
  };
}

/* ---- Table rendering ---- */

function generateGrowthTable(type, seriesData, view = "yearly") {
  const useMonthly = type === "amort" && view === "monthly";
  const columns = useMonthly ? seriesData.monthlyColumns : seriesData.columns;
  const rows = useMonthly ? seriesData.monthlyRows : seriesData.rows;

  els.tableHead.innerHTML = `<tr>${columns.map((c) => `<th>${c}</th>`).join("")}</tr>`;

  els.tableBody.innerHTML = rows
    .map((row) => {
      if (type === "fv" || type === "pv" || type === "ci" || type === "si") {
        return `<tr><td>${row.year}</td><td>${row.year === 0 ? "—" : formatINR(row.starting)}</td><td>${row.year === 0 ? "—" : formatINR(row.interest)}</td><td>${formatINR(row.ending)}</td></tr>`;
      }
      if (type === "fva" || type === "pva") {
        return `<tr><td>${row.year}</td><td>${row.year === 0 ? "—" : formatINR(row.starting)}</td><td>${row.year === 0 ? "—" : formatINR(row.contribution)}</td><td>${row.year === 0 ? "—" : formatINR(row.interest)}</td><td>${formatINR(row.ending)}</td></tr>`;
      }
      // amort — same row shape for both the yearly and monthly views
      const period = row.year !== undefined ? row.year : row.period;
      return `<tr><td>${period}</td><td>${formatINR(row.starting)}</td><td>${formatINR(row.payment)}</td><td>${formatINR(row.principalPaid)}</td><td>${formatINR(row.interestPaid)}</td><td>${formatINR(row.ending)}</td></tr>`;
    })
    .join("");
}

/** Convert a series object into flat {values, labels} the chart can draw. */
function seriesToChartData(type, seriesData, view = "yearly") {
  return {
    values: seriesData.rows.map((r) => r.ending),
    labels: seriesData.rows.map((r) => "Y" + r.year),
  };
}

/** Render the Scenario Analysis comparison table. */
function generateScenarioTable(scenarios) {
  els.tableHead.innerHTML = `<tr><th>Scenario</th><th>Rate</th><th>Future Value</th><th>Interest Earned</th></tr>`;
  els.tableBody.innerHTML = scenarios
    .map((s) => `<tr><td>${s.label}</td><td>${s.rate}%</td><td>${formatINR(s.futureValue)}</td><td>${formatINR(s.interest)}</td></tr>`)
    .join("");
}

/* ---- Chart rendering (plain canvas, no external library) ---- */

/** Width available inside the chart card, excluding its padding, so the canvas never spills out. */
function chartContentWidth(canvas) {
  const parent = canvas.parentElement;
  const cs = getComputedStyle(parent);
  return Math.max(parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), 200);
}

function updateChart(chartData) {
  const canvas = els.chartCanvas;
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = chartContentWidth(canvas);
  const cssHeight = 300;
  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const { values, labels } = chartData;

  const padding = { top: 16, right: 16, bottom: 28, left: 64 };
  const chartW = cssWidth - padding.left - padding.right;
  const chartH = cssHeight - padding.top - padding.bottom;

  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#0f6e5c";
  const gridColor = "#e4e1d8";
  const textColor = "#66707d";

  const xForIndex = (i) => padding.left + (chartW * i) / Math.max(values.length - 1, 1);
  const yForValue = (v) => padding.top + chartH - ((v - minVal) / range) * chartH;

  // Horizontal gridlines + y-axis labels
  ctx.strokeStyle = gridColor;
  ctx.fillStyle = textColor;
  ctx.font = "11px Inter, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const gridLines = 4;
  for (let g = 0; g <= gridLines; g++) {
    const v = minVal + (range * g) / gridLines;
    const y = yForValue(v);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(cssWidth - padding.right, y);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillText(formatCompactINR(v), padding.left - 8, y);
  }

  // X-axis labels (thin out if too many)
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const step = Math.ceil(labels.length / 8);
  labels.forEach((label, i) => {
    if (i % step !== 0 && i !== labels.length - 1) return;
    ctx.fillText(label, xForIndex(i), cssHeight - padding.bottom + 8);
  });

  // Area fill
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = xForIndex(i);
    const y = yForValue(v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(xForIndex(values.length - 1), yForValue(minVal));
  ctx.lineTo(xForIndex(0), yForValue(minVal));
  ctx.closePath();
  ctx.fillStyle = hexToRgba(accent, 0.1);
  ctx.fill();

  // Line
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = xForIndex(i);
    const y = yForValue(v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.stroke();

  // Points
  values.forEach((v, i) => {
    ctx.beginPath();
    ctx.arc(xForIndex(i), yForValue(v), 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = accent;
    ctx.stroke();
  });
}

/** Draw several coloured lines sharing one set of axes — used by Scenario Analysis. */
function drawMultiLineChart(labels, seriesArr) {
  const canvas = els.chartCanvas;
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = chartContentWidth(canvas);
  const cssHeight = 300;
  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const allValues = seriesArr.flatMap((s) => s.values);
  const padding = { top: 16, right: 16, bottom: 28, left: 64 };
  const chartW = cssWidth - padding.left - padding.right;
  const chartH = cssHeight - padding.top - padding.bottom;
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;
  const gridColor = "#e4e1d8";
  const textColor = "#66707d";

  const xForIndex = (i) => padding.left + (chartW * i) / Math.max(labels.length - 1, 1);
  const yForValue = (v) => padding.top + chartH - ((v - minVal) / range) * chartH;

  ctx.strokeStyle = gridColor;
  ctx.fillStyle = textColor;
  ctx.font = "11px Inter, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const gridLines = 4;
  for (let g = 0; g <= gridLines; g++) {
    const v = minVal + (range * g) / gridLines;
    const y = yForValue(v);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(cssWidth - padding.right, y);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillText(formatCompactINR(v), padding.left - 8, y);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const step = Math.ceil(labels.length / 8);
  labels.forEach((label, i) => {
    if (i % step !== 0 && i !== labels.length - 1) return;
    ctx.fillText(label, xForIndex(i), cssHeight - padding.bottom + 8);
  });

  seriesArr.forEach((s) => {
    ctx.beginPath();
    s.values.forEach((v, i) => {
      const x = xForIndex(i);
      const y = yForValue(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.stroke();

    s.values.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(xForIndex(i), yForValue(v), 3, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = s.color;
      ctx.stroke();
    });
  });
}

/** Draw the amortization chart: outstanding balance vs cumulative interest paid. */
function drawAmortChart(amort, view) {
  const monthly = view === "monthly";
  const rows = monthly ? amort.monthlyRows : amort.rows;
  const prefix = monthly ? "M" : "Y";
  const labels = [prefix + "0", ...rows.map((r) => prefix + (monthly ? r.period : r.year))];
  let cumulative = 0;
  const seriesArr = [
    { name: "Outstanding balance", color: "#0f6e5c", values: [amort.principal, ...rows.map((r) => r.ending)] },
    { name: "Interest paid so far", color: "#c9922f", values: [0, ...rows.map((r) => (cumulative += r.interestPaid))] },
  ];
  drawMultiLineChart(labels, seriesArr);
  els.chartLegend.innerHTML = seriesArr
    .map((s) => `<span class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${s.name}</span>`)
    .join("");
}

/** Render the amortization table and chart for the chosen yearly/monthly view. */
function renderAmortView(amort, view) {
  generateGrowthTable("amort", amort, view);
  drawAmortChart(amort, view);
}

/** Build and draw the three-scenario comparison chart + legend. */
function renderScenarioChart(scenarios, years, freq, baseAmount) {
  const labels = [];
  const seriesArr = scenarios.map((s) => ({ name: s.label, color: s.color, values: [] }));
  for (let year = 0; year <= years; year++) {
    labels.push("Y" + year);
    scenarios.forEach((s, i) => {
      const r = s.rate / 100 / freq;
      const periodsElapsed = year * freq;
      seriesArr[i].values.push(baseAmount * Math.pow(1 + r, periodsElapsed));
    });
  }
  drawMultiLineChart(labels, seriesArr);
  els.chartLegend.innerHTML = seriesArr
    .map((s) => `<span class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${s.name}</span>`)
    .join("");
}

function formatCompactINR(value) {
  const abs = Math.abs(value);
  if (abs >= 1e7) return "₹" + (value / 1e7).toFixed(1) + "Cr";
  if (abs >= 1e5) return "₹" + (value / 1e5).toFixed(1) + "L";
  if (abs >= 1e3) return "₹" + (value / 1e3).toFixed(1) + "k";
  return "₹" + Math.round(value);
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ---- Result panel rendering ---- */

function displayResult(type, result) {
  const oldSplit = document.getElementById("split-bar");
  if (oldSplit) oldSplit.remove();
  els.resultEmpty.hidden = true;
  els.resultContent.hidden = false;

  els.resultLabel.textContent = "Your Result";
  els.resultValue.textContent = formatINR(result.main);
  els.resultKind.textContent = result.mainLabel;
  els.resultSentence.textContent = result.sentence;

  els.resultStats.innerHTML = result.stats
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");

  if (result.split) {
    const p = result.split.principalPct.toFixed(1);
    const i = result.split.interestPct.toFixed(1);
    els.resultStats.insertAdjacentHTML(
      "beforebegin",
      `<div class="split" id="split-bar">
        <div class="split-track" role="img" aria-label="Principal ${p}%, interest ${i}% of total payment">
          <span class="split-principal" style="width:${p}%"></span><span class="split-interest" style="width:${i}%"></span>
        </div>
        <div class="split-legend">
          <span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Principal ${p}%</span>
          <span class="legend-item"><span class="legend-dot" style="background:#c9922f"></span>Interest ${i}%</span>
        </div>
      </div>`
    );
  }

  els.copyBtn.classList.remove("is-copied");
  els.copyBtn.textContent = "Copy result";

  els.amortLinkBtn.hidden = type !== "emi";

  els.tableChartGrid.hidden = false;
  els.tableChartGrid.classList.remove("chart-only");
  els.chartTitle.textContent = "Investment growth over time";

  if (result.isScenario) {
    els.tableTitle.textContent = "Scenario comparison";
    els.scheduleToggle.hidden = true;
    els.chartLegend.hidden = false;
    generateScenarioTable(result.scenarios);
    renderScenarioChart(result.scenarios, result.years, result.freq, result.baseAmount);
  } else if (type === "amort") {
    state.scheduleView = "yearly";
    els.scheduleToggle.querySelectorAll(".toggle-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.view === "yearly"));
    els.scheduleToggle.hidden = false;
    els.chartLegend.hidden = false;
    els.tableTitle.textContent = "Loan amortisation schedule";
    els.chartTitle.textContent = "Balance vs interest paid";
    renderAmortView(result.amort, "yearly");
  } else if (type === "emi") {
    // The EMI domain shows the instalment and balance chart; the full schedule lives in Loan Amortization.
    els.scheduleToggle.hidden = true;
    els.chartLegend.hidden = true;
    els.tableChartGrid.classList.add("chart-only");
    els.chartTitle.textContent = "Outstanding loan balance";
    updateChart(seriesToChartData(type, result.chart, "yearly"));
  } else {
    els.scheduleToggle.hidden = true;
    els.chartLegend.hidden = true;
    els.tableTitle.textContent = "Year-by-year growth";
    generateGrowthTable(type, result.chart, state.scheduleView);
    updateChart(seriesToChartData(type, result.chart, state.scheduleView));
  }

  state.lastResult = { type, result };
}

/* ---- Reset ---- */

function resetCalculator() {
  els.form.reset();
  renderFields(state.type);
  els.formError.textContent = "";
  els.resultEmpty.hidden = false;
  els.resultContent.hidden = true;
  els.tableChartGrid.hidden = true;
  els.scheduleToggle.hidden = true;
  els.chartLegend.hidden = true;
  els.amortLinkBtn.hidden = true;
  state.scheduleView = "yearly";
  state.lastResult = null;
  state.lastRaw = null;
}

/* ---- Event wiring ---- */

function switchDomain(domain) {
  if (domain === state.domain) return;
  state.domain = domain;
  els.domainSwitch.querySelectorAll(".domain-btn").forEach((btn) => {
    const active = btn.dataset.domain === domain;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });
  els.tabs.hidden = domain !== "tvm";
  els.calcTitle.textContent = DOMAINS[domain].title;
  els.calcSubtitle.textContent = DOMAINS[domain].intro;
  switchType(domain === "tvm" ? state.lastTvmType : "emi");
}

function switchType(type) {
  state.type = type;
  if (type !== "emi") state.lastTvmType = type;
  els.tabs.querySelectorAll(".tab-btn").forEach((btn) => {
    const active = btn.dataset.type === type;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });
  renderFields(type);
  renderFormula(type);
  els.formError.textContent = "";
  els.resultEmpty.hidden = false;
  els.resultContent.hidden = true;
  els.tableChartGrid.hidden = true;
  els.scheduleToggle.hidden = true;
  els.chartLegend.hidden = true;
  els.amortLinkBtn.hidden = true;
  state.scheduleView = "yearly";
  state.lastResult = null;
  state.lastRaw = null;
}

els.domainSwitch.addEventListener("click", (e) => {
  const btn = e.target.closest(".domain-btn");
  if (!btn) return;
  switchDomain(btn.dataset.domain);
});

els.tabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (!btn) return;
  switchType(btn.dataset.type);
});

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const type = state.type;
  const raw = readRawInputs(type);
  const { valid, errors } = validateInputs(type, raw);

  paintFieldErrors(type, errors);

  if (!valid) {
    els.formError.textContent = "Please fix the highlighted fields before calculating.";
    return;
  }

  // Convert to numbers for the maths layer.
  const values = {};
  CALC_TYPES[type].fields.forEach((field) => {
    values[field.id] = field.kind === "freq" ? Number(raw[field.id]) : Number(raw[field.id]);
  });

  try {
    const result = runCalculation(type, values);
    if (!Number.isFinite(result.main)) {
      els.formError.textContent = "These values produce an invalid result. Please check your inputs.";
      return;
    }
    els.formError.textContent = "";
    state.lastRaw = raw;
    displayResult(type, result);
  } catch (err) {
    els.formError.textContent = "Something went wrong with that calculation. Please check your inputs.";
  }
});

els.resetBtn.addEventListener("click", resetCalculator);

els.scheduleToggle.addEventListener("click", (e) => {
  const btn = e.target.closest(".toggle-btn");
  if (!btn || !state.lastResult || state.lastResult.type !== "amort") return;
  state.scheduleView = btn.dataset.view;
  els.scheduleToggle.querySelectorAll(".toggle-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
  renderAmortView(state.lastResult.result.amort, state.scheduleView);
});

// EMI domain -> hand the same loan over to Loan Amortization and run it.
els.amortLinkBtn.addEventListener("click", () => {
  if (!state.lastRaw || state.lastResult?.type !== "emi") return;
  const raw = state.lastRaw;
  switchDomain("tvm");
  switchType("amort");
  ["loanAmount", "rate", "years", "tenureUnit"].forEach((id) => {
    const input = document.getElementById(`f-${id}`);
    if (input) input.value = raw[id];
  });
  if (els.form.requestSubmit) els.form.requestSubmit();
  else els.form.dispatchEvent(new Event("submit", { cancelable: true }));
  document.getElementById("calculator").scrollIntoView({ behavior: "smooth", block: "start" });
});

els.formulaToggle.addEventListener("click", () => {
  const expanded = els.formulaToggle.getAttribute("aria-expanded") === "true";
  els.formulaToggle.setAttribute("aria-expanded", String(!expanded));
  els.formulaContent.hidden = expanded;
});

els.copyBtn.addEventListener("click", async () => {
  if (!state.lastResult) return;
  const { result } = state.lastResult;
  const text = `${result.mainLabel}: ${formatINR(result.main)}\n${result.sentence}`;
  try {
    await navigator.clipboard.writeText(text);
    els.copyBtn.textContent = "Copied ✓";
    els.copyBtn.classList.add("is-copied");
    setTimeout(() => {
      els.copyBtn.textContent = "Copy result";
      els.copyBtn.classList.remove("is-copied");
    }, 1800);
  } catch {
    els.formError.textContent = "Could not copy automatically — please select and copy manually.";
  }
});

window.addEventListener("resize", () => {
  if (!state.lastResult) return;
  const { type, result } = state.lastResult;
  if (result.isScenario) {
    renderScenarioChart(result.scenarios, result.years, result.freq, result.baseAmount);
  } else if (type === "amort") {
    drawAmortChart(result.amort, state.scheduleView);
  } else {
    updateChart(seriesToChartData(type, result.chart, "yearly"));
  }
});

/* ---- Init ---- */

renderFields(state.type);
renderFormula(state.type);
