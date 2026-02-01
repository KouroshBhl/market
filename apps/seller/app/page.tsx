import Link from 'next/link';
import { Button, SidebarTrigger, Separator, Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from '@workspace/ui';

export default function Page() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="mx-auto w-full max-w-6xl">
          <h1 className="text-3xl font-bold mb-4">Seller Dashboard</h1>
          <p className="text-muted-foreground mb-6">Manage your products and inventory</p>
          
          <div className="space-y-4">
            <Link href="/products">
              <Button size="sm">Go to Products →</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
