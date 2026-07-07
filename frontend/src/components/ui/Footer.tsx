'use client';

import React from 'react';

export function Footer() {
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#0c0c0d] text-[#ffffff] font-helvetica select-none relative overflow-hidden">
      {/* Neo-brutalist diagonal stripes element - Top */}
      <div className="h-[6px] bg-[repeating-linear-gradient(45deg,#fcc20f,#fcc20f_10px,#000_10px,#000_20px)] border-y-2 border-frame-ink" />

      <div className="max-w-7xl mx-auto px-[24px] py-[32px] flex flex-col md:flex-row justify-between items-center gap-[24px]">
        {/* Left: Branding */}
        <div className="flex flex-col items-center md:items-start gap-[6px] text-center md:text-left">
          <div className="font-arial-black text-heading-2 uppercase tracking-wide">
            PLACEMENT <span className="text-[#fcc20f]">BUDDY</span>
          </div>
        </div>

        {/* Center: Developer Credits & System Status Metadata */}
        <div className="flex flex-col items-center gap-[8px] text-center">
          <p className="font-times-new-roman text-[16px] md:text-[17px] text-[#a8a4b6]">
            DEVELOPED BY <span className="font-bold text-[#fcc20f] hover:text-white transition-colors cursor-pointer uppercase">SUJAL MOVALIYA</span> @2026
          </p>
          <div className="font-times-new-roman text-caption text-[#8c889a] uppercase tracking-widest">
            ALL RIGHTS RESERVED // VER: 1.2.0 // EST. 2026
          </div>
        </div>

        {/* Right: Interactive utility buttons */}
        <div className="flex items-center gap-[12px]">
          <button
            onClick={scrollToTop}
            type="button"
            className="bg-[#1e1c24] text-white border-2 border-frame-ink px-[14px] py-[8px] text-caption uppercase font-bold tracking-wider hover:bg-[#fcc20f] hover:text-[#000000] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_#000000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all duration-150 cursor-pointer shadow-[2px_2px_0px_#000000]"
          >
            ↑ SCROLL TO TOP
          </button>
        </div>
      </div>

      {/* Neo-brutalist diagonal stripes element - Bottom */}
      <div className="h-[6px] bg-[repeating-linear-gradient(45deg,#fcc20f,#fcc20f_10px,#000_10px,#000_20px)] border-y-2 border-frame-ink" />
    </footer>
  );
}
