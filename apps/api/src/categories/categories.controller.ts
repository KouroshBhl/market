import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { getCategoriesContract, type GetCategoriesResponse } from '../contracts/categories/get-categories.contract';

/**
 * Categories Controller
 * Implements contracts defined in src/contracts/categories/
 */
@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * GET /categories
   * Contract: getCategoriesContract
   * 
   * Get all active categories grouped by parent
   * Used by sellers to select category when creating products
   */
  @Get()
  @ApiOperation({
    summary: 'Get active categories',
    description: 'Returns all active parent categories with their active children, ordered by sortOrder. Used for two-step category selection in product creation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved categories',
    schema: {
      type: 'object',
      properties: {
        parents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid', example: '00000000-0000-0000-0000-000000000001' },
              name: { type: 'string', example: 'Games' },
              slug: { type: 'string', example: 'games' },
              sortOrder: { type: 'number', example: 10 },
              children: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid', example: '10000000-0000-0000-0000-000000000001' },
                    name: { type: 'string', example: 'World of Warcraft' },
                    slug: { type: 'string', example: 'world-of-warcraft' },
                    sortOrder: { type: 'number', example: 10 },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async getActiveCategories(): Promise<GetCategoriesResponse> {
    // The contract ensures type safety
    const result = await this.categoriesService.getActiveCategories();
    
    // Return matches the contract's response schema
    return {
      parents: result.parents,
    };
  }
}
