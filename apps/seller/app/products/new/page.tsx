'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DeliveryType } from '@workspace/contracts';
import { Button } from '@workspace/ui';

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
      
      // Navigate to next step (placeholder for now)
      router.push(`/products/${draft.id}/next-step`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product draft');
      setSelectedType(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Product</h1>
          <p className="text-gray-600">Choose how you want to deliver this product</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AUTO_KEY Card */}
          <div
            onClick={() => !loading && handleSelectDeliveryType('AUTO_KEY')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSelectDeliveryType('AUTO_KEY')}
            className={`
              relative p-8 bg-white border-2 rounded-lg text-left transition-all
              ${selectedType === 'AUTO_KEY' ? 'border-blue-500 ring-4 ring-blue-100' : 'border-gray-300 hover:border-blue-400 hover:shadow-lg'}
              ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Automatic Key Delivery
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Perfect for digital products like game keys, software licenses, or gift cards. Keys are delivered instantly to customers after purchase.
                </p>
                <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Instant delivery
                </div>
              </div>
            </div>
            {selectedType === 'AUTO_KEY' && loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-medium">Creating draft...</span>
                </div>
              </div>
            )}
          </div>

          {/* MANUAL Card */}
          <div
            onClick={() => !loading && handleSelectDeliveryType('MANUAL')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSelectDeliveryType('MANUAL')}
            className={`
              relative p-8 bg-white border-2 rounded-lg text-left transition-all
              ${selectedType === 'MANUAL' ? 'border-green-500 ring-4 ring-green-100' : 'border-gray-300 hover:border-green-400 hover:shadow-lg'}
              ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Manual Fulfillment
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Ideal for custom services, physical goods, or products that require personal attention. You&apos;ll fulfill orders manually.
                </p>
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Flexible delivery
                </div>
              </div>
            </div>
            {selectedType === 'MANUAL' && loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-medium">Creating draft...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/products')}
          >
            ← Back to Products
          </Button>
        </div>
      </div>
    </div>
  );
}
