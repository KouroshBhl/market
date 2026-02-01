import { Injectable } from '@nestjs/common';
import { prisma } from '@workspace/db';
import type { Product, CreateProduct, ProductDraft, CreateProductDraft } from '@workspace/contracts';

@Injectable()
export class ProductsService {
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
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
