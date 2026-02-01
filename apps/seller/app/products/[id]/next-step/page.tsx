'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button, Card } from '@workspace/ui';

export default function NextStepPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto max-w-4xl">
        <Card className="p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Draft Created!</h1>
            <p className="text-gray-600">Product ID: {productId}</p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-700 mb-6">
            <p className="font-medium mb-1">Next Step Placeholder</p>
            <p>This is where you would continue setting up your product (title, price, category, etc.)</p>
          </div>

          <Button onClick={() => router.push('/products')}>
            Back to Products
          </Button>
        </Card>
      </div>
    </div>
  );
}
