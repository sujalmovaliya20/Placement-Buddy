import mongoose, { Document, Schema } from 'mongoose';
import { env } from '../config/env';

export interface IStudent extends Document {
  roll_no: string;
  name: string;
  branch: string;
  cgpa: number;
  phone: string;
  email: string;
  resume_url: string | null;
  skills: string[];
  links: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    roll_no: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
    },
    cgpa: {
      type: Number,
      required: [true, 'CGPA is required'],
      min: [0, 'CGPA cannot be less than 0'],
      max: [10, 'CGPA cannot be greater than 10'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\+?[0-9\s-]{10,20}$/, 'Please provide a valid phone number (10 to 20 digits, optionally starting with +)'],
    },
    email: {
      type: String,
      required: [true, 'Student email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return v.endsWith(`@${env.COLLEGE_EMAIL_DOMAIN}`);
        },
        message: (props) => `${props.value} is not a valid college email address. It must end with @${env.COLLEGE_EMAIL_DOMAIN}`,
      },
    },
    resume_url: {
      type: String,
      default: null,
    },
    skills: {
      type: [String],
      default: [],
    },
    links: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Student = mongoose.model<IStudent>('Student', studentSchema);
