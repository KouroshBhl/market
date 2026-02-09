import { SetMetadata } from '@nestjs/common';
import type { SellerPermission } from './permissions';

export const SELLER_PERMISSION_KEY = 'seller_permission';

/**
 * Decorator: require a specific seller-scoped permission.
 *
 * Usage:
 *   @RequireSellerPermission('orders.manage')
 *   @UseGuards(AuthGuard, SellerMemberGuard, SellerPermissionGuard)
 *
 * The guard reads the role from `request.sellerMember` (set by SellerMemberGuard)
 * and checks if the role grants the required permission via `can()`.
 */
export const RequireSellerPermission = (permission: SellerPermission) =>
  SetMetadata(SELLER_PERMISSION_KEY, permission);
