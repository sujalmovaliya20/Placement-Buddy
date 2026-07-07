import React from 'react';

type TintVariant = 'olive' | 'sage' | 'salmon' | 'peach' | 'lime' | 'sky' | 'steel' | 'periwinkle';

interface RibbonCardProps {
  title: string;
  variant?: TintVariant;
  children: React.ReactNode;
  className?: string;
}

const TINT_CLASSES: Record<TintVariant, string> = {
  olive: 'bg-tint-olive',
  sage: 'bg-tint-sage',
  salmon: 'bg-tint-salmon',
  peach: 'bg-tint-peach',
  lime: 'bg-tint-lime',
  sky: 'bg-tint-sky',
  steel: 'bg-tint-steel',
  periwinkle: 'bg-tint-periwinkle',
};

export function RibbonCard({ title, variant = 'sage', children, className = '' }: RibbonCardProps) {
  const tintClass = TINT_CLASSES[variant] || TINT_CLASSES.sage;
  return (
    <div className={`border-2 border-frame-ink rounded-none flex flex-col shadow-[4px_4px_0px_#000000] transition-all duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0px_#000000] ${className}`}>
      {/* Title Bar */}
      <div className="bg-[#ffffff] text-[#000000] border-b-2 border-frame-ink font-helvetica text-heading-3 font-bold px-[12px] py-[8px] select-none relative overflow-hidden">
        {/* Subtle dot grid on title bar */}
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:6px_6px]" />
        <span className="relative z-10 tracking-wide">{title}</span>
      </div>
      {/* Body */}
      <div className={`${tintClass} text-[#000000] font-times-new-roman text-body p-[16px]`}>
        {children}
      </div>
    </div>
  );
}
