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

export const createDriveSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  role: z.string().min(1, 'Role is required'),
  deadline: z.preprocess(
    (val) => (typeof val === 'string' ? new Date(val) : val),
    z.date({ invalid_type_error: 'Deadline must be a valid date' })
  ),
  source_type: z.enum(['native', 'google_form']),
  google_form_url: z.string().url('Please enter a valid URL').nullable().optional().or(z.literal('')),
  field_mapping: z.record(z.string(), z.string()).nullable().optional(),
  manual_field_mapping: z
    .array(
      z.object({
        form_label: z.string().min(1, 'Form label is required'),
        profile_field: z.string().min(1, 'Profile field is required'),
      })
    )
    .nullable()
    .optional(),
  custom_fields: z
    .array(
      z.object({
        key: z.string().min(1, 'Field key is required'),
        label: z.string().min(1, 'Field label is required'),
        type: z.string().min(1, 'Field type is required'),
        required: z.boolean(),
      })
    )
    .optional(),
  status: z.enum(['draft', 'open', 'in_progress', 'completed', 'cancelled']).optional(),
});

export const updateDriveSchema = createDriveSchema.partial();

export const createApplicationSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required'),
  drive_id: z.string().min(1, 'Drive ID is required'),
  custom_answers: z.record(z.string(), z.any()).optional(),
  status: z.enum(['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'selected', 'rejected', 'withdrawn']).optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'selected', 'rejected', 'withdrawn']),
  note: z.string().optional(),
});

// Admin-specific Google form parser validations
export const parseGoogleFormSchema = z.object({
  googleFormUrl: z.string().url('Please enter a valid Google Form URL'),
});

export const parseFormStructureSchema = z.object({
  editor_url: z.string().url('Please enter a valid Google Form editor URL'),
});

export const parsePrefillReferenceSchema = z.object({
  prefill_url: z.string().url('Please enter a valid Google Form prefilled reference URL'),
});

export const updateMappingSchema = z.object({
  field_mapping: z.record(z.string(), z.string()).nullable().optional(),
  manual_field_mapping: z
    .array(
      z.object({
        form_label: z.string().min(1, 'Form label is required'),
        profile_field: z.string().min(1, 'Profile field is required'),
      })
    )
    .nullable()
    .optional(),
});

export const listQuerySchema = z.object({
  page: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1).optional()),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  studentId: z.string().optional(),
  driveId: z.string().optional(),
});

