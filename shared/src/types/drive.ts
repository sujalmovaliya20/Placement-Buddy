/**
 * Drive — a company placement drive with eligibility criteria and scheduling.
 *
 * Each drive can have custom fields for additional application questions.
 */

import type { Department } from './student';
import type { CustomField } from './custom-field';

export type DriveStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface EligibilityCriteria {
  /** Minimum CGPA required (0.0 – 10.0) */
  minCgpa: number;

  /** Eligible departments (empty array = all departments) */
  departments: Department[];

  /** Required skills (student must have at least one matching) */
  skills: string[];

  /** Minimum graduation year */
  minGraduationYear?: number;

  /** Maximum graduation year */
  maxGraduationYear?: number;

  /** Whether students who are already placed can apply */
  allowPlacedStudents: boolean;
}

export interface CompensationPackage {
  /** Cost-to-company in INR per annum */
  ctc: number;

  /** Monthly stipend in INR (for internship drives) */
  stipend: number | null;

  /** Currency code (default: INR) */
  currency: string;

  /** Additional compensation notes */
  notes?: string;
}

export interface Drive {
  /** Unique identifier */
  id: string;

  /** Company name */
  companyName: string;

  /** Job role/title */
  role: string;

  /** Detailed job description (supports markdown) */
  description: string;

  /** Who can apply */
  eligibilityCriteria: EligibilityCriteria;

  /** Compensation details */
  package: CompensationPackage;

  /** ISO 8601 date — when the placement drive takes place */
  driveDate: string;

  /** ISO 8601 date — application deadline */
  deadline: string;

  /** Current drive status */
  status: DriveStatus;

  /** Dynamic form fields for this drive */
  customFields: CustomField[];

  /** Drive location (on-campus / office address / remote) */
  location: string;

  /** Number of positions available */
  openPositions: number | null;

  /** ISO 8601 timestamp */
  createdAt: string;

  /** ISO 8601 timestamp */
  updatedAt: string;
}

/** Payload for creating a new drive (server assigns id + timestamps) */
export type CreateDrivePayload = Omit<Drive, 'id' | 'createdAt' | 'updatedAt'>;

/** Payload for updating an existing drive (all fields optional) */
export type UpdateDrivePayload = Partial<CreateDrivePayload>;
