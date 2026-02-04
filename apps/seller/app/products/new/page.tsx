'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type {
  DeliveryType,
  Currency,
  CatalogProduct,
  CatalogVariant,
} from '@workspace/contracts';
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
  Card,
  Input,
  Label,
  Badge,
  toast,
  Select,
} from '@workspace/ui';
import { DeliveryTypeCard } from '@/components/delivery-type-card';
import { MarkdownEditor } from '@/components/markdown-editor';
import { MarkdownPreview } from '@/components/markdown-preview';
import { CategorySelector } from '@/components/category-selector';
import { CatalogProductSelector } from '@/components/catalog-product-selector';
import { VariantSelector } from '@/components/variant-selector';
import { useQuery } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// For now, hardcode sellerId until auth is implemented
const SELLER_ID = '00000000-0000-0000-0000-000000000001';

type Step =
  | 'category'
  | 'product'
  | 'variant'
  | 'delivery-type'
  | 'pricing'
  | 'review';

// SLA presets for manual delivery (in minutes)
const SLA_PRESETS = [
  { label: '15 minutes', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '6 hours', value: 360 },
  { label: '24 hours', value: 1440 },
  { label: '3 days', value: 4320 },
  { label: 'Custom', value: -1 }, // -1 indicates custom input
] as const;

interface WizardState {
  categoryId: string | null;
  productId: string | null;
  variantId: string | null;
  deliveryType: DeliveryType | null;
  priceAmount: string; // Keep as string for input
  currency: Currency;
  stockCount: string; // For MANUAL delivery only
  descriptionMarkdown: string;
  // Manual delivery
  deliveryInstructions: string;
  estimatedDeliveryMinutes: number | null; // SLA for manual delivery
  customSlaValue: string; // For custom SLA input
}

const INITIAL_STATE: WizardState = {
  categoryId: null,
  productId: null,
  variantId: null,
  deliveryType: null,
  priceAmount: '',
  currency: 'USD',
  stockCount: '',
  descriptionMarkdown: '',
  deliveryInstructions: '',
  estimatedDeliveryMinutes: null,
  customSlaValue: '',
};

export default function NewOfferPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('category');
  const [wizardState, setWizardState] = useState<WizardState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  // Fetch catalog products for selected category
  const { data: catalogProductsData, isLoading: productsLoading } = useQuery<{
    products: CatalogProduct[];
  }>({
    queryKey: ['catalog-products', wizardState.categoryId],
    queryFn: async () => {
      const url = new URL(`${API_URL}/catalog/products`);
      if (wizardState.categoryId) {
        url.searchParams.set('categoryId', wizardState.categoryId);
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    enabled: !!wizardState.categoryId,
  });

  // Fetch variants for selected product
  const { data: variantsData, isLoading: variantsLoading } = useQuery<{
    variants: CatalogVariant[];
  }>({
    queryKey: ['catalog-variants', wizardState.productId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/catalog/products/${wizardState.productId}/variants`
      );
      if (!response.ok) throw new Error('Failed to fetch variants');
      return response.json();
    },
    enabled: !!wizardState.productId,
  });

  // Fetch platform fee for pricing preview
  const { data: platformFee } = useQuery({
    queryKey: ['platformFee'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/settings/platform-fee`);
      if (!response.ok) throw new Error('Failed to fetch platform fee');
      return response.json();
    },
  });

  const updateState = (updates: Partial<WizardState>) => {
    setWizardState((prev) => ({ ...prev, ...updates }));
    setError(null);
    setValidationErrors([]);
  };

  const goToStep = (step: Step) => {
    setCurrentStep(step);
    setError(null);
    setValidationErrors([]);
  };

  const canProceedFromCategory = wizardState.categoryId !== null;
  const canProceedFromProduct = wizardState.productId !== null;
  const canProceedFromVariant = wizardState.variantId !== null;
  const canProceedFromDeliveryType = wizardState.deliveryType !== null;
  
  // For MANUAL delivery, require delivery instructions and SLA to publish
  const manualDeliveryValid = wizardState.deliveryType === 'MANUAL'
    ? wizardState.deliveryInstructions.trim() !== '' && 
      wizardState.estimatedDeliveryMinutes !== null && 
      wizardState.estimatedDeliveryMinutes > 0
    : true;
  
  const canProceedFromPricing =
    wizardState.priceAmount.trim() !== '' &&
    !isNaN(Number(wizardState.priceAmount)) &&
    Number(wizardState.priceAmount) > 0 &&
    manualDeliveryValid;

  // Get selected variant details
  const selectedVariant = variantsData?.variants.find(
    (v) => v.id === wizardState.variantId
  );

  // Determine available delivery types based on variant capabilities
  const availableDeliveryTypes = selectedVariant
    ? {
        autoKey: selectedVariant.supportsAutoKey,
        manual: selectedVariant.supportsManual,
      }
    : { autoKey: true, manual: true }; // Default to all if no variant selected yet

  // Auto-select delivery type if only one is available, or reset if current selection is invalid
  useEffect(() => {
    if (!selectedVariant) return;

    const { supportsAutoKey, supportsManual } = selectedVariant;

    // If only one delivery type is supported, auto-select it
    if (supportsAutoKey && !supportsManual) {
      updateState({ deliveryType: 'AUTO_KEY' });
    } else if (!supportsAutoKey && supportsManual) {
      updateState({ deliveryType: 'MANUAL' });
    } else if (!supportsAutoKey && !supportsManual) {
      // This shouldn't happen if data is correct, but handle it
      setError('Selected variant does not support any delivery method');
    } else if (wizardState.deliveryType) {
      // Both are supported, but check if current selection is still valid
      if (wizardState.deliveryType === 'AUTO_KEY' && !supportsAutoKey) {
        updateState({ deliveryType: null });
      } else if (wizardState.deliveryType === 'MANUAL' && !supportsManual) {
        updateState({ deliveryType: null });
      }
    }
  }, [selectedVariant?.id]); // Only run when variant changes

  const handleSaveDraft = async () => {
    console.log('💾 Saving draft...');
    setLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      const payload: any = {
        sellerId: SELLER_ID,
        deliveryType: wizardState.deliveryType,
      };

      // Add optional fields if provided
      if (wizardState.variantId) payload.variantId = wizardState.variantId;
      if (
        wizardState.priceAmount.trim() &&
        !isNaN(Number(wizardState.priceAmount))
      ) {
        payload.priceAmount = Math.round(Number(wizardState.priceAmount) * 100); // Convert to cents
      }
      if (wizardState.currency) payload.currency = wizardState.currency;
      if (
        wizardState.deliveryType === 'MANUAL' &&
        wizardState.stockCount.trim() &&
        !isNaN(Number(wizardState.stockCount))
      ) {
        payload.stockCount = Number(wizardState.stockCount);
      }
      if (wizardState.descriptionMarkdown.trim()) {
        payload.descriptionMarkdown = wizardState.descriptionMarkdown.trim();
      }

      // Add delivery config for MANUAL type
      if (wizardState.deliveryType === 'MANUAL') {
        payload.deliveryInstructions = wizardState.deliveryInstructions || null;
        if (wizardState.estimatedDeliveryMinutes) {
          payload.estimatedDeliveryMinutes = wizardState.estimatedDeliveryMinutes;
        }
      }
      // Note: For AUTO_KEY, key pool is created automatically when publishing

      console.log('📤 Saving draft payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${API_URL}/offers/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('📥 Draft response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Draft error:', errorData);
        throw new Error(errorData.message || 'Failed to save draft');
      }

      const result = await response.json();
      console.log('✅ Draft saved:', result);

      toast({
        title: '✓ Success',
        description: 'Draft saved successfully!',
        variant: 'success',
      });

      setTimeout(() => router.push('/products'), 1000);
    } catch (err) {
      console.error('💥 Draft save error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save draft';
      setError(errorMessage);
      toast({
        title: '✕ Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    console.log('🚀 Starting publish process...');
    setLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      // Validate required fields before sending
      if (!wizardState.variantId) {
        throw new Error('Please select a variant');
      }
      if (!wizardState.priceAmount || Number(wizardState.priceAmount) <= 0) {
        throw new Error('Please enter a valid price greater than 0');
      }
      // Validate MANUAL delivery requirements
      if (wizardState.deliveryType === 'MANUAL') {
        if (!wizardState.deliveryInstructions || wizardState.deliveryInstructions.trim() === '') {
          throw new Error('Delivery instructions are required for manual delivery');
        }
        if (!wizardState.estimatedDeliveryMinutes || wizardState.estimatedDeliveryMinutes <= 0) {
          throw new Error('Estimated delivery time (SLA) is required for manual delivery');
        }
      }

      const payload: any = {
        sellerId: SELLER_ID,
        deliveryType: wizardState.deliveryType,
        variantId: wizardState.variantId,
        priceAmount: Math.round(Number(wizardState.priceAmount) * 100),
        currency: wizardState.currency,
      };

      if (
        wizardState.deliveryType === 'MANUAL' &&
        wizardState.stockCount.trim() &&
        !isNaN(Number(wizardState.stockCount))
      ) {
        payload.stockCount = Number(wizardState.stockCount);
      }
      if (wizardState.descriptionMarkdown.trim()) {
        payload.descriptionMarkdown = wizardState.descriptionMarkdown.trim();
      }

      // Add delivery config for MANUAL type
      if (wizardState.deliveryType === 'MANUAL') {
        payload.deliveryInstructions = wizardState.deliveryInstructions || null;
        payload.estimatedDeliveryMinutes = wizardState.estimatedDeliveryMinutes;
      }
      // Note: For AUTO_KEY, key pool is created automatically by the API

      console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${API_URL}/offers/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);

        if (errorData.errors && Array.isArray(errorData.errors)) {
          setValidationErrors(errorData.errors);
        }
        throw new Error(errorData.message || 'Failed to publish offer');
      }

      const result = await response.json();
      console.log('✅ Offer published successfully:', result);

      // Show success message
      toast({
        title: '✓ Success',
        description: 'Offer published successfully!',
        variant: 'success',
      });

      // Redirect to products page after a short delay
      setTimeout(() => router.push('/products'), 1500);
    } catch (err) {
      console.error('💥 Publish error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to publish offer';
      setError(errorMessage);
      // Also show toast for immediate feedback
      toast({
        title: '✕ Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'category':
        return (
          <div>
            <div className='mb-8'>
              <h2 className='text-2xl font-bold text-foreground mb-2'>
                Select Category
              </h2>
              <p className='text-muted-foreground'>
                Choose the category to browse catalog products
              </p>
            </div>

            {categoriesLoading ? (
              <div className='text-center py-12'>
                <div className='w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto'></div>
                <p className='text-muted-foreground mt-4'>
                  Loading categories...
                </p>
              </div>
            ) : categoriesData?.parents ? (
              <CategorySelector
                categories={categoriesData.parents}
                selectedCategoryId={wizardState.categoryId}
                onSelect={(id) =>
                  updateState({
                    categoryId: id,
                    productId: null,
                    variantId: null,
                  })
                }
              />
            ) : (
              <Alert variant='destructive'>
                <AlertDescription>Failed to load categories</AlertDescription>
              </Alert>
            )}

            <div className='mt-8 flex gap-4'>
              <Button variant='ghost' onClick={() => router.push('/products')}>
                Cancel
              </Button>
              <Button
                onClick={() => goToStep('product')}
                disabled={!canProceedFromCategory}
              >
                Next: Select Product →
              </Button>
            </div>
          </div>
        );

      case 'product':
        return (
          <div>
            <div className='mb-8'>
              <h2 className='text-2xl font-bold text-foreground mb-2'>
                Select Catalog Product
              </h2>
              <p className='text-muted-foreground'>
                Choose a product from the marketplace catalog
              </p>
            </div>

            {productsLoading ? (
              <div className='text-center py-12'>
                <div className='w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto'></div>
                <p className='text-muted-foreground mt-4'>
                  Loading products...
                </p>
              </div>
            ) : catalogProductsData?.products ? (
              <CatalogProductSelector
                products={catalogProductsData.products}
                selectedProductId={wizardState.productId}
                onSelect={(id) =>
                  updateState({ productId: id, variantId: null })
                }
              />
            ) : (
              <Alert variant='destructive'>
                <AlertDescription>Failed to load products</AlertDescription>
              </Alert>
            )}

            <div className='mt-8 flex gap-4'>
              <Button variant='ghost' onClick={() => goToStep('category')}>
                ← Back
              </Button>
              <Button
                onClick={() => goToStep('variant')}
                disabled={!canProceedFromProduct}
              >
                Next: Select Variant →
              </Button>
            </div>
          </div>
        );

      case 'variant':
        return (
          <div>
            <div className='mb-8'>
              <h2 className='text-2xl font-bold text-foreground mb-2'>
                Select Variant
              </h2>
              <p className='text-muted-foreground'>
                Choose a variant (region/duration/edition) to create your offer
                for
              </p>
            </div>

            {variantsLoading ? (
              <div className='text-center py-12'>
                <div className='w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto'></div>
                <p className='text-muted-foreground mt-4'>
                  Loading variants...
                </p>
              </div>
            ) : variantsData?.variants ? (
              <VariantSelector
                variants={variantsData.variants}
                selectedVariantId={wizardState.variantId}
                onSelect={(id) => {
                  updateState({ variantId: id, deliveryType: null });
                }}
              />
            ) : (
              <Alert variant='destructive'>
                <AlertDescription>Failed to load variants</AlertDescription>
              </Alert>
            )}

            <div className='mt-8 flex gap-4'>
              <Button variant='ghost' onClick={() => goToStep('product')}>
                ← Back
              </Button>
              <Button
                onClick={() => goToStep('delivery-type')}
                disabled={!canProceedFromVariant}
              >
                Next: Choose Delivery Type →
              </Button>
            </div>
          </div>
        );

      case 'delivery-type':
        return (
          <div>
            <div className='mb-8'>
              <h2 className='text-2xl font-bold text-foreground mb-2'>
                Choose Delivery Type
              </h2>
              <p className='text-muted-foreground'>
                Select how you want to deliver this product to customers
              </p>
              {selectedVariant && (
                <div className='mt-4 p-4 bg-muted/50 rounded-lg border border-border'>
                  <p className='text-sm text-muted-foreground'>
                    <strong>Selected variant:</strong> {selectedVariant.sku}
                  </p>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Available delivery methods:{' '}
                    {[
                      selectedVariant.supportsAutoKey && 'Auto-Key',
                      selectedVariant.supportsManual && 'Manual',
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}
            </div>

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
                selected={wizardState.deliveryType === 'AUTO_KEY'}
                disabled={!availableDeliveryTypes.autoKey}
                loading={false}
                onSelect={() => updateState({ deliveryType: 'AUTO_KEY' })}
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
                selected={wizardState.deliveryType === 'MANUAL'}
                disabled={!availableDeliveryTypes.manual}
                loading={false}
                onSelect={() => updateState({ deliveryType: 'MANUAL' })}
              />
            </div>

            {!availableDeliveryTypes.autoKey &&
              !availableDeliveryTypes.manual && (
                <Alert variant='destructive' className='mt-6'>
                  <AlertDescription>
                    The selected variant does not support any delivery method.
                    Please go back and select a different variant.
                  </AlertDescription>
                </Alert>
              )}

            <div className='mt-8 flex gap-4'>
              <Button variant='ghost' onClick={() => goToStep('variant')}>
                ← Back
              </Button>
              <Button
                onClick={() => goToStep('pricing')}
                disabled={!canProceedFromDeliveryType}
              >
                Next: Set Pricing →
              </Button>
            </div>
          </div>
        );

      case 'pricing': {
        // Calculate pricing preview
        const priceCents = Math.round(
          parseFloat(wizardState.priceAmount || '0') * 100
        );
        const commission =
          platformFee && priceCents > 0
            ? {
                sellerPriceCents: priceCents,
                feeAmountCents: Math.round(
                  (priceCents * platformFee.platformFeeBps) / 10000
                ),
                buyerTotalCents:
                  priceCents +
                  Math.round((priceCents * platformFee.platformFeeBps) / 10000),
              }
            : null;

        const formatPrice = (cents: number) => (cents / 100).toFixed(2);

        return (
          <div>
            <div className='mb-8'>
              <h2 className='text-2xl font-bold text-foreground mb-2'>
                Pricing & Delivery
              </h2>
              <p className='text-muted-foreground'>
                Set your offer price and delivery configuration
              </p>
            </div>

            <Card className='p-6 space-y-6'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='price'>
                    Price ({wizardState.currency}) *
                  </Label>
                  <Input
                    id='price'
                    type='number'
                    step='0.01'
                    min='0.01'
                    value={wizardState.priceAmount}
                    onChange={(e) =>
                      updateState({ priceAmount: e.target.value })
                    }
                    placeholder='9.99'
                  />
                  <p className='text-xs text-muted-foreground'>
                    This is the amount you will receive per sale
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='currency'>Currency *</Label>
                  <Select
                    id='currency'
                    value={wizardState.currency}
                    onChange={(e) =>
                      updateState({ currency: e.target.value as Currency })
                    }
                  >
                    <option value='USD'>USD - US Dollar</option>
                    <option value='EUR'>EUR - Euro</option>
                    <option value='UAH'>UAH - Ukrainian Hryvnia</option>
                    <option value='RUB'>RUB - Russian Ruble</option>
                    <option value='IRR'>IRR - Iranian Rial</option>
                  </Select>
                </div>
              </div>

              {/* Pricing Preview Card */}
              {commission && priceCents > 0 && (
                <Card className='p-4 bg-muted/30 border-2'>
                  <h3 className='font-semibold text-foreground mb-3'>
                    Pricing Preview
                  </h3>
                  <div className='space-y-2'>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-muted-foreground'>
                        Your price (seller receives):
                      </span>
                      <span className='font-medium text-foreground'>
                        {wizardState.currency}{' '}
                        {formatPrice(commission.sellerPriceCents)}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-muted-foreground'>
                        Platform fee (
                        {platformFee?.platformFeePercent.toFixed(2)}%):
                      </span>
                      <span className='font-medium text-foreground'>
                        +{wizardState.currency}{' '}
                        {formatPrice(commission.feeAmountCents)}
                      </span>
                    </div>
                    <div className='border-t pt-2 flex justify-between items-center'>
                      <span className='font-semibold text-foreground'>
                        Buyer pays:
                      </span>
                      <span className='font-bold text-foreground text-lg'>
                        {wizardState.currency}{' '}
                        {formatPrice(commission.buyerTotalCents)}
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {wizardState.deliveryType === 'MANUAL' && (
                <div className='space-y-2'>
                  <Label htmlFor='stockCount'>Stock Count (optional)</Label>
                  <Input
                    id='stockCount'
                    type='number'
                    min='0'
                    value={wizardState.stockCount}
                    onChange={(e) =>
                      updateState({ stockCount: e.target.value })
                    }
                    placeholder='e.g., 100'
                  />
                  <p className='text-xs text-muted-foreground'>
                    Manual stock tracking. Leave empty for unlimited.
                  </p>
                </div>
              )}

              <div className='space-y-2'>
                <MarkdownEditor
                  value={wizardState.descriptionMarkdown}
                  onChange={(v) => updateState({ descriptionMarkdown: v })}
                  label='Offer description (optional)'
                  helperText='Supports **bold**, _italic_, lists, headings, emojis. Visible to buyers.'
                />
              </div>

              {wizardState.deliveryType === 'MANUAL' && (
                <>
                  <div className='space-y-2'>
                    <Label htmlFor='deliveryInstructions'>
                      Delivery Instructions * (required)
                    </Label>
                    <Input
                      id='deliveryInstructions'
                      value={wizardState.deliveryInstructions}
                      onChange={(e) =>
                        updateState({ deliveryInstructions: e.target.value })
                      }
                      placeholder='How will you deliver this product to the buyer...'
                      required
                    />
                    <p className='text-xs text-muted-foreground'>
                      Describe how you will fulfill orders (e.g., "I will send the account credentials via chat within 1 hour")
                    </p>
                  </div>
                  
                  <div className='space-y-2'>
                    <Label>Estimated Delivery Time (SLA) * (required)</Label>
                    <div className='grid grid-cols-3 gap-2'>
                      {SLA_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type='button'
                          onClick={() => {
                            if (preset.value === -1) {
                              // Custom: keep current custom value or reset
                              updateState({ 
                                estimatedDeliveryMinutes: wizardState.customSlaValue 
                                  ? parseInt(wizardState.customSlaValue) 
                                  : null 
                              });
                            } else {
                              updateState({ 
                                estimatedDeliveryMinutes: preset.value,
                                customSlaValue: '' 
                              });
                            }
                          }}
                          className={`
                            p-2 text-sm rounded-lg border-2 transition-all
                            ${
                              (preset.value === -1 && wizardState.customSlaValue) ||
                              (preset.value !== -1 && wizardState.estimatedDeliveryMinutes === preset.value)
                                ? 'border-ring bg-accent text-accent-foreground'
                                : 'border-border hover:border-ring/50 text-foreground'
                            }
                          `}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom SLA input */}
                    {(wizardState.customSlaValue || 
                      (wizardState.estimatedDeliveryMinutes && 
                       !SLA_PRESETS.slice(0, -1).some(p => p.value === wizardState.estimatedDeliveryMinutes))) && (
                      <div className='flex gap-2 items-center mt-2'>
                        <Input
                          type='number'
                          min='1'
                          value={wizardState.customSlaValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateState({ 
                              customSlaValue: val,
                              estimatedDeliveryMinutes: val ? parseInt(val) : null 
                            });
                          }}
                          placeholder='Enter minutes'
                          className='w-32'
                        />
                        <span className='text-sm text-muted-foreground'>minutes</span>
                      </div>
                    )}
                    
                    <p className='text-xs text-muted-foreground'>
                      How long will it typically take you to fulfill orders? This SLA is shown to buyers.
                    </p>
                  </div>
                </>
              )}

              {wizardState.deliveryType === 'AUTO_KEY' && (
                <div className='space-y-2 p-4 bg-muted/50 rounded-lg border border-border'>
                  <div className='flex items-center gap-2'>
                    <svg
                      className='w-5 h-5 text-muted-foreground'
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
                    <span className='font-medium text-foreground'>
                      Auto-Key Delivery
                    </span>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    A key pool will be automatically created when you publish
                    this offer. You can upload keys after publishing.
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    Note: The offer will show as &quot;Out of Stock&quot; until
                    you upload keys.
                  </p>
                </div>
              )}
            </Card>

            <div className='mt-8 flex gap-4'>
              <Button variant='ghost' onClick={() => goToStep('delivery-type')}>
                ← Back
              </Button>
              <Button
                onClick={() => goToStep('review')}
                disabled={!canProceedFromPricing}
              >
                Next: Review →
              </Button>
            </div>
          </div>
        );
      }

      case 'review': {
        const reviewVariant = variantsData?.variants.find(
          (v) => v.id === wizardState.variantId
        );
        const reviewProduct = catalogProductsData?.products.find(
          (p) => p.id === wizardState.productId
        );

        return (
          <div>
            <div className='mb-8'>
              <h2 className='text-2xl font-bold text-foreground mb-2'>
                Review & Publish
              </h2>
              <p className='text-muted-foreground'>
                Review your offer details before publishing
              </p>
            </div>

            <Card className='p-6 space-y-6'>
              <div>
                <h3 className='font-semibold text-foreground mb-2'>
                  Delivery Type
                </h3>
                <Badge>
                  {wizardState.deliveryType === 'AUTO_KEY'
                    ? 'Automatic Key Delivery'
                    : 'Manual Fulfillment'}
                </Badge>
              </div>

              <Separator />

              <div>
                <h3 className='font-semibold text-foreground mb-2'>Product</h3>
                {reviewProduct && (
                  <div className='text-sm'>
                    <p className='font-medium text-foreground'>
                      {reviewProduct.name}
                    </p>
                    {reviewProduct.description && (
                      <p className='text-muted-foreground mt-1'>
                        {reviewProduct.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h3 className='font-semibold text-foreground mb-2'>Variant</h3>
                {reviewVariant && (
                  <dl className='space-y-2 text-sm'>
                    <div>
                      <dt className='text-muted-foreground'>Region:</dt>
                      <dd className='text-foreground'>
                        {reviewVariant.region}
                      </dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>Duration:</dt>
                      <dd className='text-foreground'>
                        {reviewVariant.durationDays
                          ? `${reviewVariant.durationDays} days`
                          : 'N/A'}
                      </dd>
                    </div>
                    {reviewVariant.edition && (
                      <div>
                        <dt className='text-muted-foreground'>Edition:</dt>
                        <dd className='text-foreground'>
                          {reviewVariant.edition}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className='text-muted-foreground'>SKU:</dt>
                      <dd className='text-foreground font-mono text-xs'>
                        {reviewVariant.sku}
                      </dd>
                    </div>
                  </dl>
                )}
              </div>

              <Separator />

              <div>
                <h3 className='font-semibold text-foreground mb-2'>Pricing</h3>
                <dl className='space-y-2 text-sm'>
                  <div>
                    <dt className='text-muted-foreground'>Price:</dt>
                    <dd className='text-foreground font-semibold'>
                      {wizardState.currency} ${wizardState.priceAmount}
                    </dd>
                  </div>
                  {wizardState.deliveryType === 'MANUAL' &&
                    wizardState.stockCount && (
                      <div>
                        <dt className='text-muted-foreground'>Stock Count:</dt>
                        <dd className='text-foreground'>
                          {wizardState.stockCount} units
                        </dd>
                      </div>
                    )}
                </dl>
              </div>

              {wizardState.descriptionMarkdown.trim() && (
                <>
                  <Separator />
                  <div>
                    <h3 className='font-semibold text-foreground mb-2'>
                      Description
                    </h3>
                    <MarkdownPreview
                      content={wizardState.descriptionMarkdown}
                    />
                  </div>
                </>
              )}

              {wizardState.deliveryType === 'MANUAL' && (
                <>
                  <Separator />
                  <div>
                    <h3 className='font-semibold text-foreground mb-2'>
                      Manual Delivery Config
                    </h3>
                    <dl className='space-y-2 text-sm'>
                      <div>
                        <dt className='text-muted-foreground'>
                          Delivery Instructions:
                        </dt>
                        <dd className='text-foreground'>
                          {wizardState.deliveryInstructions || <span className='text-destructive'>Not provided (required)</span>}
                        </dd>
                      </div>
                      <div>
                        <dt className='text-muted-foreground'>
                          Estimated Delivery Time (SLA):
                        </dt>
                        <dd className='text-foreground'>
                          {wizardState.estimatedDeliveryMinutes ? (
                            wizardState.estimatedDeliveryMinutes < 60 
                              ? `${wizardState.estimatedDeliveryMinutes} minutes`
                              : wizardState.estimatedDeliveryMinutes < 1440
                                ? `${Math.round(wizardState.estimatedDeliveryMinutes / 60)} hour(s)`
                                : `${Math.round(wizardState.estimatedDeliveryMinutes / 1440)} day(s)`
                          ) : (
                            <span className='text-destructive'>Not selected (required)</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </>
              )}

              {wizardState.deliveryType === 'AUTO_KEY' && (
                <>
                  <Separator />
                  <div className='p-4 bg-muted/50 rounded-lg border border-border'>
                    <h3 className='font-semibold text-foreground mb-2'>
                      Auto-Key Delivery
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      A key pool will be created automatically when you publish.
                      You can upload keys from the product management page after
                      publishing.
                    </p>
                    <p className='text-xs text-muted-foreground mt-2'>
                      Note: The offer will show as &quot;Out of Stock&quot;
                      until keys are uploaded.
                    </p>
                  </div>
                </>
              )}
            </Card>

            {validationErrors.length > 0 && (
              <Alert variant='destructive' className='mt-4'>
                <AlertDescription>
                  <p className='font-semibold mb-2'>Cannot publish offer:</p>
                  <ul className='list-disc list-inside space-y-1'>
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className='mt-8 flex gap-4'>
              <Button variant='ghost' onClick={() => goToStep('pricing')}>
                ← Back
              </Button>
              <Button
                variant='secondary'
                onClick={handleSaveDraft}
                disabled={loading}
              >
                Save as Draft
              </Button>
              <Button
                onClick={handlePublish}
                disabled={loading || !canProceedFromPricing}
              >
                {loading ? 'Publishing...' : 'Publish Offer'}
              </Button>
            </div>
          </div>
        );
      }
    }
  };

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
              <BreadcrumbLink href='/products'>Offers</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>New Offer</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className='flex flex-1 flex-col gap-4 p-4'>
        <div className='mx-auto w-full max-w-4xl'>
          {/* Progress indicator */}
          <div className='mb-8'>
            <div className='flex items-center justify-between'>
              {(
                [
                  'category',
                  'product',
                  'variant',
                  'delivery-type',
                  'pricing',
                  'review',
                ] as Step[]
              ).map((step, idx) => (
                <div key={step} className='flex items-center'>
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                      ${
                        currentStep === step
                          ? 'bg-ring text-background'
                          : [
                                'category',
                                'product',
                                'variant',
                                'delivery-type',
                                'pricing',
                                'review',
                              ].indexOf(currentStep) > idx
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {idx + 1}
                  </div>
                  {idx < 5 && (
                    <div
                      className={`w-12 h-1 mx-2 ${
                        [
                          'category',
                          'product',
                          'variant',
                          'delivery-type',
                          'pricing',
                          'review',
                        ].indexOf(currentStep) > idx
                          ? 'bg-accent'
                          : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <Alert variant='destructive' className='mb-6'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {renderStepContent()}
        </div>
      </div>
    </>
  );
}
