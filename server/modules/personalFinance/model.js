const mongoose = require("mongoose");

const { Types } = mongoose.Schema;

/** Ledger: actual cash in/out (manual or approved import). */
const PfTransactionSchema = new mongoose.Schema(
  {
    flow: { type: String, enum: ["in", "out"], required: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    occurredAt: { type: Date, required: true, index: true },
    title: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    source: { type: String, enum: ["manual", "import"], default: "manual", index: true },
    importLineId: { type: Types.ObjectId, ref: "PfStatementLine", default: null },
    loanId: { type: Types.ObjectId, ref: "PfLoan", default: null },
    subscriptionId: { type: Types.ObjectId, ref: "PfSubscription", default: null },
  },
  { timestamps: true, collection: "pf_transactions" }
);

PfTransactionSchema.index({ occurredAt: -1, flow: 1 });
PfTransactionSchema.index({ title: "text", notes: "text" });

const PfLoanSchema = new mongoose.Schema(
  {
    loanKind: {
      type: String,
      enum: ["borrowed_bank", "borrowed_person", "lent_to_person"],
      required: true,
      index: true,
    },
    partyName: { type: String, required: true, trim: true },
    principal: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["active", "settled", "overdue"], default: "active", index: true },
    startDate: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true, collection: "pf_loans" }
);

const PfLoanRepaymentSchema = new mongoose.Schema(
  {
    loanId: { type: Types.ObjectId, ref: "PfLoan", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    paidAt: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true, collection: "pf_loan_repayments" }
);

const PfSubscriptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    billingCycle: {
      type: String,
      enum: ["weekly", "monthly", "quarterly", "yearly", "custom"],
      default: "monthly",
    },
    cycleDays: { type: Number, min: 1, default: null },
    nextDueDate: { type: Date, default: null, index: true },
    autoRenew: { type: Boolean, default: true },
    category: { type: String, trim: true, default: "subscriptions" },
    notes: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: "pf_subscriptions" }
);

const PfStatementImportSchema = new mongoose.Schema(
  {
    fileName: { type: String, trim: true, default: "statement.csv" },
    status: {
      type: String,
      enum: ["parsed", "review", "completed", "failed"],
      default: "parsed",
      index: true,
    },
    rowCount: { type: Number, default: 0 },
    errorMessage: { type: String, trim: true, default: "" },
  },
  { timestamps: true, collection: "pf_statement_imports" }
);

const PfStatementLineSchema = new mongoose.Schema(
  {
    importId: { type: Types.ObjectId, ref: "PfStatementImport", required: true, index: true },
    rowIndex: { type: Number, required: true },
    statementDate: { type: Date, default: null },
    description: { type: String, trim: true, default: "" },
    /** Positive = credit to account, negative = debit (money out). */
    amountSigned: { type: Number, default: 0 },
    raw: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    transactionId: { type: Types.ObjectId, ref: "PfTransaction", default: null },
  },
  { timestamps: true, collection: "pf_statement_lines" }
);

PfStatementLineSchema.index({ importId: 1, rowIndex: 1 }, { unique: true });

const PfTransaction =
  mongoose.models.PfTransaction || mongoose.model("PfTransaction", PfTransactionSchema);
const PfLoan = mongoose.models.PfLoan || mongoose.model("PfLoan", PfLoanSchema);
const PfLoanRepayment =
  mongoose.models.PfLoanRepayment || mongoose.model("PfLoanRepayment", PfLoanRepaymentSchema);
const PfSubscription =
  mongoose.models.PfSubscription || mongoose.model("PfSubscription", PfSubscriptionSchema);
const PfStatementImport =
  mongoose.models.PfStatementImport || mongoose.model("PfStatementImport", PfStatementImportSchema);
const PfStatementLine =
  mongoose.models.PfStatementLine || mongoose.model("PfStatementLine", PfStatementLineSchema);

module.exports = {
  PfTransaction,
  PfLoan,
  PfLoanRepayment,
  PfSubscription,
  PfStatementImport,
  PfStatementLine,
};
