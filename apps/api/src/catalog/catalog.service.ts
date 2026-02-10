import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@workspace/db';
import type {
  CatalogProduct,
  CatalogVariant,
  GetCatalogProductsResponse,
  GetCatalogVariantsResponse,
} from '@workspace/contracts';
import type { ProductBySlugResponse } from '../contracts/catalog/get-product-by-slug.contract';

@Injectable()
export class CatalogService {
  /**
   * Get catalog products, optionally filtered by child categoryId
   */
  async getProducts(categoryId?: string): Promise<GetCatalogProductsResponse> {
    const products = await prisma.catalogProduct.findMany({
      where: {
        ...(categoryId && { categoryId }),
        isActive: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    return {
      products: products.map(this.mapProductToContract),
    };
  }

  /**
   * Get a single catalog product by ID
   */
  async getProductById(productId: string): Promise<CatalogProduct> {
    const product = await prisma.catalogProduct.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Catalog product with ID ${productId} not found`);
    }

    return this.mapProductToContract(product);
  }

  /**
   * Get a catalog product by slug, with category info and active variants.
   * Each variant includes offerCount (number of active offers).
   * Used by the buyer product page.
   */
  async getProductBySlug(slug: string): Promise<ProductBySlugResponse> {
    const product = await prisma.catalogProduct.findFirst({
      where: { slug, isActive: true },
      include: {
        category: {
          include: {
            parent: { select: { id: true, name: true, slug: true } },
          },
        },
        variants: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { region: 'asc' }, { durationDays: 'asc' }],
          select: {
            id: true,
            region: true,
            durationDays: true,
            edition: true,
            sku: true,
            supportsAutoKey: true,
            supportsManual: true,
            sortOrder: true,
            _count: { select: { offers: { where: { status: 'active' } } } },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      imageUrl: product.imageUrl,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
        parent: product.category.parent
          ? {
              id: product.category.parent.id,
              name: product.category.parent.name,
              slug: product.category.parent.slug,
            }
          : null,
      },
      variants: product.variants.map((v) => ({
        id: v.id,
        region: v.region,
        durationDays: v.durationDays,
        edition: v.edition,
        sku: v.sku,
        supportsAutoKey: v.supportsAutoKey,
        supportsManual: v.supportsManual,
        sortOrder: v.sortOrder,
        offerCount: v._count.offers,
      })),
    };
  }

  /**
   * Get variants for a catalog product
   */
  async getVariants(productId: string): Promise<GetCatalogVariantsResponse> {
    // Verify product exists
    await this.getProductById(productId);

    const variants = await prisma.catalogVariant.findMany({
      where: {
        productId,
        isActive: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { region: 'asc' },
        { durationDays: 'asc' },
      ],
    });

    return {
      variants: variants.map(this.mapVariantToContract),
    };
  }

  /**
   * Helper: Map Prisma CatalogProduct to contract
   */
  private mapProductToContract(product: any): CatalogProduct {
    return {
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      imageUrl: product.imageUrl,
      isActive: product.isActive,
      sortOrder: product.sortOrder,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  /**
   * Helper: Map Prisma CatalogVariant to contract
   */
  private mapVariantToContract(variant: any): CatalogVariant {
    return {
      id: variant.id,
      productId: variant.productId,
      region: variant.region,
      durationDays: variant.durationDays,
      edition: variant.edition,
      sku: variant.sku,
      supportsAutoKey: variant.supportsAutoKey,
      supportsManual: variant.supportsManual,
      isActive: variant.isActive,
      sortOrder: variant.sortOrder,
      createdAt: variant.createdAt.toISOString(),
      updatedAt: variant.updatedAt.toISOString(),
    };
  }
}
