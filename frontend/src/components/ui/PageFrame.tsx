import React from 'react';

export function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#000000] p-[4px] min-[481px]:p-[8px] font-times-new-roman text-[#000000] selection:bg-[#fcc20f] selection:text-[#000000]">
      <div className="min-h-[calc(100vh-8px)] min-[481px]:min-h-[calc(100vh-16px)] bg-[#ffffff] text-[#000000] border border-[#000000] flex flex-col">
        {children}
      </div>
    </div>
  );
}
