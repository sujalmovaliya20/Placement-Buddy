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
    <div className={`border border-[#000000] rounded-none flex flex-col ${className}`}>
      {/* Title Bar */}
      <div className="bg-[#ffffff] text-[#000000] border-b border-[#000000] font-helvetica text-heading-3 font-bold px-[12px] py-[6px] select-none">
        {title}
      </div>
      {/* Body */}
      <div className={`${tintClass} text-[#000000] font-times-new-roman text-body p-[12px_16px]`}>
        {children}
      </div>
    </div>
  );
}
