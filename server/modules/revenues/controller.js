/**
 * Example populated query (nested client on project):
 * Revenue.find()
 *   .populate({ path: "projectId", select: "name budget clientId",
 *     populate: { path: "clientId", select: "name email contact" } });
 */
const { Revenue } = require("./model");
const { Project } = require("../projects/model");
const { revenueLineAmount, revenueLineStatus, revenueLineDate } = require("../lib/financeHelpers");
const { projectReceivesNewPayments } = require("../lib/projectFinance");

function normalizeRevenueLean(doc) {
  const amount = revenueLineAmount(doc);
  const advance = doc.advanceAmount != null ? doc.advanceAmount : 0;
  const pending =
    doc.pendingAmount != null
      ? doc.pendingAmount
      : Math.max(0, Number(amount) - Number(advance));
  const date = revenueLineDate(doc);
  const status = revenueLineStatus(doc);
  const paymentType =
    doc.paymentType && ["Advance", "Installment", "Final"].includes(doc.paymentType)
      ? doc.paymentType
      : "Installment";
  return {
    ...doc,
    amount,
    totalAmount: amount,
    advanceAmount: advance,
    pendingAmount: pending,
    date,
    paymentDate: date,
    paymentType,
    type: paymentType,
    status,
  };
}

const getRevenues = async (_req, res) => {
  try {
    const revenues = await Revenue.find()
      .populate({
        path: "projectId",
        select: "name budget clientId totalValue status",
        populate: { path: "clientId", select: "name email contact" },
      })
      .lean();

    revenues.sort((a, b) => {
      const da = new Date(revenueLineDate(a) || 0).getTime();
      const db = new Date(revenueLineDate(b) || 0).getTime();
      return db - da;
    });

    const normalized = revenues.map(normalizeRevenueLean);
    console.log("[GET /api/revenues] count:", normalized.length);
    return res.json(normalized);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const createRevenue = async (req, res) => {
  try {
    const body = req.body || {};
    const {
      projectId,
      amount,
      totalAmount,
      advanceAmount,
      date,
      paymentDate,
      currency,
      description,
      paymentType,
      type,
      status,
    } = body;
    if (!projectId) return res.status(400).json({ message: "projectId is required" });

    const proj = await Project.findById(projectId).select("status").lean();
    if (!proj) return res.status(400).json({ message: "Project not found" });
    if (!projectReceivesNewPayments(proj.status)) {
      return res.status(400).json({
        message: "This project is cancelled; new payments cannot be recorded.",
      });
    }

    const line =
      amount != null && amount !== ""
        ? Number(amount)
        : totalAmount != null && totalAmount !== ""
          ? Number(totalAmount)
          : 0;
    const advance = advanceAmount != null ? Number(advanceAmount) : 0;
    /** Line-level remainder only (project pending is derived from Project + all payments). */
    const pending = Math.max(0, line - advance);

    const ptRaw = type || paymentType;
    const pt =
      ptRaw && ["Advance", "Installment", "Final"].includes(ptRaw)
        ? ptRaw
        : "Installment";

    const st =
      status && ["Received", "Pending", "Failed"].includes(status) ? status : "Received";

    const dt = date || paymentDate || undefined;

    const doc = await Revenue.create({
      projectId,
      amount: line,
      totalAmount: line,
      advanceAmount: advance,
      pendingAmount: pending,
      date: dt || undefined,
      paymentDate: dt || undefined,
      currency: currency || "INR",
      description,
      paymentType: pt,
      status: st,
    });
    const populated = await Revenue.findById(doc._id)
      .populate({
        path: "projectId",
        select: "name budget clientId totalValue status",
        populate: { path: "clientId", select: "name email contact" },
      })
      .lean();
    return res.status(201).json(normalizeRevenueLean(populated));
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const updateRevenue = async (req, res) => {
  try {
    const body = req.body || {};
    const {
      projectId,
      amount,
      totalAmount,
      advanceAmount,
      date,
      paymentDate,
      currency,
      description,
      paymentType,
      type,
      status,
    } = body;
    const existing = await Revenue.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: "Revenue not found" });

    const targetProjectId = projectId !== undefined ? projectId : existing.projectId;
    const targetProj = await Project.findById(targetProjectId).select("status").lean();
    if (!targetProj) return res.status(400).json({ message: "Project not found" });
    if (
      !projectReceivesNewPayments(targetProj.status) &&
      String(targetProjectId) !== String(existing.projectId)
    ) {
      return res.status(400).json({
        message: "Cannot attach or move payments to a cancelled project.",
      });
    }

    const patch = {};
    if (projectId !== undefined) patch.projectId = projectId;
    if (amount !== undefined || totalAmount !== undefined) {
      const line =
        amount !== undefined && amount !== ""
          ? Number(amount)
          : totalAmount !== undefined && totalAmount !== ""
            ? Number(totalAmount)
            : undefined;
      if (line !== undefined && !Number.isNaN(line)) {
        patch.amount = line;
        patch.totalAmount = line;
      }
    }
    if (advanceAmount !== undefined) patch.advanceAmount = Number(advanceAmount);
    if (date !== undefined || paymentDate !== undefined) {
      const dt = date !== undefined ? date : paymentDate;
      patch.date = dt || null;
      patch.paymentDate = dt || null;
    }
    if (currency !== undefined) patch.currency = currency;
    if (description !== undefined) patch.description = description;
    const ptRaw = type !== undefined ? type : paymentType;
    if (ptRaw !== undefined) {
      patch.paymentType = ["Advance", "Installment", "Final"].includes(ptRaw)
        ? ptRaw
        : "Installment";
    }
    if (status !== undefined) {
      patch.status = ["Received", "Pending", "Failed"].includes(status)
        ? status
        : "Received";
    }

    const lineAfter =
      patch.amount !== undefined && !Number.isNaN(patch.amount)
        ? patch.amount
        : revenueLineAmount(existing);
    const advAfter =
      patch.advanceAmount !== undefined
        ? Number(patch.advanceAmount)
        : Number(existing.advanceAmount ?? 0);
    patch.pendingAmount = Math.max(0, Number(lineAfter) - Number(advAfter));

    const doc = await Revenue.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    }).lean();
    if (!doc) return res.status(404).json({ message: "Revenue not found" });
    const populated = await Revenue.findById(doc._id)
      .populate({
        path: "projectId",
        select: "name budget clientId totalValue status",
        populate: { path: "clientId", select: "name email contact" },
      })
      .lean();
    return res.json(normalizeRevenueLean(populated));
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const deleteRevenue = async (req, res) => {
  try {
    const removed = await Revenue.findByIdAndDelete(req.params.id).lean();
    if (!removed) return res.status(404).json({ message: "Revenue not found" });
    return res.json({ ok: true, id: req.params.id });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = { getRevenues, createRevenue, updateRevenue, deleteRevenue };
