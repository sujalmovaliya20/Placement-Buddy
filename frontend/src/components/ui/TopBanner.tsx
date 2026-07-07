import React from 'react';

export function TopBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col select-none">
      {/* Neo-brutalist diagonal stripes element - Top */}
      <div className="h-[6px] bg-[repeating-linear-gradient(45deg,#fcc20f,#fcc20f_10px,#000_10px,#000_20px)] border-y-2 border-frame-ink w-full" />
      
      <header className="relative bg-[#0c0c0d] text-[#ffffff] font-helvetica text-heading-2 font-bold p-[14px_24px] overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.06)] group">
        {/* Subtle diagonal line pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.02)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.02)_50%,rgba(255,255,255,0.02)_75%,transparent_75%,transparent)] bg-[size:16px_16px] pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between gap-[16px] flex-wrap md:flex-nowrap">
          <div className="flex items-center gap-[10px] tracking-wide uppercase">
            {children}
          </div>
          
          {/* Live Status indicator */}
          <div className="flex items-center gap-[8px] bg-[#1d1b22] border border-[#2b2933] px-[10px] py-[4px] shadow-[2px_2px_0px_#000000] text-caption uppercase tracking-widest text-[#a8a4b6] transition-all group-hover:border-[#fcc20f] group-hover:text-white">
            <span className="w-[8px] h-[8px] rounded-full bg-[#10b981] animate-pulse" />
            <span>SYSTEM ACTIVE</span>
          </div>
        </div>
      </header>
      {/* Neo-brutalist diagonal stripes element - Bottom */}
      <div className="h-[6px] bg-[repeating-linear-gradient(45deg,#fcc20f,#fcc20f_10px,#000_10px,#000_20px)] border-y-2 border-frame-ink w-full" />
    </div>
  );
}
