import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Project model
 * Stores project information including client, team assignments, budget, and status
 */
export interface IProject extends Document {
  name: string;
  description: string;
  client: string;
  startDate: Date;
  deadline: Date;
  budget: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'On Hold';
  assignedTeam: mongoose.Types.ObjectId[];
  tasks: {
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'completed';
    assignedTo: mongoose.Types.ObjectId;
    dueDate: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema<IProject> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
    },
    client: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
      min: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'On Hold'],
      default: 'Pending',
    },
    assignedTeam: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Team',
      },
    ],
    tasks: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          default: '',
        },
        status: {
          type: String,
          enum: ['todo', 'in-progress', 'completed'],
          default: 'todo',
        },
        assignedTo: {
          type: Schema.Types.ObjectId,
          ref: 'Team',
        },
        dueDate: {
          type: Date,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;
