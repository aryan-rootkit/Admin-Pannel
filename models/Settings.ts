import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Settings model
 * Stores agency configuration and settings
 */
export interface ISettings extends Document {
  agencyName: string;
  agencyLogo?: string;
  emailSignature: string;
  taxRate: number;
  invoiceSettings: {
    prefix: string;
    nextNumber: number;
    paymentTerms: number; // days
  };
  teamStructure: {
    roles: string[];
    departments: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema<ISettings> = new Schema(
  {
    agencyName: {
      type: String,
      required: [true, 'Agency name is required'],
      default: 'Rootkit Development',
      trim: true,
    },
    agencyLogo: {
      type: String,
      default: '',
    },
    emailSignature: {
      type: String,
      default: 'Best regards,\nRootkit Development Team',
      trim: true,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    invoiceSettings: {
      prefix: {
        type: String,
        default: 'INV',
        trim: true,
      },
      nextNumber: {
        type: Number,
        default: 1,
        min: 1,
      },
      paymentTerms: {
        type: Number,
        default: 30,
        min: 0,
      },
    },
    teamStructure: {
      roles: [
        {
          type: String,
        },
      ],
      departments: [
        {
          type: String,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Add static method type
interface SettingsModel extends Model<ISettings> {
  getSettings(): Promise<ISettings>;
}

// Ensure only one settings document exists
(SettingsSchema.statics as SettingsModel).getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings: SettingsModel = mongoose.models.Settings || mongoose.model<ISettings, SettingsModel>('Settings', SettingsSchema);

export default Settings;
