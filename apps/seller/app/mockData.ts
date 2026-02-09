/**
 * Mock data for offers and orders tables
 */

export interface MockOffer {
  id: string;
  title: string;
  deliveryType: 'AUTO_KEY' | 'MANUAL';
  status: 'draft' | 'active' | 'inactive';
  stockStatus: 'in_stock' | 'out_of_stock' | 'low_stock';
  keyCount?: number; // For AUTO_KEY
  stockCount?: number; // For MANUAL
  priceAmount: number; // cents
  currency: string;
}

export interface MockOrder {
  id: string;
  displayId: string; // Short ID for display
  status: 'PENDING_PAYMENT' | 'PAID' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
  deliveryType: 'AUTO_KEY' | 'MANUAL';
  isOverdue: boolean;
  slaDueAt?: string; // ISO string
  assignedToUserId?: string;
  assignedToName?: string;
  buyerTotalAmount: number; // cents
  currency: string;
  paidAt?: string; // ISO string
}

export const MOCK_OFFERS: MockOffer[] = [
  {
    id: '1',
    title: 'Netflix Premium 1 Month - US Region',
    deliveryType: 'AUTO_KEY',
    status: 'active',
    stockStatus: 'in_stock',
    keyCount: 45,
    priceAmount: 1299,
    currency: 'USDT',
  },
  {
    id: '2',
    title: 'Spotify Premium 3 Months - Global',
    deliveryType: 'AUTO_KEY',
    status: 'active',
    stockStatus: 'low_stock',
    keyCount: 3,
    priceAmount: 2499,
    currency: 'USDT',
  },
  {
    id: '3',
    title: 'Steam Wallet $50 - US',
    deliveryType: 'MANUAL',
    status: 'active',
    stockStatus: 'in_stock',
    stockCount: 20,
    priceAmount: 4799,
    currency: 'USDT',
  },
  {
    id: '4',
    title: 'Xbox Game Pass Ultimate 1 Month',
    deliveryType: 'AUTO_KEY',
    status: 'inactive',
    stockStatus: 'out_of_stock',
    keyCount: 0,
    priceAmount: 1599,
    currency: 'USDT',
  },
  {
    id: '5',
    title: 'PlayStation Plus 12 Months - EU',
    deliveryType: 'MANUAL',
    status: 'draft',
    stockStatus: 'in_stock',
    stockCount: 10,
    priceAmount: 5999,
    currency: 'USDT',
  },
];

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: 'ord_1',
    displayId: 'ORD-1234',
    status: 'PAID',
    deliveryType: 'MANUAL',
    isOverdue: true,
    slaDueAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    assignedToUserId: 'user_1',
    assignedToName: 'John Doe',
    buyerTotalAmount: 1299,
    currency: 'USDT',
    paidAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
  },
  {
    id: 'ord_2',
    displayId: 'ORD-1235',
    status: 'PAID',
    deliveryType: 'MANUAL',
    isOverdue: false,
    slaDueAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
    buyerTotalAmount: 2499,
    currency: 'USDT',
    paidAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord_3',
    displayId: 'ORD-1236',
    status: 'FULFILLED',
    deliveryType: 'AUTO_KEY',
    isOverdue: false,
    assignedToUserId: 'user_1',
    assignedToName: 'John Doe',
    buyerTotalAmount: 4799,
    currency: 'USDT',
    paidAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord_4',
    displayId: 'ORD-1237',
    status: 'PAID',
    deliveryType: 'AUTO_KEY',
    isOverdue: false,
    buyerTotalAmount: 1599,
    currency: 'USDT',
    paidAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord_5',
    displayId: 'ORD-1238',
    status: 'PENDING_PAYMENT',
    deliveryType: 'MANUAL',
    isOverdue: false,
    buyerTotalAmount: 5999,
    currency: 'USDT',
  },
];

export function formatPrice(cents: number, currency: string): string {
  return `$${(cents / 100).toFixed(2)} ${currency}`;
}

export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

export function formatDueTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMs < 0) {
    // Overdue
    const overdueMins = Math.abs(diffMins);
    const overdueHours = Math.abs(diffHours);
    if (overdueMins < 60) {
      return `${overdueMins}m overdue`;
    } else {
      return `${overdueHours}h overdue`;
    }
  } else {
    // Due in future
    if (diffMins < 60) {
      return `Due in ${diffMins}m`;
    } else {
      return `Due in ${diffHours}h`;
    }
  }
}
