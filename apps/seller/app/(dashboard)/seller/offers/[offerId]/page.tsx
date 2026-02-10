'use client';

import * as React from 'react';
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
} from '@workspace/ui';
import { getOffer, updateOfferStatus } from '@/lib/api';
import { useSeller } from '@/components/seller-provider';
import { OfferStatusBar } from '@/components/offer-settings/offer-status-bar';
import { OverviewTab } from '@/components/offer-settings/overview-tab';
import { KeysTab } from '@/components/offer-settings/keys-tab';
import { PricingTab } from '@/components/offer-settings/pricing-tab';
import { DeliveryTab } from '@/components/offer-settings/delivery-tab';
import { DescriptionTab } from '@/components/offer-settings/description-tab';
import { AdvancedTab } from '@/components/offer-settings/advanced-tab';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@workspace/ui';
import type { OfferWithDetails } from '@workspace/contracts';

type TabId = 'overview' | 'keys' | 'pricing' | 'description' | 'delivery' | 'advanced';

const TABS: { id: TabId; label: string; showWhen?: (offer: OfferWithDetails) => boolean }[] = [
  { id: 'overview', label: 'Overview' },
  {
    id: 'keys',
    label: 'Keys',
    showWhen: (o) => o.deliveryType === 'AUTO_KEY',
  },
  { id: 'pricing', label: 'Pricing' },
  { id: 'description', label: 'Description' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'advanced', label: 'Advanced' },
];

export default function OfferSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeSeller } = useSeller();
  const offerId = params.offerId as string;
  const [activeTab, setActiveTab] = React.useState<TabId>('overview');

  const { data: offer, isLoading, error } = useQuery({
    queryKey: ['offer', offerId, activeSeller?.sellerId],
    queryFn: () => getOffer(offerId, activeSeller!.sellerId),
    enabled: !!offerId && !!activeSeller?.sellerId,
  });

  const forceDeactivateMutation = useMutation({
    mutationFn: () => updateOfferStatus(offerId, { status: 'inactive' }, activeSeller!.sellerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['offer', offerId] });
      toast({
        title: 'Offer deactivated',
        description: 'The offer is now inactive.',
        variant: 'success',
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to deactivate',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const visibleTabs = offer
    ? TABS.filter((t) => (t.showWhen ? t.showWhen(offer) : true))
    : TABS;

  if (isLoading) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/products">Offers</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Offer Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="mx-auto w-full max-w-4xl flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </>
    );
  }

  if (error || !offer) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/products">Offers</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Offer Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="mx-auto w-full max-w-4xl">
            <Alert variant="destructive">
              <AlertDescription>
                {error ? 'Failed to load offer.' : 'Offer not found.'}
              </AlertDescription>
            </Alert>
            <Button className="mt-4" onClick={() => router.push('/products')}>
              Back to Offers
            </Button>
          </div>
        </div>
      </>
    );
  }

  const breadcrumbLabel = offer.variant?.product?.name ?? offer.variant?.sku ?? offer.id;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/products">Offers</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{breadcrumbLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <h1 className="text-2xl font-bold text-foreground">Offer Settings</h1>
          <OfferStatusBar offer={offer} />

          <nav
            className="flex gap-1 border-b border-border"
            role="tablist"
            aria-label="Offer settings tabs"
          >
            {visibleTabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                className={
                  activeTab === tab.id
                    ? 'border-b-2 border-primary rounded-b-none -mb-px'
                    : ''
                }
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </nav>

          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
          >
            {activeTab === 'overview' && (
              <OverviewTab
                offer={offer}
                onNavigateToKeys={() => setActiveTab('keys')}
              />
            )}
            {activeTab === 'keys' && <KeysTab offerId={offer.id} />}
            {activeTab === 'pricing' && <PricingTab offer={offer} />}
            {activeTab === 'description' && <DescriptionTab offer={offer} />}
            {activeTab === 'delivery' && <DeliveryTab offer={offer} />}
            {activeTab === 'advanced' && (
              <AdvancedTab
                offer={offer}
                onForceDeactivate={() => forceDeactivateMutation.mutate()}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
