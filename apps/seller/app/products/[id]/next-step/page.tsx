'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { CategoriesResponse, ProductDraft } from '@workspace/contracts';
import {
  Button,
  Card,
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
  Skeleton,
} from '@workspace/ui';
import { CategorySelector } from '@/components/category-selector';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function CategorySelectionPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [categories, setCategories] = useState<CategoriesResponse | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch draft and categories on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [draftRes, categoriesRes] = await Promise.all([
          fetch(`${API_URL}/products/draft/${productId}`),
          fetch(`${API_URL}/categories`),
        ]);

        if (!draftRes.ok) {
          throw new Error('Failed to load product draft');
        }

        if (!categoriesRes.ok) {
          throw new Error('Failed to load categories');
        }

        const draftData = await draftRes.json();
        const categoriesData = await categoriesRes.json();

        setDraft(draftData);
        setCategories(categoriesData);
        setSelectedCategoryId(draftData.categoryId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [productId]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const handleContinue = async () => {
    if (!selectedCategoryId) {
      setError('Please select a category');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`${API_URL}/products/draft/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoryId: selectedCategoryId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update category');
      }

      // Navigate to next step (placeholder for now)
      router.push('/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setSaving(false);
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
              <BreadcrumbPage>Select Category</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className='flex flex-1 flex-col gap-4 p-4'>
        <div className='mx-auto w-full max-w-6xl'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-foreground mb-2'>
              Select Product Category
            </h1>
            <p className='text-muted-foreground'>
              Choose the category that best describes your product
            </p>
          </div>

          {error && (
            <Alert variant='destructive' className='mb-6'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <Card className='p-6'>
              <div className='space-y-6'>
                <div>
                  <Skeleton className='h-8 w-48 mb-4' />
                  <div className='grid grid-cols-5 gap-3'>
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className='h-20' />
                    ))}
                  </div>
                </div>
                <div>
                  <Skeleton className='h-8 w-48 mb-4' />
                  <div className='grid grid-cols-3 gap-3'>
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className='h-16' />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ) : categories ? (
            <Card className='p-6'>
              <CategorySelector
                categories={categories.parents}
                selectedCategoryId={selectedCategoryId}
                onSelect={handleCategorySelect}
                disabled={saving}
              />
            </Card>
          ) : null}

          <div className='mt-8 flex items-center justify-between'>
            <Button
              variant='ghost'
              onClick={() => router.push('/products')}
              disabled={saving}
            >
              ← Cancel
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!selectedCategoryId || saving}
            >
              {saving ? 'Saving...' : 'Continue →'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
