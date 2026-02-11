import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { prisma } from '@workspace/db';
import type {
  GetStoreIdentityResponse,
  UpdateStoreIdentityRequest,
  UpdateStoreIdentityResponse,
} from '@workspace/contracts';

@Injectable()
export class SellerProfileService {
  private readonly logger = new Logger(SellerProfileService.name);

  // ============================================
  // GET STORE IDENTITY
  // ============================================

  async getStoreIdentity(sellerId: string): Promise<GetStoreIdentityResponse> {
    const profile = await prisma.sellerProfile.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        slug: true,
        displayName: true,
        logoUrl: true,
        bio: true,
        supportResponseTime: true,
        timezone: true,
        languages: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    return profile;
  }

  // ============================================
  // UPDATE STORE IDENTITY
  // ============================================

  async updateStoreIdentity(
    sellerId: string,
    userId: string,
    data: UpdateStoreIdentityRequest,
  ): Promise<UpdateStoreIdentityResponse> {
    // Verify seller profile exists
    const profile = await prisma.sellerProfile.findUnique({
      where: { id: sellerId },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    // Authorization: Only the owner (userId === profile.userId) can update identity
    // OR a team member with appropriate permissions (handled by guard)
    // For MVP, we'll allow any authenticated team member to update
    // In production, you'd check for specific permissions

    // Update profile
    const updated = await prisma.sellerProfile.update({
      where: { id: sellerId },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.supportResponseTime !== undefined && {
          supportResponseTime: data.supportResponseTime,
        }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.languages !== undefined && { languages: data.languages }),
      },
      select: {
        id: true,
        slug: true,
        displayName: true,
        logoUrl: true,
        bio: true,
        supportResponseTime: true,
        timezone: true,
        languages: true,
      },
    });

    this.logger.log(`Store identity updated for seller ${sellerId} by user ${userId}`);

    return {
      success: true,
      profile: updated,
    };
  }
}
