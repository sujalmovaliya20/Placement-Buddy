import React from 'react';

interface AuthFormCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  accentBgClassName?: string;
  bgClassName?: string;
  textClassName?: string;
}

export function AuthFormCard({
  title,
  children,
  className = '',
  accentBgClassName = 'bg-tint-sage',
  bgClassName = 'bg-canvas',
  textClassName = 'text-ink'
}: AuthFormCardProps) {
  return (
    <div className={`${bgClassName} ${textClassName} border border-frame-ink rounded-none flex flex-col ${className}`}>
      {title && (
        <div className={`${accentBgClassName} h-[40px] md:h-[48px] px-[16px] flex items-center border-b border-frame-ink select-none`}>
          <span className="font-helvetica text-heading-2 font-bold uppercase text-ink">
            {title}
          </span>
        </div>
      )}
      <div className="p-[24px] flex flex-col">
        {children}
      </div>
    </div>
  );
}
