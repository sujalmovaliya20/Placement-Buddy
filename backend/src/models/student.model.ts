import mongoose, { Document, Schema } from 'mongoose';
import { env } from '../config/env';
import bcrypt from 'bcryptjs';

export interface IStudent extends Document {
  first_name: string;
  last_name: string;
  name: string;
  date_of_birth: Date;
  email: string;
  contact_number: string;
  present_address: string;
  course: string;
  enrollment_number: string;
  tenth_result: number;
  twelfth_result: number;
  cgpa_previous_semester: number;
  sem1_sgpa?: number | null;
  sem2_sgpa?: number | null;
  sem3_sgpa?: number | null;
  sem4_sgpa?: number | null;
  sem5_sgpa?: number | null;
  sem6_sgpa?: number | null;
  sem7_sgpa?: number | null;
  sem8_sgpa?: number | null;
  experience_months?: number;
  password?: string;
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
    first_name: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    last_name: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    date_of_birth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    email: {
      type: String,
      required: [true, 'Student email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          const email = v.toLowerCase();
          return email.endsWith(`@${env.COLLEGE_EMAIL_DOMAIN}`) || email.endsWith('@gmail.com');
        },
        message: (props) => `${props.value} is not a valid email address. It must end with @${env.COLLEGE_EMAIL_DOMAIN} or @gmail.com`,
      },
    },
    contact_number: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number'],
    },
    present_address: {
      type: String,
      required: [true, 'Present address is required'],
      trim: true,
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
    },
    enrollment_number: {
      type: String,
      required: [true, 'Enrollment number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    tenth_result: {
      type: Number,
      required: [true, '10th result percentage is required'],
      min: [0, '10th result cannot be less than 0'],
      max: [100, '10th result cannot be greater than 100'],
    },
    twelfth_result: {
      type: Number,
      required: [true, '12th result percentage is required'],
      min: [0, '12th result cannot be less than 0'],
      max: [100, '12th result cannot be greater than 100'],
    },
    cgpa_previous_semester: {
      type: Number,
      required: [true, 'CGPA is required'],
      min: [0, 'CGPA cannot be less than 0'],
      max: [10, 'CGPA cannot be greater than 10'],
    },
    sem1_sgpa: { type: Number, min: 0, max: 10, default: null },
    sem2_sgpa: { type: Number, min: 0, max: 10, default: null },
    sem3_sgpa: { type: Number, min: 0, max: 10, default: null },
    sem4_sgpa: { type: Number, min: 0, max: 10, default: null },
    sem5_sgpa: { type: Number, min: 0, max: 10, default: null },
    sem6_sgpa: { type: Number, min: 0, max: 10, default: null },
    sem7_sgpa: { type: Number, min: 0, max: 10, default: null },
    sem8_sgpa: { type: Number, min: 0, max: 10, default: null },
    experience_months: {
      type: Number,
      default: 0,
      min: [0, 'Experience months cannot be negative'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual getter for full name
studentSchema.virtual('name').get(function (this: IStudent) {
  return `${this.first_name} ${this.last_name}`.trim();
});

studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password || '', salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

export const Student = mongoose.model<IStudent>('Student', studentSchema);
