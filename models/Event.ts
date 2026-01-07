import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Calendar Event model
 * Stores calendar events, tasks, and deadlines
 */
export interface IEvent extends Document {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: 'event' | 'task' | 'deadline';
  project?: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema<IEvent> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    start: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    end: {
      type: Date,
      required: [true, 'End date is required'],
    },
    type: {
      type: String,
      enum: ['event', 'task', 'deadline'],
      default: 'event',
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
    color: {
      type: String,
      default: '#3b82f6', // Default blue
    },
  },
  {
    timestamps: true,
  }
);

const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;
