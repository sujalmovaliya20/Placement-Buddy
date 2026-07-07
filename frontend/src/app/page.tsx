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

          <p className="font-times-new-roman text-[16px] md:text-[18px] font-bold text-ink leading-relaxed relative z-10">
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
            <span className="font-times-new-roman text-body font-bold text-ink">
              Already registered? <TextLink href="/login" className="font-bold hover:underline">Log in here</TextLink>
            </span>
          </div>
        </div>
      </main>

      {/* Interactive stickman chase company marquee */}
      <div className="relative border-t-2 border-frame-ink bg-[#fcfcf9] py-[16px] overflow-hidden select-none">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes car-vibe {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-1.5px); }
          }
          @keyframes run-bob-1 {
            0%, 100% { transform: translateY(0) rotate(-6deg); }
            50% { transform: translateY(-4px) rotate(6deg); }
          }
          @keyframes run-bob-2 {
            0%, 100% { transform: translateY(-2px) rotate(4deg); }
            50% { transform: translateY(2px) rotate(-8deg); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .wheel-spin {
            transform-origin: center;
            transform-box: fill-box;
            animation: spin 0.4s linear infinite;
          }
          .company-car {
            animation: car-vibe 0.15s ease-in-out infinite;
          }
          .student-runner-1 {
            animation: run-bob-1 0.4s ease-in-out infinite;
          }
          .student-runner-2 {
            animation: run-bob-2 0.45s ease-in-out infinite;
          }
          .marquee-track {
            display: flex;
            width: max-content;
            animation: marquee 35s linear infinite;
          }
          .marquee-track:hover {
            animation-play-state: paused;
          }
        `}} />
        
        {/* Banner Title / Header for Marquee */}
        <div className="absolute top-[2px] left-[16px] z-20 bg-[#e91d2a] text-white border border-black text-[9px] font-helvetica font-bold px-[6px] py-[1px] uppercase tracking-wider shadow-[1px_1px_0px_#000000]">
          ★ THE PLACEMENT RUSH ★
        </div>

        <div className="marquee-track flex gap-[64px]">
          {/* First loop */}
          {[
            { name: 'GOOGLE', logoSymbol: '✦', bg: '#ffebe8', text: '#ea4335', students: 2 },
            { name: 'MICROSOFT', logoSymbol: '❖', bg: '#ecfdf5', text: '#10b981', students: 1 },
            { name: 'META', logoSymbol: '∞', bg: '#e0f2fe', text: '#0064e0', students: 2 },
            { name: 'OPENAI', logoSymbol: '❂', bg: '#f3f4f6', text: '#000000', students: 1 },
            { name: 'ANTHROPIC', logoSymbol: '▲', bg: '#fef3c7', text: '#d97706', students: 2 },
            { name: 'NVIDIA', logoSymbol: '▼', bg: '#f0fdf4', text: '#76b900', students: 1 },
          ].map((c, i) => (
            <div key={`loop1-${i}`} className="flex items-end gap-[16px]">
              {/* The Wheeled Company Card */}
              <div className="company-car relative pb-[12px] flex flex-col items-center select-none filter drop-shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
                {/* The Card Body */}
                <div
                  className="border-2 border-frame-ink px-[16px] py-[8px] flex items-center gap-[8px] shadow-[3px_3px_0px_#000000] relative z-10"
                  style={{ backgroundColor: c.bg }}
                >
                  <span className="font-arial-black text-heading-3" style={{ color: c.text }}>
                    {c.logoSymbol}
                  </span>
                  <span className="font-arial-black text-body uppercase tracking-wider text-ink">
                    {c.name}
                  </span>
                </div>
                {/* Left Wheel */}
                <div className="absolute bottom-[2px] left-[16px] z-20 w-[18px] h-[18px] bg-black border-2 border-frame-ink rounded-full flex items-center justify-center">
                  <div className="w-[6px] h-[6px] bg-white rounded-none wheel-spin" />
                </div>
                {/* Right Wheel */}
                <div className="absolute bottom-[2px] right-[16px] z-20 w-[18px] h-[18px] bg-black border-2 border-frame-ink rounded-full flex items-center justify-center">
                  <div className="w-[6px] h-[6px] bg-white rounded-none wheel-spin" />
                </div>
              </div>

              {/* Chasing Students */}
              <div className="flex items-end gap-[6px] mb-[12px]">
                {Array.from({ length: c.students }).map((_, idx) => (
                  <div key={idx} className={idx === 0 ? "student-runner-1" : "student-runner-2"} title="Chasing placement!">
                    <svg viewBox="0 0 40 60" className="w-[28px] h-[42px] select-none">
                      {/* Graduation Cap */}
                      <polygon points="10,6 24,3 30,8 16,11" fill="black" stroke="black" strokeWidth="1" />
                      <path d="M 15,9 L 15,13 C 15,14 20,14 20,13 L 20,9" fill="black" stroke="black" strokeWidth="1" />
                      <path d="M 10,6 L 6,12" stroke="black" strokeWidth="1.5" />
                      <circle cx="6" cy="12" r="1.5" fill="black" />
                      
                      {/* Head */}
                      <circle cx="20" cy="20" r="5" fill="white" stroke="black" strokeWidth="2.5" />
                      
                      {/* Backpack (student knapsack on their back) */}
                      <rect x="22" y="25" width="7" height="10" rx="1.5" fill="white" stroke="black" strokeWidth="2" />
                      <path d="M 20,26 Q 23,24 23,27" fill="none" stroke="black" strokeWidth="1.5" />
                      
                      {/* Body */}
                      <path d="M 20,25 L 18,38" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
                      
                      {/* Arms */}
                      {/* Back Arm */}
                      <path d="M 19,27 L 27,31 L 33,37" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {/* Front Arm (holds scroll) */}
                      <path d="M 19,27 L 10,30 L 6,24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      
                      {/* Diploma Scroll in Hand (at 6,24) */}
                      <g transform="rotate(-20 6 24)">
                        <rect x="1" y="22" width="10" height="4" rx="1" fill="white" stroke="black" strokeWidth="1.5" />
                        <line x1="5" y1="22" x2="5" y2="26" stroke="#e91d2a" strokeWidth="1.5" />
                      </g>
                      
                      {/* Legs */}
                      <path d="M 18,38 L 8,44 L 4,52" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 18,38 L 25,45 L 32,52" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {/* Second loop */}
          {[
            { name: 'GOOGLE', logoSymbol: '✦', bg: '#ffebe8', text: '#ea4335', students: 2 },
            { name: 'MICROSOFT', logoSymbol: '❖', bg: '#ecfdf5', text: '#10b981', students: 1 },
            { name: 'META', logoSymbol: '∞', bg: '#e0f2fe', text: '#0064e0', students: 2 },
            { name: 'OPENAI', logoSymbol: '❂', bg: '#f3f4f6', text: '#000000', students: 1 },
            { name: 'ANTHROPIC', logoSymbol: '▲', bg: '#fef3c7', text: '#d97706', students: 2 },
            { name: 'NVIDIA', logoSymbol: '▼', bg: '#f0fdf4', text: '#76b900', students: 1 },
          ].map((c, i) => (
            <div key={`loop2-${i}`} className="flex items-end gap-[16px]">
              {/* The Wheeled Company Card */}
              <div className="company-car relative pb-[12px] flex flex-col items-center select-none filter drop-shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
                {/* The Card Body */}
                <div
                  className="border-2 border-frame-ink px-[16px] py-[8px] flex items-center gap-[8px] shadow-[3px_3px_0px_#000000] relative z-10"
                  style={{ backgroundColor: c.bg }}
                >
                  <span className="font-arial-black text-heading-3" style={{ color: c.text }}>
                    {c.logoSymbol}
                  </span>
                  <span className="font-arial-black text-body uppercase tracking-wider text-ink">
                    {c.name}
                  </span>
                </div>
                {/* Left Wheel */}
                <div className="absolute bottom-[2px] left-[16px] z-20 w-[18px] h-[18px] bg-black border-2 border-frame-ink rounded-full flex items-center justify-center">
                  <div className="w-[6px] h-[6px] bg-white rounded-none wheel-spin" />
                </div>
                {/* Right Wheel */}
                <div className="absolute bottom-[2px] right-[16px] z-20 w-[18px] h-[18px] bg-black border-2 border-frame-ink rounded-full flex items-center justify-center">
                  <div className="w-[6px] h-[6px] bg-white rounded-none wheel-spin" />
                </div>
              </div>

              {/* Chasing Students */}
              <div className="flex items-end gap-[6px] mb-[12px]">
                {Array.from({ length: c.students }).map((_, idx) => (
                  <div key={idx} className={idx === 0 ? "student-runner-1" : "student-runner-2"} title="Chasing placement!">
                    <svg viewBox="0 0 40 60" className="w-[28px] h-[42px] select-none">
                      {/* Graduation Cap */}
                      <polygon points="10,6 24,3 30,8 16,11" fill="black" stroke="black" strokeWidth="1" />
                      <path d="M 15,9 L 15,13 C 15,14 20,14 20,13 L 20,9" fill="black" stroke="black" strokeWidth="1" />
                      <path d="M 10,6 L 6,12" stroke="black" strokeWidth="1.5" />
                      <circle cx="6" cy="12" r="1.5" fill="black" />
                      
                      {/* Head */}
                      <circle cx="20" cy="20" r="5" fill="white" stroke="black" strokeWidth="2.5" />
                      
                      {/* Backpack (student knapsack on their back) */}
                      <rect x="22" y="25" width="7" height="10" rx="1.5" fill="white" stroke="black" strokeWidth="2" />
                      <path d="M 20,26 Q 23,24 23,27" fill="none" stroke="black" strokeWidth="1.5" />
                      
                      {/* Body */}
                      <path d="M 20,25 L 18,38" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
                      
                      {/* Arms */}
                      {/* Back Arm */}
                      <path d="M 19,27 L 27,31 L 33,37" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {/* Front Arm (holds scroll) */}
                      <path d="M 19,27 L 10,30 L 6,24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      
                      {/* Diploma Scroll in Hand (at 6,24) */}
                      <g transform="rotate(-20 6 24)">
                        <rect x="1" y="22" width="10" height="4" rx="1" fill="white" stroke="black" strokeWidth="1.5" />
                        <line x1="5" y1="22" x2="5" y2="26" stroke="#e91d2a" strokeWidth="1.5" />
                      </g>
                      
                      {/* Legs */}
                      <path d="M 18,38 L 8,44 L 4,52" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 18,38 L 25,45 L 32,52" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
