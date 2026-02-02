'use client';

import { Card, Badge } from '@workspace/ui';
import type { CatalogVariant, Region } from '@workspace/contracts';

interface VariantSelectorProps {
  variants: CatalogVariant[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
}

const REGION_LABELS: Record<Region, string> = {
  EU: 'Europe',
  US: 'United States',
  TR: 'Turkey',
  GLOBAL: 'Global',
};

const REGION_COLORS: Record<Region, string> = {
  EU: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  US: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  TR: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  GLOBAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

export function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
}: VariantSelectorProps) {
  // Group variants by region
  const variantsByRegion = variants.reduce((acc, variant) => {
    if (!acc[variant.region]) {
      acc[variant.region] = [];
    }
    acc[variant.region].push(variant);
    return acc;
  }, {} as Record<Region, CatalogVariant[]>);

  if (variants.length === 0) {
    return (
      <div className='text-center py-12 text-muted-foreground'>
        No variants available for this product
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {(Object.entries(variantsByRegion) as [Region, CatalogVariant[]][]).map(
        ([region, regionVariants]) => (
          <div key={region}>
            <div className='mb-3 flex items-center gap-2'>
              <h3 className='font-semibold text-foreground'>
                {REGION_LABELS[region]}
              </h3>
              <Badge className={REGION_COLORS[region]}>{region}</Badge>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
              {regionVariants.map((variant) => (
                <Card
                  key={variant.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedVariantId === variant.id
                      ? 'border-ring ring-2 ring-ring'
                      : 'border-border hover:border-accent'
                  }`}
                  onClick={() => onSelect(variant.id)}
                >
                  <div className='space-y-2'>
                    <div className='font-medium text-foreground'>
                      {variant.durationDays
                        ? `${variant.durationDays} Days`
                        : 'Instant'}
                    </div>
                    {variant.edition && (
                      <div className='text-sm text-muted-foreground'>
                        {variant.edition} Edition
                      </div>
                    )}
                    <div className='text-xs text-muted-foreground font-mono'>
                      SKU: {variant.sku}
                    </div>
                    {selectedVariantId === variant.id && (
                      <Badge variant='default' className='mt-2'>
                        Selected
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
