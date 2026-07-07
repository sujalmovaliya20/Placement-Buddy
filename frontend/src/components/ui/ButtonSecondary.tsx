import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  bgClassName?: string;
  textClassName?: string;
  borderClassName?: string;
  roundedClassName?: string;
}

export function ButtonSecondary({
  children,
  className = '',
  bgClassName = 'bg-[#ffffff]',
  textClassName = 'text-[#000000]',
  borderClassName = 'border-[#000000]',
  roundedClassName = 'rounded-none',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${bgClassName} ${textClassName} border ${borderClassName} ${roundedClassName} font-helvetica text-button font-bold px-[16px] py-[10px] inline-flex items-center justify-center transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#000000] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

