import { TopBanner } from '@/components/ui';

export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col bg-[#f6f5f0] bg-[radial-gradient(#c2c2c2_1.5px,transparent_1.5px)] [background-size:20px_20px] font-helvetica">
      <TopBanner>STUDENT PORTAL // ACCESSING REGISTRATION REGISTRY SYSTEM...</TopBanner>
      <main className="flex-1 flex flex-col items-center justify-center p-[24px]">
        <div className="w-full max-w-xl border-2 border-black bg-white p-[32px] shadow-[8px_8px_0px_0px_#000]">
          <div className="bg-yellow-sticker border-2 border-black p-[12px] text-center font-arial-black text-[18px] uppercase mb-[24px] select-none shadow-[3px_3px_0px_#000000]">
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
