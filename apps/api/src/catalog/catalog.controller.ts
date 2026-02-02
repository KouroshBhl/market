import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import type {
  GetCatalogProductsResponse,
  GetCatalogVariantsResponse,
} from '@workspace/contracts';

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
