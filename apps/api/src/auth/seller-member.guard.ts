import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@workspace/db';
import type { SellerTeamRole } from './permissions';

/**
 * Seller Membership Guard
 *
 * Validates that the authenticated user is an ACTIVE member of the
 * seller referenced in the route parameter `:sellerId`.
 *
 * Attaches `request.sellerMember` for downstream guards/handlers:
 *   { memberId, sellerId, userId, role }
 *
 * MUST be used AFTER AuthGuard (requires request.user).
 * Expects route param: `:sellerId` (e.g. /seller/:sellerId/...).
 */
@Injectable()
export class SellerMemberGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user = request.user;
    if (!user?.userId) {
      throw new ForbiddenException('Not authenticated');
    }

    const sellerId = request.params?.sellerId;
    if (!sellerId) {
      throw new NotFoundException('Seller ID is required');
    }

    const member = await prisma.sellerTeamMember.findUnique({
      where: {
        sellerId_userId: {
          sellerId,
          userId: user.userId,
        },
      },
    });

    if (!member || member.status !== 'ACTIVE') {
      throw new ForbiddenException('You are not a member of this seller organization');
    }

    // Attach member context to request for downstream use
    request.sellerMember = {
      memberId: member.id,
      sellerId: member.sellerId,
      userId: member.userId,
      role: member.role as SellerTeamRole,
    };

    return true;
  }
}
