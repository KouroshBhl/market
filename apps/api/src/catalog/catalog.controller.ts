import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import type {
  GetCatalogProductsResponse,
  GetCatalogVariantsResponse,
} from '@workspace/contracts';
import type { ProductBySlugResponse } from '../contracts/catalog/get-product-by-slug.contract';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  @ApiOperation({
    summary: 'Get catalog products',
    description: 'List all active catalog products, optionally filtered by child category ID',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by child category ID (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of catalog products',
  })
  async getProducts(
    @Query('categoryId') categoryId?: string,
  ): Promise<GetCatalogProductsResponse> {
    return this.catalogService.getProducts(categoryId);
  }

  @Get('products/by-slug/:slug')
  @ApiOperation({
    summary: 'Get catalog product by slug',
    description: 'Returns a single active catalog product by its slug, including category info and active variants. Used by the buyer product page.',
  })
  @ApiParam({ name: 'slug', description: 'Product slug', type: String })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found or inactive' })
  async getProductBySlug(
    @Param('slug') slug: string,
  ): Promise<ProductBySlugResponse> {
    return this.catalogService.getProductBySlug(slug);
  }

  @Get('products/:productId/variants')
  @ApiOperation({
    summary: 'Get variants for a catalog product',
    description: 'List all active variants (region/duration/edition combinations) for a catalog product',
  })
  @ApiResponse({
    status: 200,
    description: 'List of catalog variants',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async getVariants(
    @Param('productId') productId: string,
  ): Promise<GetCatalogVariantsResponse> {
    return this.catalogService.getVariants(productId);
  }
}
