import React from 'react';

/**
 * WARNING: Max one CtaBlockRed component per page!
 * Please ensure this rule is enforced when composing layouts.
 */
export function CtaBlockRed({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#e91d2a] text-[#ffffff] border border-[#000000] font-times-new-roman text-body p-[16px] rounded-none ${className}`}>
      {children}
    </div>
  );
}
