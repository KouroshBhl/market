'use client';

import { Card, Input, Badge } from '@workspace/ui';
import type { CatalogProduct } from '@workspace/contracts';
import { useState } from 'react';

interface CatalogProductSelectorProps {
  products: CatalogProduct[];
  selectedProductId: string | null;
  onSelect: (productId: string) => void;
}

export function CatalogProductSelector({
  products,
  selectedProductId,
  onSelect,
}: CatalogProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='space-y-4'>
      <Input
        type='text'
        placeholder='Search products...'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {filteredProducts.length === 0 ? (
        <div className='text-center py-12 text-muted-foreground'>
          {searchQuery
            ? `No products found matching "${searchQuery}"`
            : 'No products available in this category'}
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4'>
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className={`p-4 cursor-pointer transition-all ${
                selectedProductId === product.id
                  ? 'border-ring ring-2 ring-ring'
                  : 'border-border hover:border-accent'
              }`}
              onClick={() => onSelect(product.id)}
            >
              <div className='flex items-start gap-4'>
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className='w-16 h-16 object-cover rounded'
                  />
                )}
                <div className='flex-1'>
                  <h3 className='font-semibold text-foreground'>
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className='text-sm text-muted-foreground mt-1 line-clamp-2'>
                      {product.description}
                    </p>
                  )}
                </div>
                {selectedProductId === product.id && (
                  <Badge variant='default'>Selected</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
