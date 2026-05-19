const mongoose = require("mongoose");
const {
  PfTransaction,
  PfLoan,
  PfLoanRepayment,
  PfSubscription,
  PfStatementImport,
  PfStatementLine,
} = require("./model");
const { parseBankCsv } = require("./csvParse");
const { computeRootkitBusinessMonth } = require("./rootkitBusiness");

function oid(id) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
}

function ymNow() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function utcMonthBounds(ym) {
  const parts = String(ym || "").split("-");
  const y = Number(parts[0]);
  const mo = Number(parts[1]);
  if (!y || !mo || mo < 1 || mo > 12) {
    const d = new Date();
    return utcMonthBounds(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const start = new Date(Date.UTC(y, mo - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, mo, 1, 0, 0, 0, 0));
  return { start, end, ym: `${y}-${String(mo).padStart(2, "0")}` };
}

function prevMonthBounds(ym) {
  const { start } = utcMonthBounds(ym);
  const d = new Date(start.getTime());
  d.setUTCMonth(d.getUTCMonth() - 1);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return utcMonthBounds(`${y}-${String(m).padStart(2, "0")}`);
}

function isTransfer(cat) {
  return String(cat || "").toLowerCase() === "transfer";
}

async function sumFlowInRange(matchExtra, flow) {
  const m = { ...matchExtra, flow };
  const agg = await PfTransaction.aggregate([
    { $match: m },
    { $group: { _id: null, t: { $sum: "$amount" } } },
  ]);
  return agg[0]?.t || 0;
}

async function cashNetLifetime() {
  const ins = await sumFlowInRange({}, "in");
  const outs = await sumFlowInRange({}, "out");
  return ins - outs;
}

async function monthlyNonTransfer(flow, start, end) {
  const rows = await PfTransaction.find({
    flow,
    occurredAt: { $gte: start, $lt: end },
  }).lean();
  let t = 0;
  for (const r of rows) {
    if (isTransfer(r.category)) continue;
    t += Number(r.amount) || 0;
  }
  return t;
}

async function repaidTotal(loanId) {
  const lid = typeof loanId === "string" ? oid(loanId) : loanId;
  const agg = await PfLoanRepayment.aggregate([
    { $match: { loanId: lid } },
    { $group: { _id: null, t: { $sum: "$amount" } } },
  ]);
  return agg[0]?.t || 0;
}

function momMeta(curr, prev) {
  if (prev == null || !Number.isFinite(prev) || prev === 0) {
    return { pct: null, label: "No prior month to compare" };
  }
  const pct = ((curr - prev) / prev) * 100;
  return { pct, label: `${pct >= 0 ? "↑" : "↓"} ${Math.abs(pct).toFixed(1)}% from last month` };
}

async function categoryTotals(start, end) {
  const rows = await PfTransaction.find({
    flow: "out",
    occurredAt: { $gte: start, $lt: end },
  }).lean();
  const map = new Map();
  for (const r of rows) {
    if (isTransfer(r.category)) continue;
    const k = r.category || "misc";
    map.set(k, (map.get(k) || 0) + (Number(r.amount) || 0));
  }
  return map;
}

async function lastNMonthsSeries(n) {
  const end = new Date();
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (n - 1), 1));
  const txns = await PfTransaction.find({
    occurredAt: { $gte: start, $lte: end },
  })
    .select("flow amount occurredAt category")
    .lean();

  const keys = [];
  for (let i = 0; i < n; i += 1) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (n - 1 - i), 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const byKey = Object.fromEntries(keys.map((k) => [k, { month: k, inflow: 0, outflow: 0 }]));
  for (const t of txns) {
    const d = new Date(t.occurredAt);
    const k = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    if (!byKey[k]) continue;
    const amt = Number(t.amount) || 0;
    if (isTransfer(t.category)) continue;
    if (t.flow === "in") byKey[k].inflow += amt;
    else byKey[k].outflow += amt;
  }
  return keys.map((k) => byKey[k]);
}

async function avgMonthlyBurn(lastMonths = 3) {
  const end = new Date();
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - lastMonths, 1));
  const rows = await PfTransaction.find({
    flow: "out",
    occurredAt: { $gte: start, $lt: end },
  }).lean();
  let total = 0;
  for (const r of rows) {
    if (isTransfer(r.category)) continue;
    total += Number(r.amount) || 0;
  }
  return total / lastMonths;
}

async function outstandingBorrowed() {
  const list = await PfLoan.find({
    loanKind: { $in: ["borrowed_bank", "borrowed_person"] },
    status: { $ne: "settled" },
  }).lean();
  let s = 0;
  for (const L of list) {
    const pr = Number(L.principal) || 0;
    const rep = await repaidTotal(L._id);
    s += Math.max(0, pr - rep);
  }
  return s;
}

async function outstandingLent() {
  const list = await PfLoan.find({ loanKind: "lent_to_person", status: { $ne: "settled" } }).lean();
  let s = 0;
  for (const L of list) {
    const pr = Number(L.principal) || 0;
    const rep = await repaidTotal(L._id);
    s += Math.max(0, pr - rep);
  }
  return s;
}

const getSummary = async (req, res) => {
  try {
    const ym = req.query.month || ymNow();
    const { start, end } = utcMonthBounds(ym);
    const prev = prevMonthBounds(ym);

    const [
      cashNet,
      incomeCurr,
      incomePrev,
      expenseCurr,
      expensePrev,
      debtOutstanding,
      receivableOutstanding,
      catMap,
      series,
      burnAvg,
      loans,
      subs,
      pendingImportLines,
      rootkitCurr,
      rootkitPrev,
    ] = await Promise.all([
      cashNetLifetime(),
      monthlyNonTransfer("in", start, end),
      monthlyNonTransfer("in", prev.start, prev.end),
      monthlyNonTransfer("out", start, end),
      monthlyNonTransfer("out", prev.start, prev.end),
      outstandingBorrowed(),
      outstandingLent(),
      categoryTotals(start, end),
      lastNMonthsSeries(6),
      avgMonthlyBurn(3),
      PfLoan.find().sort({ updatedAt: -1 }).limit(50).lean(),
      PfSubscription.find({ active: true }).sort({ nextDueDate: 1 }).lean(),
      PfStatementLine.countDocuments({ status: "pending" }),
      computeRootkitBusinessMonth(start, end),
      computeRootkitBusinessMonth(prev.start, prev.end),
    ]);

    const netWorth = cashNet + receivableOutstanding - debtOutstanding;

    const cats = [...catMap.entries()].sort((a, b) => b[1] - a[1]);
    const biggestCategory = cats.length ? { name: cats[0][0], amount: cats[0][1] } : null;

    const now = Date.now();
    const week = 7 * 86400000;
    const upcomingSubs = subs.filter((s) => {
      if (!s.nextDueDate) return false;
      const t = new Date(s.nextDueDate).getTime();
      return t >= now && t <= now + week;
    });
    const overdueSubs = subs.filter((s) => {
      if (!s.nextDueDate) return false;
      return new Date(s.nextDueDate).getTime() < now;
    });

    const subMonthlyEquiv = subs.reduce((acc, s) => {
      const a = Number(s.amount) || 0;
      if (s.billingCycle === "yearly") return acc + a / 12;
      if (s.billingCycle === "quarterly") return acc + a / 3;
      if (s.billingCycle === "weekly") return acc + a * 4.33;
      return acc + a;
    }, 0);

    const prevBurnProxy = expensePrev / 3;

    const estimatedSavings = rootkitCurr.rootkitNet - expenseCurr;
    const spendRatePct =
      rootkitCurr.rootkitNet > 0 ? (expenseCurr / rootkitCurr.rootkitNet) * 100 : null;

    const insights = [];
    if (biggestCategory && expenseCurr > 0) {
      const pct = (biggestCategory.amount / expenseCurr) * 100;
      insights.push({
        id: "biggest_cat",
        text: `Largest spend category this month: ${biggestCategory.name} (${pct.toFixed(0)}% of expenses).`,
      });
    }
    if (expenseCurr > 0 && expensePrev > 0) {
      const d = ((expenseCurr - expensePrev) / expensePrev) * 100;
      if (Math.abs(d) >= 5) {
        insights.push({
          id: "expense_mom",
          text:
            d > 0
              ? `You spent ${d.toFixed(0)}% more than last month (non-transfer outflows).`
              : `Spending is ${Math.abs(d).toFixed(0)}% lower than last month.`,
        });
      }
    }
    if (debtOutstanding > 0) {
      insights.push({
        id: "debt",
        text: `₹${Math.round(debtOutstanding).toLocaleString("en-IN")} total principal still to repay on active borrowings.`,
      });
    }
    if (receivableOutstanding > 0) {
      insights.push({
        id: "receive",
        text: `₹${Math.round(receivableOutstanding).toLocaleString("en-IN")} outstanding that others owe you.`,
      });
    }
    if (overdueSubs.length) {
      insights.push({
        id: "sub_overdue",
        text: `${overdueSubs.length} subscription(s) look overdue on next due date.`,
      });
    }
    if (pendingImportLines > 0) {
      insights.push({
        id: "imports",
        text: `${pendingImportLines} bank import line(s) waiting for review.`,
      });
    }
    if (rootkitCurr.revenueReceived > 0 || rootkitCurr.projectPayoutCost > 0) {
      insights.push({
        id: "rootkit_margin",
        text: `Rootkit margin this month (rev − project payouts): ₹${Math.round(rootkitCurr.rootkitMargin).toLocaleString("en-IN")} before company subscriptions & expenses.`,
      });
    }
    if (rootkitCurr.rootkitNet !== 0 && expenseCurr > 0) {
      if (estimatedSavings >= 0) {
        insights.push({
          id: "rootkit_savings",
          text: `After personal spend (₹${Math.round(expenseCurr).toLocaleString("en-IN")}), about ₹${Math.round(estimatedSavings).toLocaleString("en-IN")} of business net may be available to keep this month.`,
        });
      } else {
        insights.push({
          id: "rootkit_overspend",
          text: `Personal spend exceeds business net by ₹${Math.round(Math.abs(estimatedSavings)).toLocaleString("en-IN")} this month — you're drawing more than Rootkit earned after costs.`,
        });
      }
    }

    const loansWithOut = await Promise.all(
      loans.map(async (L) => {
        const rep = await repaidTotal(L._id);
        const pr = Number(L.principal) || 0;
        return {
          ...L,
          repaid: rep,
          outstanding: Math.max(0, pr - rep),
        };
      })
    );

    return res.json({
      month: utcMonthBounds(ym).ym,
      kpis: {
        totalBalance: cashNet,
        cashNet,
        netWorth,
        monthlyIncome: incomeCurr,
        monthlyExpenses: expenseCurr,
        debtLoans: debtOutstanding,
        moneyToReceive: receivableOutstanding,
        monthlyBurn: burnAvg,
        momIncome: momMeta(incomeCurr, incomePrev),
        momExpense: momMeta(expenseCurr, expensePrev),
        momBurn: momMeta(burnAvg, prevBurnProxy),
      },
      cashflowSeries: series,
      categoryBreakdown: cats.map(([name, amount]) => ({ name, amount })),
      subscriptions: {
        active: subs,
        upcoming: upcomingSubs,
        overdue: overdueSubs,
        monthlyEquivalentEstimate: subMonthlyEquiv,
      },
      loans: loansWithOut,
      insights,
      pendingImportLines,
      rootkitBusiness: {
        revenueReceived: rootkitCurr.revenueReceived,
        projectPayoutCost: rootkitCurr.projectPayoutCost,
        projectPayoutLineCount: rootkitCurr.projectPayoutLineCount,
        operatingExpenses: rootkitCurr.operatingExpenses,
        rootkitMargin: rootkitCurr.rootkitMargin,
        rootkitNet: rootkitCurr.rootkitNet,
        ledgerRootkitIncome: rootkitCurr.ledgerRootkitIncome,
        estimatedSavings,
        spendRatePct,
        personalSpend: expenseCurr,
        momMargin: momMeta(rootkitCurr.rootkitMargin, rootkitPrev.rootkitMargin),
        momNet: momMeta(rootkitCurr.rootkitNet, rootkitPrev.rootkitNet),
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const listTransactions = async (req, res) => {
  try {
    const q = {};
    if (req.query.from) q.occurredAt = { ...(q.occurredAt || {}), $gte: new Date(req.query.from) };
    if (req.query.to) q.occurredAt = { ...(q.occurredAt || {}), $lte: new Date(req.query.to) };
    if (req.query.flow) q.flow = req.query.flow;
    if (req.query.category) q.category = req.query.category;
    if (req.query.minAmount != null) q.amount = { ...(q.amount || {}), $gte: Number(req.query.minAmount) };
    if (req.query.maxAmount != null) q.amount = { ...(q.amount || {}), $lte: Number(req.query.maxAmount) };
    if (req.query.search) {
      const s = String(req.query.search).trim();
      q.$or = [{ title: new RegExp(s, "i") }, { notes: new RegExp(s, "i") }, { category: new RegExp(s, "i") }];
    }
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 200));
    const rows = await PfTransaction.find(q).sort({ occurredAt: -1 }).limit(limit).lean();
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const createTransaction = async (req, res) => {
  try {
    const { flow, category, amount, occurredAt, title, notes, source, loanId, subscriptionId } = req.body || {};
    if (!flow || !["in", "out"].includes(flow)) return res.status(400).json({ message: "flow is required" });
    if (!category) return res.status(400).json({ message: "category is required" });
    if (amount == null || Number(amount) < 0) return res.status(400).json({ message: "amount is required" });
    const row = await PfTransaction.create({
      flow,
      category: String(category).trim(),
      amount: Number(amount),
      occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
      title: title != null ? String(title) : "",
      notes: notes != null ? String(notes) : "",
      source: source === "import" ? "import" : "manual",
      loanId: loanId ? oid(loanId) : undefined,
      subscriptionId: subscriptionId ? oid(subscriptionId) : undefined,
    });
    return res.status(201).json(row);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const row = await PfTransaction.findById(req.params.id);
    if (!row) return res.status(404).json({ message: "Not found" });
    const b = req.body || {};
    if (b.flow != null) row.flow = b.flow;
    if (b.category != null) row.category = String(b.category).trim();
    if (b.amount != null) row.amount = Number(b.amount);
    if (b.occurredAt != null) row.occurredAt = new Date(b.occurredAt);
    if (b.title != null) row.title = String(b.title);
    if (b.notes != null) row.notes = String(b.notes);
    await row.save();
    return res.json(row);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const row = await PfTransaction.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ message: "Not found" });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const listLoans = async (_req, res) => {
  try {
    const loans = await PfLoan.find().sort({ createdAt: -1 }).lean();
    const out = [];
    for (const L of loans) {
      const rep = await repaidTotal(L._id);
      const pr = Number(L.principal) || 0;
      out.push({
        ...L,
        repaid: rep,
        outstanding: Math.max(0, pr - rep),
      });
    }
    return res.json(out);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const createLoan = async (req, res) => {
  try {
    const { loanKind, partyName, principal, status, startDate, dueDate, notes } = req.body || {};
    if (!loanKind || !partyName || principal == null)
      return res.status(400).json({ message: "loanKind, partyName, principal required" });
    const row = await PfLoan.create({
      loanKind,
      partyName: String(partyName).trim(),
      principal: Number(principal),
      status: status || "active",
      startDate: startDate ? new Date(startDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes != null ? String(notes) : "",
    });
    return res.status(201).json(row);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const updateLoan = async (req, res) => {
  try {
    const row = await PfLoan.findById(req.params.id);
    if (!row) return res.status(404).json({ message: "Not found" });
    const b = req.body || {};
    if (b.partyName != null) row.partyName = String(b.partyName).trim();
    if (b.principal != null) row.principal = Number(b.principal);
    if (b.status != null) row.status = b.status;
    if (b.loanKind != null) row.loanKind = b.loanKind;
    if (b.dueDate !== undefined) row.dueDate = b.dueDate ? new Date(b.dueDate) : null;
    if (b.notes != null) row.notes = String(b.notes);
    await row.save();
    const rep = await repaidTotal(row._id);
    const pr = Number(row.principal) || 0;
    return res.json({ ...row.toObject(), repaid: rep, outstanding: Math.max(0, pr - rep) });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const deleteLoan = async (req, res) => {
  try {
    await PfLoanRepayment.deleteMany({ loanId: req.params.id });
    const row = await PfLoan.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ message: "Not found" });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const addRepayment = async (req, res) => {
  try {
    const loan = await PfLoan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    const { amount, paidAt, notes } = req.body || {};
    if (amount == null || Number(amount) <= 0) return res.status(400).json({ message: "amount required" });
    const rep = await PfLoanRepayment.create({
      loanId: loan._id,
      amount: Number(amount),
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      notes: notes != null ? String(notes) : "",
    });
    const totalRep = await repaidTotal(loan._id);
    if (totalRep >= loan.principal - 1e-6) {
      loan.status = "settled";
      await loan.save();
    }
    return res.status(201).json(rep);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const deleteRepayment = async (req, res) => {
  try {
    const rep = await PfLoanRepayment.findById(req.params.rid);
    if (!rep || String(rep.loanId) !== String(req.params.id)) return res.status(404).json({ message: "Not found" });
    await rep.deleteOne();
    const loan = await PfLoan.findById(req.params.id);
    if (loan) {
      const totalRep = await repaidTotal(loan._id);
      if (totalRep < loan.principal) loan.status = "active";
      await loan.save();
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const listSubscriptions = async (_req, res) => {
  try {
    const rows = await PfSubscription.find().sort({ nextDueDate: 1, name: 1 }).lean();
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const createSubscription = async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.name || b.amount == null) return res.status(400).json({ message: "name and amount required" });
    const row = await PfSubscription.create({
      name: String(b.name).trim(),
      amount: Number(b.amount),
      billingCycle: b.billingCycle || "monthly",
      cycleDays: b.cycleDays != null ? Number(b.cycleDays) : null,
      nextDueDate: b.nextDueDate ? new Date(b.nextDueDate) : null,
      autoRenew: Boolean(b.autoRenew),
      category: b.category != null ? String(b.category) : "subscriptions",
      notes: b.notes != null ? String(b.notes) : "",
      active: b.active !== false,
    });
    return res.status(201).json(row);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const updateSubscription = async (req, res) => {
  try {
    const row = await PfSubscription.findById(req.params.id);
    if (!row) return res.status(404).json({ message: "Not found" });
    const b = req.body || {};
    if (b.name != null) row.name = String(b.name).trim();
    if (b.amount != null) row.amount = Number(b.amount);
    if (b.billingCycle != null) row.billingCycle = b.billingCycle;
    if (b.cycleDays !== undefined) row.cycleDays = b.cycleDays;
    if (b.nextDueDate !== undefined) row.nextDueDate = b.nextDueDate ? new Date(b.nextDueDate) : null;
    if (b.autoRenew != null) row.autoRenew = Boolean(b.autoRenew);
    if (b.category != null) row.category = String(b.category);
    if (b.notes != null) row.notes = String(b.notes);
    if (b.active != null) row.active = Boolean(b.active);
    await row.save();
    return res.json(row);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const deleteSubscription = async (req, res) => {
  try {
    const row = await PfSubscription.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ message: "Not found" });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const createImport = async (req, res) => {
  try {
    const { csvText, fileName } = req.body || {};
    if (!csvText || typeof csvText !== "string") return res.status(400).json({ message: "csvText required" });
    let lines;
    try {
      lines = parseBankCsv(csvText);
    } catch (e) {
      return res.status(400).json({ message: e.message || "CSV parse failed" });
    }
    if (!lines.length) return res.status(400).json({ message: "No rows parsed from CSV" });
    const imp = await PfStatementImport.create({
      fileName: fileName ? String(fileName) : "statement.csv",
      status: "review",
      rowCount: lines.length,
    });
    const docs = lines.map((L, i) => ({
      importId: imp._id,
      rowIndex: i,
      statementDate: L.statementDate,
      description: L.description,
      amountSigned: L.amountSigned,
      raw: L.raw,
      status: "pending",
    }));
    await PfStatementLine.insertMany(docs);
    return res.status(201).json({ import: imp, linesCreated: docs.length });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const listImports = async (_req, res) => {
  try {
    const rows = await PfStatementImport.find().sort({ createdAt: -1 }).limit(40).lean();
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const listImportLines = async (req, res) => {
  try {
    const impId = oid(req.params.id);
    if (!impId) return res.status(400).json({ message: "Invalid import id" });
    const q = { importId: impId };
    if (req.query.status) q.status = req.query.status;
    const rows = await PfStatementLine.find(q).sort({ rowIndex: 1 }).limit(500).lean();
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const rejectLine = async (req, res) => {
  try {
    const impId = oid(req.params.id);
    const lineId = oid(req.params.lineId);
    if (!impId || !lineId) return res.status(400).json({ message: "Invalid id" });
    const line = await PfStatementLine.findOne({
      _id: lineId,
      importId: impId,
    });
    if (!line) return res.status(404).json({ message: "Line not found" });
    line.status = "rejected";
    await line.save();
    return res.json(line);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const approveLine = async (req, res) => {
  try {
    const impId = oid(req.params.id);
    const lineId = oid(req.params.lineId);
    if (!impId || !lineId) return res.status(400).json({ message: "Invalid id" });
    const line = await PfStatementLine.findOne({
      _id: lineId,
      importId: impId,
    });
    if (!line) return res.status(404).json({ message: "Line not found" });
    if (line.status === "approved") return res.status(400).json({ message: "Already approved" });
    const { category, title } = req.body || {};
    if (!category) return res.status(400).json({ message: "category required to approve" });
    const signed = Number(line.amountSigned) || 0;
    if (signed === 0) return res.status(400).json({ message: "Line has zero amount" });
    const flow = signed > 0 ? "in" : "out";
    const amt = Math.abs(signed);
    const txn = await PfTransaction.create({
      flow,
      category: String(category).trim(),
      amount: amt,
      occurredAt: line.statementDate || new Date(),
      title: title != null ? String(title) : line.description || "Bank import",
      notes: `Import line ${line._id}`,
      source: "import",
      importLineId: line._id,
    });
    line.status = "approved";
    line.transactionId = txn._id;
    await line.save();
    return res.json({ line, transaction: txn });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const getActivity = async (_req, res) => {
  try {
    const [txns, reps, imps] = await Promise.all([
      PfTransaction.find().sort({ occurredAt: -1 }).limit(25).lean(),
      PfLoanRepayment.find().sort({ paidAt: -1 }).limit(15).populate("loanId", "partyName loanKind").lean(),
      PfStatementImport.find().sort({ createdAt: -1 }).limit(8).lean(),
    ]);
    const items = [];
    for (const t of txns) {
      items.push({
        id: `txn-${t._id}`,
        kind: "transaction",
        at: t.occurredAt || t.createdAt,
        title: t.title || t.category,
        detail: `${t.flow === "in" ? "In" : "Out"} · ${t.category}`,
        amount: t.amount,
        flow: t.flow,
      });
    }
    for (const r of reps) {
      items.push({
        id: `rep-${r._id}`,
        kind: "repayment",
        at: r.paidAt || r.createdAt,
        title: "Loan repayment",
        detail: r.loanId && r.loanId.partyName ? `${r.loanId.partyName}` : "Loan",
        amount: r.amount,
        flow: "out",
      });
    }
    for (const i of imps) {
      items.push({
        id: `imp-${i._id}`,
        kind: "import",
        at: i.createdAt,
        title: "Bank statement imported",
        detail: i.fileName || "CSV",
        amount: null,
        flow: null,
      });
    }
    items.sort((a, b) => new Date(b.at) - new Date(a.at));
    return res.json(items.slice(0, 40));
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = {
  getSummary,
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  listLoans,
  createLoan,
  updateLoan,
  deleteLoan,
  addRepayment,
  deleteRepayment,
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  createImport,
  listImports,
  listImportLines,
  approveLine,
  rejectLine,
  getActivity,
};
