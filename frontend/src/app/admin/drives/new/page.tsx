'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { TopBanner, ButtonPrimary, ButtonSecondary, TextInput, RibbonCard } from '@/components/ui';

interface CustomField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'dropdown' | 'file';
  required: boolean;
}

interface FormField {
  entryId: string;
  label: string;
  type: string;
}

export default function AdminNewDrivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const driveIdParam = searchParams.get('driveId');
  const { error: toastError, success: toastSuccess } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wizard state
  const [step, setStep] = useState<1 | 2>(1);
  const [createdDriveId, setCreatedDriveId] = useState<string | null>(null);

  // Form states (Step 1)
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [sourceType, setSourceType] = useState<'native' | 'google_form'>('native');

  // Custom fields configuration (Step 1 - Native)
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomField['type']>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Step 2 Form States (Google Form)
  const [googleFormUrl, setGoogleFormUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedFields, setParsedFields] = useState<FormField[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [isSavingMapping, setIsSavingMapping] = useState(false);
  const [mappingSaved, setMappingSaved] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [requiresManualFill, setRequiresManualFill] = useState(false);
  const [manualFields, setManualFields] = useState<Array<{ form_label: string; profile_field: string }>>([
    { form_label: '', profile_field: '' }
  ]);


  // Verify Admin Access
  useEffect(() => {
    async function verifyAdmin() {
      try {
        const authRes = await api.get<any>('/auth/me');
        if (!authRes.success || (authRes.data.role !== 'tpo' && authRes.data.role !== 'superadmin')) {
          toastError('Unauthorized: Access restricted to TPO administrators.');
          router.push('/login');
          return;
        }
        setIsAdmin(true);
      } catch (err: any) {
        toastError(err.message || 'Failed to verify admin status.');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }
    verifyAdmin();
  }, [router, toastError]);

  // Load Existing Draft if Edit/Complete Setup is triggered
  useEffect(() => {
    if (!isAdmin || !driveIdParam) return;

    async function loadDraft() {
      setIsLoading(true);
      try {
        const res = await api.get<any>(`/drives/${driveIdParam}`);
        if (res.success && res.data) {
          const drive = res.data;
          setCompanyName(drive.company_name);
          setRole(drive.role);
          setSourceType(drive.source_type);
          setCreatedDriveId(drive._id);

          const deadline = new Date(drive.deadline);
          const yyyy = deadline.getFullYear();
          const mm = String(deadline.getMonth() + 1).padStart(2, '0');
          const dd = String(deadline.getDate()).padStart(2, '0');
          const hh = String(deadline.getHours()).padStart(2, '0');
          const min = String(deadline.getMinutes()).padStart(2, '0');

          setDeadlineDate(`${yyyy}-${mm}-${dd}`);
          setDeadlineTime(`${hh}:${min}`);

          if (drive.source_type === 'google_form') {
            setGoogleFormUrl(drive.google_form_url || '');
            setStep(2);
            if (drive.manual_field_mapping && drive.manual_field_mapping.length > 0) {
              setRequiresManualFill(true);
              setManualFields(drive.manual_field_mapping);
              setMappingSaved(true);
            } else if (drive.field_mapping) {
              setRequiresManualFill(false);
              const initialMappingState: Record<string, string> = {};
              Object.entries(drive.field_mapping).forEach(([studentField, entryId]) => {
                if (entryId) {
                  initialMappingState[entryId as string] = studentField;
                }
              });
              setFieldMappings(initialMappingState);
              setMappingSaved(true);
            }
          } else {
            setCustomFields(drive.custom_fields || []);
            setStep(1);
          }
        }
      } catch (err: any) {
        toastError(err.message || 'Failed to load placement drive draft.');
      } finally {
        setIsLoading(false);
      }
    }

    loadDraft();
  }, [isAdmin, driveIdParam, toastError]);

  // Automatically trigger parse on Step 2 mount if URL is already set (draft loading)
  useEffect(() => {
    if (step === 2 && createdDriveId && googleFormUrl && googleFormUrl !== 'https://docs.google.com/forms/placeholder') {
      handleParseGoogleForm(googleFormUrl);
    }
  }, [step, createdDriveId]);

  // Add Custom Field to Native Array
  const handleAddCustomField = () => {
    if (!newFieldKey.trim() || !newFieldLabel.trim()) {
      toastError('Custom field ID/key and display label are required.');
      return;
    }

    const keySafe = newFieldKey.trim().replace(/\s+/g, '');
    if (customFields.some((f) => f.key === keySafe)) {
      toastError('A custom field with this ID/key already exists.');
      return;
    }

    setCustomFields((prev) => [
      ...prev,
      {
        key: keySafe,
        label: newFieldLabel.trim(),
        type: newFieldType,
        required: newFieldRequired,
      },
    ]);

    setNewFieldKey('');
    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldRequired(false);
  };

  const handleRemoveCustomField = (keyToRemove: string) => {
    setCustomFields((prev) => prev.filter((f) => f.key !== keyToRemove));
  };

  // Step 1: Form Submission (Native saves & exits, Google Form saves & goes to Step 2)
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!companyName.trim() || !role.trim() || !deadlineDate || !deadlineTime) {
      toastError('Please fill in all core drive details.');
      return;
    }

    setIsSubmitting(true);

    try {
      const deadline = new Date(`${deadlineDate}T${deadlineTime}`);
      if (deadline <= new Date()) {
        toastError('The application deadline must be in the future.');
        setIsSubmitting(false);
        return;
      }

      // If we are editing an existing draft, update it. Otherwise, create it.
      let res: any;
      if (createdDriveId) {
        const payload = {
          company_name: companyName.trim(),
          role: role.trim(),
          deadline,
          source_type: sourceType,
          google_form_url: sourceType === 'google_form' ? (googleFormUrl || 'https://docs.google.com/forms/placeholder') : null,
          custom_fields: sourceType === 'native' ? customFields : [],
        };
        res = await api.patch<any>(`/drives/${createdDriveId}`, payload);
      } else {
        const payload = {
          company_name: companyName.trim(),
          role: role.trim(),
          deadline,
          source_type: sourceType,
          google_form_url: sourceType === 'google_form' ? 'https://docs.google.com/forms/placeholder' : null,
          custom_fields: sourceType === 'native' ? customFields : [],
          status: 'draft',
        };
        res = await api.post<any>('/admin/drives', payload);
      }

      if (res.success && res.data) {
        const drive = res.data;
        if (sourceType === 'native') {
          toastSuccess('Placement recruitment drive registered successfully as draft.');
          router.push('/admin/drives');
        } else {
          setCreatedDriveId(drive._id);
          // If we had a dummy placeholder url, reset it so user can input the real one
          if (drive.google_form_url === 'https://docs.google.com/forms/placeholder') {
            setGoogleFormUrl('');
          } else {
            setGoogleFormUrl(drive.google_form_url || '');
          }
          setStep(2);
          toastSuccess('Drive draft created. Proceeding to Google Form parsing.');
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to save drive details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Google Form Parser Trigger
  const handleParseGoogleForm = async (urlToParse: string) => {
    if (!createdDriveId) return;
    const urlStr = urlToParse.trim();
    if (!urlStr) {
      toastError('Please enter a valid Google Form URL first.');
      return;
    }

    setIsParsing(true);
    setMappingSaved(false);

    try {
      // 1. Update the database URL first using PATCH /drives/:id
      await api.patch<any>(`/drives/${createdDriveId}`, {
        google_form_url: urlStr,
      });

      // 2. Parse form
      const res = await api.post<any>(`/admin/drives/${createdDriveId}/parse-google-form`, {
        googleFormUrl: urlStr,
      });
      if (res.success && res.data) {
        if (res.data.requires_manual_fill) {
          setRequiresManualFill(true);
          setManualFields([{ form_label: '', profile_field: '' }]);
          setParsedFields([]);
          toastSuccess('This restricted form requires manual mapping setup.');
        } else {
          setRequiresManualFill(false);
          setParsedFields(res.data);
          toastSuccess('Successfully parsed input fields from Google Form.');
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to parse Google Form. Ensure form is public.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddManualRow = () => {
    setManualFields((prev) => [...prev, { form_label: '', profile_field: '' }]);
  };

  const handleRemoveManualRow = (index: number) => {
    setManualFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleManualRowChange = (index: number, key: 'form_label' | 'profile_field', value: string) => {
    setManualFields((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  // Step 2: Save field mapping
  const handleSaveMapping = async () => {
    if (!createdDriveId) return;
    setIsSavingMapping(true);

    try {
      let payload: any = {};
      if (requiresManualFill) {
        const cleaned = manualFields.filter((f) => f.form_label.trim() !== '');
        if (cleaned.length === 0) {
          toastError('Please define at least one form field mapping row.');
          setIsSavingMapping(false);
          return;
        }
        payload = {
          manual_field_mapping: cleaned,
          field_mapping: null,
        };
      } else {
        const payloadMapping: Record<string, string> = {};
        Object.entries(fieldMappings).forEach(([entryId, studentField]) => {
          if (studentField && studentField !== 'custom') {
            payloadMapping[studentField] = entryId;
          }
        });
        payload = {
          field_mapping: payloadMapping,
          manual_field_mapping: null,
        };
      }

      const res = await api.put<any>(`/admin/drives/${createdDriveId}/mapping`, payload);

      if (res.success) {
        setMappingSaved(true);
        toastSuccess('Field mapping configuration saved successfully.');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to save field mapping.');
    } finally {
      setIsSavingMapping(false);
    }
  };

  // Step 2: Publish Drive
  const handlePublishDrive = async () => {
    if (!createdDriveId) return;
    setIsPublishing(true);

    try {
      const res = await api.patch<any>(`/drives/${createdDriveId}`, {
        status: 'open',
      });
      if (res.success) {
        toastSuccess('Placement drive published and is now open for students!');
        router.push('/admin/drives');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to publish drive.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-[40px] bg-[#ffffff]">
        <div className="border border-[#000000] p-[24px] bg-[#fcc20f] font-helvetica font-bold select-none">
          LOADING TPO REGISTRATION PORTAL... PLEASE WAIT
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex-1 flex flex-col bg-[#ffffff] text-[#000000]">
      <TopBanner>
        TPO CONSOLE // REGISTER NEW RECRUITMENT DRIVE v1.0
      </TopBanner>

      <main className="flex-1 p-[24px] max-w-3xl mx-auto w-full space-y-[24px]">
        {/* Navigation */}
        <div className="border-b border-[#000000] pb-[12px] flex items-center justify-between">
          <Link href="/admin/drives">
            <ButtonSecondary>
              ← BACK TO DRIVES LIST
            </ButtonSecondary>
          </Link>
          <div className="font-helvetica text-ui-label uppercase font-bold text-gray-500">
            WIZARD STEP: {step} OF 2
          </div>
        </div>

        {step === 1 ? (
          <RibbonCard title="STEP 1: RECRUITMENT DRIVE BASICS" variant="salmon">
            <form onSubmit={handleStep1Submit} className="space-y-[20px]">
              <div className="space-y-[16px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                  <TextInput
                    label="Company Name"
                    placeholder="e.g. Dell Computer"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={isSubmitting}
                  />

                  <TextInput
                    label="Job Role / Title"
                    placeholder="e.g. Systems Engineer"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                  <div className="flex flex-col gap-[4px] w-full">
                    <label className="font-helvetica text-ui-label text-[#000000] font-bold select-none">
                      Deadline Date
                    </label>
                    <input
                      type="date"
                      required
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      disabled={isSubmitting}
                      className="bg-[#ffffff] text-[#000000] border border-[#000000] font-times-new-roman text-body px-[6px] py-[4px] rounded-none focus:outline-none w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-[4px] w-full">
                    <label className="font-helvetica text-ui-label text-[#000000] font-bold select-none">
                      Deadline Time
                    </label>
                    <input
                      type="time"
                      required
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      disabled={isSubmitting}
                      className="bg-[#ffffff] text-[#000000] border border-[#000000] font-times-new-roman text-body px-[6px] py-[4px] rounded-none focus:outline-none w-full"
                    />
                  </div>
                </div>

                {/* Source Type Toggle */}
                <div className="flex flex-col gap-[8px] w-full">
                  <label className="font-helvetica text-ui-label text-[#000000] font-bold select-none">
                    Registration Pathway Source Type
                  </label>
                  <div className="flex gap-[12px]">
                    <button
                      type="button"
                      onClick={() => setSourceType('native')}
                      className={`flex-1 ${sourceType === 'native'
                          ? 'bg-[#000000] text-[#ffffff] border border-[#000000]'
                          : 'bg-[#ffffff] text-[#000000] border border-[#000000]'
                        } font-helvetica text-button font-bold px-[16px] py-[6px] rounded-none justify-center`}
                      disabled={isSubmitting}
                    >
                      NATIVE REGISTRATION FORM
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceType('google_form')}
                      className={`flex-1 ${sourceType === 'google_form'
                          ? 'bg-[#000000] text-[#ffffff] border border-[#000000]'
                          : 'bg-[#ffffff] text-[#000000] border border-[#000000]'
                        } font-helvetica text-button font-bold px-[16px] py-[6px] rounded-none justify-center`}
                      disabled={isSubmitting}
                    >
                      GOOGLE FORMS REDIRECT
                    </button>
                  </div>
                </div>
              </div>

              {/* Native Mode Custom Field Builder */}
              {sourceType === 'native' && (
                <div className="border border-[#000000] p-[16px] bg-[#ffffff] space-y-[16px] mt-[16px]">
                  <h4 className="font-helvetica text-heading-3 uppercase font-bold border-b border-[#000000] pb-[4px]">
                    Configure Native Custom Fields
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] pt-[4px]">
                    <TextInput
                      label="Field ID / Key (no spaces, e.g. linkedinUrl)"
                      placeholder="e.g. githubLink"
                      value={newFieldKey}
                      onChange={(e) => setNewFieldKey(e.target.value)}
                    />
                    <TextInput
                      label="Field Label / Display Text"
                      placeholder="e.g. GitHub Repository Link"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] items-end">
                    <div className="flex flex-col gap-[4px] w-full">
                      <label className="font-helvetica text-ui-label text-[#000000] font-bold select-none">
                        Field Data Type
                      </label>
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as any)}
                        className="bg-[#ffffff] text-[#000000] border border-[#000000] font-times-new-roman text-body px-[6px] py-[4px] rounded-none focus:outline-none w-full"
                      >
                        <option value="text">Single-line Text</option>
                        <option value="number">Number</option>
                        <option value="textarea">Multi-line Text (Textarea)</option>
                        <option value="dropdown">Dropdown Select (Yes/No)</option>
                        <option value="file">File Attachment</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-[8px] h-[34px]">
                      <input
                        id="new-field-required"
                        type="checkbox"
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        className="h-[16px] w-[16px] rounded-none border-[#000000] bg-[#ffffff] accent-[#000000]"
                      />
                      <label htmlFor="new-field-required" className="font-times-new-roman text-body select-none font-bold">
                        Mark field as required
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-[4px]">
                    <ButtonSecondary type="button" onClick={handleAddCustomField}>
                      + ADD FIELD TO REGISTRATION
                    </ButtonSecondary>
                  </div>

                  {/* Configured Fields */}
                  <div className="space-y-[8px] pt-[8px]">
                    <span className="font-helvetica text-ui-label uppercase font-bold block text-[#000000]">
                      Active Custom Fields:
                    </span>
                    {customFields.length === 0 ? (
                      <p className="font-times-new-roman text-body-sm italic">
                        No custom fields configured. Students will apply using standard profile details only.
                      </p>
                    ) : (
                      <div className="space-y-[6px]">
                        {customFields.map((f) => (
                          <div key={f.key} className="flex justify-between items-center border border-[#000000] p-[8px] bg-tint-sky text-body-sm font-times-new-roman">
                            <div>
                              <span className="font-bold">{f.label}</span> (Key: <code>{f.key}</code>) | Type: {f.type} | {f.required ? 'Required' : 'Optional'}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomField(f.key)}
                              className="text-[#e91d2a] underline font-bold cursor-pointer font-helvetica text-button border-none bg-transparent"
                            >
                              [REMOVE]
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="pt-[16px] border-t border-[#000000] flex justify-end">
                <ButtonPrimary type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? 'SAVING BASICS...'
                    : sourceType === 'google_form'
                      ? 'NEXT: CONFIGURE GOOGLE FORM MAPPING →'
                      : 'SAVE RECRUITMENT DRIVE'}
                </ButtonPrimary>
              </div>
            </form>
          </RibbonCard>
        ) : (
          <RibbonCard title="STEP 2: GOOGLE FORM PARSING & MAPPING" variant="steel">
            <div className="space-y-[20px]">
              {/* Google Form URL Setup */}
              <div className="space-y-[16px]">
                <div className="grid grid-cols-1 gap-[16px]">
                  <TextInput
                    label="Public Form Link (for students)"
                    placeholder="https://docs.google.com/forms/d/e/.../viewform"
                    required
                    value={googleFormUrl}
                    onChange={(e) => setGoogleFormUrl(e.target.value)}
                    disabled={isParsing}
                  />

                </div>

                <div className="flex justify-end pt-[4px]">
                  <ButtonPrimary
                    onClick={() => handleParseGoogleForm(googleFormUrl)}
                    disabled={isParsing}
                  >
                    PARSE GOOGLE FORM
                  </ButtonPrimary>
                </div>
              </div>

              {/* Loading State */}
              {isParsing && (
                <div className="p-[16px] border border-black bg-white font-times-new-roman text-body">
                  Parsing form...
                </div>
              )}

              {/* Manual Mapping Table */}
              {!isParsing && requiresManualFill && (
                <div className="space-y-[12px]">
                  <div className="font-helvetica text-heading-3 uppercase font-bold">
                    Manual Field Mapping Rules
                  </div>
                  <p className="font-times-new-roman text-body-sm">
                    This form is restricted or login-protected. Define the fields you want students to copy-paste manually.
                  </p>

                  <div className="space-y-[12px] max-w-full">
                    {manualFields.map((field, idx) => (
                      <div key={idx} className="flex gap-[8px] items-end border border-black p-[12px] bg-white">
                        <div className="flex-1">
                          <TextInput
                            label="Form Field Label (e.g. Full Name)"
                            placeholder="Enter the label on the Google Form"
                            value={field.form_label}
                            onChange={(e) => handleManualRowChange(idx, 'form_label', e.target.value)}
                          />
                        </div>
                        <div className="flex-1 flex flex-col gap-[4px]">
                          <label className="font-helvetica text-ui-label text-ink select-none font-bold">
                            Maps to Profile Field
                          </label>
                          <select
                            value={field.profile_field}
                            onChange={(e) => handleManualRowChange(idx, 'profile_field', e.target.value)}
                            className="bg-[#ffffff] text-[#000000] border border-[#000000] font-helvetica text-ui-label px-[6px] py-[8px] rounded-none focus:outline-none w-full h-[38px]"
                          >
                            <option value="">Select Profile Field...</option>
                            <option value="first_name">First Name (first_name)</option>
                            <option value="last_name">Last Name (last_name)</option>
                            <option value="date_of_birth">Date of Birth (date_of_birth)</option>
                            <option value="email">Email Address (email)</option>
                            <option value="contact_number">Contact Number (contact_number)</option>
                            <option value="present_address">Present Address (present_address)</option>
                            <option value="course">Course (course)</option>
                            <option value="enrollment_number">Enrollment Number (enrollment_number)</option>
                            <option value="tenth_result">10th Result % (tenth_result)</option>
                            <option value="twelfth_result">12th Result % (twelfth_result)</option>
                            <option value="cgpa_previous_semester">CGPA Prev Semester (cgpa_previous_semester)</option>
                            <option value="sem1_sgpa">Sem 1 SGPA (sem1_sgpa)</option>
                            <option value="sem2_sgpa">Sem 2 SGPA (sem2_sgpa)</option>
                            <option value="sem3_sgpa">Sem 3 SGPA (sem3_sgpa)</option>
                            <option value="sem4_sgpa">Sem 4 SGPA (sem4_sgpa)</option>
                            <option value="sem5_sgpa">Sem 5 SGPA (sem5_sgpa)</option>
                            <option value="sem6_sgpa">Sem 6 SGPA (sem6_sgpa)</option>
                            <option value="sem7_sgpa">Sem 7 SGPA (sem7_sgpa)</option>
                            <option value="sem8_sgpa">Sem 8 SGPA (sem8_sgpa)</option>
                            <option value="experience_months">Experience Months (experience_months)</option>
                            <option value="resume_url">Resume Link (resume_url)</option>
                          </select>
                        </div>
                        <ButtonSecondary type="button" onClick={() => handleRemoveManualRow(idx)} className="h-[38px] text-red-600 border-red-600 hover:bg-red-50">
                          DELETE
                        </ButtonSecondary>
                      </div>
                    ))}
                    <div className="flex pt-[8px]">
                      <ButtonSecondary type="button" onClick={handleAddManualRow}>
                        + ADD MAPPING ROW
                      </ButtonSecondary>
                    </div>
                  </div>

                  <div className="flex justify-end gap-[12px] pt-[12px] border-t border-[#000000]">
                    <ButtonSecondary onClick={() => setStep(1)}>
                      ← MODIFY BASICS
                    </ButtonSecondary>
                    <ButtonPrimary onClick={handleSaveMapping} disabled={isSavingMapping}>
                      {isSavingMapping ? 'SAVING MAPPING...' : 'SAVE MAPPING'}
                    </ButtonPrimary>
                  </div>
                </div>
              )}

              {/* Parsed Fields Mapping Table */}
              {!isParsing && parsedFields.length > 0 && (
                <div className="space-y-[12px]">
                  <div className="font-helvetica text-heading-3 uppercase font-bold">
                    Field Mapping Rules
                  </div>
                  <p className="font-times-new-roman text-body-sm">
                    Map each detected Google Form field (left) to a student profile attribute (right).
                    Select "Custom" if the student must fill it manually.
                  </p>

                  <div className="border border-[#000000] overflow-x-auto rounded-none">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#ffffff]">
                          <th className="border-b border-[#000000] px-[12px] py-[8px] font-helvetica text-caption uppercase font-bold text-[#000000] border-r border-[#000000] last:border-r-0 select-none">
                            Google Form Field Label
                          </th>
                          <th className="border-b border-[#000000] px-[12px] py-[8px] font-helvetica text-caption uppercase font-bold text-[#000000] border-r border-[#000000] last:border-r-0 select-none">
                            Mapped Profile Attribute
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedFields.map((field) => {
                          const currentVal = fieldMappings[field.entryId] || '';
                          return (
                            <tr key={field.entryId} className="border-b border-[#000000] last:border-b-0">
                              <td className="border-r border-[#000000] px-[12px] py-[8px] font-times-new-roman text-body-sm text-[#000000]">
                                <span className="font-bold">{field.label}</span>
                                <div className="text-[10px] text-gray-500 font-mono mt-[2px]">
                                  ID: {field.entryId} ({field.type})
                                </div>
                              </td>
                              <td className="px-[12px] py-[8px]">
                                <select
                                  value={currentVal}
                                  onChange={(e) => setFieldMappings(prev => ({ ...prev, [field.entryId]: e.target.value }))}
                                  className="bg-[#ffffff] text-[#000000] border border-[#000000] font-helvetica text-ui-label px-[6px] py-[4px] rounded-none focus:outline-none w-full"
                                >
                                  <option value="">Custom — student fills manually</option>
                                  <option value="first_name">First Name (first_name)</option>
                                  <option value="last_name">Last Name (last_name)</option>
                                  <option value="date_of_birth">Date of Birth (date_of_birth)</option>
                                  <option value="email">Email Address (email)</option>
                                  <option value="contact_number">Contact Number (contact_number)</option>
                                  <option value="present_address">Present Address (present_address)</option>
                                  <option value="course">Course (course)</option>
                                  <option value="enrollment_number">Enrollment Number (enrollment_number)</option>
                                  <option value="tenth_result">10th Result % (tenth_result)</option>
                                  <option value="twelfth_result">12th Result % (twelfth_result)</option>
                                  <option value="cgpa_previous_semester">CGPA Prev Semester (cgpa_previous_semester)</option>
                                  <option value="sem1_sgpa">Sem 1 SGPA (sem1_sgpa)</option>
                                  <option value="sem2_sgpa">Sem 2 SGPA (sem2_sgpa)</option>
                                  <option value="sem3_sgpa">Sem 3 SGPA (sem3_sgpa)</option>
                                  <option value="sem4_sgpa">Sem 4 SGPA (sem4_sgpa)</option>
                                  <option value="sem5_sgpa">Sem 5 SGPA (sem5_sgpa)</option>
                                  <option value="sem6_sgpa">Sem 6 SGPA (sem6_sgpa)</option>
                                  <option value="sem7_sgpa">Sem 7 SGPA (sem7_sgpa)</option>
                                  <option value="sem8_sgpa">Sem 8 SGPA (sem8_sgpa)</option>
                                  <option value="experience_months">Experience Months (experience_months)</option>
                                  <option value="resume_url">Resume Link (resume_url)</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-[12px] pt-[12px] border-t border-[#000000]">
                    <ButtonSecondary onClick={() => setStep(1)}>
                      ← MODIFY BASICS
                    </ButtonSecondary>
                    <ButtonPrimary onClick={handleSaveMapping} disabled={isSavingMapping}>
                      {isSavingMapping ? 'SAVING MAPPING...' : 'SAVE MAPPING'}
                    </ButtonPrimary>
                  </div>
                </div>
              )}

              {/* Publish Drive Step */}
              {mappingSaved && !isParsing && (
                <div className="border border-black p-[16px] bg-tint-sage space-y-[12px] mt-[16px]">
                  <h4 className="font-helvetica text-heading-3 uppercase font-bold border-b border-[#000000] pb-[4px]">
                    PUBLISH RECRUITMENT REGISTER
                  </h4>
                  <p className="font-times-new-roman text-body-sm">
                    The mapping has been saved to the database. Publishing will set the drive's status to <strong>OPEN</strong>, making it active for registration.
                  </p>
                  <div className="flex justify-end">
                    <ButtonPrimary onClick={handlePublishDrive} disabled={isPublishing}>
                      {isPublishing ? 'PUBLISHING...' : '★ PUBLISH RECRUITMENT DRIVE'}
                    </ButtonPrimary>
                  </div>
                </div>
              )}
            </div>
          </RibbonCard>
        )}
      </main>

      <footer className="border-t border-[#000000] p-[16px] text-center font-times-new-roman text-body-sm select-none">
        TPO Recruitment Registry System. Secure admin terminal.
      </footer>
    </div>
  );
}
