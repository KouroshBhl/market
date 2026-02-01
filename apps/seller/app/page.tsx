import Link from 'next/link';
import { Button } from '@workspace/ui';

export default function Page() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Seller Dashboard</h1>
      <p className="text-gray-600 mb-6">Manage your products and inventory</p>
      
      <div className="space-y-4">
        <Link href="/products">
          <Button size="sm">Go to Products →</Button>
        </Link>
      </div>
    </div>
  );
}
