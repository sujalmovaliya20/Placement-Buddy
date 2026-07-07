import React from 'react';

interface AuthFormCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  accentBgClassName?: string;
  bgClassName?: string;
  textClassName?: string;
  borderClassName?: string;
  roundedClassName?: string;
  titleClassName?: string;
}

export function AuthFormCard({
  title,
  children,
  className = '',
  accentBgClassName = 'bg-tint-sage',
  bgClassName = 'bg-canvas',
  textClassName = 'text-ink',
  borderClassName = 'border-2 border-frame-ink shadow-[6px_6px_0px_#000000]',
  roundedClassName = 'rounded-none',
  titleClassName = 'font-helvetica text-heading-2 font-bold uppercase text-ink'
}: AuthFormCardProps) {
  return (
    <div className={`${bgClassName} ${textClassName} ${borderClassName} ${roundedClassName} flex flex-col ${className}`}>
      {title && (
        <div className={`${accentBgClassName} h-[48px] md:h-[56px] px-[20px] flex items-center border-b-2 border-frame-ink select-none relative overflow-hidden`}>
          {/* Subtle dot matrix grid on card header */}
          <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:6px_6px]" />
          <span className={`${titleClassName} relative z-10 tracking-wide`}>
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
