import { TopBanner } from '@/components/ui';

export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col bg-tint-periwinkle font-helvetica">
      <TopBanner>STUDENT PORTAL // ACCESSING REGISTRATION REGISTRY SYSTEM...</TopBanner>
      <main className="flex-1 flex flex-col items-center justify-center p-[24px]">
        <div className="w-full max-w-xl border-4 border-black bg-white p-[24px] shadow-[8px_8px_0px_0px_#000]">
          <div className="bg-yellow-sticker border-2 border-black p-[12px] text-center font-arial-black text-[18px] uppercase mb-[20px] select-none">
            ★ LOADING SYSTEM RECORDS ★
          </div>
          
          <div className="space-y-[16px]">
            {/* Skeletal pulse fields */}
            <div className="border-2 border-black p-[16px] bg-tint-lime/20 flex flex-col gap-[8px] animate-pulse">
              <div className="h-[18px] bg-tint-olive/40 border border-black w-2/3" />
              <div className="h-[14px] bg-tint-olive/20 border border-black w-1/2" />
            </div>

            <div className="border-2 border-black p-[16px] bg-tint-peach/20 flex flex-col gap-[8px] animate-pulse" style={{ animationDelay: '0.2s' }}>
              <div className="h-[18px] bg-tint-peach/40 border border-black w-3/4" />
              <div className="h-[14px] bg-tint-peach/20 border border-black w-1/3" />
            </div>

            <div className="border-2 border-black p-[16px] bg-tint-sky/20 flex flex-col gap-[8px] animate-pulse" style={{ animationDelay: '0.4s' }}>
              <div className="h-[18px] bg-tint-sky/40 border border-black w-1/2" />
              <div className="h-[14px] bg-tint-sky/20 border border-black w-2/3" />
            </div>
          </div>

          <p className="mt-[20px] text-center text-body-sm font-times-new-roman italic animate-pulse">
            Retrieving database data ledger... Please wait.
          </p>
        </div>
      </main>
    </div>
  );
}
