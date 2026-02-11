"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import type { SellerTeamRole } from "@workspace/contracts";
import { ROLE_PERMISSIONS } from "@/lib/permissions";

// ============================================
// Seller Context — multi-seller switcher support
// ============================================

interface SellerMembership {
  sellerId: string;
  sellerSlug: string;
  sellerDisplayName: string;
  role: SellerTeamRole;
}

interface SellerContextValue {
  /** Currently active seller org */
  activeSeller: SellerMembership | null;
  /** All orgs the user belongs to */
  memberships: SellerMembership[];
  /** Switch to a different seller org */
  switchSeller: (sellerId: string) => void;
  /** Check if user has a specific permission in the active seller */
  hasPermission: (permission: string) => boolean;
  /** Active seller's role */
  activeRole: SellerTeamRole | null;
  /** Whether the context is still loading */
  isLoading: boolean;
}

const SellerContext = React.createContext<SellerContextValue>({
  activeSeller: null,
  memberships: [],
  switchSeller: () => {},
  hasPermission: () => false,
  activeRole: null,
  isLoading: true,
});

export function useSeller() {
  return React.useContext(SellerContext);
}

const ACTIVE_SELLER_KEY = "active_seller_id";

export function SellerProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Derive memberships from auth user.
  // Fallback: when the backend hasn't returned memberships yet (pre-migration),
  // synthesise one from the user's own seller profile so the app still works.
  const memberships: SellerMembership[] = React.useMemo(() => {
    if (user?.memberships && user.memberships.length > 0) {
      return user.memberships as SellerMembership[];
    }

    // Fallback: user owns a seller profile but memberships array is empty
    if (user?.sellerId) {
      return [
        {
          sellerId: user.sellerId,
          sellerSlug: "store",
          sellerDisplayName:
            user.displayName || user.email?.split("@")[0] || "My Store",
          role: "OWNER" as SellerTeamRole,
        },
      ];
    }

    return [];
  }, [user]);

  // Restore persisted active seller or default to first membership
  React.useEffect(() => {
    if (memberships.length === 0) {
      setActiveId(null);
      return;
    }

    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem(ACTIVE_SELLER_KEY)
        : null;

    if (stored && memberships.some((m) => m.sellerId === stored)) {
      setActiveId(stored);
    } else {
      setActiveId(memberships[0]?.sellerId ?? null);
    }
  }, [memberships]);

  const activeSeller = React.useMemo(() => {
    return memberships.find((m) => m.sellerId === activeId) ?? null;
  }, [memberships, activeId]);

  const switchSeller = React.useCallback(
    (sellerId: string) => {
      const found = memberships.find((m) => m.sellerId === sellerId);
      if (found) {
        setActiveId(sellerId);
        if (typeof window !== "undefined") {
          localStorage.setItem(ACTIVE_SELLER_KEY, sellerId);
        }
      }
    },
    [memberships],
  );

  const hasPermission = React.useCallback(
    (permission: string): boolean => {
      if (!activeSeller) return false;
      const perms = ROLE_PERMISSIONS[activeSeller.role] ?? [];
      return perms.includes(permission);
    },
    [activeSeller],
  );

  const value = React.useMemo<SellerContextValue>(
    () => ({
      activeSeller,
      memberships,
      switchSeller,
      hasPermission,
      activeRole: activeSeller?.role ?? null,
      isLoading: authLoading,
    }),
    [activeSeller, memberships, switchSeller, hasPermission, authLoading],
  );

  return (
    <SellerContext.Provider value={value}>{children}</SellerContext.Provider>
  );
}
