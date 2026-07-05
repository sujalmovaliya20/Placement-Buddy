import { z } from 'zod';

const baseStudentFields = {
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  email: z.string().email('Please enter a valid email address'),
  contact_number: z.string().regex(/^[6-9]\d{9}$/, 'Contact number must be a valid 10-digit Indian mobile number'),
  present_address: z.string().min(1, 'Present address is required'),
  course: z.string().min(1, 'Course is required'),
  enrollment_number: z.string().min(1, 'Enrollment number is required'),
  tenth_result: z.coerce.number().min(0, '10th result percentage cannot be less than 0').max(100, '10th result percentage cannot exceed 100'),
  twelfth_result: z.coerce.number().min(0, '12th result percentage cannot be less than 0').max(100, '12th result percentage cannot exceed 100'),
  cgpa_previous_semester: z.coerce.number().min(0, 'CGPA cannot be less than 0').max(10, 'CGPA cannot be greater than 10'),
  sem1_sgpa: z.preprocess((val) => (val === '' || val === undefined ? null : val), z.coerce.number().min(0).max(10).nullable().optional()),
  sem2_sgpa: z.preprocess((val) => (val === '' || val === undefined ? null : val), z.coerce.number().min(0).max(10).nullable().optional()),
  sem3_sgpa: z.preprocess((val) => (val === '' || val === undefined ? null : val), z.coerce.number().min(0).max(10).nullable().optional()),
  sem4_sgpa: z.preprocess((val) => (val === '' || val === undefined ? null : val), z.coerce.number().min(0).max(10).nullable().optional()),
  sem5_sgpa: z.preprocess((val) => (val === '' || val === undefined ? null : val), z.coerce.number().min(0).max(10).nullable().optional()),
  sem6_sgpa: z.preprocess((val) => (val === '' || val === undefined ? null : val), z.coerce.number().min(0).max(10).nullable().optional()),
  sem7_sgpa: z.preprocess((val) => (val === '' || val === undefined ? null : val), z.coerce.number().min(0).max(10).nullable().optional()),
  sem8_sgpa: z.preprocess((val) => (val === '' || val === undefined ? null : val), z.coerce.number().min(0).max(10).nullable().optional()),
  experience_months: z.preprocess((val) => (val === '' || val === undefined ? 0 : val), z.coerce.number().min(0, 'Experience cannot be negative').optional()),
  resume_url: z.string().url('Please enter a valid URL').nullable().optional().or(z.literal('')),
  skills: z.array(z.string()).optional(),
  links: z.object({
    github: z.string().url('Please enter a valid GitHub URL').or(z.literal('')).optional(),
    linkedin: z.string().url('Please enter a valid LinkedIn URL').or(z.literal('')).optional(),
    portfolio: z.string().url('Please enter a valid Portfolio URL').or(z.literal('')).optional(),
  }).optional(),
};

export const signupSchema = z.object({
  ...baseStudentFields,
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  ...baseStudentFields,
}).omit({ email: true });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
