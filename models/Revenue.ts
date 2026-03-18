import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Revenue model
 * Tracks revenue, invoices, and expenses
 */
export interface IRevenue extends Document {
  type: 'income' | 'expense' | 'invoice';
  amount: number;
  description: string;
  date: Date;
  project?: mongoose.Types.ObjectId;
  status?: 'pending' | 'paid' | 'overdue';
  invoiceNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RevenueSchema: Schema<IRevenue> = new Schema(
  {
    type: {
      type: String,
      enum: ['income', 'expense', 'invoice'],
      required: [true, 'Type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending',
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

const Revenue: Model<IRevenue> = mongoose.models.Revenue || mongoose.model<IRevenue>('Revenue', RevenueSchema);

export default Revenue;
