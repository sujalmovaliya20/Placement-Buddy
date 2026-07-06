/**
 * Student entity — represents a registered student on the placement platform.
 *
 * Used by both frontend (profile display, forms) and backend (validation, queries).
 */

export interface Student {
  /** Unique database-generated ID */
  id: string;
  _id?: string;

  /** First name of the student */
  first_name: string;

  /** Last name of the student */
  last_name: string;

  /** Date of birth (YYYY-MM-DD string representation) */
  date_of_birth: string;

  /** Institutional or Gmail address (unique) */
  email: string;

  /** Contact phone number (10 digit Indian number) */
  contact_number: string;

  /** Present address of the student */
  present_address: string;

  /** Course enrolled (e.g. B.Tech Computer Engineering) */
  course: string;

  /** Enrollment/registration number (unique, indexed) */
  enrollment_number: string;

  /** 10th class result percentage (0-100) */
  tenth_result: number;

  /** 12th class result percentage (0-100) */
  twelfth_result: number;

  /** Cumulative Grade Point Average up to previous semester (0.0 – 10.0) */
  cgpa_previous_semester: number;

  // Semester wise SGPA (optional & nullable)
  sem1_sgpa?: number | null;
  sem2_sgpa?: number | null;
  sem3_sgpa?: number | null;
  sem4_sgpa?: number | null;
  sem5_sgpa?: number | null;
  sem6_sgpa?: number | null;
  sem7_sgpa?: number | null;
  sem8_sgpa?: number | null;

  /** Months of professional experience (default 0) */
  experience_months?: number;

  /** URL to the uploaded resume (cloud storage path) */
  resume_url: string | null;

  /** List of skill tags */
  skills?: string[];

  /** Social media links */
  links?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    [key: string]: any;
  };

  /** ISO 8601 timestamp */
  createdAt: string;

  /** ISO 8601 timestamp */
  updatedAt: string;
}

/** Payload for creating a new student */
export type CreateStudentPayload = Omit<Student, 'id' | 'createdAt' | 'updatedAt'>;

/** Payload for updating an existing student */
export type UpdateStudentPayload = Partial<CreateStudentPayload>;

export type PlacementStatus = 'unplaced' | 'placed' | 'dream_placed';
export type Department = string;

