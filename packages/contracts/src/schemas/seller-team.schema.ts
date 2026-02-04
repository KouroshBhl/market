import { z } from 'zod';

// ============================================
// SELLER TEAM - Team member management
// ============================================

export const SellerTeamRoleSchema = z.enum(['OWNER', 'STAFF']);
export type SellerTeamRole = z.infer<typeof SellerTeamRoleSchema>;

export const SellerTeamMemberSchema = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  userId: z.string().uuid(),
  role: SellerTeamRoleSchema,
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // User details (joined)
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable(),
  }),
});

export type SellerTeamMember = z.infer<typeof SellerTeamMemberSchema>;

// GET /seller/team - List seller team members
export const GetSellerTeamResponseSchema = z.object({
  members: z.array(SellerTeamMemberSchema),
});

export type GetSellerTeamResponse = z.infer<typeof GetSellerTeamResponseSchema>;
