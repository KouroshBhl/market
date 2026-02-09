import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';
import { Providers } from '@/components/providers';
import { QueryProvider } from '@/components/query-provider';
import { AuthProvider } from '@/components/auth-provider';
import { Toaster } from '@workspace/ui';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <QueryProvider>
          <Providers>
            <AuthProvider>
              {children}
            </AuthProvider>
          </Providers>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
