/**
 * Utility function for merging Tailwind CSS classes.
 *
 * Combines clsx (conditional classes) with tailwind-merge (deduplication)
 * so component variants don't produce conflicting utility classes.
 *
 * Usage:
 *   cn('px-4 py-2', isActive && 'bg-primary', className)
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
