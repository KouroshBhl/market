'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DeliveryType, Currency, CatalogProduct, CatalogVariant } from '@workspace/contracts';
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
import { CategorySelector } from '@/components/category-selector';
import { CatalogProductSelector } from '@/components/catalog-product-selector';
import { VariantSelector } from '@/components/variant-selector';
import { useQuery } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// For now, hardcode sellerId until auth is implemented
const SELLER_ID = '00000000-0000-0000-0000-000000000001';

type Step = 'delivery-type' | 'category' | 'product' | 'variant' | 'pricing' | 'review';

interface WizardState {
  deliveryType: DeliveryType | null;
  categoryId: string | null;
  productId: string | null;
  variantId: string | null;
  priceAmount: string; // Keep as string for input
  currency: Currency;
  stockCount: string;
  // Manual delivery
  deliveryInstructions: string;
  // Auto key (placeholder for now)
  keyPoolId: string;
}

const INITIAL_STATE: WizardState = {
  deliveryType: null,
  categoryId: null,
  productId: null,
  variantId: null,
  priceAmount: '',
  currency: 'USD',
  stockCount: '',
  deliveryInstructions: '',
  keyPoolId: '',
};

export default function NewOfferPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('delivery-type');
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

  const canProceedFromDeliveryType = wizardState.deliveryType !== null;
  const canProceedFromCategory = wizardState.categoryId !== null;
  const canProceedFromProduct = wizardState.productId !== null;
  const canProceedFromVariant = wizardState.variantId !== null;
  const canProceedFromPricing = 
    wizardState.priceAmount.trim() !== '' && 
    !isNaN(Number(wizardState.priceAmount)) &&
    Number(wizardState.priceAmount) > 0;

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
      if (wizardState.priceAmount.trim() && !isNaN(Number(wizardState.priceAmount))) {
        payload.priceAmount = Math.round(Number(wizardState.priceAmount) * 100); // Convert to cents
      }
      if (wizardState.currency) payload.currency = wizardState.currency;
      if (wizardState.stockCount.trim() && !isNaN(Number(wizardState.stockCount))) {
        payload.stockCount = Number(wizardState.stockCount);
      }

      // Add delivery config based on type
      if (wizardState.deliveryType === 'MANUAL') {
        payload.deliveryInstructions = wizardState.deliveryInstructions || null;
      } else if (wizardState.deliveryType === 'AUTO_KEY') {
        payload.keyPoolId = wizardState.keyPoolId || null;
      }

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
        title: "✓ Success",
        description: "Draft saved successfully!",
        variant: "success",
      });
      
      setTimeout(() => router.push('/products'), 1000);
    } catch (err) {
      console.error('💥 Draft save error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save draft';
      setError(errorMessage);
      toast({
        title: "✕ Error",
        description: errorMessage,
        variant: "destructive",
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

      const payload: any = {
        sellerId: SELLER_ID,
        deliveryType: wizardState.deliveryType,
        variantId: wizardState.variantId,
        priceAmount: Math.round(Number(wizardState.priceAmount) * 100),
        currency: wizardState.currency,
      };

      if (wizardState.stockCount.trim() && !isNaN(Number(wizardState.stockCount))) {
        payload.stockCount = Number(wizardState.stockCount);
      }

      // Add delivery config
      if (wizardState.deliveryType === 'MANUAL') {
        payload.deliveryInstructions = wizardState.deliveryInstructions || null;
      } else if (wizardState.deliveryType === 'AUTO_KEY') {
        payload.keyPoolId = wizardState.keyPoolId || null;
      }

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
        title: "✓ Success",
        description: "Offer published successfully!",
        variant: "success",
      });
      
      // Redirect to products page after a short delay
      setTimeout(() => router.push('/products'), 1500);
    } catch (err) {
      console.error('💥 Publish error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish offer';
      setError(errorMessage);
      // Also show toast for immediate feedback
      toast({
        title: "✕ Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
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
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <DeliveryTypeCard
                title='Automatic Key Delivery'
                description='Perfect for digital products like game keys, software licenses, or gift cards. Keys are delivered instantly to customers after purchase.'
                badge='Instant delivery'
                icon={
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' />
                  </svg>
                }
                badgeIcon={
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                  </svg>
                }
                selected={wizardState.deliveryType === 'AUTO_KEY'}
                disabled={false}
                loading={false}
                onSelect={() => updateState({ deliveryType: 'AUTO_KEY' })}
              />

              <DeliveryTypeCard
                title='Manual Fulfillment'
                description="Ideal for custom services, physical goods, or products that require personal attention. You'll fulfill orders manually."
                badge='Flexible delivery'
                icon={
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                  </svg>
                }
                badgeIcon={
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                }
                selected={wizardState.deliveryType === 'MANUAL'}
                disabled={false}
                loading={false}
                onSelect={() => updateState({ deliveryType: 'MANUAL' })}
              />
            </div>

            <div className='mt-8 flex gap-4'>
              <Button variant='ghost' onClick={() => router.push('/products')}>
                Cancel
              </Button>
              <Button 
                onClick={() => goToStep('category')}
                disabled={!canProceedFromDeliveryType}
              >
                Next: Select Category →
              </Button>
            </div>
          </div>
        );

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
                <p className='text-muted-foreground mt-4'>Loading categories...</p>
              </div>
            ) : categoriesData?.parents ? (
              <CategorySelector
                categories={categoriesData.parents}
                selectedCategoryId={wizardState.categoryId}
                onSelect={(id) => updateState({ categoryId: id, productId: null, variantId: null })}
              />
            ) : (
              <Alert variant='destructive'>
                <AlertDescription>Failed to load categories</AlertDescription>
              </Alert>
            )}

            <div className='mt-8 flex gap-4'>
              <Button variant='ghost' onClick={() => goToStep('delivery-type')}>
                ← Back
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
                <p className='text-muted-foreground mt-4'>Loading products...</p>
              </div>
            ) : catalogProductsData?.products ? (
              <CatalogProductSelector
                products={catalogProductsData.products}
                selectedProductId={wizardState.productId}
                onSelect={(id) => updateState({ productId: id, variantId: null })}
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
                Choose a variant (region/duration/edition) to create your offer for
              </p>
            </div>

            {variantsLoading ? (
              <div className='text-center py-12'>
                <div className='w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto'></div>
                <p className='text-muted-foreground mt-4'>Loading variants...</p>
              </div>
            ) : variantsData?.variants ? (
              <VariantSelector
                variants={variantsData.variants}
                selectedVariantId={wizardState.variantId}
                onSelect={(id) => updateState({ variantId: id })}
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
                onClick={() => goToStep('pricing')}
                disabled={!canProceedFromVariant}
              >
                Next: Set Pricing →
              </Button>
            </div>
          </div>
        );

      case 'pricing':
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
                  <Label htmlFor='price'>Price * (in dollars)</Label>
                  <Input
                    id='price'
                    type='number'
                    step='0.01'
                    min='0.01'
                    value={wizardState.priceAmount}
                    onChange={(e) => updateState({ priceAmount: e.target.value })}
                    placeholder='9.99'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='currency'>Currency *</Label>
                  <Select
                    id='currency'
                    value={wizardState.currency}
                    onChange={(e) => updateState({ currency: e.target.value as Currency })}
                  >
                    <option value='USD'>USD - US Dollar</option>
                    <option value='EUR'>EUR - Euro</option>
                    <option value='UAH'>UAH - Ukrainian Hryvnia</option>
                    <option value='RUB'>RUB - Russian Ruble</option>
                    <option value='IRR'>IRR - Iranian Rial</option>
                  </Select>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='stockCount'>Stock Count (optional)</Label>
                <Input
                  id='stockCount'
                  type='number'
                  min='0'
                  value={wizardState.stockCount}
                  onChange={(e) => updateState({ stockCount: e.target.value })}
                  placeholder='e.g., 100'
                />
                <p className='text-xs text-muted-foreground'>
                  Manual stock tracking. Leave empty for unlimited.
                </p>
              </div>

              {wizardState.deliveryType === 'MANUAL' && (
                <div className='space-y-2'>
                  <Label htmlFor='deliveryInstructions'>
                    Delivery Instructions (optional but recommended)
                  </Label>
                  <Input
                    id='deliveryInstructions'
                    value={wizardState.deliveryInstructions}
                    onChange={(e) => updateState({ deliveryInstructions: e.target.value })}
                    placeholder='Instructions for fulfilling this order...'
                  />
                </div>
              )}

              {wizardState.deliveryType === 'AUTO_KEY' && (
                <div className='space-y-2'>
                  <Label htmlFor='keyPoolId'>
                    Key Pool ID (placeholder - leave empty for MVP)
                  </Label>
                  <Input
                    id='keyPoolId'
                    value={wizardState.keyPoolId}
                    onChange={(e) => updateState({ keyPoolId: e.target.value })}
                    placeholder='Key pool not implemented yet'
                    disabled
                  />
                  <p className='text-xs text-muted-foreground'>
                    Key pool management will be implemented in a future phase.
                  </p>
                </div>
              )}
            </Card>

            <div className='mt-8 flex gap-4'>
              <Button variant='ghost' onClick={() => goToStep('variant')}>
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


      case 'review':
        const selectedVariant = variantsData?.variants.find((v) => v.id === wizardState.variantId);
        const selectedProduct = catalogProductsData?.products.find((p) => p.id === wizardState.productId);

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
                <h3 className='font-semibold text-foreground mb-2'>Delivery Type</h3>
                <Badge>{wizardState.deliveryType === 'AUTO_KEY' ? 'Automatic Key Delivery' : 'Manual Fulfillment'}</Badge>
              </div>

              <Separator />

              <div>
                <h3 className='font-semibold text-foreground mb-2'>Product</h3>
                {selectedProduct && (
                  <div className='text-sm'>
                    <p className='font-medium text-foreground'>{selectedProduct.name}</p>
                    {selectedProduct.description && (
                      <p className='text-muted-foreground mt-1'>{selectedProduct.description}</p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h3 className='font-semibold text-foreground mb-2'>Variant</h3>
                {selectedVariant && (
                  <dl className='space-y-2 text-sm'>
                    <div>
                      <dt className='text-muted-foreground'>Region:</dt>
                      <dd className='text-foreground'>{selectedVariant.region}</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>Duration:</dt>
                      <dd className='text-foreground'>
                        {selectedVariant.durationDays ? `${selectedVariant.durationDays} days` : 'N/A'}
                      </dd>
                    </div>
                    {selectedVariant.edition && (
                      <div>
                        <dt className='text-muted-foreground'>Edition:</dt>
                        <dd className='text-foreground'>{selectedVariant.edition}</dd>
                      </div>
                    )}
                    <div>
                      <dt className='text-muted-foreground'>SKU:</dt>
                      <dd className='text-foreground font-mono text-xs'>{selectedVariant.sku}</dd>
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
                    <dd className='text-foreground font-semibold'>{wizardState.currency} ${wizardState.priceAmount}</dd>
                  </div>
                  {wizardState.stockCount && (
                    <div>
                      <dt className='text-muted-foreground'>Stock Count:</dt>
                      <dd className='text-foreground'>{wizardState.stockCount} units</dd>
                    </div>
                  )}
                </dl>
              </div>

              {(wizardState.deliveryInstructions || wizardState.keyPoolId) && (
                <>
                  <Separator />
                  <div>
                    <h3 className='font-semibold text-foreground mb-2'>Delivery Config</h3>
                    <dl className='space-y-2 text-sm'>
                      {wizardState.deliveryInstructions && (
                        <div>
                          <dt className='text-muted-foreground'>Instructions:</dt>
                          <dd className='text-foreground'>{wizardState.deliveryInstructions}</dd>
                        </div>
                      )}
                      {wizardState.keyPoolId && (
                        <div>
                          <dt className='text-muted-foreground'>Key Pool:</dt>
                          <dd className='text-foreground'>{wizardState.keyPoolId}</dd>
                        </div>
                      )}
                    </dl>
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
              <BreadcrumbLink href='/products'>Products</BreadcrumbLink>
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
              {(['delivery-type', 'category', 'product', 'variant', 'pricing', 'review'] as Step[]).map((step, idx) => (
                <div key={step} className='flex items-center'>
                  <div 
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                      ${currentStep === step ? 'bg-ring text-background' : 
                        ['delivery-type', 'category', 'product', 'variant', 'pricing', 'review'].indexOf(currentStep) > idx
                        ? 'bg-accent text-accent-foreground' 
                        : 'bg-muted text-muted-foreground'}
                    `}
                  >
                    {idx + 1}
                  </div>
                  {idx < 5 && (
                    <div className={`w-12 h-1 mx-2 ${
                      ['delivery-type', 'category', 'product', 'variant', 'pricing', 'review'].indexOf(currentStep) > idx
                        ? 'bg-accent' 
                        : 'bg-muted'
                    }`} />
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
