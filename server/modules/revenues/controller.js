/**
 * Example populated query (nested client on project):
 * Revenue.find()
 *   .populate({ path: "projectId", select: "name budget clientId",
 *     populate: { path: "clientId", select: "name email contact" } });
 */
const { Revenue } = require("./model");

function normalizeRevenueLean(doc) {
  const total =
    doc.totalAmount != null ? doc.totalAmount : doc.amount != null ? doc.amount : 0;
  const advance = doc.advanceAmount != null ? doc.advanceAmount : 0;
  const pending =
    doc.pendingAmount != null
      ? doc.pendingAmount
      : Math.max(0, Number(total) - Number(advance));
  const paymentDate = doc.paymentDate || doc.receivedAt;
  const paymentType =
    doc.paymentType && ["Advance", "Installment", "Final"].includes(doc.paymentType)
      ? doc.paymentType
      : "Installment";
  return {
    ...doc,
    totalAmount: total,
    advanceAmount: advance,
    pendingAmount: pending,
    paymentDate,
    paymentType,
  };
}

const getRevenues = async (_req, res) => {
  try {
    const revenues = await Revenue.find()
      .populate({
        path: "projectId",
        select: "name budget clientId",
        populate: { path: "clientId", select: "name email contact" },
      })
      .lean();

    revenues.sort((a, b) => {
      const da = new Date(a.paymentDate || a.receivedAt || 0).getTime();
      const db = new Date(b.paymentDate || b.receivedAt || 0).getTime();
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
    const {
      projectId,
      totalAmount,
      advanceAmount,
      pendingAmount,
      paymentDate,
      currency,
      description,
      paymentType,
    } = req.body || {};
    if (!projectId) return res.status(400).json({ message: "projectId is required" });
    const total = totalAmount != null ? Number(totalAmount) : 0;
    const advance = advanceAmount != null ? Number(advanceAmount) : 0;
    const pending =
      pendingAmount != null
        ? Number(pendingAmount)
        : Math.max(0, total - advance);

    const pt =
      paymentType && ["Advance", "Installment", "Final"].includes(paymentType)
        ? paymentType
        : "Installment";

    const doc = await Revenue.create({
      projectId,
      totalAmount: total,
      advanceAmount: advance,
      pendingAmount: pending,
      paymentDate: paymentDate || undefined,
      currency: currency || "INR",
      description,
      paymentType: pt,
    });
    const populated = await Revenue.findById(doc._id)
      .populate({
        path: "projectId",
        select: "name budget clientId",
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
    const {
      projectId,
      totalAmount,
      advanceAmount,
      pendingAmount,
      paymentDate,
      currency,
      description,
      paymentType,
    } = req.body || {};
    const patch = {};
    if (projectId !== undefined) patch.projectId = projectId;
    if (totalAmount !== undefined) patch.totalAmount = Number(totalAmount);
    if (advanceAmount !== undefined) patch.advanceAmount = Number(advanceAmount);
    if (pendingAmount !== undefined) patch.pendingAmount = Number(pendingAmount);
    if (paymentDate !== undefined) patch.paymentDate = paymentDate || null;
    if (currency !== undefined) patch.currency = currency;
    if (description !== undefined) patch.description = description;
    if (paymentType !== undefined) {
      patch.paymentType = ["Advance", "Installment", "Final"].includes(paymentType)
        ? paymentType
        : "Installment";
    }

    const doc = await Revenue.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    }).lean();
    if (!doc) return res.status(404).json({ message: "Revenue not found" });
    const populated = await Revenue.findById(doc._id)
      .populate({
        path: "projectId",
        select: "name budget clientId",
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
