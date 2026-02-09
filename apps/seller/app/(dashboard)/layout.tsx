import { SidebarProvider, SidebarInset } from '@workspace/ui';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { EmailVerificationBanner } from '@/components/email-verification-banner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
