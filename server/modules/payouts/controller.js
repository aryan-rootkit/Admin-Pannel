/**
 * Example populated query:
 * Payout.find()
 *   .populate("projectId", "name budget")
 *   .populate("peopleId", "name email contact")
 *   .populate("personId", "name email contact");
 */
const { Payout } = require("./model");

function effectivePayoutType(doc) {
  if (doc.type === "subscription" || doc.type === "payout") return doc.type;
  if (doc.name && !doc.personId && !doc.peopleId && !doc.projectId)
    return "subscription";
  return "payout";
}

function normalizePayoutLean(doc) {
  const type = effectivePayoutType(doc);
  const paymentDate = doc.paymentDate || doc.paidAt;
  const peopleId = doc.peopleId || doc.personId;
  return {
    ...doc,
    type,
    paymentDate,
    peopleId,
  };
}

const getPayouts = async (_req, res) => {
  try {
    const payouts = await Payout.find()
      .populate("projectId", "name budget")
      .populate("peopleId", "name email contact role")
      .populate("personId", "name email contact role")
      .populate("clientId", "name email contact")
      .lean();

    payouts.sort((a, b) => {
      const da = new Date(a.paymentDate || a.paidAt || 0).getTime();
      const db = new Date(b.paymentDate || b.paidAt || 0).getTime();
      return db - da;
    });

    const normalized = payouts.map(normalizePayoutLean);
    console.log("[GET /api/payouts] count:", normalized.length);
    return res.json(normalized);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const createPayout = async (req, res) => {
  try {
    const body = req.body || {};
    const type = body.type === "subscription" ? "subscription" : "payout";
    const amount = Number(body.amount);
    if (Number.isNaN(amount) || amount < 0)
      return res.status(400).json({ message: "amount is required" });
    const paymentDate = body.paymentDate ? new Date(body.paymentDate) : new Date();

    let doc;
    if (type === "subscription") {
      if (!body.name) return res.status(400).json({ message: "name is required" });
      doc = await Payout.create({
        type: "subscription",
        name: body.name,
        amount,
        paymentDate,
        status: body.status || "active",
        currency: body.currency || "INR",
        notes: body.notes,
        category: body.category,
      });
    } else {
      if (!body.projectId || !(body.peopleId || body.personId))
        return res.status(400).json({
          message: "projectId and peopleId are required for dev payouts",
        });
      doc = await Payout.create({
        type: "payout",
        projectId: body.projectId,
        peopleId: body.peopleId || body.personId,
        amount,
        paymentDate,
        currency: body.currency || "INR",
        notes: body.notes,
        category: body.category,
      });
    }

    const populated = await Payout.findById(doc._id)
      .populate("projectId", "name budget")
      .populate("peopleId", "name email contact role")
      .populate("personId", "name email contact role")
      .populate("clientId", "name email contact")
      .lean();
    return res.status(201).json(normalizePayoutLean(populated));
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const updatePayout = async (req, res) => {
  try {
    const body = req.body || {};
    const patch = {};
    if (body.type !== undefined) patch.type = body.type;
    if (body.amount !== undefined) patch.amount = Number(body.amount);
    if (body.paymentDate !== undefined) patch.paymentDate = body.paymentDate || null;
    if (body.currency !== undefined) patch.currency = body.currency;
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.name !== undefined) patch.name = body.name;
    if (body.status !== undefined) patch.status = body.status;
    if (body.projectId !== undefined) patch.projectId = body.projectId;
    if (body.peopleId !== undefined) patch.peopleId = body.peopleId;
    if (body.personId !== undefined) patch.personId = body.personId;
    if (body.clientId !== undefined) patch.clientId = body.clientId;
    if (body.category !== undefined) patch.category = body.category;

    const doc = await Payout.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: false,
    }).lean();
    if (!doc) return res.status(404).json({ message: "Payout not found" });
    const populated = await Payout.findById(doc._id)
      .populate("projectId", "name budget")
      .populate("peopleId", "name email contact role")
      .populate("personId", "name email contact role")
      .populate("clientId", "name email contact")
      .lean();
    return res.json(normalizePayoutLean(populated));
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const deletePayout = async (req, res) => {
  try {
    const removed = await Payout.findByIdAndDelete(req.params.id).lean();
    if (!removed) return res.status(404).json({ message: "Payout not found" });
    return res.json({ ok: true, id: req.params.id });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = { getPayouts, createPayout, updatePayout, deletePayout };
