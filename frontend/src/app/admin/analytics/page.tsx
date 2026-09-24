'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { TopBanner, ButtonSecondary, Footer } from '@/components/ui';
import { GlobalAnalytics } from '@shared/types/analytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import Link from 'next/link';

export default function GlobalAnalyticsPage() {
  const { error: toastError } = useToast();
  
  const [analytics, setAnalytics] = useState<GlobalAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await api.get<GlobalAnalytics>('/admin/analytics/overview');
        if (res.success) {
          setAnalytics(res.data);
        }
      } catch (err) {
        toastError((err as Error).message || 'Failed to load global analytics.');
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [toastError]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-[40px] bg-[#f6f5f0] bg-[radial-gradient(#c2c2c2_1.5px,transparent_1.5px)] [background-size:20px_20px]">
        <div className="border-2 border-frame-ink p-[24px] bg-[#fcc20f] font-helvetica font-bold shadow-[6px_6px_0px_#000000] uppercase tracking-wider animate-pulse select-none">
          LOADING GLOBAL ANALYTICS... PLEASE WAIT
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const totalDrives = analytics.totalDrives.reduce((acc, curr) => acc + curr.count, 0);
  const participationRate = analytics.totalStudents > 0 
    ? Math.round((analytics.totalUniqueStudents / analytics.totalStudents) * 100) 
    : 0;

  return (
    <div className="flex-1 flex flex-col bg-[#f6f5f0] bg-[radial-gradient(#c2c2c2_1.5px,transparent_1.5px)] [background-size:20px_20px] text-[#000000]">
      <TopBanner>
        GLOBAL OVERVIEW // PLACEMENT OFFICE
      </TopBanner>

      <main className="flex-1 p-[24px] space-y-[24px] max-w-7xl mx-auto w-full">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-frame-ink pb-[16px] gap-[12px]">
          <div>
            <h1 className="font-arial-black text-heading-1 uppercase leading-none tracking-wide text-ink">
              Global Overview
            </h1>
            <p className="font-times-new-roman text-body mt-[4px] text-ink/80">
              High-level insights across all placement drives.
            </p>
          </div>
          <div className="flex gap-[8px]">
            <Link href="/admin/drives">
              <ButtonSecondary
                className="transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                bgClassName="bg-canvas hover:bg-neutral-50"
                textClassName="text-ink font-bold uppercase tracking-wider"
                borderClassName="border-2 border-frame-ink shadow-[3px_3px_0px_#000000]"
                roundedClassName="rounded-none"
              >
                ← BACK TO DRIVES
              </ButtonSecondary>
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-[24px]">
          <div className="border-2 border-frame-ink bg-ribbon-teal p-[20px] shadow-[4px_4px_0px_#000000]">
            <h3 className="font-helvetica font-bold uppercase text-caption text-ink/70">Total Drives</h3>
            <p className="font-arial-black text-[48px] leading-none mt-[8px] text-ink">{totalDrives}</p>
          </div>
          
          <div className="border-2 border-frame-ink bg-[#ffffff] p-[20px] shadow-[4px_4px_0px_#000000]">
            <h3 className="font-helvetica font-bold uppercase text-caption text-ink/70">Total Applications</h3>
            <p className="font-arial-black text-[48px] leading-none mt-[8px] text-ink">{analytics.totalApplications}</p>
          </div>

          <div className="border-2 border-frame-ink bg-[#ffffff] p-[20px] shadow-[4px_4px_0px_#000000]">
            <h3 className="font-helvetica font-bold uppercase text-caption text-ink/70">Unique Students Applied</h3>
            <p className="font-arial-black text-[48px] leading-none mt-[8px] text-ink">{analytics.totalUniqueStudents}</p>
            <p className="font-helvetica text-caption mt-[4px]">Out of {analytics.totalStudents} total students</p>
          </div>

          <div className="border-2 border-frame-ink bg-ribbon-periwinkle p-[20px] shadow-[4px_4px_0px_#000000]">
            <h3 className="font-helvetica font-bold uppercase text-caption text-ink/70">Participation Rate</h3>
            <p className="font-arial-black text-[48px] leading-none mt-[8px] text-ink">{participationRate}%</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
          <div className="border-2 border-frame-ink bg-[#ffffff] p-[20px] shadow-[6px_6px_0px_#000000]">
            <h3 className="font-helvetica text-heading-3 uppercase font-bold border-b-2 border-frame-ink pb-[8px] mb-[16px]">
              Top 10 Companies (Most Applications)
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.companyRanking} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis type="number" tick={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 12, fill: '#000000' }} />
                  <YAxis dataKey="company" type="category" width={100} tick={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 12, fill: '#000000' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '0', border: '2px solid #000000', fontFamily: 'Times New Roman, serif', fontWeight: 'bold' }}
                    itemStyle={{ color: '#000000' }}
                  />
                  <Bar dataKey="count" fill="#8884d8" stroke="#000000" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border-2 border-frame-ink bg-[#ffffff] p-[20px] shadow-[6px_6px_0px_#000000]">
            <h3 className="font-helvetica text-heading-3 uppercase font-bold border-b-2 border-frame-ink pb-[8px] mb-[16px]">
              Branch Participation (%)
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.branchParticipation} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="course" tick={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 12, fill: '#000000' }} />
                  <YAxis domain={[0, 100]} tick={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 12, fill: '#000000' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '0', border: '2px solid #000000', fontFamily: 'Times New Roman, serif', fontWeight: 'bold' }}
                    itemStyle={{ color: '#000000' }}
                  />
                  <Bar dataKey="rate" fill="#fcc20f" stroke="#000000" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="border-2 border-frame-ink bg-[#ffffff] p-[20px] shadow-[6px_6px_0px_#000000]">
          <h3 className="font-helvetica text-heading-3 uppercase font-bold border-b-2 border-frame-ink pb-[8px] mb-[16px]">
            Overall Application Trend
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" tick={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 12, fill: '#000000' }} />
                <YAxis tick={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 12, fill: '#000000' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '0', border: '2px solid #000000', fontFamily: 'Times New Roman, serif', fontWeight: 'bold' }}
                  itemStyle={{ color: '#000000' }}
                />
                <Line type="monotone" dataKey="count" stroke="#e91d2a" strokeWidth={4} dot={{ r: 4, fill: '#ffffff', stroke: '#000000', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#e91d2a', stroke: '#000000', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Never Applied Table */}
        <div className="border-2 border-frame-ink bg-[#ffffff] p-[20px] shadow-[6px_6px_0px_#000000]">
          <div className="flex justify-between items-center border-b-2 border-frame-ink pb-[8px] mb-[16px]">
            <h3 className="font-helvetica text-heading-3 uppercase font-bold text-[#e91d2a]">
              Action Required: Never Applied Students ({analytics.neverAppliedStudents.length})
            </h3>
            {/* Optional action button for future */}
            <ButtonSecondary className="!py-1 !text-caption">COPY EMAILS</ButtonSecondary>
          </div>
          
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#ffffff] shadow-[0_2px_0_0_#000000]">
                <tr>
                  <th className="px-[12px] py-[8px] font-helvetica text-caption uppercase font-bold select-none text-ink border-b border-[#000000]">Enrollment No</th>
                  <th className="px-[12px] py-[8px] font-helvetica text-caption uppercase font-bold select-none text-ink border-b border-[#000000]">Name</th>
                  <th className="px-[12px] py-[8px] font-helvetica text-caption uppercase font-bold select-none text-ink border-b border-[#000000]">Course</th>
                  <th className="px-[12px] py-[8px] font-helvetica text-caption uppercase font-bold select-none text-ink border-b border-[#000000]">Contact</th>
                  <th className="px-[12px] py-[8px] font-helvetica text-caption uppercase font-bold select-none text-ink border-b border-[#000000]">Email</th>
                </tr>
              </thead>
              <tbody>
                {analytics.neverAppliedStudents.map((student) => (
                  <tr key={student._id} className="border-b border-[#000000] last:border-b-0 hover:bg-black/5">
                    <td className="px-[12px] py-[8px] font-times-new-roman text-body-sm text-[#000000]">{student.enrollment_number}</td>
                    <td className="px-[12px] py-[8px] font-times-new-roman text-body-sm text-[#000000] font-bold">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="px-[12px] py-[8px] font-times-new-roman text-body-sm text-[#000000]">{student.course}</td>
                    <td className="px-[12px] py-[8px] font-times-new-roman text-body-sm text-[#000000]">{student.contact_number}</td>
                    <td className="px-[12px] py-[8px] font-times-new-roman text-body-sm text-[#000000]">{student.email}</td>
                  </tr>
                ))}
                {analytics.neverAppliedStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-[20px] text-center font-times-new-roman italic text-ink/70">
                      All students have applied to at least one drive. Great job!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
