import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Team member model
 * Stores team member information including role, hourly rate, and availability
 */
export interface ITeam extends Document {
  name: string;
  email: string;
  role: string;
  hourlyRate: number;
  availability: 'Available' | 'Busy' | 'On Leave';
  avatar?: string;
  bio?: string;
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
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: 0,
    },
    availability: {
      type: String,
      enum: ['Available', 'Busy', 'On Leave'],
      default: 'Available',
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      trim: true,
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
