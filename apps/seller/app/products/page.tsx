'use client';

import { useState, useEffect } from 'react';
import type { Product, CreateProduct, Currency } from '@workspace/contracts';
import { getProducts, createProduct } from '@/lib/api';

const CURRENCIES: Currency[] = ['USD', 'EUR', 'UAH', 'RUB', 'IRR'];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateProduct>({
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

        {/* Create Product Form */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Create New Product</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1 text-gray-900">
                Title *
              </label>
              <input
                id="title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-white text-gray-900 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Product name"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1 text-gray-900">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-white text-gray-900 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="basePrice" className="block text-sm font-medium mb-1 text-gray-900">
                Base Price (in smallest unit, e.g., cents) *
              </label>
              <input
                id="basePrice"
                type="number"
                required
                min="0"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white text-gray-900 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="9999"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="baseCurrency" className="block text-sm font-medium mb-1 text-gray-900">
                  Base Currency *
                </label>
                <select
                  id="baseCurrency"
                  required
                  value={formData.baseCurrency}
                  onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value as Currency })}
                  className="w-full px-3 py-2 bg-white text-gray-900 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="displayCurrency" className="block text-sm font-medium mb-1 text-gray-900">
                  Display Currency *
                </label>
                <select
                  id="displayCurrency"
                  required
                  value={formData.displayCurrency}
                  onChange={(e) => setFormData({ ...formData, displayCurrency: e.target.value as Currency })}
                  className="w-full px-3 py-2 bg-white text-gray-900 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-300 rounded-md text-red-800 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Product'}
            </button>
          </form>
        </div>

        {/* Products List */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
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
                    <h3 className="font-semibold text-lg text-gray-900">{product.title}</h3>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {(product.basePrice / 100).toFixed(2)} {product.baseCurrency}
                      </div>
                      <div className="text-xs text-gray-600">
                        Display: {product.displayCurrency}
                      </div>
                    </div>
                  </div>

                  {product.description && (
                    <p className="text-gray-700 text-sm mb-2">{product.description}</p>
                  )}

                  <div className="flex gap-4 text-xs text-gray-500 mt-2">
                    <span>ID: {product.id.slice(0, 8)}...</span>
                    <span>Created: {new Date(product.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
