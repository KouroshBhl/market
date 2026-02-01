import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { prisma } from '@workspace/db';
import type { 
  Product, 
  ProductDraft, 
  SaveProductDraft, 
  UpdateProductDraft,
  UpdateProductStatus,
  ProductStatus
} from '@workspace/contracts';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ProductsService {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Get all products for a seller (TODO: add sellerId filter when auth is implemented)
   */
  async findAll(): Promise<Product[]> {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        autoKeyConfig: true,
        manualDeliveryConfig: true,
      },
    });

    return products.map((product) => this.mapProductToContract(product));
  }

  /**
   * Get a single product by ID
   */
  async findOne(id: string): Promise<Product> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        autoKeyConfig: true,
        manualDeliveryConfig: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.mapProductToContract(product);
  }

  /**
   * Save a new product draft (creates new record)
   */
  async saveDraft(data: SaveProductDraft): Promise<ProductDraft> {
    // Validate category if provided
    if (data.categoryId) {
      const isValid = await this.categoriesService.validateChildCategory(data.categoryId);
      if (!isValid) {
        throw new BadRequestException(
          'Invalid category. Products must reference an active child category (not a parent category).'
        );
      }
    }

    // Validate delivery config matches delivery type
    this.validateDeliveryConfig(data.deliveryType, data.autoKeyConfig, data.manualDeliveryConfig);

    // Create product in transaction with delivery config
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          sellerId: data.sellerId,
          status: 'draft',
          deliveryType: data.deliveryType,
          categoryId: data.categoryId || null,
          title: data.title || null,
          description: data.description || null,
          priceAmount: data.priceAmount || null,
          currency: data.currency || null,
        },
      });

      // Create delivery config based on type
      if (data.deliveryType === 'AUTO_KEY' && data.autoKeyConfig) {
        await tx.productAutoKeyConfig.create({
          data: {
            productId: newProduct.id,
            keyPoolId: data.autoKeyConfig.keyPoolId || null,
            autoDelivery: data.autoKeyConfig.autoDelivery ?? true,
            stockAlert: data.autoKeyConfig.stockAlert || null,
          },
        });
      } else if (data.deliveryType === 'MANUAL' && data.manualDeliveryConfig) {
        await tx.productManualDeliveryConfig.create({
          data: {
            productId: newProduct.id,
            deliveryInstructions: data.manualDeliveryConfig.deliveryInstructions || null,
            estimatedDeliverySLA: data.manualDeliveryConfig.estimatedDeliverySLA || null,
          },
        });
      }

      return tx.product.findUnique({
        where: { id: newProduct.id },
        include: {
          autoKeyConfig: true,
          manualDeliveryConfig: true,
        },
      });
    });

    return this.mapProductToDraftContract(product!);
  }

  /**
   * Update an existing draft
   */
  async updateDraft(id: string, data: UpdateProductDraft): Promise<ProductDraft> {
    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        autoKeyConfig: true,
        manualDeliveryConfig: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (existing.status !== 'draft') {
      throw new BadRequestException('Only draft products can be updated via this endpoint');
    }

    // Validate category if provided
    if (data.categoryId) {
      const isValid = await this.categoriesService.validateChildCategory(data.categoryId);
      if (!isValid) {
        throw new BadRequestException(
          'Invalid category. Products must reference an active child category (not a parent category).'
        );
      }
    }

    // Validate delivery config matches product's delivery type
    this.validateDeliveryConfig(existing.deliveryType, data.autoKeyConfig, data.manualDeliveryConfig);

    // Update in transaction
    const product = await prisma.$transaction(async (tx) => {
      // Update product fields
      const updated = await tx.product.update({
        where: { id },
        data: {
          ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.priceAmount !== undefined && { priceAmount: data.priceAmount }),
          ...(data.currency !== undefined && { currency: data.currency }),
        },
      });

      // Update delivery config
      if (existing.deliveryType === 'AUTO_KEY' && data.autoKeyConfig) {
        await tx.productAutoKeyConfig.upsert({
          where: { productId: id },
          create: {
            productId: id,
            keyPoolId: data.autoKeyConfig.keyPoolId || null,
            autoDelivery: data.autoKeyConfig.autoDelivery ?? true,
            stockAlert: data.autoKeyConfig.stockAlert || null,
          },
          update: {
            ...(data.autoKeyConfig.keyPoolId !== undefined && { 
              keyPoolId: data.autoKeyConfig.keyPoolId 
            }),
            ...(data.autoKeyConfig.autoDelivery !== undefined && { 
              autoDelivery: data.autoKeyConfig.autoDelivery 
            }),
            ...(data.autoKeyConfig.stockAlert !== undefined && { 
              stockAlert: data.autoKeyConfig.stockAlert 
            }),
          },
        });
      } else if (existing.deliveryType === 'MANUAL' && data.manualDeliveryConfig) {
        await tx.productManualDeliveryConfig.upsert({
          where: { productId: id },
          create: {
            productId: id,
            deliveryInstructions: data.manualDeliveryConfig.deliveryInstructions || null,
            estimatedDeliverySLA: data.manualDeliveryConfig.estimatedDeliverySLA || null,
          },
          update: {
            ...(data.manualDeliveryConfig.deliveryInstructions !== undefined && {
              deliveryInstructions: data.manualDeliveryConfig.deliveryInstructions,
            }),
            ...(data.manualDeliveryConfig.estimatedDeliverySLA !== undefined && {
              estimatedDeliverySLA: data.manualDeliveryConfig.estimatedDeliverySLA,
            }),
          },
        });
      }

      return tx.product.findUnique({
        where: { id },
        include: {
          autoKeyConfig: true,
          manualDeliveryConfig: true,
        },
      });
    });

    return this.mapProductToDraftContract(product!);
  }

  /**
   * Publish a draft (validate and set status to active)
   */
  async publishDraft(id: string): Promise<Product> {
    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        autoKeyConfig: true,
        manualDeliveryConfig: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (existing.status !== 'draft') {
      throw new BadRequestException('Only draft products can be published');
    }

    // Validate required fields for publishing
    const errors: string[] = [];
    
    if (!existing.categoryId) {
      errors.push('Category is required');
    } else {
      const isValid = await this.categoriesService.validateChildCategory(existing.categoryId);
      if (!isValid) {
        errors.push('Invalid category (must be a child category)');
      }
    }

    if (!existing.title || existing.title.trim() === '') {
      errors.push('Title is required');
    }

    if (existing.priceAmount === null || existing.priceAmount === undefined) {
      errors.push('Price is required');
    } else if (existing.priceAmount < 0) {
      errors.push('Price must be non-negative');
    }

    if (!existing.currency) {
      errors.push('Currency is required');
    }

    // Validate delivery config
    if (existing.deliveryType === 'AUTO_KEY') {
      if (!existing.autoKeyConfig) {
        errors.push('Auto key delivery configuration is required');
      }
    } else if (existing.deliveryType === 'MANUAL') {
      if (!existing.manualDeliveryConfig) {
        errors.push('Manual delivery configuration is required');
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed. Cannot publish product.',
        errors,
      });
    }

    // Update to active status
    const product = await prisma.product.update({
      where: { id },
      data: {
        status: 'active',
        publishedAt: new Date(),
      },
      include: {
        autoKeyConfig: true,
        manualDeliveryConfig: true,
      },
    });

    return this.mapProductToContract(product);
  }

  /**
   * Update product status (toggle active <-> inactive)
   */
  async updateStatus(id: string, data: UpdateProductStatus): Promise<Product> {
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (existing.status === 'draft') {
      throw new BadRequestException('Cannot change status of draft products. Publish them first.');
    }

    const product = await prisma.product.update({
      where: { id },
      data: { status: data.status },
      include: {
        autoKeyConfig: true,
        manualDeliveryConfig: true,
      },
    });

    return this.mapProductToContract(product);
  }

  /**
   * Helper: Validate delivery config matches delivery type
   */
  private validateDeliveryConfig(
    deliveryType: string,
    autoKeyConfig?: any,
    manualDeliveryConfig?: any
  ): void {
    if (deliveryType === 'AUTO_KEY' && manualDeliveryConfig) {
      throw new BadRequestException(
        'Cannot provide manual delivery config for AUTO_KEY products'
      );
    }
    if (deliveryType === 'MANUAL' && autoKeyConfig) {
      throw new BadRequestException(
        'Cannot provide auto key config for MANUAL products'
      );
    }
  }

  /**
   * Helper: Map Prisma product to contract Product
   */
  private mapProductToContract(product: any): Product {
    return {
      id: product.id,
      sellerId: product.sellerId,
      status: product.status as ProductStatus,
      deliveryType: product.deliveryType,
      categoryId: product.categoryId,
      title: product.title,
      description: product.description,
      priceAmount: product.priceAmount,
      currency: product.currency,
      publishedAt: product.publishedAt?.toISOString() || null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  /**
   * Helper: Map Prisma product to contract ProductDraft (includes delivery configs)
   */
  private mapProductToDraftContract(product: any): ProductDraft {
    const base = this.mapProductToContract(product);
    
    return {
      ...base,
      autoKeyConfig: product.autoKeyConfig ? {
        keyPoolId: product.autoKeyConfig.keyPoolId,
        autoDelivery: product.autoKeyConfig.autoDelivery,
        stockAlert: product.autoKeyConfig.stockAlert,
      } : null,
      manualDeliveryConfig: product.manualDeliveryConfig ? {
        deliveryInstructions: product.manualDeliveryConfig.deliveryInstructions,
        estimatedDeliverySLA: product.manualDeliveryConfig.estimatedDeliverySLA,
      } : null,
    };
  }
}
