'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { TopBanner, ButtonPrimary, ButtonSecondary, RibbonCard } from '@/components/ui';
import type { Student } from '@shared/index';

interface DashboardAuthResponse {
  role: string;
  profile: Student;
}

interface Drive {
  _id: string;
  company_name: string;
  role: string;
  deadline: string;
  source_type: 'native' | 'google_form';
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
}

interface Application {
  _id: string;
  student_id: string;
  drive_id: string;
  status: 'applied' | 'shortlisted' | 'rejected';
  applied_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [student, setStudent] = useState<Student | null>(null);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'applied' | 'eligible'>('all');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // 1. Fetch Profile and Role
        const authRes = await api.get<DashboardAuthResponse>('/auth/me');
        if (!authRes.success || !authRes.data) {
          router.push('/login?redirectTo=/dashboard');
          return;
        }

        const { role, profile } = authRes.data;
        if (role === 'tpo' || role === 'superadmin') {
          router.push('/admin/drives');
          return;
        }

        setStudent(profile);

        // 2. Fetch Drives & Applications in parallel
        const [drivesRes, appsRes] = await Promise.all([
          api.getList<Drive>('/drives'),
          api.getList<Application>(`/applications`, { studentId: profile.id || profile._id })
        ]);

        if (drivesRes.success) {
          // Filter to only display drives that are open/in_progress
          const visibleDrives = (drivesRes.data || []).filter(
            (d) => d.status === 'open' || d.status === 'in_progress'
          );
          setDrives(visibleDrives);
        }

        if (appsRes.success) {
          setApplications(appsRes.data || []);
        }
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          router.push('/login?redirectTo=/dashboard');
        } else {
          toastError((err as Error).message || 'Failed to load dashboard data.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [router, toastError]);

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

  // Helper to match drive with student application
  const getApplicationForDrive = (driveId: string) => {
    return applications.find((app) => app.drive_id === driveId);
  };

  // Filter & search drives
  const filteredDrives = drives.filter((drive) => {
    const matchesSearch =
      drive.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drive.role.toLowerCase().includes(searchQuery.toLowerCase());

    const app = getApplicationForDrive(drive._id);
    const matchesTab =
      filterTab === 'all' ||
      (filterTab === 'applied' && !!app) ||
      (filterTab === 'eligible' && !app);

    return matchesSearch && matchesTab;
  });

  const appliedCount = applications.length;
  const pendingCount = applications.filter((a) => a.status === 'applied').length;
  const activeDrivesCount = drives.length;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-[40px] bg-[#f6f5f0] bg-[radial-gradient(#c2c2c2_1.5px,transparent_1.5px)] [background-size:20px_20px]">
        <div className="border-2 border-frame-ink p-[24px] bg-[#fcc20f] font-helvetica font-bold shadow-[6px_6px_0px_#000000] uppercase tracking-wider animate-pulse">
          LOADING SYSTEM RECORDS... PLEASE WAIT
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f6f5f0] bg-[radial-gradient(#c2c2c2_1.5px,transparent_1.5px)] [background-size:20px_20px] text-[#000000]">
      <TopBanner>
        STUDENT PORTAL // PLACEMENT OFFICE DATABASE -- LOGGED IN AS: {`${student?.first_name || ''} ${student?.last_name || ''}`.trim().toUpperCase()}
      </TopBanner>

      <main className="flex-1 p-[24px] space-y-[24px] max-w-7xl mx-auto w-full">
        {/* Navigation / Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-frame-ink pb-[16px] gap-[12px]">
          <div className="flex flex-col gap-[4px]">
            <h1 className="font-arial-black text-heading-1 uppercase leading-none tracking-wide text-ink">
              Welcome back, {student?.first_name}!
            </h1>
            <p className="font-times-new-roman text-body mt-[4px] text-ink/80">
              Course: {student?.course} | CGPA: {student?.cgpa_previous_semester}
            </p>
          </div>

          <div className="flex gap-[8px]">
            <Link href="/profile">
              <ButtonSecondary
                className="transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                bgClassName="bg-canvas hover:bg-neutral-50"
                textClassName="text-ink font-bold uppercase tracking-wider"
                borderClassName="border-2 border-frame-ink shadow-[3px_3px_0px_#000000]"
                roundedClassName="rounded-none"
              >
                EDIT PROFILE
              </ButtonSecondary>
            </Link>
            <ButtonPrimary
              onClick={handleLogout}
              className="transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
              bgClassName="bg-tint-salmon hover:bg-[#ff8e8e]"
              textClassName="text-ink font-bold uppercase tracking-wider"
              borderClassName="border-2 border-frame-ink shadow-[3px_3px_0px_#000000]"
              roundedClassName="rounded-none"
            >
              LOG OUT
            </ButtonPrimary>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[20px]">
          <RibbonCard title="ACTIVE RECRUITMENT DRIVES" variant="peach">
            <div className="text-[36px] font-extrabold font-helvetica leading-none tracking-tight">{activeDrivesCount}</div>
            <div className="text-body-sm font-times-new-roman mt-[6px] font-bold text-ink/75 uppercase tracking-wide">Open for student applications</div>
          </RibbonCard>

          <RibbonCard title="YOUR SUBMITTED APPLICATIONS" variant="sage">
            <div className="text-[36px] font-extrabold font-helvetica leading-none tracking-tight text-ink">{appliedCount}</div>
            <div className="text-body-sm font-times-new-roman mt-[6px] font-bold text-ink/75 uppercase tracking-wide">Applications tracked in database</div>
          </RibbonCard>

          <RibbonCard title="PENDING REVIEW" variant="lime">
            <div className="text-[36px] font-extrabold font-helvetica leading-none tracking-tight text-ink">{pendingCount}</div>
            <div className="text-body-sm font-times-new-roman mt-[6px] font-bold text-ink/75 uppercase tracking-wide">Applications awaiting TPO evaluation</div>
          </RibbonCard>
        </div>

        {/* Toolbar */}
        <div className="relative overflow-hidden border-2 border-frame-ink p-[16px] bg-tint-sky flex flex-col md:flex-row justify-between items-center gap-[12px] shadow-[4px_4px_0px_#000000] transition-all hover:shadow-[6px_6px_0px_#000000] hover:-translate-x-[1px] hover:-translate-y-[1px]">
          {/* Subtle tape stripe overlay background */}
          <div className="absolute inset-0 opacity-[0.05] bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,#000000_8px,#000000_16px)]" />

          {/* Tabs */}
          <div className="relative z-10 flex border-2 border-frame-ink bg-[#ffffff] shadow-[2px_2px_0px_#000000]">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-[16px] py-[8px] font-helvetica text-button font-bold rounded-none transition-colors duration-150 ${
                filterTab === 'all' ? 'bg-[#000000] text-[#ffffff]' : 'text-[#000000] hover:bg-neutral-50'
              }`}
            >
              ALL DRIVES
            </button>
            <button
              onClick={() => setFilterTab('applied')}
              className={`px-[16px] py-[8px] font-helvetica text-button font-bold border-l-2 border-[#000000] rounded-none transition-colors duration-150 ${
                filterTab === 'applied' ? 'bg-[#000000] text-[#ffffff]' : 'text-[#000000] hover:bg-neutral-50'
              }`}
            >
              APPLIED
            </button>
            <button
              onClick={() => setFilterTab('eligible')}
              className={`px-[16px] py-[8px] font-helvetica text-button font-bold border-l-2 border-[#000000] rounded-none transition-colors duration-150 ${
                filterTab === 'eligible' ? 'bg-[#000000] text-[#ffffff]' : 'text-[#000000] hover:bg-neutral-50'
              }`}
            >
              NOT APPLIED
            </button>
          </div>

          {/* Search */}
          <div className="relative z-10 flex w-full md:w-auto items-center border-2 border-frame-ink bg-[#ffffff] px-[12px] shadow-[2px_2px_0px_#000000] focus-within:shadow-[3px_3px_0px_#000000] focus-within:-translate-y-1 transition-all">
            <span className="font-helvetica text-ui-label font-bold text-[#000000] mr-[8px] select-none">SEARCH:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by company or role..."
              className="py-[8px] text-body font-times-new-roman focus:outline-none w-full md:w-[220px]"
            />
          </div>
        </div>

        {/* Drives List */}
        <div className="space-y-[20px]">
          {filteredDrives.length === 0 ? (
            <div className="border-2 border-dashed border-frame-ink p-[48px] text-center font-times-new-roman text-body text-[#000000] bg-[#ffffff] shadow-[4px_4px_0px_#000000]">
              No active placement drives match your filter settings.
            </div>
          ) : (
            filteredDrives.map((drive, idx) => {
              const app = getApplicationForDrive(drive._id);
              const cardVariants: ('olive' | 'sage' | 'salmon' | 'peach' | 'lime' | 'sky' | 'steel' | 'periwinkle')[] = [
                'olive', 'sage', 'salmon', 'peach', 'lime', 'sky', 'steel', 'periwinkle'
              ];
              const variant = cardVariants[idx % cardVariants.length] || 'sage';

              return (
                <RibbonCard
                  key={drive._id}
                  title={`${drive.company_name.toUpperCase()} // ${drive.role.toUpperCase()}`}
                  variant={variant}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-[16px]">
                    <div className="space-y-[8px]">
                      <div className="font-times-new-roman text-caption text-[#000000] flex items-center gap-[6px]">
                        <span className="font-bold uppercase bg-black/5 px-[6px] py-[2px] border border-black/10">Deadline:</span> 
                        <span className="font-semibold">{new Date(drive.deadline).toLocaleDateString()}</span> at {new Date(drive.deadline).toLocaleTimeString()}
                      </div>
                      <div className="font-times-new-roman text-body text-[#000000] flex items-center gap-[6px]">
                        <span className="font-bold uppercase bg-black/5 px-[6px] py-[2px] border border-black/10">Application Mode:</span> 
                        <span>{drive.source_type === 'google_form' ? 'External Google Form' : 'Native Platform Form'}</span>
                      </div>
                      {app && (
                        <div className="inline-flex items-center mt-[4px] bg-[#fcc20f] border-2 border-[#000000] font-helvetica text-ui-label font-bold px-[8px] py-[4px] uppercase select-none rounded-none shadow-[2px_2px_0px_#000000] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#000000]">
                          ★ APPLIED (STATUS: {app.status.toUpperCase()})
                        </div>
                      )}
                    </div>

                    <div className="w-full md:w-auto flex justify-end">
                      {app ? (
                        <Link href={`/apply/${drive._id}`} className="w-full md:w-auto">
                          <ButtonSecondary 
                            className="w-full md:w-auto transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                            bgClassName="bg-canvas hover:bg-neutral-50"
                            textClassName="text-ink font-bold uppercase tracking-wider"
                            borderClassName="border-2 border-frame-ink shadow-[3px_3px_0px_#000000]"
                            roundedClassName="rounded-none"
                          >
                            VIEW DETAILS
                          </ButtonSecondary>
                        </Link>
                      ) : (
                        <Link href={`/apply/${drive._id}`} className="w-full md:w-auto">
                          <ButtonPrimary 
                            className="w-full md:w-auto transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                            bgClassName="bg-[#e91d2a] hover:bg-[#ff3b47]"
                            textClassName="text-white font-bold uppercase tracking-wider"
                            borderClassName="border-2 border-frame-ink shadow-[3px_3px_0px_#000000]"
                            roundedClassName="rounded-none"
                          >
                            APPLY NOW
                          </ButtonPrimary>
                        </Link>
                      )}
                    </div>
                  </div>
                </RibbonCard>
              );
            })
          )}
        </div>
      </main>

      <footer className="border-t border-[#000000] bg-[#000000] text-[#ffffff] p-[16px] text-center font-helvetica text-heading-2 font-bold select-none">
        DEVLOPED BY SUJAL MOVALIYA @2026 ALL RIGHTS RESERVED
      </footer>
    </div>
  );
}
