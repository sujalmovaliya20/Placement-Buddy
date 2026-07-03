/**
 * Application — a student's application to a placement drive.
 *
 * Tracks the full lifecycle from submission through final decision.
 */

import type { CustomFieldResponse } from './custom-field';

export type ApplicationStatus =
  | 'applied'
  | 'under_review'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'selected'
  | 'rejected'
  | 'withdrawn';

export interface ApplicationStatusHistory {
  /** The status that was set */
  status: ApplicationStatus;

  /** ISO 8601 timestamp when the status changed */
  changedAt: string;

  /** Optional note explaining the status change */
  note?: string;
}

export interface Application {
  /** Unique identifier */
  id: string;

  /** References Student.id */
  studentId: string;

  /** References Drive.id */
  driveId: string;

  /** Current application status */
  status: ApplicationStatus;

  /** ISO 8601 timestamp — when the student applied */
  appliedAt: string;

  /** Responses to drive-specific custom fields */
  customFieldResponses: CustomFieldResponse[];

  /** Full status change history for audit trail */
  statusHistory: ApplicationStatusHistory[];

  /** Recruiter/coordinator notes (not visible to student) */
  internalNotes?: string;

  /** ISO 8601 timestamp */
  updatedAt: string;
}

/** Payload for creating a new application */
export type CreateApplicationPayload = Pick<
  Application,
  'studentId' | 'driveId' | 'customFieldResponses'
>;

/** Payload for updating application status */
export interface UpdateApplicationStatusPayload {
  status: ApplicationStatus;
  note?: string;
}
