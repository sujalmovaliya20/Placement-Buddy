'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, API_BASE_URL } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { TopBanner, ButtonPrimary, ButtonSecondary, TextInput, RibbonCard, Footer } from '@/components/ui';

interface AdminAuthResponse {
  role: string;
}

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
  enrollment_number: string;
  first_name: string;
  last_name: string;
  course: string;
  cgpa_previous_semester: number;
  contact_number: string;
  email: string;
}

interface Application {
  _id: string;
  student_id: Student;
  status: 'applied' | 'shortlisted' | 'rejected';
  applied_at: string;
  custom_answers?: Record<string, unknown>;
}

interface FormField {
  entryId: string;
  label: string;
  type: string;
}

const STUDENT_FIELDS = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'enrollment_number', label: 'Enrollment Number' },
  { key: 'course', label: 'Course' },
  { key: 'cgpa_previous_semester', label: 'CGPA (Prev Sem)' },
  { key: 'contact_number', label: 'Contact Number' },
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
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});

  // Google Form parsing & mapping state
  const [formFields, setFormFields] = useState<Record<string, FormField[]>>({});
  const [loadingFields, setLoadingFields] = useState<Record<string, boolean>>({});
  const [mappings, setMappings] = useState<Record<string, Record<string, string>>>({});

  // Notification status state
  const [sendingNotify, setSendingNotify] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function verifyAuthAndLoad() {
      try {
        const authRes = await api.get<AdminAuthResponse>('/auth/me');
        if (!authRes.success || (authRes.data.role !== 'tpo' && authRes.data.role !== 'superadmin')) {
          toastError('Unauthorized: Access restricted to TPO administrators.');
          router.push('/login');
          return;
        }
        setIsAdmin(true);

        const drivesRes = await api.getList<Drive>('/admin/drives');
        if (drivesRes.success) {
          const drivesList = drivesRes.data || [];
          setDrives(drivesList);

          // Initialize mappings
          const initialMappings: Record<string, Record<string, string>> = {};
          drivesList.forEach((d) => {
            if (d.source_type === 'google_form') {
              initialMappings[d._id] = d.field_mapping || {
                first_name: '',
                last_name: '',
                email: '',
                enrollment_number: '',
                course: '',
                cgpa_previous_semester: '',
                contact_number: '',
              };
            }
          });
          setMappings(initialMappings);

          // Fetch applicant counts in parallel
          const counts: Record<string, number> = {};
          await Promise.all(
            drivesList.map(async (drive) => {
              try {
                const res = await api.get<Application[]>(`/admin/drives/${drive._id}/applications`);
                if (res.success) {
                  counts[drive._id] = (res.data || []).length;
                }
              } catch (e) {
                console.error(`Failed to fetch applications for ${drive._id}:`, e);
                counts[drive._id] = 0;
              }
            })
          );
          setApplicantCounts(counts);
        }
      } catch (err) {
        toastError((err as Error).message || 'Failed to verify admin status or load drives.');
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
        const appList = res.data || [];
        setApplications((prev) => ({ ...prev, [driveId]: appList }));
        setApplicantCounts((prev) => ({ ...prev, [driveId]: appList.length }));
      }
    } catch (err) {
      toastError((err as Error).message || 'Failed to load applicants.');
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
    } catch (err) {
      toastError((err as Error).message || 'Failed to parse Google Form. Ensure the URL is public.');
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
      const res = await api.put<Record<string, unknown>>(`/admin/drives/${driveId}/mapping`, {
        field_mapping: {
          ...driveMapping,
        },
      });
      if (res.success) {
        toastSuccess('Field mapping configuration saved successfully.');
      }
    } catch (err) {
      toastError((err as Error).message || 'Failed to update field mapping.');
    }
  };

  const handleSendWhatsAppNotification = async (driveId: string) => {
    setSendingNotify((prev) => ({ ...prev, [driveId]: true }));
    try {
      const res = await api.post<unknown>(`/admin/drives/${driveId}/notify`, {}) as unknown as {
        success: boolean;
        message: string;
        error?: string;
      };
      if (res.success) {
        toastSuccess('WhatsApp notification dispatched to college placement channel.');
      } else {
        toastError(res.error || res.message || 'Notification failed.');
      }
    } catch (err) {
      toastError((err as Error).message || 'Failed to dispatch notification.');
    } finally {
      setSendingNotify((prev) => ({ ...prev, [driveId]: false }));
    }
  };

  const handleUpdateApplicationStatus = async (driveId: string, appId: string, newStatus: 'applied' | 'shortlisted' | 'rejected') => {
    try {
      const res = await api.put<Record<string, unknown>>(`/applications/${appId}/status`, { status: newStatus });
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
    } catch (err) {
      toastError((err as Error).message || 'Failed to update application status.');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
      toastSuccess('Logged out successfully');
      router.push('/login');
      router.refresh();
    } catch (err) {
      toastError((err as Error).message || 'Failed to log out.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-[40px] bg-[#f6f5f0] bg-[radial-gradient(#c2c2c2_1.5px,transparent_1.5px)] [background-size:20px_20px]">
        <div className="border-2 border-frame-ink p-[24px] bg-[#fcc20f] font-helvetica font-bold shadow-[6px_6px_0px_#000000] uppercase tracking-wider animate-pulse select-none">
          LOADING TPO ADMINISTRATIVE DATABASE... PLEASE WAIT
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  // Helper to map status to RibbonCard variant
  const getCardVariant = (status: Drive['status']) => {
    switch (status) {
      case 'open':
        return 'sage';
      case 'draft':
        return 'steel';
      case 'in_progress':
        return 'periwinkle';
      case 'completed':
      case 'cancelled':
      default:
        return 'salmon';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f6f5f0] bg-[radial-gradient(#c2c2c2_1.5px,transparent_1.5px)] [background-size:20px_20px] text-[#000000]">
      <TopBanner>
        TPO CONSOLE // PLACEMENT OFFICE DATABASE ADMINISTRATOR -- ACTIVE SESSION
      </TopBanner>

      <main className="flex-1 p-[24px] space-y-[24px] max-w-7xl mx-auto w-full">
        {/* Navigation & Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-frame-ink pb-[16px] gap-[12px]">
          <div>
            <h1 className="font-arial-black text-heading-1 uppercase leading-none tracking-wide text-ink">
              Drives Administrator
            </h1>
            <p className="font-times-new-roman text-body mt-[4px] text-ink/80">
              Configure placement registers, manage student applications, and push channel updates.
            </p>
          </div>

          <div className="flex gap-[8px] w-full sm:w-auto">
            <Link href="/admin/drives/new">
              <ButtonPrimary
                className="transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                bgClassName="bg-yellow-sticker"
                textClassName="text-ink font-bold uppercase tracking-wider"
                borderClassName="border-2 border-frame-ink shadow-[3px_3px_0px_#000000]"
                roundedClassName="rounded-none"
              >
                ★ CREATE NEW DRIVE
              </ButtonPrimary>
            </Link>
            <ButtonSecondary
              onClick={handleLogout}
              className="transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
              bgClassName="bg-canvas hover:bg-neutral-50"
              textClassName="text-ink font-bold uppercase tracking-wider"
              borderClassName="border-2 border-frame-ink shadow-[3px_3px_0px_#000000]"
              roundedClassName="rounded-none"
            >
              LOG OUT
            </ButtonSecondary>
          </div>
        </div>

        {/* Drives List */}
        <div className="space-y-[24px]">
          {drives.length === 0 ? (
            <div className="border border-dashed border-[#000000] p-[40px] text-center font-times-new-roman text-body">
              No placement drives registered in the system database. Click &apos;Create New Drive&apos; to begin.
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
              const applicantsCount = applicantCounts[drive._id] ?? 0;
              const cardVariant = getCardVariant(drive.status);

              return (
                <RibbonCard
                  key={drive._id}
                  title={`${drive.company_name.toUpperCase()} // ${drive.role.toUpperCase()} -- STATUS: ${drive.status.toUpperCase()}`}
                  variant={cardVariant}
                >
                  <div className="space-y-[16px]">
                    {/* Meta Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-[16px] text-body-sm font-times-new-roman border-b border-[#000000] pb-[12px]">
                      <div>
                        <span className="font-bold block">REGISTRATION TYPE:</span>
                        {drive.source_type === 'google_form' ? 'Google Form Redirect' : 'Native Platform Form'}
                      </div>
                      <div>
                        <span className="font-bold block">DEADLINE:</span>
                        <span className="font-bold text-ink text-body">{new Date(drive.deadline).toLocaleDateString()} at {new Date(drive.deadline).toLocaleTimeString()}</span>
                      </div>
                      <div>
                        <span className="font-bold block">APPLICANTS:</span>
                        {applicantsCount} student(s) registered
                      </div>
                      <div className="flex gap-[8px] items-end justify-end">
                        {drive.status === 'draft' && (
                          <Link href={`/admin/drives/new?driveId=${drive._id}`}>
                            <ButtonPrimary className="text-center w-full">
                              EDIT/COMPLETE SETUP
                            </ButtonPrimary>
                          </Link>
                        )}
                        <ButtonSecondary
                          onClick={() => handleToggleExpand(drive._id)}
                          className="text-center"
                        >
                          {isExpanded ? '▲ CLOSE' : '▼ EXPAND CONSOLE'}
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
                            href={`${API_BASE_URL}/admin/drives/${drive._id}/export`}
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
                          <div className="border-2 border-frame-ink p-[20px] bg-[#ffffff] space-y-[20px] shadow-[4px_4px_0px_#000000] transition-all hover:shadow-[6px_6px_0px_#000000]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-frame-ink pb-[12px] gap-[12px]">
                              <h3 className="font-helvetica text-heading-3 uppercase font-bold">
                                Google Form Mapping Configuration
                              </h3>
                              <ButtonSecondary
                                onClick={() => handleFetchFormFields(drive._id)}
                                disabled={isFieldsLoading}
                                className="transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                                bgClassName="bg-canvas hover:bg-neutral-50"
                                textClassName="text-ink font-bold uppercase tracking-wider text-button"
                                borderClassName="border-2 border-frame-ink shadow-[2px_2px_0px_#000000]"
                                roundedClassName="rounded-none"
                              >
                                {isFieldsLoading ? 'RETRIEVING FORM FIELDS...' : 'RETRIEVE GOOGLE FORM FIELDS'}
                              </ButtonSecondary>
                            </div>

                            <div className="border border-dashed border-frame-ink p-[12px] bg-[#fffde8] text-ink font-times-new-roman text-[15px] leading-relaxed shadow-[1px_1px_0px_#000000]">
                              Fetch the fields from your public Google Form. Then, map student profile fields to their corresponding Google Form entry keys (e.g. <code className="bg-black/5 px-[4px] py-[2px] border border-black/10 font-mono font-bold">entry.123456</code>).
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] pt-[8px]">
                              {STUDENT_FIELDS.map((field) => {
                                const currentMapping = driveMapping[field.key] || '';
                                return (
                                  <div key={field.key} className="space-y-[4px]">
                                    <label className="font-helvetica text-ui-label text-ink block font-bold">
                                      {field.label}
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-[8px]">
                                      {/* Native styled dropdown */}
                                      <select
                                        value={currentMapping}
                                        onChange={(e) => handleMappingChange(drive._id, field.key, e.target.value)}
                                        className="bg-[#ffffff] text-[#000000] border-2 border-frame-ink font-helvetica text-ui-label px-[10px] py-[8px] rounded-none focus:outline-none focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[3px_3px_0px_#000000] transition-all duration-150 w-full sm:w-[60%] h-[44px] shadow-[2px_2px_0px_#000000]"
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
                                        className="w-full sm:w-[40%]"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="pt-[12px] border-t-2 border-frame-ink mt-[12px] flex justify-end">
                              <ButtonPrimary
                                onClick={() => handleSaveMapping(drive._id)}
                                className="transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                                bgClassName="bg-yellow-sticker"
                                textClassName="text-ink font-bold uppercase tracking-wider"
                                borderClassName="border-2 border-frame-ink shadow-[3px_3px_0px_#000000]"
                                roundedClassName="rounded-none"
                              >
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
                            <>
                              {/* Desktop Table View */}
                              <div className="hidden md:block border border-[#000000] overflow-x-auto rounded-none">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="bg-[#ffffff]">
                                      <th className="border-b border-[#000000] px-[12px] py-[8px] font-helvetica text-caption uppercase font-bold select-none text-ink">
                                        Enrollment No
                                      </th>
                                      <th className="border-b border-[#000000] px-[12px] py-[8px] font-helvetica text-caption uppercase font-bold select-none text-ink">
                                        Name
                                      </th>
                                      <th className="border-b border-[#000000] px-[12px] py-[8px] font-helvetica text-caption uppercase font-bold select-none text-ink">
                                        Course
                                      </th>
                                      <th className="border-b border-[#000000] px-[12px] py-[8px] font-helvetica text-caption uppercase font-bold select-none text-ink">
                                        CGPA (Prev Sem)
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
                                          {app.student_id?.enrollment_number}
                                        </td>
                                        <td className="px-[12px] py-[8px] font-times-new-roman text-body-sm text-[#000000] font-bold">
                                          {app.student_id ? `${app.student_id.first_name || ''} ${app.student_id.last_name || ''}`.trim() : ''}
                                        </td>
                                        <td className="px-[12px] py-[8px] font-times-new-roman text-body-sm text-[#000000]">
                                          {app.student_id?.course}
                                        </td>
                                        <td className="px-[12px] py-[8px] font-times-new-roman text-body-sm text-[#000000]">
                                          {app.student_id?.cgpa_previous_semester}
                                        </td>
                                        <td className="px-[12px] py-[8px] font-times-new-roman text-body-sm text-[#000000]">
                                          <span className={`font-bold uppercase ${app.status === 'shortlisted' ? 'text-[#8e8a25]' :
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

                              {/* Mobile Stacked Cards View */}
                              <div className="block md:hidden space-y-[12px]">
                                {driveApps.map((app) => (
                                  <div key={app._id} className="border border-[#000000] p-[12px] bg-[#ffffff] space-y-[8px] text-body-sm font-times-new-roman">
                                    <div className="flex justify-between border-b border-dashed border-gray-300 pb-[4px]">
                                      <span className="font-bold font-helvetica text-caption uppercase text-gray-500">Enrollment No</span>
                                      <span className="text-[#000000]">{app.student_id?.enrollment_number}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-dashed border-gray-300 pb-[4px]">
                                      <span className="font-bold font-helvetica text-caption uppercase text-gray-500">Name</span>
                                      <span className="text-[#000000] font-bold">
                                        {app.student_id ? `${app.student_id.first_name || ''} ${app.student_id.last_name || ''}`.trim() : ''}
                                      </span>
                                    </div>
                                    <div className="flex justify-between border-b border-dashed border-gray-300 pb-[4px]">
                                      <span className="font-bold font-helvetica text-caption uppercase text-gray-500">Course</span>
                                      <span className="text-[#000000]">{app.student_id?.course}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-dashed border-gray-300 pb-[4px]">
                                      <span className="font-bold font-helvetica text-caption uppercase text-gray-500">CGPA (Prev Sem)</span>
                                      <span className="text-[#000000]">{app.student_id?.cgpa_previous_semester}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-dashed border-gray-300 pb-[4px]">
                                      <span className="font-bold font-helvetica text-caption uppercase text-gray-500">Status</span>
                                      <span className={`font-bold uppercase ${app.status === 'shortlisted' ? 'text-[#8e8a25]' :
                                          app.status === 'rejected' ? 'text-[#e91d2a]' : 'text-[#000000]'
                                        }`}>
                                        {app.status}
                                      </span>
                                    </div>
                                    <div className="flex gap-[8px] pt-[4px] justify-end">
                                      {app.status !== 'shortlisted' && (
                                        <button
                                          onClick={() => handleUpdateApplicationStatus(drive._id, app._id, 'shortlisted')}
                                          className="px-[12px] py-[8px] border border-[#000000] bg-[#ffffff] font-helvetica text-button font-bold text-[#8e8a25] rounded-none cursor-pointer"
                                        >
                                          SHORTLIST
                                        </button>
                                      )}
                                      {app.status !== 'rejected' && (
                                        <button
                                          onClick={() => handleUpdateApplicationStatus(drive._id, app._id, 'rejected')}
                                          className="px-[12px] py-[8px] border border-[#000000] bg-[#ffffff] font-helvetica text-button font-bold text-[#e91d2a] rounded-none cursor-pointer"
                                        >
                                          REJECT
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
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

      <Footer />
    </div>
  );
}
