/**
 * CustomField — dynamic form fields that can be attached to any Drive.
 *
 * Allows placement coordinators to add drive-specific questions
 * (e.g., "Preferred location?", "Upload project portfolio") without
 * changing the core schema.
 */

export type CustomFieldType = 'text' | 'number' | 'select' | 'date' | 'file' | 'textarea';

export interface CustomFieldValidation {
  /** Minimum length for text, minimum value for number */
  min?: number;

  /** Maximum length for text, maximum value for number */
  max?: number;

  /** Regex pattern for text validation */
  pattern?: string;

  /** Human-readable validation error message */
  message?: string;

  /** Allowed file extensions for file-type fields (e.g., [".pdf", ".docx"]) */
  allowedExtensions?: string[];

  /** Maximum file size in bytes */
  maxFileSize?: number;
}

export interface CustomField {
  /** Unique identifier */
  id: string;

  /** Display label shown to students */
  label: string;

  /** Field input type */
  fieldType: CustomFieldType;

  /** Whether this field must be filled to submit the application */
  isRequired: boolean;

  /** Dropdown/radio options — only relevant when fieldType is 'select' */
  options: string[];

  /** Validation rules */
  validation: CustomFieldValidation | null;

  /** Placeholder text for the input */
  placeholder?: string;

  /** Help text displayed below the field */
  helpText?: string;

  /** Display order within the form */
  order: number;
}

/**
 * CustomFieldResponse — a student's answer to a custom field.
 *
 * Stored as part of an Application.
 */
export interface CustomFieldResponse {
  /** References CustomField.id */
  fieldId: string;

  /** The student's response value (stringified for all types) */
  value: string;
}

/** Payload for creating a custom field (server assigns id) */
export type CreateCustomFieldPayload = Omit<CustomField, 'id'>;
