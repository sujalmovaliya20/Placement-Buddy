import React from 'react';

interface AuthFormCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function AuthFormCard({ title, children, className = '' }: AuthFormCardProps) {
  return (
    <div className={`bg-[#ffffff] text-[#000000] border border-[#000000] rounded-none p-[24px] flex flex-col ${className}`}>
      {title && (
        <div className="font-helvetica text-heading-3 font-bold border-b border-[#000000] pb-[8px] mb-[16px] uppercase select-none">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
