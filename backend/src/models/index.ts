import { Student as StudentModel } from './student.model';
import { Drive as DriveModel } from './drive.model';
import { Application as ApplicationModel } from './application.model';
import { Admin as AdminModel } from './admin.model';
import { NotificationLog as NotificationLogModel } from './notification-log.model';

// Export mongoose models
export { StudentModel, DriveModel, ApplicationModel, AdminModel, NotificationLogModel };

// Export interface types (Document types)
export type { IStudent, IStudent as Student } from './student.model';
export type { IDrive, IDrive as Drive, ICustomField as CustomField } from './drive.model';
export type { IApplication, IApplication as Application } from './application.model';
export type { IAdmin, IAdmin as Admin } from './admin.model';
export type { INotificationLog, INotificationLog as NotificationLog } from './notification-log.model';

// Payloads for Creation/Updates expected by controllers & services
export type CreateStudentPayload = {
  roll_no: string;
  name: string;
  branch: string;
  cgpa: number;
  phone: string;
  email: string;
  password?: string;
  resume_url?: string | null;
  skills?: string[];
  links?: Record<string, any>;
};
export type UpdateStudentPayload = Partial<CreateStudentPayload>;

export type CreateDrivePayload = {
  company_name: string;
  role: string;
  deadline: Date | string;
  source_type: 'native' | 'google_form';
  google_form_url?: string | null;
  field_mapping?: Record<string, string> | null;
  custom_fields?: Array<{ key: string; label: string; type: string; required: boolean }>;
  status?: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_by: string;
};
export type UpdateDrivePayload = Partial<CreateDrivePayload>;

export type CreateApplicationPayload = {
  student_id: string;
  drive_id: string;
  custom_answers?: Record<string, any>;
  status?: 'applied' | 'shortlisted' | 'rejected';
};
export type UpdateApplicationStatusPayload = {
  status: 'applied' | 'shortlisted' | 'rejected';
};
