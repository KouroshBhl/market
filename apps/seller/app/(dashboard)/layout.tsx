'use client';

import { SidebarProvider, SidebarInset } from '@workspace/ui';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { EmailVerificationBanner } from '@/components/email-verification-banner';
import { SellerProvider } from '@/components/seller-provider';
import { PresenceProvider } from '@/components/presence-provider';
import { usePresenceHeartbeat } from '@/hooks/use-presence-heartbeat';

function DashboardInner({ children }: { children: React.ReactNode }) {
  usePresenceHeartbeat();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <EmailVerificationBanner />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SellerProvider>
      <PresenceProvider>
        <DashboardInner>{children}</DashboardInner>
      </PresenceProvider>
    </SellerProvider>
  );
}
