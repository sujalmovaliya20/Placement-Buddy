import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICustomField {
  key: string;
  label: string;
  type: string;
  required: boolean;
}

export interface IManualFieldMapping {
  form_label: string;
  profile_field: string;
}

export interface IDrive extends Document {
  company_name: string;
  role: string;
  deadline: Date;
  source_type: 'native' | 'google_form';
  google_form_url: string | null;
  field_mapping: Record<string, string> | null;
  manual_field_mapping: IManualFieldMapping[] | null;
  custom_fields: ICustomField[];
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_by: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const customFieldSchema = new Schema<ICustomField>(
  {
    key: { type: String, required: [true, 'Custom field key is required'] },
    label: { type: String, required: [true, 'Custom field label is required'] },
    type: { type: String, required: [true, 'Custom field type is required'] },
    required: { type: Boolean, required: [true, 'Custom field required flag is required'] },
  },
  { _id: false }
);

const driveSchema = new Schema<IDrive>(
  {
    company_name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline date is required'],
    },
    source_type: {
      type: String,
      enum: {
        values: ['native', 'google_form'],
        message: '{VALUE} is not a valid source type',
      },
      required: [true, 'Source type is required'],
    },
    google_form_url: {
      type: String,
      default: null,
      validate: {
        validator: function (this: IDrive, v: string | null) {
          if (this.source_type === 'google_form') {
            return typeof v === 'string' && v.trim().length > 0;
          }
          return true;
        },
        message: 'google_form_url is required when source_type is "google_form"',
      },
    },
    field_mapping: {
      type: Schema.Types.Mixed,
      default: null,
    },
    manual_field_mapping: {
      type: [{
        form_label: { type: String, required: true },
        profile_field: { type: String, required: true }
      }],
      default: null,
    },
    custom_fields: {
      type: [customFieldSchema],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'open', 'in_progress', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'draft',
      index: true,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Created by admin ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

export const Drive = mongoose.model<IDrive>('Drive', driveSchema);
