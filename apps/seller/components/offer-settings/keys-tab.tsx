'use client';

import { KeyPoolManager } from '@/components/key-pool-manager';

const SELLER_ID = '00000000-0000-0000-0000-000000000001';

interface KeysTabProps {
  offerId: string;
}

export function KeysTab({ offerId }: KeysTabProps) {
  return (
    <div className="space-y-6">
      <KeyPoolManager offerId={offerId} sellerId={SELLER_ID} />
    </div>
  );
}
