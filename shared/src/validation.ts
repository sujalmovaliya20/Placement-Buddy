import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  roll_no: z.string().min(1, 'Roll number is required'),
  name: z.string().min(1, 'Name is required'),
  branch: z.string().min(1, 'Branch is required'),
  cgpa: z.coerce.number().min(0, 'CGPA cannot be less than 0').max(10, 'CGPA cannot be greater than 10'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20, 'Phone number is too long'),
  resume_url: z.string().url('Please enter a valid URL').nullable().optional(),
  skills: z.array(z.string()).optional(),
  links: z.record(z.any()).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  roll_no: z.string().min(1, 'Roll number is required'),
  branch: z.string().min(1, 'Branch is required'),
  cgpa: z.coerce.number().min(0, 'CGPA cannot be less than 0').max(10, 'CGPA cannot be greater than 10'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20, 'Phone number is too long'),
  resume_url: z.string().url('Please enter a valid URL').nullable().optional(),
  skills: z.array(z.string()).optional(),
  links: z.object({
    github: z.string().url('Please enter a valid GitHub URL').or(z.literal('')).optional(),
    linkedin: z.string().url('Please enter a valid LinkedIn URL').or(z.literal('')).optional(),
    portfolio: z.string().url('Please enter a valid Portfolio URL').or(z.literal('')).optional(),
  }).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

