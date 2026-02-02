import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@workspace/db';
import type {
  CatalogProduct,
  CatalogVariant,
  GetCatalogProductsResponse,
  GetCatalogVariantsResponse,
} from '@workspace/contracts';

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
      isActive: variant.isActive,
      sortOrder: variant.sortOrder,
      createdAt: variant.createdAt.toISOString(),
      updatedAt: variant.updatedAt.toISOString(),
    };
  }
}
