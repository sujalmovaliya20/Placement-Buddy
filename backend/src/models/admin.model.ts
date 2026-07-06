import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdmin extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'tpo' | 'superadmin';
  google_refresh_token?: string;
  google_connected: boolean;
  google_token_expiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdmin>(
  {
    name: {
      type: String,
      required: [true, 'Admin name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Admin email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['tpo', 'superadmin'],
        message: '{VALUE} is not a valid admin role',
      },
      required: [true, 'Admin role is required'],
    },
    google_refresh_token: {
      type: String,
      select: false,
      default: null,
    },
    google_connected: {
      type: Boolean,
      default: false,
    },
    google_token_expiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password || '', salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

export const Admin = mongoose.model<IAdmin>('Admin', adminSchema);
