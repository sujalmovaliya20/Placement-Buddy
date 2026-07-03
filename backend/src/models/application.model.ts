import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IApplication extends Document {
  student_id: Types.ObjectId;
  drive_id: Types.ObjectId;
  custom_answers: Record<string, any>;
  status: 'applied' | 'shortlisted' | 'rejected';
  applied_at: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    student_id: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
      index: true,
    },
    drive_id: {
      type: Schema.Types.ObjectId,
      ref: 'Drive',
      required: [true, 'Drive ID is required'],
      index: true,
    },
    custom_answers: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: {
        values: ['applied', 'shortlisted', 'rejected'],
        message: '{VALUE} is not a valid application status',
      },
      default: 'applied',
    },
    applied_at: {
      type: Date,
      default: Date.now,
    },
  }
);

// Compound unique index to prevent duplicate student application per drive
applicationSchema.index({ student_id: 1, drive_id: 1 }, { unique: true });

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
