import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

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
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
