import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@workspace/db';
import type { Product, CreateProduct, ProductDraft, CreateProductDraft, UpdateProductDraft } from '@workspace/contracts';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ProductsService {
  constructor(private readonly categoriesService: CategoriesService) {}

  async findAll(): Promise<Product[]> {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Convert Date objects to ISO strings to match contract
    return products.map((product) => ({
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }));
  }

  async create(data: CreateProduct): Promise<Product> {
    const product = await prisma.product.create({
      data: {
        status: 'PUBLISHED',
        deliveryType: data.deliveryType,
        title: data.title,
        description: data.description || null,
        basePrice: data.basePrice,
        baseCurrency: data.baseCurrency,
        displayCurrency: data.displayCurrency,
      },
    });

    // Convert Date objects to ISO strings to match contract
    return {
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  /**
   * Create a product from contract (supports both DRAFT and PUBLISHED)
   */
  async createFromContract(data: any): Promise<any> {
    // Validate category if provided
    if (data.categoryId) {
      const isValid = await this.categoriesService.validateChildCategory(data.categoryId);
      if (!isValid) {
        throw new BadRequestException(
          'Invalid category. Products must reference an active child category (not a parent category).'
        );
      }
    }

    const product = await prisma.product.create({
      data: {
        status: data.status || 'DRAFT',
        deliveryType: data.deliveryType,
        categoryId: data.categoryId || null,
        title: data.title || null,
        description: data.description || null,
        basePrice: data.basePrice || null,
        baseCurrency: data.baseCurrency || null,
        displayCurrency: data.displayCurrency || null,
      },
    });

    // Convert Date objects to ISO strings to match contract
    return {
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  async createDraft(data: CreateProductDraft): Promise<ProductDraft> {
    const product = await prisma.product.create({
      data: {
        status: 'DRAFT',
        deliveryType: data.deliveryType,
      },
    });

    // Convert Date objects to ISO strings to match contract
    return {
      id: product.id,
      status: product.status,
      deliveryType: product.deliveryType,
      categoryId: product.categoryId,
      title: product.title,
      description: product.description,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  async getDraft(id: string): Promise<ProductDraft> {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product draft with ID ${id} not found`);
    }

    return {
      id: product.id,
      status: product.status,
      deliveryType: product.deliveryType,
      categoryId: product.categoryId,
      title: product.title,
      description: product.description,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  async updateDraft(id: string, data: UpdateProductDraft): Promise<ProductDraft> {
    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Product draft with ID ${id} not found`);
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

    // Update the draft
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });

    return {
      id: product.id,
      status: product.status,
      deliveryType: product.deliveryType,
      categoryId: product.categoryId,
      title: product.title,
      description: product.description,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
