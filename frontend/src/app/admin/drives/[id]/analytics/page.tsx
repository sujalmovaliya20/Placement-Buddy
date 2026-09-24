'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { TopBanner, ButtonSecondary, Footer } from '@/components/ui';
import { DriveAnalytics } from '@shared/types/analytics';
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

export default function DriveAnalyticsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { error: toastError } = useToast();
  
  const [analytics, setAnalytics] = useState<DriveAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await api.get<DriveAnalytics>(`/admin/drives/${params.id}/analytics`);
        if (res.success) {
          setAnalytics(res.data);
        }
      } catch (err) {
        toastError((err as Error).message || 'Failed to load analytics.');
        router.push('/admin/drives');
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [params.id, router, toastError]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-[40px] bg-[#f6f5f0] bg-[radial-gradient(#c2c2c2_1.5px,transparent_1.5px)] [background-size:20px_20px]">
        <div className="border-2 border-frame-ink p-[24px] bg-[#fcc20f] font-helvetica font-bold shadow-[6px_6px_0px_#000000] uppercase tracking-wider animate-pulse select-none">
          LOADING ANALYTICS ENGINE... PLEASE WAIT
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="flex-1 flex flex-col bg-[#f6f5f0] bg-[radial-gradient(#c2c2c2_1.5px,transparent_1.5px)] [background-size:20px_20px] text-[#000000]">
      <TopBanner>
        ANALYTICS DASHBOARD // PLACEMENT OFFICE
      </TopBanner>

      <main className="flex-1 p-[24px] space-y-[24px] max-w-7xl mx-auto w-full">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-frame-ink pb-[16px] gap-[12px]">
          <div>
            <h1 className="font-arial-black text-heading-1 uppercase leading-none tracking-wide text-ink">
              Drive Analytics
            </h1>
            <p className="font-times-new-roman text-body mt-[4px] text-ink/80">
              Data visualizations for recruitment drive performance.
            </p>
          </div>
          <div className="flex gap-[8px]">
            <ButtonSecondary
              onClick={() => router.push('/admin/drives')}
              className="transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
              bgClassName="bg-canvas hover:bg-neutral-50"
              textClassName="text-ink font-bold uppercase tracking-wider"
              borderClassName="border-2 border-frame-ink shadow-[3px_3px_0px_#000000]"
              roundedClassName="rounded-none"
            >
              ← BACK TO DRIVES
            </ButtonSecondary>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-[24px]">
          <div className="border-2 border-frame-ink bg-[#ffffff] p-[20px] shadow-[4px_4px_0px_#000000]">
            <h3 className="font-helvetica font-bold uppercase text-caption text-ink/70">Total Applications</h3>
            <p className="font-arial-black text-[48px] leading-none mt-[8px] text-ink">{analytics.totalApplications}</p>
          </div>
          
          {['applied', 'shortlisted', 'rejected'].map(status => {
            const match = analytics.statusBreakdown.find(s => s.status === status);
            const count = match ? match.count : 0;
            const bg = status === 'shortlisted' ? 'bg-ribbon-sage' : status === 'rejected' ? 'bg-ribbon-salmon' : 'bg-ribbon-periwinkle';
            return (
              <div key={status} className={`border-2 border-frame-ink ${bg} p-[20px] shadow-[4px_4px_0px_#000000]`}>
                <h3 className="font-helvetica font-bold uppercase text-caption text-ink/70">{status}</h3>
                <p className="font-arial-black text-[48px] leading-none mt-[8px] text-ink">{count}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
          <div className="border-2 border-frame-ink bg-[#ffffff] p-[20px] shadow-[6px_6px_0px_#000000]">
            <h3 className="font-helvetica text-heading-3 uppercase font-bold border-b-2 border-frame-ink pb-[8px] mb-[16px]">
              Branch Breakdown
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.courseBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="course" tick={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 12, fill: '#000000' }} />
                  <YAxis tick={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 12, fill: '#000000' }} />
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
              CGPA Distribution
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.cgpaDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="range" tick={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 12, fill: '#000000' }} />
                  <YAxis tick={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 12, fill: '#000000' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '0', border: '2px solid #000000', fontFamily: 'Times New Roman, serif', fontWeight: 'bold' }}
                    itemStyle={{ color: '#000000' }}
                  />
                  <Bar dataKey="count" fill="#fcc20f" stroke="#000000" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="border-2 border-frame-ink bg-[#ffffff] p-[20px] shadow-[6px_6px_0px_#000000]">
          <h3 className="font-helvetica text-heading-3 uppercase font-bold border-b-2 border-frame-ink pb-[8px] mb-[16px]">
            Application Timeline
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
      </main>

      <Footer />
    </div>
  );
}
