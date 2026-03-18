import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    company: { type: String },
    address: { type: String },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Lead', 'Proposal', 'Overdue', 'Won', 'Lost', 'Archived'],
      default: 'Lead',
    },
    notes: { type: String },
  },
  { timestamps: true, strict: false }
);

export default mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);
