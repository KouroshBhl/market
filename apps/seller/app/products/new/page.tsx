'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DeliveryType } from '@workspace/contracts';
import {
  Button,
  Alert,
  AlertDescription,
  SidebarTrigger,
  Separator,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui';
import { DeliveryTypeCard } from '@/components/delivery-type-card';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function NewProductPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<DeliveryType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelectDeliveryType(deliveryType: DeliveryType) {
    setSelectedType(deliveryType);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/products/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deliveryType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create product draft');
      }

      const draft = await response.json();

      // Navigate to next step
      router.push(`/products/${draft.id}/next-step`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create product draft'
      );
      setSelectedType(null);
    } finally {
      setLoading(false);
    }
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
              <BreadcrumbPage>New Product</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className='flex flex-1 flex-col gap-4 p-4'>
        <div className='mx-auto w-full max-w-4xl'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-foreground mb-2'>
              Create New Product
            </h1>
            <p className='text-muted-foreground'>
              Choose how you want to deliver this product
            </p>
          </div>

          {error && (
            <Alert variant='destructive' className='mb-6'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <DeliveryTypeCard
              title='Automatic Key Delivery'
              description='Perfect for digital products like game keys, software licenses, or gift cards. Keys are delivered instantly to customers after purchase.'
              badge='Instant delivery'
              icon={
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z'
                  />
                </svg>
              }
              badgeIcon={
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 10V3L4 14h7v7l9-11h-7z'
                  />
                </svg>
              }
              selected={selectedType === 'AUTO_KEY'}
              disabled={loading}
              loading={selectedType === 'AUTO_KEY' && loading}
              onSelect={() => handleSelectDeliveryType('AUTO_KEY')}
            />

            <DeliveryTypeCard
              title='Manual Fulfillment'
              description="Ideal for custom services, physical goods, or products that require personal attention. You'll fulfill orders manually."
              badge='Flexible delivery'
              icon={
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                  />
                </svg>
              }
              badgeIcon={
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              }
              selected={selectedType === 'MANUAL'}
              disabled={loading}
              loading={selectedType === 'MANUAL' && loading}
              onSelect={() => handleSelectDeliveryType('MANUAL')}
            />
          </div>

          <div className='mt-8 text-center'>
            <Button variant='ghost' onClick={() => router.push('/products')}>
              ← Back to Products
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
