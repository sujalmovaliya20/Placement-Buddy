import type { Metadata } from 'next';
import Link from 'next/link';
import { TopBanner, ButtonPrimary, ButtonSecondary, TextLink, CtaBlockRed, Footer } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Home',
};

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col bg-[#f6f5f0] bg-[radial-gradient(#c2c2c2_1.5px,transparent_1.5px)] [background-size:20px_20px]">
      <TopBanner>
        <span className="font-arial-black text-heading-2 uppercase tracking-wide">
          PLACEMENT <span className="text-[#fcc20f]">BUDDY</span>
        </span>
        <span className="text-body-sm font-times-new-roman text-gray-400 normal-case">
          // ONLINE SYSTEM v1.0
        </span>
      </TopBanner>

      <main className="flex-1 flex flex-col items-center justify-center p-[40px] text-center bg-transparent">
        <div className="max-w-[600px] border-2 border-frame-ink p-[32px] rounded-none bg-tint-sage flex flex-col items-center gap-[20px] shadow-[8px_8px_0px_#000000] transition-all duration-300 hover:scale-[1.005] hover:shadow-[10px_10px_0px_#000000] relative overflow-hidden">
          {/* Subtle dot matrix grid on card background */}
          <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:8px_8px]" />

          {/* Active Burst */}
          <div className="bg-[#fcc20f] text-[#000000] border-2 border-frame-ink font-helvetica text-ui-label font-bold px-[12px] py-[6px] uppercase select-none shadow-[2px_2px_0px_#000000] transition-all duration-150 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#000000] relative z-10">
            ★ SYSTEM STATUS: ONLINE ★
          </div>

          <h1 className="font-arial-black text-display text-ink uppercase leading-none tracking-tight relative z-10 drop-shadow-[1px_1px_0px_rgba(255,255,255,0.8)]">
            Placement <span className="text-[#e91d2a]">Buddy</span>
          </h1>

          <p className="font-times-new-roman text-body text-[#000000] leading-relaxed relative z-10">
            Welcome to the Placement Buddy portal. This secure system automates recruitment coordination, drive notifications, and student profile matching for enterprise-scale placement drives.
          </p>

          {/* WARNING: Max one CtaBlockRed per page */}
          <CtaBlockRed className="w-full text-left flex flex-col gap-[8px] border-2 border-frame-ink shadow-[4px_4px_0px_#000000] transition-all duration-200 hover:shadow-[6px_6px_0px_#000000] hover:-translate-x-[1px] hover:-translate-y-[1px] relative z-10">
            <span className="font-helvetica text-heading-3 uppercase font-bold block text-white">
              ★ ATTENTION STUDENTS ★
            </span>
            <span className="font-times-new-roman text-body block text-white leading-relaxed">
              Please sign up with your valid college domain email address (<strong className="underline">@college.edu</strong>) or Gmail address (<strong className="underline">@gmail.com</strong>) to submit applications for the active placement cycle.
            </span>
          </CtaBlockRed>

          <div className="flex flex-col sm:flex-row gap-[16px] w-full justify-center mt-[8px] relative z-10">
            <Link href="/dashboard" className="flex-1 sm:flex-none">
              <ButtonPrimary 
                className="w-full transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                bgClassName="bg-yellow-sticker"
                textClassName="text-ink font-bold uppercase tracking-wider"
                borderClassName="border-2 border-frame-ink shadow-[3px_3px_0px_#000000]"
                roundedClassName="rounded-none"
              >
                GO TO DASHBOARD
              </ButtonPrimary>
            </Link>
            <Link href="/signup" className="flex-1 sm:flex-none">
              <ButtonSecondary 
                className="w-full transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                bgClassName="bg-canvas hover:bg-neutral-50"
                textClassName="text-ink font-bold uppercase tracking-wider"
                borderClassName="border-2 border-frame-ink shadow-[3px_3px_0px_#000000]"
                roundedClassName="rounded-none"
              >
                CREATE AN ACCOUNT
              </ButtonSecondary>
            </Link>
          </div>

          <div className="border-t-2 border-frame-ink pt-[16px] w-full text-center relative z-10">
            <span className="font-times-new-roman text-body-sm text-[#000000]">
              Already registered? <TextLink href="/login" className="font-bold hover:underline">Log in here</TextLink>
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
