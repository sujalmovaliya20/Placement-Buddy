import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function ButtonPrimary({ children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`bg-[#000000] text-[#ffffff] border border-[#000000] font-helvetica text-button font-bold px-[16px] py-[6px] rounded-none inline-flex items-center justify-center transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#000000] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
