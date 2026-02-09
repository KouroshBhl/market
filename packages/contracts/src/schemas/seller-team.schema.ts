import { z } from 'zod';

// ============================================
// SELLER TEAM — RBAC (fixed roles, no custom roles)
// ============================================

// ---------- Roles ----------

export const SellerTeamRoleSchema = z.enum([
  'OWNER',
  'ADMIN',
  'OPS',
  'CATALOG',
  'SUPPORT',
]);
export type SellerTeamRole = z.infer<typeof SellerTeamRoleSchema>;

// ---------- Permissions ----------

/**
 * Centralized permission strings.
 * Role → permission mapping is enforced on the backend ONLY.
 * Frontend reads these for UI gating but never for security.
 *
 * TODO: When per-member permission overrides are added,
 *       extend can() to merge role defaults with overrides.
 */
export const SellerPermissionSchema = z.enum([
  'orders.manage',
  'orders.read',
  'offers.manage',
  'products.manage',
  'keys.manage',
  'team.manage',
  'payouts.manage',
]);
export type SellerPermission = z.infer<typeof SellerPermissionSchema>;

// ---------- Member Status ----------

export const MemberStatusSchema = z.enum(['ACTIVE', 'SUSPENDED']);
export type MemberStatus = z.infer<typeof MemberStatusSchema>;

// ---------- Team Member ----------

export const SellerTeamMemberSchema = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  userId: z.string().uuid(),
  role: SellerTeamRoleSchema,
  status: MemberStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable(),
  }),
});

export type SellerTeamMember = z.infer<typeof SellerTeamMemberSchema>;

// ---------- Invite ----------

export const SellerInviteSchema = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  email: z.string().email(),
  role: SellerTeamRoleSchema,
  expiresAt: z.string(),
  acceptedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type SellerInvite = z.infer<typeof SellerInviteSchema>;

// ---------- Membership (for seller switcher) ----------

export const SellerMembershipSchema = z.object({
  sellerId: z.string().uuid(),
  sellerName: z.string(),
  role: SellerTeamRoleSchema,
});

export type SellerMembership = z.infer<typeof SellerMembershipSchema>;

// ============================================
// Request / Response Schemas
// ============================================

// GET /seller/:id/members
export const GetSellerTeamResponseSchema = z.object({
  members: z.array(SellerTeamMemberSchema),
  invites: z.array(SellerInviteSchema),
});
export type GetSellerTeamResponse = z.infer<typeof GetSellerTeamResponseSchema>;

// POST /seller/:id/invite
export const InviteMemberRequestSchema = z.object({
  email: z.string().email(),
  role: SellerTeamRoleSchema.exclude(['OWNER']), // Cannot invite as OWNER
});
export type InviteMemberRequest = z.infer<typeof InviteMemberRequestSchema>;

export const InviteMemberResponseSchema = z.object({
  invite: SellerInviteSchema,
});
export type InviteMemberResponse = z.infer<typeof InviteMemberResponseSchema>;

// POST /seller/:id/members/:userId/role
export const ChangeRoleRequestSchema = z.object({
  role: SellerTeamRoleSchema.exclude(['OWNER']), // Cannot promote to OWNER
});
export type ChangeRoleRequest = z.infer<typeof ChangeRoleRequestSchema>;

export const ChangeRoleResponseSchema = z.object({
  member: SellerTeamMemberSchema,
});
export type ChangeRoleResponse = z.infer<typeof ChangeRoleResponseSchema>;

// DELETE /seller/:id/members/:userId
export const RemoveMemberResponseSchema = z.object({
  success: z.boolean(),
});
export type RemoveMemberResponse = z.infer<typeof RemoveMemberResponseSchema>;

// GET /user/memberships
export const GetMembershipsResponseSchema = z.object({
  memberships: z.array(SellerMembershipSchema),
});
export type GetMembershipsResponse = z.infer<typeof GetMembershipsResponseSchema>;

// DELETE /seller/:id/invites/:inviteId
export const RevokeInviteResponseSchema = z.object({
  success: z.boolean(),
});
export type RevokeInviteResponse = z.infer<typeof RevokeInviteResponseSchema>;

// POST /invite/accept
export const AcceptInviteRequestSchema = z.object({
  token: z.string().min(1),
});
export type AcceptInviteRequest = z.infer<typeof AcceptInviteRequestSchema>;

export const AcceptInviteResponseSchema = z.object({
  membership: SellerMembershipSchema,
});
export type AcceptInviteResponse = z.infer<typeof AcceptInviteResponseSchema>;
