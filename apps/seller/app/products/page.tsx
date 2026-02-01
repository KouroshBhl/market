'use client';

import { useState, useEffect } from 'react';
import type { Product, CreateProduct, Currency } from '@workspace/contracts';
import { getProducts, createProduct } from '@/lib/api';
import { Button, Input, Label, Select, Textarea, Card } from '@workspace/ui';

const CURRENCIES: Currency[] = ['USD', 'EUR', 'UAH', 'RUB', 'IRR'];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateProduct>({
    deliveryType: 'MANUAL',
    title: '',
    description: '',
    basePrice: 0,
    baseCurrency: 'USD',
    displayCurrency: 'USD',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Remove empty description
      const payload: CreateProduct = {
        ...formData,
        description: formData.description?.trim() || undefined,
      };

      await createProduct(payload);

      // Reset form
      setFormData({
        deliveryType: 'MANUAL',
        title: '',
        description: '',
        basePrice: 0,
        baseCurrency: 'USD',
        displayCurrency: 'USD',
      });

      // Reload products
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Products</h1>

      {/* Create Product Actions */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Create New Product</h2>
          <Button asChild>
            <a href="/products/new">+ New Product</a>
          </Button>
        </div>
        <p className="text-gray-600 text-sm">Click &quot;New Product&quot; to start creating a product with delivery type selection</p>
      </Card>

      {/* Legacy Create Product Form */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Create (Legacy)</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Product name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="basePrice">Base Price (in smallest unit, e.g., cents) *</Label>
            <Input
              id="basePrice"
              type="number"
              required
              min="0"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: parseInt(e.target.value) || 0 })}
              placeholder="9999"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseCurrency">Base Currency *</Label>
              <Select
                id="baseCurrency"
                required
                value={formData.baseCurrency}
                onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value as Currency })}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayCurrency">Display Currency *</Label>
              <Select
                id="displayCurrency"
                required
                value={formData.displayCurrency}
                onChange={(e) => setFormData({ ...formData, displayCurrency: e.target.value as Currency })}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-300 rounded-md text-red-800 text-sm font-medium">
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Creating...' : 'Create Product'}
          </Button>
        </form>
      </Card>

      {/* Products List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Products List</h2>

          {loading ? (
            <p className="text-gray-600">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-gray-600">No products yet. Create one above!</p>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
              <div
                key={product.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {product.title || <span className="text-gray-400 italic">[Draft - No Title]</span>}
                    </h3>
                    {product.status && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        product.status === 'DRAFT' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {product.status}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {product.basePrice !== null && product.baseCurrency ? (
                      <>
                        <div className="text-lg font-bold text-gray-900">
                          {(product.basePrice / 100).toFixed(2)} {product.baseCurrency}
                        </div>
                        {product.displayCurrency && (
                          <div className="text-xs text-gray-600">
                            Display: {product.displayCurrency}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-gray-400 italic">No price set</div>
                    )}
                  </div>
                </div>

                {product.description && (
                  <p className="text-gray-700 text-sm mb-2">{product.description}</p>
                )}

                <div className="flex gap-4 text-xs text-gray-500 mt-2">
                  {product.deliveryType && (
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {product.deliveryType === 'AUTO_KEY' ? '🔑 Auto Key' : '👤 Manual'}
                    </span>
                  )}
                  <span>ID: {product.id.slice(0, 8)}...</span>
                  <span>Created: {new Date(product.createdAt).toLocaleString()}</span>
                </div>
              </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
