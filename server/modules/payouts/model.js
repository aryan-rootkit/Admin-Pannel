const mongoose = require("mongoose");

const { Types } = mongoose.Schema;

/**
 * Unified payouts collection: subscriptions vs dev payouts.
 * Legacy fields (personId, paidAt, clientId, category) remain optional so old rows load unchanged.
 */
const PayoutSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["subscription", "payout"],
      index: true,
    },
    amount: { type: Number, min: 0 },
    paymentDate: { type: Date },
    currency: { type: String, default: "INR" },
    notes: { type: String, trim: true },
    category: { type: String, trim: true },
    /** Subscription */
    name: { type: String, trim: true },
    status: { type: String, trim: true },
    /** Dev payout */
    projectId: { type: Types.ObjectId, ref: "Project", index: true },
    peopleId: { type: Types.ObjectId, ref: "Person", index: true },
    /** @deprecated use `peopleId` */
    personId: { type: Types.ObjectId, ref: "Person", index: true },
    /** @deprecated not in new spec; kept for legacy rows */
    clientId: { type: Types.ObjectId, ref: "Client", index: true },
    /** @deprecated use `paymentDate` */
    paidAt: { type: Date },
  },
  { timestamps: true, collection: "payouts", strict: false }
);

const Payout =
  mongoose.models.Payout || mongoose.model("Payout", PayoutSchema);

module.exports = { Payout };
