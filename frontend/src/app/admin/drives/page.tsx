'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { TopBanner, ButtonPrimary, ButtonSecondary, TextInput, RibbonCard, TextLink } from '@/components/ui';

interface Drive {
  _id: string;
  company_name: string;
  role: string;
  deadline: string;
  source_type: 'native' | 'google_form';
  google_form_url?: string | null;
  field_mapping?: Record<string, string> | null;
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  custom_fields: Array<{ key: string; label: string; type: string; required: boolean }>;
}

interface Student {
  roll_no: string;
  name: string;
  branch: string;
  cgpa: number;
  phone: string;
  email: string;
}

interface Application {
  _id: string;
  student_id: Student;
  status: 'applied' | 'shortlisted' | 'rejected';
  applied_at: string;
  custom_answers?: Record<string, any>;
}

interface FormField {
  entryId: string;
  label: string;
  type: string;
}

const STUDENT_FIELDS = [
  { key: 'name', label: 'Full Name' },
  { key: 'email', label: 'College Email' },
  { key: 'roll_no', label: 'Roll Number' },
  { key: 'branch', label: 'Branch / Specialization' },
  { key: 'cgpa', label: 'CGPA' },
  { key: 'phone', label: 'Phone Number' },
];

export default function AdminDrivesPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Expanded drives details state (applications list, form fields, mapping status)
  const [expandedDrive, setExpandedDrive] = useState<string | null>(null);
  const [applications, setApplications] = useState<Record<string, Application[]>>({});
  const [loadingApps, setLoadingApps] = useState<Record<string, boolean>>({});
  
  // Google Form parsing & mapping state
  const [formFields, setFormFields] = useState<Record<string, FormField[]>>({});
  const [loadingFields, setLoadingFields] = useState<Record<string, boolean>>({});
  const [mappings, setMappings] = useState<Record<string, Record<string, string>>>({});
  
  // Notification status state
  const [sendingNotify, setSendingNotify] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function verifyAuthAndLoad() {
      try {
        const authRes = await api.get<any>('/auth/me');
        if (!authRes.success || (authRes.data.role !== 'tpo' && authRes.data.role !== 'superadmin')) {
          toastError('Unauthorized: Access restricted to TPO administrators.');
          router.push('/login');
          return;
        }
        setIsAdmin(true);

        const drivesRes = await api.getList<Drive>('/admin/drives');
        if (drivesRes.success) {
          setDrives(drivesRes.data || []);
          // Initialize mappings
          const initialMappings: Record<string, Record<string, string>> = {};
          (drivesRes.data || []).forEach((d) => {
            if (d.source_type === 'google_form') {
              initialMappings[d._id] = d.field_mapping || {
                name: '',
                email: '',
                roll_no: '',
                branch: '',
                cgpa: '',
                phone: '',
              };
            }
          });
          setMappings(initialMappings);
        }
      } catch (err: any) {
        toastError(err.message || 'Failed to verify admin status or load drives.');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuthAndLoad();
  }, [router, toastError]);

  const loadApplications = async (driveId: string) => {
    if (applications[driveId]) return; // already loaded
    setLoadingApps((prev) => ({ ...prev, [driveId]: true }));
    try {
      const res = await api.get<Application[]>(`/admin/drives/${driveId}/applications`);
      if (res.success) {
        setApplications((prev) => ({ ...prev, [driveId]: res.data || [] }));
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load applicants.');
    } finally {
      setLoadingApps((prev) => ({ ...prev, [driveId]: false }));
    }
  };

  const handleToggleExpand = (driveId: string) => {
    if (expandedDrive === driveId) {
      setExpandedDrive(null);
    } else {
      setExpandedDrive(driveId);
      loadApplications(driveId);
    }
  };

  const handleFetchFormFields = async (driveId: string) => {
    setLoadingFields((prev) => ({ ...prev, [driveId]: true }));
    try {
      const res = await api.post<FormField[]>(`/admin/drives/${driveId}/parse-google-form`, {});
      if (res.success) {
        setFormFields((prev) => ({ ...prev, [driveId]: res.data || [] }));
        toastSuccess('Successfully fetched fields from Google Form HTML.');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to parse Google Form. Ensure the URL is public.');
    } finally {
      setLoadingFields((prev) => ({ ...prev, [driveId]: false }));
    }
  };

  const handleMappingChange = (driveId: string, studentField: string, value: string) => {
    setMappings((prev) => ({
      ...prev,
      [driveId]: {
        ...(prev[driveId] || {}),
        [studentField]: value,
      },
    }));
  };

  const handleSaveMapping = async (driveId: string) => {
    const driveMapping = mappings[driveId];
    try {
      const res = await api.put<any>(`/admin/drives/${driveId}/mapping`, { field_mapping: driveMapping });
      if (res.success) {
        toastSuccess('Field mapping configuration saved successfully.');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update field mapping.');
    }
  };

  const handleSendWhatsAppNotification = async (driveId: string) => {
    setSendingNotify((prev) => ({ ...prev, [driveId]: true }));
    try {
      const res = (await api.post<any>(`/admin/drives/${driveId}/notify`, {})) as unknown as {
        success: boolean;
        message: string;
        error?: string;
      };
      if (res.success) {
        toastSuccess('WhatsApp notification dispatched to college placement channel.');
      } else {
        toastError(res.error || res.message || 'Notification failed.');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to dispatch notification.');
    } finally {
      setSendingNotify((prev) => ({ ...prev, [driveId]: false }));
    }
  };

  const handleUpdateApplicationStatus = async (driveId: string, appId: string, newStatus: 'applied' | 'shortlisted' | 'rejected') => {
    try {
      const res = await api.put<any>(`/applications/${appId}/status`, { status: newStatus });
      if (res.success) {
        toastSuccess(`Applicant status updated to ${newStatus.toUpperCase()}`);
        // Refresh local applications list
        setApplications((prev) => {
          const list = prev[driveId] || [];
          return {
            ...prev,
            [driveId]: list.map((app) => (app._id === appId ? { ...app, status: newStatus } : app)),
          };
        });
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update application status.');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
      toastSuccess('Logged out successfully');
      router.push('/login');
      router.refresh();
    } catch (err: any) {
      toastError(err.message || 'Failed to log out.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-[40px] bg-[#ffffff]">
        <div className="border border-[#000000] p-[24px] bg-[#fcc20f] font-helvetica font-bold">
          LOADING TPO ADMINISTRATIVE DATABASE... PLEASE WAIT
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  return (
    <div className="flex-1 flex flex-col bg-[#ffffff] text-[#000000]">
      <TopBanner>
        TPO CONSOLE // PLACEMENT OFFICE DATABASE ADMINISTRATOR -- ACTIVE SESSION
      </TopBanner>

      <main className="flex-1 p-[24px] space-y-[24px] max-w-7xl mx-auto w-full">
        {/* Navigation & Header Actions */}
        <div className="flex items-center justify-between border-b border-[#000000] pb-[12px]">
          <div>
            <h1 className="font-arial-black text-heading-1 uppercase leading-none">
              Drives Administrator
            </h1>
            <p className="font-times-new-roman text-body mt-[4px]">
              Configure placement registers, manage student applications, and push channel updates.
            </p>
          </div>

          <div className="flex gap-[8px]">
            <Link href="/admin/drives/new">
              <ButtonPrimary>
                ★ CREATE NEW DRIVE
              </ButtonPrimary>
            </Link>
            <ButtonSecondary onClick={handleLogout}>
              LOG OUT
            </ButtonSecondary>
          </div>
        </div>

        {/* Drives List */}
        <div className="space-y-[24px]">
          {drives.length === 0 ? (
            <div className="border border-dashed border-[#000000] p-[40px] text-center font-times-new-roman text-body">
              No placement drives registered in the system database. Click 'Create New Drive' to begin.
            </div>
          ) : (
            drives.map((drive) => {
              const isExpanded = expandedDrive === drive._id;
              const driveApps = applications[drive._id] || [];
              const isAppLoading = loadingApps[drive._id];
              const driveMapping = mappings[drive._id] || {};
              const fieldsList = formFields[drive._id] || [];
              const isFieldsLoading = loadingFields[drive._id];
              const isNotifySending = sendingNotify[drive._id];

              return (
                <RibbonCard
                  key={drive._id}
                  title={`${drive.company_name.toUpperCase()} // ${drive.role.toUpperCase()} -- STATUS: ${drive.status.toUpperCase()}`}
                  variant="steel"
                >
                  <div className="space-y-[16px]">
                    {/* Meta Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-[16px] text-body-sm font-times-new-roman border-b border-[#000000] pb-[12px]">
                      <div>
                        <span className="font-bold block">REGISTRATION TYPE:</span>
                        {drive.source_type === 'google_form' ? 'Google Form Redirect' : 'Native Platform Form'}
                      </div>
                      <div>
                        <span className="font-bold block">DEADLINE DATE:</span>
                        {new Date(drive.deadline).toLocaleDateString()} at {new Date(drive.deadline).toLocaleTimeString()}
                      </div>
                      <div>
                        <span className="font-bold block">CUSTOM FORM FIELDS:</span>
                        {drive.custom_fields.length} field(s) configured
                      </div>
                      <div className="flex items-end">
                        <ButtonSecondary 
                          onClick={() => handleToggleExpand(drive._id)}
                          className="w-full text-center"
                        >
                          {isExpanded ? '▲ CLOSE CONTROLS' : '▼ EXPAND CONSOLE'}
                        </ButtonSecondary>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="space-y-[24px] pt-[8px]">
                        
                        {/* Quick Action Bar */}
                        <div className="flex flex-wrap gap-[12px]">
                          <ButtonPrimary
                            onClick={() => handleSendWhatsAppNotification(drive._id)}
                            disabled={isNotifySending}
                          >
                            {isNotifySending ? 'DISPATCHING WHATSAPP...' : '🔊 DISPATCH WHATSAPP NOTIFICATION'}
                          </ButtonPrimary>
                          
                          <a
                            href={`${baseUrl}/admin/drives/${drive._id}/export`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ButtonSecondary type="button">
                              💾 EXPORT APPLICANTS CSV
                            </ButtonSecondary>
                          </a>
                        </div>

                        {/* Google Form Mapping Editor */}
                        {drive.source_type === 'google_form' && (
                          <div className="border border-[#000000] p-[16px] bg-[#ffffff] space-y-[16px]">
                            <div className="flex items-center justify-between border-b border-[#000000] pb-[8px]">
                              <h3 className="font-helvetica text-heading-3 uppercase font-bold">
                                Google Form Mapping Configuration
                              </h3>
                              <ButtonSecondary
                                onClick={() => handleFetchFormFields(drive._id)}
                                disabled={isFieldsLoading}
                              >
                                {isFieldsLoading ? 'RETRIEVING FORM FIELDS...' : 'RETRIEVE GOOGLE FORM FIELDS'}
                              </ButtonSecondary>
                            </div>

                            <p className="font-times-new-roman text-body-sm">
                              Fetch the fields from your public Google Form. Then, map student profile fields to their corresponding Google Form entry keys (e.g. <code>entry.123456</code>).
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] pt-[8px]">
                              {STUDENT_FIELDS.map((field) => {
                                const currentMapping = driveMapping[field.key] || '';
                                return (
                                  <div key={field.key} className="space-y-[4px]">
                                    <label className="font-helvetica text-ui-label text-ink block font-bold">
                                      {field.label}
                                    </label>
                                    <div className="flex gap-[8px]">
                                      {/* Native styled dropdown */}
                                      <select
                                        value={currentMapping}
                                        onChange={(e) => handleMappingChange(drive._id, field.key, e.target.value)}
                                        className="bg-[#ffffff] text-[#000000] border border-[#000000] font-times-new-roman text-body px-[6px] py-[4px] rounded-none focus:outline-none w-[60%]"
                                      >
                                        <option value="">Select parsed field...</option>
                                        {fieldsList.map((f) => (
                                          <option key={f.entryId} value={f.entryId}>
                                            {f.label} ({f.entryId})
                                          </option>
                                        ))}
                                      </select>
                                      {/* Manual entry override */}
                                      <TextInput
                                        placeholder="Or type entryId manually"
                                        value={currentMapping}
                                        onChange={(e) => handleMappingChange(drive._id, field.key, e.target.value)}
                                        className="w-[40%]"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="pt-[8px] flex justify-end">
                              <ButtonPrimary onClick={() => handleSaveMapping(drive._id)}>
                                SAVE FIELD MAPPING CONFIGURATION
                              </ButtonPrimary>
                            </div>
                          </div>
                        )}

                        {/* Applicants Data Table */}
                        <div className="space-y-[8px]">
                          <h3 className="font-helvetica text-heading-3 uppercase font-bold border-b border-[#000000] pb-[4px]">
                            Registered Applicants List
                          </h3>

                          {isAppLoading ? (
                            <p className="font-times-new-roman text-body-sm italic">Loading applicant records from main registrar...</p>
                          ) : driveApps.length === 0 ? (
                            <div className="border border-dashed border-[#000000] p-[24px] text-center font-times-new-roman text-body-sm">
                              No students have applied to this recruitment drive yet.
                            </div>
                          ) : (
                            <div className="border border-[#000000] overflow-x-auto rounded-none">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-[#ffffff]">
                                    <th className="border-b border-[#000000] px-[12px] py-[8px] font-helvetica text-caption uppercase font-bold select-none text-ink">
                                      Roll No
                                    </th>
                                    <th className="border-b border-[#000000] px-[12px] py-[8px] font-helvetica text-caption uppercase font-bold select-none text-ink">
                                      Name
                                    </th>
                                    <th className="border-b border-[#000000] px-[12px] py-[8px] font-helvetica text-caption uppercase font-bold select-none text-ink">
                                      Branch
                                    </th>
                                    <th className="border-b border-[#000000] px-[12px] py-[8px] font-helvetica text-caption uppercase font-bold select-none text-ink">
                                      CGPA
                                    </th>
                                    <th className="border-b border-[#000000] px-[12px] py-[8px] font-helvetica text-caption uppercase font-bold select-none text-ink">
                                      Status
                                    </th>
                                    <th className="border-b border-[#000000] px-[12px] py-[8px] font-helvetica text-caption uppercase font-bold select-none text-ink">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {driveApps.map((app) => (
                                    <tr key={app._id} className="border-b border-[#000000] last:border-b-0">
                                      <td className="px-[12px] py-[8px] font-times-new-roman text-body-sm text-[#000000]">
                                        {app.student_id?.roll_no}
                                      </td>
                                      <td className="px-[12px] py-[8px] font-times-new-roman text-body-sm text-[#000000] font-bold">
                                        {app.student_id?.name}
                                      </td>
                                      <td className="px-[12px] py-[8px] font-times-new-roman text-body-sm text-[#000000]">
                                        {app.student_id?.branch}
                                      </td>
                                      <td className="px-[12px] py-[8px] font-times-new-roman text-body-sm text-[#000000]">
                                        {app.student_id?.cgpa}
                                      </td>
                                      <td className="px-[12px] py-[8px] font-times-new-roman text-body-sm text-[#000000]">
                                        <span className={`font-bold uppercase ${
                                          app.status === 'shortlisted' ? 'text-[#8e8a25]' : 
                                          app.status === 'rejected' ? 'text-[#e91d2a]' : 'text-[#000000]'
                                        }`}>
                                          {app.status}
                                        </span>
                                      </td>
                                      <td className="px-[12px] py-[8px] flex gap-[8px]">
                                        {app.status !== 'shortlisted' && (
                                          <button
                                            onClick={() => handleUpdateApplicationStatus(drive._id, app._id, 'shortlisted')}
                                            className="px-[8px] py-[2px] border border-[#000000] bg-[#ffffff] font-helvetica text-button font-bold text-[#8e8a25] rounded-none cursor-pointer"
                                          >
                                            SHORTLIST
                                          </button>
                                        )}
                                        {app.status !== 'rejected' && (
                                          <button
                                            onClick={() => handleUpdateApplicationStatus(drive._id, app._id, 'rejected')}
                                            className="px-[8px] py-[2px] border border-[#000000] bg-[#ffffff] font-helvetica text-button font-bold text-[#e91d2a] rounded-none cursor-pointer"
                                          >
                                            REJECT
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                </RibbonCard>
              );
            })
          )}
        </div>
      </main>

      <footer className="border-t border-[#000000] p-[16px] text-center font-times-new-roman text-body-sm select-none">
        TPO Recruitment Registry System. Secure admin terminal.
      </footer>
    </div>
  );
}
