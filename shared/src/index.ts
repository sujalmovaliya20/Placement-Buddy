/**
 * Barrel export — single entry point for all shared types.
 *
 * Import in frontend or backend:
 *   import type { Student, Drive, Application } from '@shared/types';
 */

// Student
export type {
  Student,
  CreateStudentPayload,
  UpdateStudentPayload,
  PlacementStatus,
  Department,
} from './types/student';

// Drive
export type {
  Drive,
  CreateDrivePayload,
  UpdateDrivePayload,
  DriveStatus,
  EligibilityCriteria,
  CompensationPackage,
} from './types/drive';

// Application
export type {
  Application,
  CreateApplicationPayload,
  UpdateApplicationStatusPayload,
  ApplicationStatus,
  ApplicationStatusHistory,
} from './types/application';

// Custom Fields
export type {
  CustomField,
  CreateCustomFieldPayload,
  CustomFieldResponse,
  CustomFieldType,
  CustomFieldValidation,
} from './types/custom-field';

// API
export type {
  ApiResponse,
  ApiErrorResponse,
  ApiErrorDetail,
  PaginatedResponse,
  ListQueryParams,
  SortOrder,
} from './types/api';
