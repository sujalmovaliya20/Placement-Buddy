import type { Metadata } from 'next';
import Link from 'next/link';
import { TopBanner, ButtonPrimary, ButtonSecondary, TextLink, CtaBlockRed } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Home',
};

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      <TopBanner>
        PLACEMENT BUDDY ONLINE SYSTEM v1.0 (DELL 1996 EDITION)
      </TopBanner>

      <main className="flex-1 flex flex-col items-center justify-center p-[40px] text-center bg-[#ffffff]">
        <div className="max-w-[600px] border border-[#000000] p-[24px] rounded-none bg-tint-sage flex flex-col items-center gap-[16px]">
          {/* Active Burst */}
          <div className="bg-[#fcc20f] text-[#000000] border border-[#000000] font-helvetica text-ui-label font-bold px-[8px] py-[4px] uppercase select-none">
            ★ SYSTEM STATUS: ONLINE ★
          </div>

          <h1 className="font-arial-black text-display text-ink uppercase leading-none tracking-tight">
            Placement <span className="text-[#e91d2a]">Buddy</span>
          </h1>

          <p className="font-times-new-roman text-body text-[#000000] leading-relaxed">
            Welcome to the Placement Buddy portal. This secure system automates recruitment coordination, drive notifications, and student profile matching for enterprise-scale placement drives.
          </p>

          {/* WARNING: Max one CtaBlockRed per page */}
          <CtaBlockRed className="w-full text-left flex flex-col gap-[8px]">
            <span className="font-helvetica text-heading-3 uppercase font-bold block">
              ★ ATTENTION STUDENTS ★
            </span>
            <span className="font-times-new-roman text-body block">
              Please sign up with your valid college domain email address (@college.edu) or Gmail address (@gmail.com) to submit applications for the active placement cycle.
            </span>
          </CtaBlockRed>

          <div className="flex flex-col sm:flex-row gap-[12px] w-full justify-center mt-[8px]">
            <Link href="/dashboard" className="flex-1 sm:flex-none">
              <ButtonPrimary className="w-full">
                GO TO DASHBOARD
              </ButtonPrimary>
            </Link>
            <Link href="/signup" className="flex-1 sm:flex-none">
              <ButtonSecondary className="w-full">
                CREATE AN ACCOUNT
              </ButtonSecondary>
            </Link>
          </div>

          <div className="border-t border-[#000000] pt-[12px] w-full text-center">
            <span className="font-times-new-roman text-body-sm text-[#000000]">
              Already registered? <TextLink href="/login">Log in here</TextLink>
            </span>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#000000] bg-[#ffffff] p-[16px] text-center font-times-new-roman text-body-sm select-none">
        © 1996 Placement Buddy Corporation. All rights reserved.
      </footer>
    </div>
  );
}
