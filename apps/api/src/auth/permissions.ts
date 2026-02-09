/**
 * Seller RBAC — Centralized permission map + authorization helper.
 *
 * Design decisions:
 *  - Fixed roles only (no custom roles, no per-user checkboxes).
 *  - Permissions are derived exclusively from role.
 *  - `can()` is the single authorization entry-point.
 *
 * TODO: To add per-member permission overrides later:
 *  1. Add a `permissionOverrides` JSON/array column to SellerTeamMember.
 *  2. In `can()`, merge ROLE_PERMISSIONS[role] with the member's overrides.
 *  3. No other call-sites need to change.
 */

// ============================================
// Permission strings
// ============================================

export type SellerPermission =
  | 'orders.manage'
  | 'orders.read'
  | 'offers.manage'
  | 'products.manage'
  | 'keys.manage'
  | 'team.manage'
  | 'payouts.manage';

// ============================================
// Role → Permission mapping (source of truth)
// ============================================

export type SellerTeamRole = 'OWNER' | 'ADMIN' | 'OPS' | 'CATALOG' | 'SUPPORT';

const ALL_PERMISSIONS: readonly SellerPermission[] = [
  'orders.manage',
  'orders.read',
  'offers.manage',
  'products.manage',
  'keys.manage',
  'team.manage',
  'payouts.manage',
] as const;

export const ROLE_PERMISSIONS: Record<SellerTeamRole, readonly SellerPermission[]> = {
  OWNER: ALL_PERMISSIONS,
  ADMIN: [
    'orders.manage',
    'orders.read',
    'offers.manage',
    'products.manage',
    'keys.manage',
    'team.manage',
    // NOTE: no payouts.manage — only owner handles billing/payouts
  ],
  OPS: [
    'orders.manage',
    'orders.read',
  ],
  CATALOG: [
    'offers.manage',
    'products.manage',
    'keys.manage',
  ],
  SUPPORT: [
    'orders.read',
  ],
} as const;

// ============================================
// Authorization helper
// ============================================

/**
 * Check whether a member with the given role has a specific permission.
 *
 * Current implementation: pure role-based lookup.
 *
 * TODO: When per-member overrides are added, accept an optional
 *       `overrides` parameter and merge:
 *       ```
 *       can(role, permission, overrides?)
 *       ```
 *       Overrides would be { grant: string[], deny: string[] }.
 */
export function can(role: SellerTeamRole, permission: SellerPermission): boolean {
  const allowed = ROLE_PERMISSIONS[role];
  if (!allowed) return false;
  return allowed.includes(permission);
}

/**
 * Get all permissions for a role. Useful for returning to frontend
 * for UI gating (NOT security — security is backend-only).
 */
export function getPermissionsForRole(role: SellerTeamRole): readonly SellerPermission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Roles that can manage team members (invite, change role, remove).
 */
export const TEAM_MANAGEMENT_ROLES: readonly SellerTeamRole[] = ['OWNER', 'ADMIN'] as const;

/**
 * Check if a role can manage the team.
 */
export function canManageTeam(role: SellerTeamRole): boolean {
  return can(role, 'team.manage');
}

/**
 * Validate role change constraints:
 *  - Owner cannot be downgraded by anyone.
 *  - Only owner can promote to admin.
 *  - Admin cannot promote to owner.
 */
export function canChangeRole(
  actorRole: SellerTeamRole,
  targetCurrentRole: SellerTeamRole,
  newRole: SellerTeamRole,
): { allowed: boolean; reason?: string } {
  // Nobody can change the owner's role
  if (targetCurrentRole === 'OWNER') {
    return { allowed: false, reason: 'Owner role cannot be changed' };
  }

  // Nobody can promote to owner
  if (newRole === 'OWNER') {
    return { allowed: false, reason: 'Cannot promote to owner' };
  }

  // Only owner/admin can change roles (already enforced by guard, but double-check)
  if (!canManageTeam(actorRole)) {
    return { allowed: false, reason: 'Insufficient permissions to manage team' };
  }

  // Admin cannot promote someone to admin (only owner can)
  if (actorRole === 'ADMIN' && newRole === 'ADMIN') {
    return { allowed: false, reason: 'Only the owner can promote to admin' };
  }

  return { allowed: true };
}
