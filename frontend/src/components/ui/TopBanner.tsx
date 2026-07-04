import React from 'react';

export function TopBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#000000] text-[#ffffff] font-helvetica text-heading-2 font-bold p-[12px_16px] border-b border-[#000000] select-none">
      {children}
    </div>
  );
}
