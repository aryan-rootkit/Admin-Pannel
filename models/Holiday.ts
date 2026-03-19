import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  description?: string;
  date: Date;
  country: string;
  type: string;
  iso?: string;
  year?: number;
  raw?: any;
}

const HolidaySchema: Schema<IHoliday> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    country: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
    },
    iso: {
      type: String,
    },
    year: {
      type: Number,
      index: true,
    },
    raw: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

HolidaySchema.index({ country: 1, year: 1, date: 1, name: 1 }, { unique: true });

const Holiday: Model<IHoliday> =
  mongoose.models.Holiday || mongoose.model<IHoliday>('Holiday', HolidaySchema);

export default Holiday;

