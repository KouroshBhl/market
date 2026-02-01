'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DeliveryType, Currency } from '@workspace/contracts';
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
  Textarea,
  Label,
  Badge,
} from '@workspace/ui';
import { DeliveryTypeCard } from '@/components/delivery-type-card';
import { CategorySelector } from '@/components/category-selector';
import { useQuery } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// For now, hardcode sellerId until auth is implemented
const SELLER_ID = '00000000-0000-0000-0000-000000000001';

type Step = 'delivery-type' | 'category' | 'basic-info' | 'delivery-config' | 'review';

interface WizardState {
  deliveryType: DeliveryType | null;
  categoryId: string | null;
  title: string;
  description: string;
  priceAmount: string; // Keep as string for input
  currency: Currency;
  // Auto key config
  autoDelivery: boolean;
  stockAlert: string;
  // Manual delivery config
  deliveryInstructions: string;
  estimatedDeliverySLA: string;
}

const INITIAL_STATE: WizardState = {
  deliveryType: null,
  categoryId: null,
  title: '',
  description: '',
  priceAmount: '',
  currency: 'USD',
  autoDelivery: true,
  stockAlert: '',
  deliveryInstructions: '',
  estimatedDeliverySLA: '',
};

export default function NewProductPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('delivery-type');
  const [wizardState, setWizardState] = useState<WizardState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Fetch categories for category selection step
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
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

  const canProceedFromDeliveryType = wizardState.deliveryType !== null;
  const canProceedFromCategory = wizardState.categoryId !== null;
  const canProceedFromBasicInfo = 
    wizardState.title.trim() !== '' && 
    wizardState.priceAmount.trim() !== '' &&
    !isNaN(Number(wizardState.priceAmount)) &&
    Number(wizardState.priceAmount) >= 0;

  const canProceedFromDeliveryConfig = () => {
    if (wizardState.deliveryType === 'AUTO_KEY') {
      return true; // Optional fields
    } else if (wizardState.deliveryType === 'MANUAL') {
      return true; // Optional fields
    }
    return false;
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      const payload: any = {
        sellerId: SELLER_ID,
        deliveryType: wizardState.deliveryType,
      };

      // Add optional fields if provided
      if (wizardState.categoryId) payload.categoryId = wizardState.categoryId;
      if (wizardState.title.trim()) payload.title = wizardState.title.trim();
      if (wizardState.description.trim()) payload.description = wizardState.description.trim();
      if (wizardState.priceAmount.trim() && !isNaN(Number(wizardState.priceAmount))) {
        payload.priceAmount = Math.round(Number(wizardState.priceAmount) * 100); // Convert to cents
      }
      if (wizardState.currency) payload.currency = wizardState.currency;

      // Add delivery config
      if (wizardState.deliveryType === 'AUTO_KEY') {
        payload.autoKeyConfig = {
          autoDelivery: wizardState.autoDelivery,
          stockAlert: wizardState.stockAlert ? Number(wizardState.stockAlert) : null,
          keyPoolId: null,
        };
      } else if (wizardState.deliveryType === 'MANUAL') {
        payload.manualDeliveryConfig = {
          deliveryInstructions: wizardState.deliveryInstructions || null,
          estimatedDeliverySLA: wizardState.estimatedDeliverySLA ? Number(wizardState.estimatedDeliverySLA) : null,
        };
      }

      const response = await fetch(`${API_URL}/products/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save draft');
      }

      const draft = await response.json();
      router.push(`/products`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      // First save as draft
      const payload: any = {
        sellerId: SELLER_ID,
        deliveryType: wizardState.deliveryType,
        categoryId: wizardState.categoryId,
        title: wizardState.title.trim(),
        description: wizardState.description.trim() || null,
        priceAmount: Math.round(Number(wizardState.priceAmount) * 100),
        currency: wizardState.currency,
      };

      if (wizardState.deliveryType === 'AUTO_KEY') {
        payload.autoKeyConfig = {
          autoDelivery: wizardState.autoDelivery,
          stockAlert: wizardState.stockAlert ? Number(wizardState.stockAlert) : null,
          keyPoolId: null,
        };
      } else if (wizardState.deliveryType === 'MANUAL') {
        payload.manualDeliveryConfig = {
          deliveryInstructions: wizardState.deliveryInstructions || null,
          estimatedDeliverySLA: wizardState.estimatedDeliverySLA ? Number(wizardState.estimatedDeliverySLA) : null,
        };
      }

      const draftResponse = await fetch(`${API_URL}/products/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!draftResponse.ok) {
        const errorData = await draftResponse.json();
        throw new Error(errorData.message || 'Failed to save draft');
      }

      const draft = await draftResponse.json();

      // Then publish
      const publishResponse = await fetch(`${API_URL}/products/${draft.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json();
        if (errorData.errors && Array.isArray(errorData.errors)) {
          setValidationErrors(errorData.errors);
        }
        throw new Error(errorData.message || 'Failed to publish product');
      }

      router.push(`/products`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish product');
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
                Select Product Category
              </h2>
              <p className='text-muted-foreground'>
                Choose the category that best describes your product
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
                onSelect={(id) => updateState({ categoryId: id })}
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
                onClick={() => goToStep('basic-info')}
                disabled={!canProceedFromCategory}
              >
                Next: Basic Information →
              </Button>
            </div>
          </div>
        );

      case 'basic-info':
        return (
          <div>
            <div className='mb-8'>
              <h2 className='text-2xl font-bold text-foreground mb-2'>
                Basic Product Information
              </h2>
              <p className='text-muted-foreground'>
                Provide the essential details about your product
              </p>
            </div>

            <Card className='p-6 space-y-6'>
              <div className='space-y-2'>
                <Label htmlFor='title'>Product Title *</Label>
                <Input
                  id='title'
                  value={wizardState.title}
                  onChange={(e) => updateState({ title: e.target.value })}
                  placeholder='e.g., World of Warcraft Gold - 1000g'
                  maxLength={200}
                />
                <p className='text-xs text-muted-foreground'>
                  {wizardState.title.length} / 200 characters
                </p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  value={wizardState.description}
                  onChange={(e) => updateState({ description: e.target.value })}
                  placeholder='Describe your product, delivery process, any special terms...'
                  rows={6}
                  maxLength={5000}
                />
                <p className='text-xs text-muted-foreground'>
                  {wizardState.description.length} / 5000 characters
                </p>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='price'>Price * (in dollars)</Label>
                  <Input
                    id='price'
                    type='number'
                    step='0.01'
                    min='0'
                    value={wizardState.priceAmount}
                    onChange={(e) => updateState({ priceAmount: e.target.value })}
                    placeholder='9.99'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='currency'>Currency *</Label>
                  <select
                    id='currency'
                    value={wizardState.currency}
                    onChange={(e) => updateState({ currency: e.target.value as Currency })}
                    className='flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm'
                  >
                    <option value='USD'>USD - US Dollar</option>
                    <option value='EUR'>EUR - Euro</option>
                    <option value='UAH'>UAH - Ukrainian Hryvnia</option>
                    <option value='RUB'>RUB - Russian Ruble</option>
                    <option value='IRR'>IRR - Iranian Rial</option>
                  </select>
                </div>
              </div>
            </Card>

            <div className='mt-8 flex gap-4'>
              <Button variant='ghost' onClick={() => goToStep('category')}>
                ← Back
              </Button>
              <Button 
                onClick={() => goToStep('delivery-config')}
                disabled={!canProceedFromBasicInfo}
              >
                Next: Delivery Configuration →
              </Button>
            </div>
          </div>
        );

      case 'delivery-config':
        return (
          <div>
            <div className='mb-8'>
              <h2 className='text-2xl font-bold text-foreground mb-2'>
                Delivery Configuration
              </h2>
              <p className='text-muted-foreground'>
                Configure how this product will be delivered
              </p>
            </div>

            <Card className='p-6 space-y-6'>
              {wizardState.deliveryType === 'AUTO_KEY' ? (
                <>
                  <div className='flex items-center gap-2 mb-4'>
                    <Badge>Automatic Key Delivery</Badge>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='autoDelivery' className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        id='autoDelivery'
                        checked={wizardState.autoDelivery}
                        onChange={(e) => updateState({ autoDelivery: e.target.checked })}
                        className='w-4 h-4'
                      />
                      Enable automatic delivery
                    </Label>
                    <p className='text-xs text-muted-foreground ml-6'>
                      Keys will be delivered immediately after payment confirmation
                    </p>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='stockAlert'>Low Stock Alert (optional)</Label>
                    <Input
                      id='stockAlert'
                      type='number'
                      min='0'
                      value={wizardState.stockAlert}
                      onChange={(e) => updateState({ stockAlert: e.target.value })}
                      placeholder='e.g., 10'
                    />
                    <p className='text-xs text-muted-foreground'>
                      Get notified when available keys fall below this number
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className='flex items-center gap-2 mb-4'>
                    <Badge>Manual Fulfillment</Badge>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='deliveryInstructions'>Delivery Instructions (optional)</Label>
                    <Textarea
                      id='deliveryInstructions'
                      value={wizardState.deliveryInstructions}
                      onChange={(e) => updateState({ deliveryInstructions: e.target.value })}
                      placeholder='Instructions for yourself on how to fulfill this order...'
                      rows={4}
                      maxLength={5000}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='estimatedSLA'>Estimated Delivery Time (optional)</Label>
                    <div className='flex gap-2 items-center'>
                      <Input
                        id='estimatedSLA'
                        type='number'
                        min='0'
                        value={wizardState.estimatedDeliverySLA}
                        onChange={(e) => updateState({ estimatedDeliverySLA: e.target.value })}
                        placeholder='24'
                        className='w-32'
                      />
                      <span className='text-sm text-muted-foreground'>hours</span>
                    </div>
                  </div>
                </>
              )}
            </Card>

            <div className='mt-8 flex gap-4'>
              <Button variant='ghost' onClick={() => goToStep('basic-info')}>
                ← Back
              </Button>
              <Button 
                onClick={() => goToStep('review')}
                disabled={!canProceedFromDeliveryConfig()}
              >
                Next: Review →
              </Button>
            </div>
          </div>
        );

      case 'review':
        return (
          <div>
            <div className='mb-8'>
              <h2 className='text-2xl font-bold text-foreground mb-2'>
                Review & Publish
              </h2>
              <p className='text-muted-foreground'>
                Review your product details before publishing
              </p>
            </div>

            <Card className='p-6 space-y-6'>
              <div>
                <h3 className='font-semibold text-foreground mb-2'>Delivery Type</h3>
                <Badge>{wizardState.deliveryType === 'AUTO_KEY' ? 'Automatic Key Delivery' : 'Manual Fulfillment'}</Badge>
              </div>

              <Separator />

              <div>
                <h3 className='font-semibold text-foreground mb-2'>Product Details</h3>
                <dl className='space-y-2 text-sm'>
                  <div>
                    <dt className='text-muted-foreground'>Title:</dt>
                    <dd className='text-foreground'>{wizardState.title}</dd>
                  </div>
                  {wizardState.description && (
                    <div>
                      <dt className='text-muted-foreground'>Description:</dt>
                      <dd className='text-foreground'>{wizardState.description}</dd>
                    </div>
                  )}
                  <div>
                    <dt className='text-muted-foreground'>Price:</dt>
                    <dd className='text-foreground'>{wizardState.currency} ${wizardState.priceAmount}</dd>
                  </div>
                </dl>
              </div>

              <Separator />

              <div>
                <h3 className='font-semibold text-foreground mb-2'>Delivery Configuration</h3>
                {wizardState.deliveryType === 'AUTO_KEY' ? (
                  <dl className='space-y-2 text-sm'>
                    <div>
                      <dt className='text-muted-foreground'>Auto Delivery:</dt>
                      <dd className='text-foreground'>{wizardState.autoDelivery ? 'Enabled' : 'Disabled'}</dd>
                    </div>
                    {wizardState.stockAlert && (
                      <div>
                        <dt className='text-muted-foreground'>Low Stock Alert:</dt>
                        <dd className='text-foreground'>{wizardState.stockAlert} keys</dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <dl className='space-y-2 text-sm'>
                    {wizardState.deliveryInstructions && (
                      <div>
                        <dt className='text-muted-foreground'>Instructions:</dt>
                        <dd className='text-foreground'>{wizardState.deliveryInstructions}</dd>
                      </div>
                    )}
                    {wizardState.estimatedDeliverySLA && (
                      <div>
                        <dt className='text-muted-foreground'>Estimated Delivery:</dt>
                        <dd className='text-foreground'>{wizardState.estimatedDeliverySLA} hours</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
            </Card>

            {validationErrors.length > 0 && (
              <Alert variant='destructive' className='mt-4'>
                <AlertDescription>
                  <p className='font-semibold mb-2'>Cannot publish product:</p>
                  <ul className='list-disc list-inside space-y-1'>
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className='mt-8 flex gap-4'>
              <Button variant='ghost' onClick={() => goToStep('delivery-config')}>
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
                disabled={loading || !canProceedFromBasicInfo}
              >
                {loading ? 'Publishing...' : 'Publish Product'}
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
              <BreadcrumbPage>New Product</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className='flex flex-1 flex-col gap-4 p-4'>
        <div className='mx-auto w-full max-w-4xl'>
          {/* Progress indicator */}
          <div className='mb-8'>
            <div className='flex items-center justify-between'>
              {['delivery-type', 'category', 'basic-info', 'delivery-config', 'review'].map((step, idx) => (
                <div key={step} className='flex items-center'>
                  <div 
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                      ${currentStep === step ? 'bg-ring text-background' : 
                        ['delivery-type', 'category', 'basic-info', 'delivery-config', 'review'].indexOf(currentStep) > idx
                        ? 'bg-accent text-accent-foreground' 
                        : 'bg-muted text-muted-foreground'}
                    `}
                  >
                    {idx + 1}
                  </div>
                  {idx < 4 && (
                    <div className={`w-12 h-1 mx-2 ${
                      ['delivery-type', 'category', 'basic-info', 'delivery-config', 'review'].indexOf(currentStep) > idx
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
