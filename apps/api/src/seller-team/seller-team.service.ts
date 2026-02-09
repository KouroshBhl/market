import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { prisma } from '@workspace/db';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';
import type {
  GetSellerTeamResponse,
  SellerTeamMember,
  SellerInvite,
  SellerMembership,
  SellerTeamRole,
  InviteMemberResponse,
  ChangeRoleResponse,
  AcceptInviteResponse,
  GetMembershipsResponse,
} from '@workspace/contracts';
import { canChangeRole, canManageTeam } from '../auth/permissions';
import type { SellerTeamRole as PermRole } from '../auth/permissions';

@Injectable()
export class SellerTeamService {
  private readonly logger = new Logger(SellerTeamService.name);

  constructor(private readonly emailService: EmailService) {}

  // ============================================
  // LIST TEAM MEMBERS + PENDING INVITES
  // ============================================

  async getTeamMembers(sellerId: string): Promise<GetSellerTeamResponse> {
    const [members, invites] = await Promise.all([
      prisma.sellerTeamMember.findMany({
        where: { sellerId, status: 'ACTIVE' },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.sellerInvite.findMany({
        where: { sellerId, acceptedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      members: members.map(this.mapMemberToContract),
      invites: invites.map(this.mapInviteToContract),
    };
  }

  // ============================================
  // INVITE MEMBER
  // ============================================

  async inviteMember(
    sellerId: string,
    actorRole: PermRole,
    email: string,
    role: SellerTeamRole,
  ): Promise<InviteMemberResponse> {
    // Authorization: only owner/admin can invite
    if (!canManageTeam(actorRole)) {
      throw new ForbiddenException('You do not have permission to invite team members');
    }

    // Cannot invite as owner
    if (role === 'OWNER') {
      throw new BadRequestException('Cannot invite as owner');
    }

    // Admin cannot invite as admin (only owner can)
    if (actorRole === 'ADMIN' && role === 'ADMIN') {
      throw new ForbiddenException('Only the owner can invite admin members');
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.sellerTeamMember.findUnique({
        where: { sellerId_userId: { sellerId, userId: existingUser.id } },
      });
      if (existingMember && existingMember.status === 'ACTIVE') {
        throw new ConflictException('User is already a member of this organization');
      }
    }

    // Check for existing pending invite
    const existingInvite = await prisma.sellerInvite.findUnique({
      where: { sellerId_email: { sellerId, email } },
    });
    if (existingInvite && !existingInvite.acceptedAt && existingInvite.expiresAt > new Date()) {
      throw new ConflictException('An active invite already exists for this email');
    }

    // Generate secure invite token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Upsert invite (replace expired/accepted invites)
    const invite = existingInvite
      ? await prisma.sellerInvite.update({
          where: { id: existingInvite.id },
          data: {
            role: role as any,
            tokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            acceptedAt: null,
          },
        })
      : await prisma.sellerInvite.create({
          data: {
            sellerId,
            email,
            role: role as any,
            tokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        });

    // Send invite email (fire-and-forget — don't block the API response)
    const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    const sellerName = seller?.displayName ?? 'your team';
    const roleLabel = { ADMIN: 'Admin', OPS: 'Operations', CATALOG: 'Catalog Manager', SUPPORT: 'Support' }[role as string] ?? role;

    this.emailService
      .sendTeamInviteEmail(email, rawToken, sellerName, roleLabel)
      .catch((err) => {
        this.logger.warn(`Failed to send invite email to ${email}: ${err?.message ?? err}`);
      });

    this.logger.log(`Invite created for ${email} to seller ${sellerId} (${sellerName}) with role ${role}`);

    return {
      invite: this.mapInviteToContract(invite),
    };
  }

  // ============================================
  // ACCEPT INVITE
  // ============================================

  /**
   * Idempotent invite acceptance:
   *  - expired → 400
   *  - email mismatch → 403 (case-insensitive)
   *  - already accepted by same user → return success (idempotent)
   *  - already accepted by different user → 409
   *  - existing OWNER/ADMIN member → keep higher role, don't downgrade
   */
  async acceptInvite(rawToken: string, userId: string): Promise<AcceptInviteResponse> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const invite = await prisma.sellerInvite.findUnique({
      where: { tokenHash },
      include: { seller: true },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found or invalid');
    }

    // Expired check (before accepted check — expired+accepted is still "accepted")
    if (!invite.acceptedAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite has expired. Ask your team admin to send a new one.');
    }

    // Load the accepting user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Case-insensitive email match
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ForbiddenException(
        `This invite was sent to ${invite.email}. You are signed in as ${user.email}.`,
      );
    }

    // Idempotency: already accepted
    if (invite.acceptedAt) {
      // Same user re-clicking the link → return success
      const existingMember = await prisma.sellerTeamMember.findUnique({
        where: { sellerId_userId: { sellerId: invite.sellerId, userId } },
      });
      if (existingMember && existingMember.status === 'ACTIVE') {
        return {
          membership: {
            sellerId: invite.sellerId,
            sellerName: invite.seller.displayName,
            role: existingMember.role as SellerTeamRole,
          },
        };
      }
      // Accepted but membership missing/suspended → treat as conflict
      throw new ConflictException('This invite has already been used.');
    }

    // Role hierarchy: don't downgrade OWNER/ADMIN
    const ROLE_RANK: Record<string, number> = {
      OWNER: 5, ADMIN: 4, OPS: 3, CATALOG: 2, SUPPORT: 1,
    };

    const existingMember = await prisma.sellerTeamMember.findUnique({
      where: { sellerId_userId: { sellerId: invite.sellerId, userId } },
    });

    const effectiveRole =
      existingMember &&
      existingMember.status === 'ACTIVE' &&
      (ROLE_RANK[existingMember.role] ?? 0) > (ROLE_RANK[invite.role] ?? 0)
        ? existingMember.role
        : invite.role;

    await prisma.$transaction(async (tx) => {
      // Mark invite as accepted
      await tx.sellerInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      if (existingMember) {
        // Reactivate / update role (keep higher role)
        await tx.sellerTeamMember.update({
          where: { id: existingMember.id },
          data: { status: 'ACTIVE', role: effectiveRole },
        });
      } else {
        await tx.sellerTeamMember.create({
          data: {
            sellerId: invite.sellerId,
            userId,
            role: invite.role,
            status: 'ACTIVE',
          },
        });
      }
    });

    return {
      membership: {
        sellerId: invite.sellerId,
        sellerName: invite.seller.displayName,
        role: effectiveRole as SellerTeamRole,
      },
    };
  }

  // ============================================
  // CHANGE ROLE
  // ============================================

  async changeMemberRole(
    sellerId: string,
    actorRole: PermRole,
    targetUserId: string,
    newRole: SellerTeamRole,
  ): Promise<ChangeRoleResponse> {
    const member = await prisma.sellerTeamMember.findUnique({
      where: { sellerId_userId: { sellerId, userId: targetUserId } },
      include: { user: true },
    });

    if (!member || member.status !== 'ACTIVE') {
      throw new NotFoundException('Member not found');
    }

    // Validate role change
    const check = canChangeRole(actorRole, member.role as PermRole, newRole as PermRole);
    if (!check.allowed) {
      throw new ForbiddenException(check.reason);
    }

    const updated = await prisma.sellerTeamMember.update({
      where: { id: member.id },
      data: { role: newRole as any },
      include: { user: true },
    });

    return {
      member: this.mapMemberToContract(updated),
    };
  }

  // ============================================
  // REMOVE MEMBER
  // ============================================

  async removeMember(
    sellerId: string,
    actorRole: PermRole,
    actorUserId: string,
    targetUserId: string,
  ): Promise<{ success: boolean }> {
    // Cannot remove yourself if you're the owner
    if (actorUserId === targetUserId && actorRole === 'OWNER') {
      throw new ForbiddenException('Owner cannot remove themselves');
    }

    if (!canManageTeam(actorRole)) {
      throw new ForbiddenException('You do not have permission to remove team members');
    }

    const member = await prisma.sellerTeamMember.findUnique({
      where: { sellerId_userId: { sellerId, userId: targetUserId } },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Owner cannot be removed
    if (member.role === 'OWNER') {
      throw new ForbiddenException('Owner cannot be removed from the organization');
    }

    // Admin can only be removed by owner
    if (member.role === 'ADMIN' && actorRole !== 'OWNER') {
      throw new ForbiddenException('Only the owner can remove admin members');
    }

    // Soft-delete: set status to SUSPENDED
    await prisma.sellerTeamMember.update({
      where: { id: member.id },
      data: { status: 'SUSPENDED' },
    });

    return { success: true };
  }

  // ============================================
  // REVOKE INVITE
  // ============================================

  async revokeInvite(
    sellerId: string,
    actorRole: PermRole,
    inviteId: string,
  ): Promise<{ success: boolean }> {
    if (!canManageTeam(actorRole)) {
      throw new ForbiddenException('You do not have permission to revoke invites');
    }

    const invite = await prisma.sellerInvite.findFirst({
      where: { id: inviteId, sellerId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    await prisma.sellerInvite.delete({ where: { id: invite.id } });

    return { success: true };
  }

  // ============================================
  // RESEND INVITE
  // ============================================

  async resendInvite(
    sellerId: string,
    actorRole: PermRole,
    inviteId: string,
  ): Promise<{ success: boolean }> {
    if (!canManageTeam(actorRole)) {
      throw new ForbiddenException('You do not have permission to resend invites');
    }

    const invite = await prisma.sellerInvite.findFirst({
      where: { id: inviteId, sellerId, acceptedAt: null },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    // Generate a fresh token and extend expiry
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await prisma.sellerInvite.update({
      where: { id: invite.id },
      data: {
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send email
    const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    const sellerName = seller?.displayName ?? 'your team';
    const roleLabel = { ADMIN: 'Admin', OPS: 'Operations', CATALOG: 'Catalog Manager', SUPPORT: 'Support' }[invite.role as string] ?? invite.role;

    this.emailService
      .sendTeamInviteEmail(invite.email, rawToken, sellerName, roleLabel)
      .catch((err) => {
        this.logger.warn(`Failed to resend invite email to ${invite.email}: ${err?.message ?? err}`);
      });

    this.logger.log(`Invite resent for ${invite.email} to seller ${sellerId}`);

    return { success: true };
  }

  // ============================================
  // GET USER MEMBERSHIPS (for seller switcher)
  // ============================================

  async getUserMemberships(userId: string): Promise<GetMembershipsResponse> {
    const memberships = await prisma.sellerTeamMember.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { seller: true },
      orderBy: { createdAt: 'asc' },
    });

    return {
      memberships: memberships.map((m) => ({
        sellerId: m.sellerId,
        sellerName: m.seller.displayName,
        role: m.role as SellerTeamRole,
      })),
    };
  }

  // ============================================
  // GET MEMBER ROLE (used by other services)
  // ============================================

  async getMemberRole(sellerId: string, userId: string): Promise<SellerTeamRole | null> {
    const member = await prisma.sellerTeamMember.findUnique({
      where: {
        sellerId_userId: { sellerId, userId },
      },
    });

    if (!member || member.status !== 'ACTIVE') return null;
    return member.role as SellerTeamRole;
  }

  // ============================================
  // INTERNAL: Create owner membership on seller setup
  // ============================================

  async createOwnerMembership(sellerId: string, userId: string): Promise<void> {
    await prisma.sellerTeamMember.create({
      data: {
        sellerId,
        userId,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });
  }

  // ============================================
  // Mappers
  // ============================================

  private mapMemberToContract(member: any): SellerTeamMember {
    return {
      id: member.id,
      sellerId: member.sellerId,
      userId: member.userId,
      role: member.role,
      status: member.status,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
      user: {
        id: member.user.id,
        email: member.user.email,
        name: member.user.name,
      },
    };
  }

  private mapInviteToContract(invite: any): SellerInvite {
    return {
      id: invite.id,
      sellerId: invite.sellerId,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt.toISOString(),
      acceptedAt: invite.acceptedAt?.toISOString() ?? null,
      createdAt: invite.createdAt.toISOString(),
    };
  }
}
