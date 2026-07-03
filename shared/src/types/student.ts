/**
 * Student entity — represents a registered student on the placement platform.
 *
 * Used by both frontend (profile display, forms) and backend (validation, queries).
 */

export type PlacementStatus = 'unplaced' | 'placed' | 'opted_out' | 'not_eligible';

export type Department =
  | 'computer_science'
  | 'information_technology'
  | 'electronics'
  | 'electrical'
  | 'mechanical'
  | 'civil'
  | 'chemical'
  | 'other';

export interface Student {
  /** Unique identifier (UUID or database-generated ID) */
  id: string;

  /** Full name of the student */
  name: string;

  /** Institutional email address (unique) */
  email: string;

  /** Contact phone number with country code */
  phone: string;

  /** Academic department */
  department: Department;

  /** Cumulative Grade Point Average (0.0 – 10.0) */
  cgpa: number;

  /** URL to the uploaded resume (cloud storage path) */
  resumeUrl: string | null;

  /** List of skill tags */
  skills: string[];

  /** Current placement status */
  placementStatus: PlacementStatus;

  /** Enrollment/registration number */
  enrollmentNumber: string;

  /** Graduation year */
  graduationYear: number;

  /** ISO 8601 timestamp */
  createdAt: string;

  /** ISO 8601 timestamp */
  updatedAt: string;
}

/** Payload for creating a new student (server assigns id + timestamps) */
export type CreateStudentPayload = Omit<Student, 'id' | 'createdAt' | 'updatedAt'>;

/** Payload for updating an existing student (all fields optional) */
export type UpdateStudentPayload = Partial<CreateStudentPayload>;
