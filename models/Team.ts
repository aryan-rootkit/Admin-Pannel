import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Team member model
 * Stores team member information including role, hourly rate, and availability
 */
export interface ITeam extends Document {
  name: string;
  email: string;
  contact?: string;
  employmentType: 'In-House' | 'Contractor';
  role: 'Developer' | 'UI-UX' | 'Marketing' | 'Sales' | 'BD';
  subRole?: string; // Frontend/Backend/Fullstack/Flutter/etc
  skills?: string[];
  hourlyRate: number;
  hoursWorkedThisWeek: number;
  avatar?: string;
  assignedProjects: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema: Schema<ITeam> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    contact: {
      type: String,
      trim: true,
    },
    employmentType: {
      type: String,
      enum: ['In-House', 'Contractor'],
      default: 'In-House',
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['Developer', 'UI-UX', 'Marketing', 'Sales', 'BD'],
      trim: true,
    },
    subRole: {
      type: String,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: 0,
    },
    hoursWorkedThisWeek: {
      type: Number,
      default: 0,
      min: 0,
    },
    avatar: {
      type: String,
      default: '',
    },
    assignedProjects: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default Team;
