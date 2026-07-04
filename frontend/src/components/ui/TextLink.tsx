import React from 'react';
import Link from 'next/link';

interface TextLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function TextLink({ href, children, className = '' }: TextLinkProps) {
  return (
    <Link
      href={href}
      className={`text-[#0000ee] underline font-times-new-roman text-body ${className}`}
    >
      {children}
    </Link>
  );
}
