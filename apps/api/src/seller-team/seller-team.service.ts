import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@workspace/db';
import type {
  GetSellerTeamResponse,
  SellerTeamMember,
} from '@workspace/contracts';

@Injectable()
export class SellerTeamService {
  /**
   * Get team members for a seller (for assignee dropdown)
   */
  async getTeamMembers(sellerId: string): Promise<GetSellerTeamResponse> {
    const members = await prisma.sellerTeamMember.findMany({
      where: {
        sellerId,
        isActive: true,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      members: members.map(this.mapMemberToContract),
    };
  }

  /**
   * Check if user is team member and get role
   */
  async getMemberRole(sellerId: string, userId: string): Promise<'OWNER' | 'STAFF' | null> {
    const member = await prisma.sellerTeamMember.findUnique({
      where: {
        sellerId_userId: {
          sellerId,
          userId,
        },
        isActive: true,
      },
    });

    return member ? member.role : null;
  }

  /**
   * Map Prisma member to contract
   */
  private mapMemberToContract(member: any): SellerTeamMember {
    return {
      id: member.id,
      sellerId: member.sellerId,
      userId: member.userId,
      role: member.role,
      isActive: member.isActive,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
      user: {
        id: member.user.id,
        email: member.user.email,
        name: member.user.name,
      },
    };
  }
}
