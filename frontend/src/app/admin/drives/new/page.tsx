'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { TopBanner, ButtonPrimary, ButtonSecondary, TextInput, RibbonCard } from '@/components/ui';

interface CustomField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'checkbox' | 'date' | 'time';
  required: boolean;
}

export default function AdminNewDrivePage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [sourceType, setSourceType] = useState<'native' | 'google_form'>('native');
  const [googleFormUrl, setGoogleFormUrl] = useState('');

  // Custom fields configuration
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'select' | 'checkbox' | 'date' | 'time'>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

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

  const handleAddCustomField = () => {
    if (!newFieldKey.trim() || !newFieldLabel.trim()) {
      toastError('Custom field key and label are required.');
      return;
    }

    const keySafe = newFieldKey.trim().replace(/\s+/g, '');
    if (customFields.some((f) => f.key === keySafe)) {
      toastError('A custom field with this key already exists.');
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

    // Reset input fields
    setNewFieldKey('');
    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldRequired(false);
  };

  const handleRemoveCustomField = (keyToRemove: string) => {
    setCustomFields((prev) => prev.filter((f) => f.key !== keyToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!companyName.trim() || !role.trim() || !deadlineDate || !deadlineTime) {
      toastError('Please fill in all standard required fields.');
      return;
    }

    if (sourceType === 'google_form' && !googleFormUrl.trim()) {
      toastError('Google Form URL is required when registration type is Google Form.');
      return;
    }

    setIsSubmitting(true);

    try {
      const deadline = new Date(`${deadlineDate}T${deadlineTime}`);
      if (deadline <= new Date()) {
        toastError('The application deadline date must be in the future.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        company_name: companyName.trim(),
        role: role.trim(),
        deadline,
        source_type: sourceType,
        google_form_url: sourceType === 'google_form' ? googleFormUrl.trim() : null,
        custom_fields: sourceType === 'native' ? customFields : [],
        status: 'draft',
      };

      const res = await api.post<any>('/admin/drives', payload);
      if (res.success) {
        toastSuccess('Placement recruitment drive registered successfully in database.');
        router.push('/admin/drives');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to register new placement drive.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-[40px] bg-[#ffffff]">
        <div className="border border-[#000000] p-[24px] bg-[#fcc20f] font-helvetica font-bold">
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
        <div className="border-b border-[#000000] pb-[12px]">
          <Link href="/admin/drives">
            <ButtonSecondary>
              ← BACK TO DRIVES LIST
            </ButtonSecondary>
          </Link>
        </div>

        {/* Create Drive Card */}
        <RibbonCard title="REGISTER PLACEMENT DRIVE SPECIFICATION" variant="salmon">
          <form onSubmit={handleSubmit} className="space-y-[20px]">
            
            {/* Standard Details Section */}
            <div className="space-y-[16px]">
              <h3 className="font-helvetica text-heading-3 uppercase border-b border-[#000000] pb-[4px]">
                1. Core Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                <TextInput
                  label="Company Name"
                  placeholder="e.g. Google Inc."
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isSubmitting}
                />

                <TextInput
                  label="Job Role / Title"
                  placeholder="e.g. Software Engineer Intern"
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
            </div>

            {/* Registration Pathway Section */}
            <div className="space-y-[16px]">
              <h3 className="font-helvetica text-heading-3 uppercase border-b border-[#000000] pb-[4px]">
                2. Application Pathway Configuration
              </h3>

              <div className="flex flex-col gap-[4px] w-full">
                <label className="font-helvetica text-ui-label text-[#000000] font-bold select-none">
                  Application Method
                </label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value as 'native' | 'google_form')}
                  disabled={isSubmitting}
                  className="bg-[#ffffff] text-[#000000] border border-[#000000] font-times-new-roman text-body px-[6px] py-[4px] rounded-none focus:outline-none w-full"
                >
                  <option value="native">Native Platform Registration (Form fields handled on-site)</option>
                  <option value="google_form">Google Forms Redirect (Pre-filled query redirect)</option>
                </select>
              </div>

              {sourceType === 'google_form' ? (
                <TextInput
                  label="Google Form URL"
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                  required
                  value={googleFormUrl}
                  onChange={(e) => setGoogleFormUrl(e.target.value)}
                  disabled={isSubmitting}
                />
              ) : (
                /* Native Custom Fields Builder */
                <div className="border border-[#000000] p-[16px] bg-[#ffffff] space-y-[16px]">
                  <h4 className="font-helvetica text-heading-3 uppercase font-bold border-b border-[#000000] pb-[4px]">
                    Configure Native Custom Fields
                  </h4>

                  {/* Add New Field Toolbar */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] pt-[4px]">
                    <TextInput
                      label="Field ID / Key (no spaces)"
                      placeholder="e.g. coverLetter"
                      value={newFieldKey}
                      onChange={(e) => setNewFieldKey(e.target.value)}
                    />
                    <TextInput
                      label="Field Label / Display Text"
                      placeholder="e.g. Why do you want to join?"
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
                        <option value="text">Text / Textarea</option>
                        <option value="select">Dropdown Select (Yes/No)</option>
                        <option value="checkbox">Agreement Checkbox</option>
                        <option value="date">Date Input</option>
                        <option value="time">Time Input</option>
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
                      <label htmlFor="new-field-required" className="font-times-new-roman text-body select-none">
                        Required field
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-[4px]">
                    <ButtonSecondary type="button" onClick={handleAddCustomField}>
                      + ADD FIELD CONFIGURATION
                    </ButtonSecondary>
                  </div>

                  {/* List of Fields */}
                  <div className="space-y-[8px] pt-[8px]">
                    <span className="font-helvetica text-ui-label uppercase font-bold block text-[#000000]">
                      Configured Fields List:
                    </span>
                    {customFields.length === 0 ? (
                      <p className="font-times-new-roman text-body-sm italic">
                        No custom fields configured. Students will apply with their profile details only.
                      </p>
                    ) : (
                      <div className="space-y-[6px]">
                        {customFields.map((f) => (
                          <div key={f.key} className="flex justify-between items-center border border-[#000000] p-[8px] bg-tint-sky text-body-sm font-times-new-roman">
                            <div>
                              <span className="font-bold">{f.label}</span> (ID: <code>{f.key}</code>) | Type: {f.type} | {f.required ? 'Required' : 'Optional'}
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
            </div>

            {/* Submission Actions */}
            <div className="pt-[16px] border-t border-[#000000] flex justify-end">
              <ButtonPrimary type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'REGISTERING DRIVE...' : 'REGISTER RECRUITMENT DRIVE'}
              </ButtonPrimary>
            </div>

          </form>
        </RibbonCard>
      </main>

      <footer className="border-t border-[#000000] p-[16px] text-center font-times-new-roman text-body-sm select-none">
        TPO Recruitment Registry System. Secure admin terminal.
      </footer>
    </div>
  );
}
