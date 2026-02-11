import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { prisma } from '@workspace/db';
import type {
  GetStoreIdentityResponse,
  UpdateStoreIdentityRequest,
  UpdateStoreIdentityResponse,
  ChangeStoreSlugRequest,
  ChangeStoreSlugResponse,
  ResolveStoreSlugResponse,
} from '@workspace/contracts';

@Injectable()
export class SellerProfileService {
  private readonly logger = new Logger(SellerProfileService.name);

  // ============================================
  // GET STORE IDENTITY (for seller settings)
  // ============================================

  async getStoreIdentity(sellerId: string): Promise<GetStoreIdentityResponse> {
    const profile = await prisma.sellerProfile.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        slug: true,
        sellerDisplayName: true,
        logoUrl: true,
        bio: true,
        timezone: true,
        slugChangeCount: true,
        slugChangedAt: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    return {
      ...profile,
      slugChangedAt: profile.slugChangedAt?.toISOString() ?? null,
      canChangeSlug: profile.slugChangeCount === 0,
    };
  }

  // ============================================
  // UPDATE STORE IDENTITY
  // ============================================

  async updateStoreIdentity(
    sellerId: string,
    userId: string,
    data: UpdateStoreIdentityRequest,
  ): Promise<UpdateStoreIdentityResponse> {
    const profile = await prisma.sellerProfile.findUnique({
      where: { id: sellerId },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    const updated = await prisma.sellerProfile.update({
      where: { id: sellerId },
      data: {
        ...(data.sellerDisplayName !== undefined && {
          sellerDisplayName: data.sellerDisplayName.trim(),
        }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.bio !== undefined && { bio: data.bio?.trim() || null }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
      },
      select: {
        id: true,
        slug: true,
        sellerDisplayName: true,
        logoUrl: true,
        bio: true,
        timezone: true,
        slugChangeCount: true,
        slugChangedAt: true,
      },
    });

    this.logger.log(`Store identity updated for seller ${sellerId} by user ${userId}`);

    return {
      success: true,
      profile: {
        ...updated,
        slugChangedAt: updated.slugChangedAt?.toISOString() ?? null,
        canChangeSlug: updated.slugChangeCount === 0,
      },
    };
  }

  // ============================================
  // CHANGE STORE SLUG (ONE-TIME)
  // Uses a transaction to atomically:
  //   1. Insert old slug into StoreSlugHistory
  //   2. Update profile with new slug + increment counter
  // ============================================

  async changeStoreSlug(
    sellerId: string,
    userId: string,
    data: ChangeStoreSlugRequest,
  ): Promise<ChangeStoreSlugResponse> {
    const profile = await prisma.sellerProfile.findUnique({
      where: { id: sellerId },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    if (profile.slugChangeCount >= 1) {
      throw new ForbiddenException('Store handle can only be changed once');
    }

    const newSlug = data.newSlug.toLowerCase().trim();

    // Check uniqueness against BOTH current slugs and historical slugs
    const [existingProfile, existingHistory] = await Promise.all([
      prisma.sellerProfile.findUnique({ where: { slug: newSlug } }),
      prisma.storeSlugHistory.findUnique({ where: { slug: newSlug } }),
    ]);

    if (existingProfile || existingHistory) {
      throw new ConflictException('This handle is already taken');
    }

    const previousSlug = profile.slug;

    // Atomic transaction
    await prisma.$transaction(async (tx) => {
      // Record old slug in history for redirect
      await tx.storeSlugHistory.create({
        data: {
          sellerId,
          slug: previousSlug,
        },
      });

      // Update profile with new slug
      await tx.sellerProfile.update({
        where: { id: sellerId },
        data: {
          slug: newSlug,
          slugChangeCount: profile.slugChangeCount + 1,
          slugChangedAt: new Date(),
        },
      });
    });

    this.logger.log(
      `Store slug changed "${previousSlug}" → "${newSlug}" for seller ${sellerId} by user ${userId}`,
    );

    return {
      success: true,
      newSlug,
      previousSlug,
    };
  }

  // ============================================
  // RESOLVE SLUG (PUBLIC)
  // Returns the current slug for a given slug.
  // If the slug is historical, returns the current slug + isRedirect=true.
  // ============================================

  async resolveSlug(slug: string): Promise<ResolveStoreSlugResponse> {
    // 1. Check current slugs
    const profile = await prisma.sellerProfile.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });

    if (profile) {
      return { currentSlug: profile.slug, sellerId: profile.id, isRedirect: false };
    }

    // 2. Check historical slugs
    const history = await prisma.storeSlugHistory.findUnique({
      where: { slug },
      include: { seller: { select: { id: true, slug: true } } },
    });

    if (history) {
      return {
        currentSlug: history.seller.slug,
        sellerId: history.seller.id,
        isRedirect: true,
      };
    }

    throw new NotFoundException('Store not found');
  }
}
