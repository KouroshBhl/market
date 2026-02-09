// ---------------------------------------------------------------------------
// Mock data for the Seller Overview Dashboard — offers, orders, and FAQ.
// ---------------------------------------------------------------------------

// ---- Offers ----------------------------------------------------------------

export interface MockOffer {
  id: string;
  title: string;
  deliveryType: "AUTO_KEY" | "MANUAL";
  status: "draft" | "active" | "inactive";
  stockLabel: string; // e.g. "12 keys", "N/A", "Out of stock"
  priceAmount: number; // cents
  currency: string;
}

export const MOCK_OFFERS: MockOffer[] = [
  {
    id: "off-001",
    title: "Windows 11 Pro Key — Global",
    deliveryType: "AUTO_KEY",
    status: "active",
    stockLabel: "12 keys",
    priceAmount: 2999,
    currency: "USDT",
  },
  {
    id: "off-002",
    title: "Office 365 — 1 Year — EU",
    deliveryType: "AUTO_KEY",
    status: "active",
    stockLabel: "3 keys",
    priceAmount: 4999,
    currency: "USDT",
  },
  {
    id: "off-003",
    title: "Spotify Premium — 6 Months",
    deliveryType: "MANUAL",
    status: "draft",
    stockLabel: "N/A",
    priceAmount: 1499,
    currency: "USDT",
  },
  {
    id: "off-004",
    title: "Steam Wallet $50",
    deliveryType: "AUTO_KEY",
    status: "inactive",
    stockLabel: "Out of stock",
    priceAmount: 4700,
    currency: "USDT",
  },
];

// ---- Orders ----------------------------------------------------------------

export type MockOrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "FULFILLED"
  | "CANCELLED"
  | "EXPIRED";

export interface MockOrder {
  id: string;
  displayId: string; // short human-readable id
  status: MockOrderStatus;
  isOverdue: boolean;
  dueLabel: string; // e.g. "Due in 2h", "Overdue by 3h", "—"
  assignedTo: string | null;
  amount: number; // cents
  currency: string;
  productName: string;
}

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: "ord-aaa-111",
    displayId: "ORD-7A3F",
    status: "PAID",
    isOverdue: false,
    dueLabel: "Due in 2 h",
    assignedTo: "You",
    amount: 2999,
    currency: "USDT",
    productName: "Windows 11 Pro Key",
  },
  {
    id: "ord-bbb-222",
    displayId: "ORD-9B2E",
    status: "PAID",
    isOverdue: true,
    dueLabel: "Overdue by 3 h",
    assignedTo: null,
    amount: 4999,
    currency: "USDT",
    productName: "Office 365 — 1 Year",
  },
  {
    id: "ord-ccc-333",
    displayId: "ORD-4C1D",
    status: "FULFILLED",
    isOverdue: false,
    dueLabel: "—",
    assignedTo: "You",
    amount: 1499,
    currency: "USDT",
    productName: "Spotify Premium",
  },
  {
    id: "ord-ddd-444",
    displayId: "ORD-8D5A",
    status: "PENDING_PAYMENT",
    isOverdue: false,
    dueLabel: "—",
    assignedTo: null,
    amount: 4700,
    currency: "USDT",
    productName: "Steam Wallet $50",
  },
  {
    id: "ord-eee-555",
    displayId: "ORD-2E6B",
    status: "CANCELLED",
    isOverdue: false,
    dueLabel: "—",
    assignedTo: null,
    amount: 2999,
    currency: "USDT",
    productName: "Windows 11 Pro Key",
  },
];

// ---- FAQ -------------------------------------------------------------------

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is the bond?",
    answer:
      "The bond is a one-time 25 USDT deposit that proves you are a real seller. It is held while you build a track record and returned to you once you reach Tier 2.",
  },
  {
    question: "When do I get my bond back?",
    answer:
      "Your bond is released automatically when you complete 10 successful orders OR maintain a clean record for 14 days after your first paid order — whichever comes first. If you violate platform rules, the bond may be forfeited.",
  },
  {
    question: "What upgrades my tier?",
    answer:
      "Tier 0 → Tier 1: Pay the 25 USDT bond. Tier 1 → Tier 2: Complete 10 successful orders OR keep a clean record for 14 consecutive days after your first paid order.",
  },
  {
    question: "What can get me banned?",
    answer:
      "Selling counterfeit or stolen goods, failing to deliver paid orders repeatedly, opening fake disputes, or any form of fraud. Bans result in bond forfeiture and permanent account suspension.",
  },
  {
    question: "Why are limits applied?",
    answer:
      "Limits protect buyers and the platform from fraud. New sellers start with conservative limits that increase automatically as you build trust through successful orders.",
  },
  {
    question: "How do payouts work (delay and cap)?",
    answer:
      "Payouts are held for a safety period (e.g., 48 hours for Tier 1) before being released to your wallet. There is also a daily payout cap that increases as your tier goes up. For example, at Tier 1 you can withdraw up to 200 USDT per day with a 48-hour delay.",
  },
];
