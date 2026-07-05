'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { TopBanner, ButtonPrimary, ButtonSecondary, RibbonCard, TextLink } from '@/components/ui';

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

  const [student, setStudent] = useState<any>(null);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'applied' | 'eligible'>('all');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // 1. Fetch Profile and Role
        const authRes = await api.get<any>('/auth/me');
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
      } catch (err: any) {
        if (err instanceof ApiError && err.statusCode === 401) {
          router.push('/login?redirectTo=/dashboard');
        } else {
          toastError(err.message || 'Failed to load dashboard data.');
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
    } catch (err: any) {
      toastError(err.message || 'Failed to log out.');
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
      <div className="flex-1 flex flex-col items-center justify-center p-[40px] bg-[#ffffff]">
        <div className="border border-[#000000] p-[24px] bg-[#fcc20f] font-helvetica font-bold">
          LOADING SYSTEM RECORDS... PLEASE WAIT
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#ffffff] text-[#000000]">
      <TopBanner>
        STUDENT PORTAL // PLACEMENT OFFICE DATABASE -- LOGGED IN AS: {`${student?.first_name || ''} ${student?.last_name || ''}`.trim().toUpperCase()}
      </TopBanner>

      <main className="flex-1 p-[24px] space-y-[24px] max-w-7xl mx-auto w-full">
        {/* Navigation / Header Actions */}
        <div className="flex items-center justify-between border-b border-[#000000] pb-[12px]">
          <div className="flex flex-col gap-[4px]">
            <h1 className="font-arial-black text-heading-1 uppercase leading-none">
              Welcome back, {student?.first_name}!
            </h1>
            <p className="font-times-new-roman text-body mt-[4px]">
              Course: {student?.course} | CGPA: {student?.cgpa_previous_semester}
            </p>
          </div>

          <div className="flex gap-[8px]">
            <Link href="/profile">
              <ButtonSecondary>
                EDIT PROFILE
              </ButtonSecondary>
            </Link>
            <ButtonPrimary onClick={handleLogout}>
              LOG OUT
            </ButtonPrimary>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
          <RibbonCard title="ACTIVE RECRUITMENT DRIVES" variant="peach">
            <div className="text-[32px] font-bold font-helvetica leading-none">{activeDrivesCount}</div>
            <div className="text-body-sm font-times-new-roman mt-[4px]">Open for student applications</div>
          </RibbonCard>

          <RibbonCard title="YOUR SUBMITTED APPLICATIONS" variant="sage">
            <div className="text-[32px] font-bold font-helvetica leading-none text-ink">{appliedCount}</div>
            <div className="text-body-sm font-times-new-roman mt-[4px]">Applications tracked in database</div>
          </RibbonCard>

          <RibbonCard title="PENDING REVIEW" variant="lime">
            <div className="text-[32px] font-bold font-helvetica leading-none text-ink">{pendingCount}</div>
            <div className="text-body-sm font-times-new-roman mt-[4px]">Applications awaiting TPO evaluation</div>
          </RibbonCard>
        </div>

        {/* Toolbar */}
        <div className="border border-[#000000] p-[12px] bg-tint-sky flex flex-col md:flex-row justify-between items-center gap-[12px]">
          {/* Tabs */}
          <div className="flex border border-[#000000] bg-[#ffffff]">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-[16px] py-[6px] font-helvetica text-button font-bold rounded-none ${
                filterTab === 'all' ? 'bg-[#000000] text-[#ffffff]' : 'text-[#000000]'
              }`}
            >
              ALL DRIVES
            </button>
            <button
              onClick={() => setFilterTab('applied')}
              className={`px-[16px] py-[6px] font-helvetica text-button font-bold border-l border-[#000000] rounded-none ${
                filterTab === 'applied' ? 'bg-[#000000] text-[#ffffff]' : 'text-[#000000]'
              }`}
            >
              APPLIED
            </button>
            <button
              onClick={() => setFilterTab('eligible')}
              className={`px-[16px] py-[6px] font-helvetica text-button font-bold border-l border-[#000000] rounded-none ${
                filterTab === 'eligible' ? 'bg-[#000000] text-[#ffffff]' : 'text-[#000000]'
              }`}
            >
              NOT APPLIED
            </button>
          </div>

          {/* Search */}
          <div className="flex w-full md:w-auto items-center border border-[#000000] bg-[#ffffff] px-[8px]">
            <span className="font-helvetica text-ui-label font-bold text-[#000000] mr-[8px] select-none">SEARCH:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by company or role..."
              className="py-[6px] text-body font-times-new-roman focus:outline-none w-full md:w-[200px]"
            />
          </div>
        </div>

        {/* Drives List */}
        <div className="space-y-[16px]">
          {filteredDrives.length === 0 ? (
            <div className="border border-dashed border-[#000000] p-[40px] text-center font-times-new-roman text-body text-[#000000]">
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
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-[12px]">
                    <div className="space-y-[4px]">
                      <div className="font-times-new-roman text-caption text-[#000000]">
                        <span className="font-bold">Deadline:</span> {new Date(drive.deadline).toLocaleDateString()} at {new Date(drive.deadline).toLocaleTimeString()}
                      </div>
                      <div className="font-times-new-roman text-body text-[#000000]">
                        <span className="font-bold">Application Mode:</span> {drive.source_type === 'google_form' ? 'External Google Form' : 'Native Platform Form'}
                      </div>
                      {app && (
                        <div className="inline-flex items-center mt-[4px] bg-[#fcc20f] border border-[#000000] font-helvetica text-ui-label font-bold px-[6px] py-[2px] uppercase select-none rounded-none">
                          ★ APPLIED (STATUS: {app.status.toUpperCase()})
                        </div>
                      )}
                    </div>

                    <div className="w-full md:w-auto">
                      {app ? (
                        <Link href={`/apply/${drive._id}`}>
                          <ButtonSecondary className="w-full md:w-auto">
                            VIEW DETAILS
                          </ButtonSecondary>
                        </Link>
                      ) : (
                        <Link href={`/apply/${drive._id}`}>
                          <ButtonPrimary className="w-full md:w-auto bg-[#e91d2a] border-[#e91d2a]">
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

      <footer className="border-t border-[#000000] p-[16px] text-center font-times-new-roman text-body-sm select-none">
        Placement Buddy System. Designed in 1996 for maximum corporate catalog clarity.
      </footer>
    </div>
  );
}
