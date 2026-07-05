'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { TopBanner, ButtonPrimary, ButtonSecondary, TextInput, RibbonCard, TextLink, CtaBlockRed } from '@/components/ui';

interface CustomField {
  key: string;
  label: string;
  type: string;
  required: boolean;
}

interface Drive {
  _id: string;
  company_name: string;
  role: string;
  deadline: string;
  source_type: 'native' | 'google_form';
  status: string;
  custom_fields: CustomField[];
  google_form_url?: string | null;
  manual_field_mapping?: Array<{ form_label: string; profile_field: string }> | null;
}

export default function ApplyPage() {
  const router = useRouter();
  const params = useParams();
  const driveId = params['driveId'] as string;
  
  const { error: toastError, success: toastSuccess } = useToast();

  const [student, setStudent] = useState<any>(null);
  const [drive, setDrive] = useState<Drive | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [prefillUrl, setPrefillUrl] = useState<string | null>(null);

  // Form state for custom fields
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch Profile
        const profileRes = await api.get<any>('/students/me');
        if (!profileRes.success || !profileRes.data) {
          router.push(`/login?redirectTo=/apply/${driveId}`);
          return;
        }
        setStudent(profileRes.data);
        const studentId = profileRes.data.id || profileRes.data._id;

        // 2. Fetch Drive details
        const driveRes = await api.get<Drive>(`/drives/${driveId}`);
        if (!driveRes.success || !driveRes.data) {
          toastError('Drive details not found.');
          router.push('/dashboard');
          return;
        }
        setDrive(driveRes.data);

        // Initialize form values with defaults
        const initialValues: Record<string, any> = {};
        (driveRes.data.custom_fields || []).forEach((field) => {
          if (field.type === 'checkbox') {
            initialValues[field.key] = false;
          } else {
            initialValues[field.key] = '';
          }
        });
        setFormValues(initialValues);

        // 3. Check if already applied
        const appsRes = await api.getList<any>('/applications', { studentId, driveId });
        if (appsRes.success && appsRes.data && appsRes.data.length > 0) {
          setAlreadyApplied(true);
          setApplicationId(appsRes.data[0]._id || appsRes.data[0].id);
        }
      } catch (err: any) {
        if (err instanceof ApiError && err.statusCode === 401) {
          router.push(`/login?redirectTo=/apply/${driveId}`);
        } else {
          toastError(err.message || 'Failed to load drive information.');
          router.push('/dashboard');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [driveId, router, toastError]);

  const handleInputChange = (key: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateForm = () => {
    if (!drive) return false;
    const errors: Record<string, string> = {};

    drive.custom_fields.forEach((field) => {
      const val = formValues[field.key];
      if (field.required) {
        if (field.type === 'checkbox' && !val) {
          errors[field.key] = `${field.label} is required`;
        } else if (field.type !== 'checkbox' && (!val || String(val).trim() === '')) {
          errors[field.key] = `${field.label} is required`;
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNativeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || alreadyApplied) return;

    if (!validateForm()) {
      toastError('Please fill all required custom fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post<any>('/applications', {
        student_id: student.id || student._id,
        drive_id: driveId,
        custom_answers: formValues,
      });

      if (response.success) {
        toastSuccess('Application submitted successfully!');
        router.push('/dashboard');
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'ALREADY_APPLIED') {
        setAlreadyApplied(true);
        toastError('You have already applied to this drive.');
      } else {
        toastError(err.message || 'Failed to submit application.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleFormSubmit = async () => {
    if (isSubmitting) return;

    if (alreadyApplied) {
      window.open(drive?.google_form_url || '', '_blank', 'noopener,noreferrer');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post<any>('/applications', {
        student_id: student.id || student._id,
        drive_id: driveId,
      });

      if (response.success) {
        const url = response.data?.prefill_url || drive?.google_form_url || '';
        setPrefillUrl(url);
        if (response.data?.id || response.data?._id) {
          setApplicationId(response.data.id || response.data._id);
        }
        setAlreadyApplied(true);
        toastSuccess('Application recorded. Opening Google Form...');
        
        // Open Google Form
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        toastError('Failed to generate prefill URL.');
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'ALREADY_APPLIED') {
        setAlreadyApplied(true);
        toastError('You have already applied to this drive.');
      } else {
        toastError(err.message || 'Failed to initialize Google Form application.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProfileFieldValue = (profileField: string): string => {
    if (!student) return '';
    if (profileField === 'resume_url') {
      return student.resume_url || '';
    }
    if (profileField === 'date_of_birth') {
      if (!student.date_of_birth) return '';
      return new Date(student.date_of_birth).toISOString().split('T')[0] ?? '';
    }
    if (profileField.startsWith('links.')) {
      const linkKey = profileField.split('.')[1];
      if (!linkKey) return '';
      return student.links?.[linkKey] || '';
    }
    const val = student[profileField];
    if (val === undefined || val === null) return '';
    return String(val);
  };

  const handleCopyField = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    toastSuccess(`Copied "${label}" to clipboard!`);
  };

  const handleCopyAll = () => {
    if (!drive) return;
    const textBlock = (drive.manual_field_mapping || [])
      .map((field) => `${field.form_label}: ${getProfileFieldValue(field.profile_field)}`)
      .join('\n');
    navigator.clipboard.writeText(textBlock);
    toastSuccess('Copied all fields block to clipboard!');
  };

  const handleToggleApplied = async () => {
    if (isSubmitting || !drive) return;
    setIsSubmitting(true);

    try {
      if (alreadyApplied) {
        // Withdraw application
        let appId = applicationId;
        if (!appId) {
          const studentId = student.id || student._id;
          const appsRes = await api.getList<any>('/applications', { studentId, driveId });
          if (appsRes.success && appsRes.data && appsRes.data.length > 0) {
            appId = appsRes.data[0]._id || appsRes.data[0].id;
          }
        }
        if (!appId) {
          throw new Error('Application ID not found to withdraw.');
        }

        await api.delete(`/applications/${appId}`);
        setAlreadyApplied(false);
        setApplicationId(null);
        setPrefillUrl(null);
        toastSuccess('Application withdrawn successfully.');
      } else {
        // Submit/Mark as applied
        const response = await api.post<any>('/applications', {
          student_id: student.id || student._id,
          drive_id: driveId,
        });

        if (response.success) {
          const appId = response.data?.id || response.data?._id;
          if (appId) {
            setApplicationId(appId);
          }
          setAlreadyApplied(true);
          toastSuccess('Application status updated to Applied.');
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update application status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-[40px] bg-[#ffffff]">
        <div className="border border-[#000000] p-[24px] bg-[#fcc20f] font-helvetica font-bold">
          LOADING APPLICATION DATA... PLEASE WAIT
        </div>
      </div>
    );
  }

  if (!drive) return null;

  const isExpired = new Date(drive.deadline).getTime() < Date.now();
  const isOpen = drive.status === 'open';
  const isGoogleForm = drive.source_type === 'google_form';

  return (
    <div className="flex-1 flex flex-col bg-[#ffffff] text-[#000000]">
      <TopBanner>
        RECRUITMENT APPLICATION GATEWAY // DRIVE REF: {driveId.toUpperCase()}
      </TopBanner>

      <main className="flex-1 p-[24px] max-w-2xl mx-auto w-full space-y-[24px]">
        {/* Navigation */}
        <div className="border-b border-[#000000] pb-[12px]">
          <Link href="/dashboard">
            <ButtonSecondary>
              ← BACK TO DASHBOARD
            </ButtonSecondary>
          </Link>
        </div>

        {/* Header Ribbon Card */}
        <RibbonCard title="PLACEMENT DRIVE SPECIFICATION" variant="periwinkle">
          <div className="space-y-[8px]">
            <div>
              <span className="bg-[#fcc20f] text-[#000000] border border-[#000000] font-helvetica text-ui-label font-bold px-[6px] py-[2px] uppercase select-none">
                {isGoogleForm ? 'GOOGLE FORM INTERFACE' : 'NATIVE PLATFORM REGISTRY'}
              </span>
            </div>
            <h1 className="font-arial-black text-heading-1 uppercase leading-none mt-[4px]">
              {drive.company_name}
            </h1>
            <p className="font-times-new-roman text-body font-bold text-ink">
              Job Role: {drive.role}
            </p>
            <div className="border-t border-[#000000] pt-[8px] mt-[8px] grid grid-cols-2 gap-[16px] text-body-sm font-times-new-roman">
              <div>
                <span className="font-bold block">DEADLINE DATE:</span>
                {new Date(drive.deadline).toLocaleDateString()} at {new Date(drive.deadline).toLocaleTimeString()}
              </div>
              <div>
                <span className="font-bold block">ELIGIBILITY STATUS:</span>
                <span className="text-[#8e8a25] font-bold">★ ELIGIBLE TO PARTICIPATE</span>
              </div>
            </div>
          </div>
        </RibbonCard>

        {/* State Banner: Already Applied */}
        {/* State Banner: Deadline Passed or Drive Closed */}
        {(isExpired || !isOpen) ? (
          alreadyApplied ? (
            <div className="border border-[#000000] bg-tint-sage p-[16px] flex flex-col gap-[8px]">
              <h4 className="font-helvetica text-heading-3 uppercase font-bold">
                ✔ APPLICATION STATUS: RECEIVED
              </h4>
              <p className="font-times-new-roman text-body">
                Your application for this placement drive is registered in the database. TPO coordinators are reviewing your profile.
              </p>
            </div>
          ) : (
            <div className="border border-[#e91d2a] bg-red-50 p-[16px] flex flex-col gap-[8px]">
              <h4 className="font-helvetica text-heading-3 uppercase font-bold text-[#e91d2a]">
                Placement Register Closed
              </h4>
              <p className="font-times-new-roman text-body">
                This recruitment registry is closed. The deadline has passed or it has been finalized by the TPO.
              </p>
            </div>
          )
        ) : (
          /* Active and Open Drive */
          isGoogleForm ? (
            <div className="space-y-[24px]">
              {/* Application Status Tracking Toggle Card */}
              <RibbonCard title="APPLICATION STATUS TRACKING" variant={alreadyApplied ? "sage" : "steel"}>
                <div className="flex items-center justify-between p-[12px] bg-white border border-black">
                  <div className="space-y-[4px]">
                    <span className="font-helvetica text-caption uppercase font-bold text-gray-500">
                      Current Status
                    </span>
                    <div className="flex items-center gap-[8px]">
                      <div className={`w-[12px] h-[12px] rounded-full ${alreadyApplied ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                      <span className="font-times-new-roman text-body font-bold uppercase">
                        {alreadyApplied ? 'Applied' : 'Not Applied'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleApplied}
                    disabled={isSubmitting}
                    className={`font-helvetica text-ui-label font-bold px-[16px] py-[8px] border border-black uppercase cursor-pointer select-none transition-colors ${
                      alreadyApplied
                        ? 'bg-red-100 hover:bg-red-200 text-red-700'
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                    }`}
                  >
                    {isSubmitting
                      ? 'Processing...'
                      : alreadyApplied
                        ? 'Withdraw Application'
                        : 'Mark as Applied'}
                  </button>
                </div>
              </RibbonCard>

              {/* Form Instructions / Link Assistant (Always visible before deadline) */}
              {drive.manual_field_mapping && drive.manual_field_mapping.length > 0 ? (
                <RibbonCard title="★ QUICK-FILL ASSISTANT ★" variant="periwinkle">
                  <div className="space-y-[16px]">
                    <p className="font-times-new-roman text-body leading-relaxed">
                      This Google Form is login-restricted, preventing automatic prefilling. 
                      Use the helper below to quickly copy your profile details and paste them into the form.
                    </p>

                    <div className="space-y-[12px]">
                      {drive.manual_field_mapping.map((field, idx) => {
                        const val = getProfileFieldValue(field.profile_field);
                        return (
                          <div key={idx} className="flex gap-[8px] items-end">
                            <div className="flex-1">
                              <TextInput
                                label={field.form_label}
                                value={val}
                                readOnly
                                disabled
                              />
                            </div>
                            <ButtonSecondary
                              type="button"
                              onClick={() => handleCopyField(field.form_label, val)}
                              className="h-[38px] min-w-[80px]"
                            >
                              COPY
                            </ButtonSecondary>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-[12px] pt-[12px] border-t border-[#000000]">
                      <ButtonSecondary
                        type="button"
                        onClick={handleCopyAll}
                        className="w-full"
                      >
                        COPY ALL VALUES
                      </ButtonSecondary>
                      <ButtonPrimary
                        onClick={handleGoogleFormSubmit}
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? 'RECORDING APPLICATION...' : 'OPEN GOOGLE FORM & APPLY'}
                      </ButtonPrimary>
                    </div>
                  </div>
                </RibbonCard>
              ) : (
                <CtaBlockRed className="text-center space-y-[16px]">
                  <h3 className="font-helvetica text-heading-3 uppercase font-bold text-[#ffffff]">
                    ★ GOOGLE FORM REDIRECT ★
                  </h3>
                  <p className="font-times-new-roman text-body text-left text-[#ffffff]">
                    This recruitment drive is conducted via Google Forms. The system will record your application locally and generate a prefilled URL containing your profile details to expedite submission.
                  </p>
                  <ButtonPrimary
                    onClick={handleGoogleFormSubmit}
                    disabled={isSubmitting}
                    className="w-full mt-[8px]"
                  >
                    {isSubmitting ? 'RECORDING APPLICATION...' : 'CONTINUE TO GOOGLE FORM'}
                  </ButtonPrimary>
                  {prefillUrl && (
                    <div className="p-[12px] border border-[#000000] bg-[#fcc20f] text-[#000000] text-body-sm font-times-new-roman">
                      If the external window failed to open, please{' '}
                      <a href={prefillUrl} target="_blank" rel="noopener noreferrer" className="text-[#0000ee] underline font-bold">
                        click here to launch form directly.
                      </a>
                    </div>
                  )}
                </CtaBlockRed>
              )}
            </div>
          ) : (
            /* Native Recruitment Drive */
            alreadyApplied ? (
              <div className="space-y-[24px]">
                {/* Application Status Tracking Toggle Card */}
                <RibbonCard title="APPLICATION STATUS TRACKING" variant="sage">
                  <div className="flex items-center justify-between p-[12px] bg-white border border-black">
                    <div className="space-y-[4px]">
                      <span className="font-helvetica text-caption uppercase font-bold text-gray-500">
                        Current Status
                      </span>
                      <div className="flex items-center gap-[8px]">
                        <div className="w-[12px] h-[12px] rounded-full bg-green-500" />
                        <span className="font-times-new-roman text-body font-bold uppercase">
                          Applied
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleToggleApplied}
                      disabled={isSubmitting}
                      className="font-helvetica text-ui-label font-bold px-[16px] py-[8px] border border-black uppercase cursor-pointer select-none transition-colors bg-red-100 hover:bg-red-200 text-red-700"
                    >
                      {isSubmitting ? 'Processing...' : 'Withdraw Application'}
                    </button>
                  </div>
                </RibbonCard>

                <div className="border border-[#000000] bg-tint-sage p-[16px] flex flex-col gap-[8px]">
                  <h4 className="font-helvetica text-heading-3 uppercase font-bold">
                    ✔ APPLICATION STATUS: RECEIVED
                  </h4>
                  <p className="font-times-new-roman text-body">
                    Your application for this placement drive is registered in the database. TPO coordinators are reviewing your profile.
                  </p>
                </div>
              </div>
            ) : (
              <RibbonCard title="SUBMIT APPLICATION FORM" variant="sage">
                <form onSubmit={handleNativeSubmit} className="space-y-[16px]">
                  {drive.custom_fields.length === 0 ? (
                    <div className="border border-dashed border-[#000000] p-[16px] text-center text-body font-times-new-roman">
                      No custom questions required. You may submit your application profile directly.
                    </div>
                  ) : (
                    drive.custom_fields.map((field) => {
                      const hasError = !!formErrors[field.key];

                      return (
                        <div key={field.key} className="space-y-[4px] flex flex-col w-full">
                          <label className="font-helvetica text-ui-label text-ink select-none font-bold">
                            {field.label} {field.required && <span className="text-[#e91d2a]">*</span>}
                          </label>

                          {/* Dynamic Inputs depending on Field Type */}
                          {field.type === 'checkbox' ? (
                            <div className="flex items-center gap-[8px] pt-[4px]">
                              <input
                                id={field.key}
                                type="checkbox"
                                checked={!!formValues[field.key]}
                                onChange={(e) => handleInputChange(field.key, e.target.checked)}
                                className="h-[16px] w-[16px] rounded-none border-[#000000] bg-[#ffffff] accent-[#000000]"
                              />
                              <label htmlFor={field.key} className="font-times-new-roman text-body-sm select-none">
                                I confirm my agreement and correctness.
                              </label>
                            </div>
                          ) : field.type === 'select' ? (
                            <select
                              value={formValues[field.key] || ''}
                              onChange={(e) => handleInputChange(field.key, e.target.value)}
                              className={`bg-[#ffffff] text-[#000000] border border-[#000000] font-times-new-roman text-body px-[6px] py-[4px] rounded-none focus:outline-none w-full ${
                                hasError ? 'border-[#e91d2a]' : ''
                              }`}
                            >
                              <option value="">Select option...</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          ) : field.type === 'date' ? (
                            <input
                              type="date"
                              value={formValues[field.key] || ''}
                              onChange={(e) => handleInputChange(field.key, e.target.value)}
                              className={`bg-[#ffffff] text-[#000000] border border-[#000000] font-times-new-roman text-body px-[6px] py-[4px] rounded-none focus:outline-none w-full ${
                                hasError ? 'border-[#e91d2a]' : ''
                              }`}
                            />
                          ) : field.type === 'time' ? (
                            <input
                              type="time"
                              value={formValues[field.key] || ''}
                              onChange={(e) => handleInputChange(field.key, e.target.value)}
                              className={`bg-[#ffffff] text-[#000000] border border-[#000000] font-times-new-roman text-body px-[6px] py-[4px] rounded-none focus:outline-none w-full ${
                                hasError ? 'border-[#e91d2a]' : ''
                              }`}
                            />
                          ) : (
                            /* Text type fallback */
                            <textarea
                              rows={3}
                              value={formValues[field.key] || ''}
                              onChange={(e) => handleInputChange(field.key, e.target.value)}
                              className={`bg-[#ffffff] text-[#000000] border border-[#000000] font-times-new-roman text-body p-[8px] rounded-none focus:outline-none w-full ${
                                hasError ? 'border-[#e91d2a]' : ''
                              }`}
                              placeholder={`Enter answer for ${field.label.toLowerCase()}...`}
                            />
                          )}

                          {hasError && (
                            <p className="font-times-new-roman text-body-sm text-[#e91d2a] font-bold">
                              ⚠ {formErrors[field.key]}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}

                  <div className="pt-[12px] border-t border-[#000000]">
                    <ButtonPrimary
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? 'SUBMITTING APPLICATION...' : 'SUBMIT APPLICATION'}
                    </ButtonPrimary>
                  </div>
                </form>
              </RibbonCard>
            )
          )
        )}
      </main>

      <footer className="border-t border-[#000000] p-[16px] text-center font-times-new-roman text-body-sm select-none">
        Corporate Recruitment Database system. All transactions logged.
      </footer>
    </div>
  );
}
