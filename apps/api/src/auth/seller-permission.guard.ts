import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SELLER_PERMISSION_KEY } from './seller-permission.decorator';
import { can } from './permissions';
import type { SellerPermission, SellerTeamRole } from './permissions';

/**
 * Seller Permission Guard
 *
 * Checks that the authenticated seller member (from SellerMemberGuard)
 * has the permission specified by @RequireSellerPermission().
 *
 * Guard order: AuthGuard → SellerMemberGuard → SellerPermissionGuard
 *
 * If no permission is specified via decorator, the guard passes (allows
 * endpoints that only need membership verification, not a specific permission).
 */
@Injectable()
export class SellerPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<SellerPermission | undefined>(
      SELLER_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permission decorator → just membership is enough
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const sellerMember = request.sellerMember as
      | { role: SellerTeamRole }
      | undefined;

    if (!sellerMember) {
      throw new ForbiddenException(
        'Seller membership not resolved. Ensure SellerMemberGuard runs before SellerPermissionGuard.',
      );
    }

    if (!can(sellerMember.role, requiredPermission)) {
      throw new ForbiddenException(
        `Missing permission: ${requiredPermission}`,
      );
    }

    return true;
  }
}
