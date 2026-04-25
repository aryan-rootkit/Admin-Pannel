const mongoose = require("mongoose");

const { Types } = mongoose.Schema;

const RevenueSchema = new mongoose.Schema(
  {
    projectId: {
      type: Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    totalAmount: { type: Number, min: 0 },
    advanceAmount: { type: Number, min: 0, default: 0 },
    pendingAmount: { type: Number, min: 0 },
    paymentDate: { type: Date },
    /** @deprecated use `totalAmount` / `paymentDate` */
    amount: { type: Number, min: 0 },
    currency: { type: String, default: "INR" },
    receivedAt: { type: Date },
    description: { type: String, trim: true },
    /** Payment / installment classification */
    paymentType: {
      type: String,
      enum: ["Advance", "Installment", "Final"],
      default: "Installment",
    },
  },
  { timestamps: true, collection: "revenues" }
);

const Revenue =
  mongoose.models.Revenue || mongoose.model("Revenue", RevenueSchema);

module.exports = { Revenue };
