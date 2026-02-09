/**
 * Frontend mirror of the role → permission map.
 *
 * IMPORTANT: This is for UI gating ONLY (show/hide buttons, menu items).
 * Security enforcement happens on the backend exclusively.
 * Never trust these checks as authorization.
 */

import type { SellerTeamRole } from "@workspace/contracts";

export type SellerPermission =
  | "orders.manage"
  | "orders.read"
  | "offers.manage"
  | "products.manage"
  | "keys.manage"
  | "team.manage"
  | "payouts.manage";

export const ROLE_PERMISSIONS: Record<SellerTeamRole, readonly string[]> = {
  OWNER: [
    "orders.manage",
    "orders.read",
    "offers.manage",
    "products.manage",
    "keys.manage",
    "team.manage",
    "payouts.manage",
  ],
  ADMIN: [
    "orders.manage",
    "orders.read",
    "offers.manage",
    "products.manage",
    "keys.manage",
    "team.manage",
  ],
  OPS: ["orders.manage", "orders.read"],
  CATALOG: ["offers.manage", "products.manage", "keys.manage"],
  SUPPORT: ["orders.read"],
};

/**
 * Role display labels for UI.
 */
export const ROLE_LABELS: Record<SellerTeamRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  OPS: "Operations",
  CATALOG: "Catalog Manager",
  SUPPORT: "Support",
};

/**
 * Roles available for assignment (excludes OWNER since it can't be assigned).
 */
export const ASSIGNABLE_ROLES: SellerTeamRole[] = [
  "ADMIN",
  "OPS",
  "CATALOG",
  "SUPPORT",
];
