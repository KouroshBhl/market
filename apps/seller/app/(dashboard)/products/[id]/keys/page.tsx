'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  SidebarTrigger,
  Separator,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Alert,
  AlertDescription,
  Badge,
} from '@workspace/ui';
import { KeyPoolManager } from '@/components/key-pool-manager';
import type { OfferWithDetails } from '@workspace/contracts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SELLER_ID = '00000000-0000-0000-0000-000000000001';

export default function OfferKeysPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;

  // Fetch offer details
  const { data: offersData, isLoading, error } = useQuery<{ offers: OfferWithDetails[] }>({
    queryKey: ['seller-offers'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/seller/offers?sellerId=${SELLER_ID}`);
      if (!response.ok) throw new Error('Failed to fetch offers');
      return response.json();
    },
  });

  const offer = offersData?.offers.find((o) => o.id === offerId);

  if (isLoading) {
    return (
      <>
        <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2 h-4' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href='/'>Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href='/products'>Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Keys</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className='flex flex-1 flex-col gap-4 p-4'>
          <div className='mx-auto w-full max-w-4xl'>
            <div className='flex items-center justify-center py-12'>
              <div className='w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin' />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !offer) {
    return (
      <>
        <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2 h-4' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href='/'>Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href='/products'>Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Keys</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className='flex flex-1 flex-col gap-4 p-4'>
          <div className='mx-auto w-full max-w-4xl'>
            <Alert variant='destructive'>
              <AlertDescription>
                {error ? 'Failed to load offer' : 'Offer not found'}
              </AlertDescription>
            </Alert>
            <Button className='mt-4' onClick={() => router.push('/products')}>
              ← Back to Products
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (offer.deliveryType !== 'AUTO_KEY') {
    return (
      <>
        <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2 h-4' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href='/'>Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href='/products'>Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Keys</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className='flex flex-1 flex-col gap-4 p-4'>
          <div className='mx-auto w-full max-w-4xl'>
            <Alert>
              <AlertDescription>
                Key management is only available for Auto-Key delivery offers.
              </AlertDescription>
            </Alert>
            <Button className='mt-4' onClick={() => router.push('/products')}>
              ← Back to Products
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href='/'>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href='/products'>Products</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Key Management</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className='flex flex-1 flex-col gap-4 p-4'>
        <div className='mx-auto w-full max-w-4xl'>
          {/* Offer Info Header */}
          <div className='mb-6'>
            <Button
              variant='ghost'
              size='sm'
              className='mb-4'
              onClick={() => router.push('/products')}
            >
              ← Back to Products
            </Button>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-2xl font-bold text-foreground'>
                  {offer.variant?.product?.name || 'Unknown Product'}
                </h1>
                <div className='flex items-center gap-2 mt-2'>
                  <Badge variant='outline'>{offer.variant?.region}</Badge>
                  {offer.variant?.durationDays && (
                    <Badge variant='outline'>{offer.variant.durationDays} days</Badge>
                  )}
                  {offer.variant?.edition && (
                    <Badge variant='outline'>{offer.variant.edition}</Badge>
                  )}
                  <Badge variant='outline'>🔑 Auto-Key</Badge>
                  <Badge variant={offer.status === 'active' ? 'success' : 'secondary'}>
                    {offer.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className='text-right'>
                <p className='text-2xl font-bold text-foreground'>
                  {(offer.priceAmount / 100).toFixed(2)} {offer.currency}
                </p>
                {offer.availability && (
                  <Badge
                    variant={offer.availability === 'in_stock' ? 'success' : 'destructive'}
                    className='mt-1'
                  >
                    {offer.availability === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Key Pool Manager */}
          <KeyPoolManager offerId={offerId} sellerId={SELLER_ID} />
        </div>
      </div>
    </>
  );
}
