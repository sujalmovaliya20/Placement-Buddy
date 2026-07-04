import type { Metadata } from 'next';
import { ToastProvider } from '@/lib/toast-context';
import { PageFrame } from '@/components/ui';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Placement Buddy — College Placement Platform',
    template: '%s | Placement Buddy',
  },
  description:
    'Streamline your college placement process — manage drives, track applications, and connect students with top companies.',
  keywords: ['placement', 'campus recruitment', 'college placements', 'job portal'],
  authors: [{ name: 'Placement Platform Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Placement Buddy',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ToastProvider>
          <PageFrame>
            {children}
          </PageFrame>
        </ToastProvider>
      </body>
    </html>
  );
}
