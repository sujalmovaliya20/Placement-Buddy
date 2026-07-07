import React from 'react';
import Link from 'next/link';

interface TextLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  colorClassName?: string;
}

export function TextLink({ href, children, className = '', colorClassName = 'text-[#0000ee]' }: TextLinkProps) {
  return (
    <Link
      href={href}
      className={`${colorClassName} underline font-times-new-roman text-body relative inline-block after:content-[''] after:absolute after:inset-[-10px] after:block ${className}`}
    >
      {children}
    </Link>
  );
}
