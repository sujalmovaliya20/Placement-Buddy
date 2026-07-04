import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotificationLog extends Document {
  drive_id: Types.ObjectId;
  group_id: string;
  message: string;
  status: 'sent' | 'failed';
  error_message?: string;
  sent_at: Date;
}

const notificationLogSchema = new Schema<INotificationLog>(
  {
    drive_id: {
      type: Schema.Types.ObjectId,
      ref: 'Drive',
      required: [true, 'Drive ID is required'],
      index: true,
    },
    group_id: {
      type: String,
      required: [true, 'WhatsApp group ID is required'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['sent', 'failed'],
        message: '{VALUE} is not a valid status',
      },
      required: [true, 'Notification status is required'],
    },
    error_message: {
      type: String,
    },
    sent_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const NotificationLog = mongoose.model<INotificationLog>('NotificationLog', notificationLogSchema);
