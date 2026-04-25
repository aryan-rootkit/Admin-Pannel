const mongoose = require("mongoose");

const { Types } = mongoose.Schema;

/**
 * Payment transactions (installments) per project.
 * `totalAmount` / `paymentDate` remain for legacy documents.
 */
const RevenueSchema = new mongoose.Schema(
  {
    projectId: {
      type: Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    /** Line amount for this payment (preferred; falls back to totalAmount in app code) */
    amount: { type: Number, min: 0 },
    /** Canonical payment date (preferred; falls back to paymentDate) */
    date: { type: Date },
    paymentType: {
      type: String,
      enum: ["Advance", "Installment", "Final"],
      default: "Installment",
    },
    status: {
      type: String,
      enum: ["Received", "Pending", "Failed"],
      default: "Received",
    },
    totalAmount: { type: Number, min: 0 },
    advanceAmount: { type: Number, min: 0, default: 0 },
    pendingAmount: { type: Number, min: 0 },
    paymentDate: { type: Date },
    currency: { type: String, default: "INR" },
    receivedAt: { type: Date },
    description: { type: String, trim: true },
  },
  { timestamps: true, collection: "revenues", strict: false }
);

const Revenue =
  mongoose.models.Revenue || mongoose.model("Revenue", RevenueSchema);

module.exports = { Revenue };
