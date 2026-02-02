import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';
import { Providers } from '@/components/providers';
import { QueryProvider } from '@/components/query-provider';
import { SidebarProvider, SidebarInset, Toaster } from '@workspace/ui';
import { AppSidebar } from '@/components/ui/app-sidebar';
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
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <Providers>{children}</Providers>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
