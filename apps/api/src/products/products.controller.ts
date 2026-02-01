import { Controller, Get, Post, Patch, Body, Param, HttpException, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ZodError } from 'zod';
import type { 
  CreateProductRequest,
  CreateProductResponse,
} from '../contracts/products/create-product.contract';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all products',
    description: 'Returns all products sorted by creation date (newest first)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved products',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED'] },
          deliveryType: { type: 'string', enum: ['AUTO_KEY', 'MANUAL'] },
          categoryId: { type: 'string', format: 'uuid', nullable: true },
          title: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
          basePrice: { type: 'number', nullable: true },
          baseCurrency: { type: 'string', nullable: true },
          displayCurrency: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async findAll() {
    return this.productsService.findAll();
  }

  /**
   * POST /products
   * Contract: createProductContract
   * 
   * Create a new product (draft or published)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a product',
    description: 'Creates a new product. Can be created as DRAFT (default) or PUBLISHED. For DRAFT, only deliveryType is required. For PUBLISHED, all fields must be provided and valid.',
  })
  @ApiBody({
    description: 'Product creation data',
    schema: {
      type: 'object',
      properties: {
        deliveryType: { 
          type: 'string', 
          enum: ['AUTO_KEY', 'MANUAL'],
          description: 'Type of product delivery',
          example: 'AUTO_KEY'
        },
        status: { 
          type: 'string', 
          enum: ['DRAFT', 'PUBLISHED'],
          description: 'Product status - defaults to DRAFT',
          default: 'DRAFT',
          example: 'DRAFT'
        },
        categoryId: { 
          type: 'string', 
          format: 'uuid',
          description: 'Category ID (must be a child category)',
          example: '10000000-0000-0000-0000-000000000001',
        },
        title: { 
          type: 'string',
          minLength: 1,
          maxLength: 200,
          description: 'Product title',
          example: 'World of Warcraft Gold - 1000g',
        },
        description: { 
          type: 'string',
          maxLength: 5000,
          description: 'Product description',
          example: 'Fast and secure delivery of WoW gold',
        },
        basePrice: { 
          type: 'number',
          description: 'Price in smallest currency unit (cents)',
          example: 9999,
        },
        baseCurrency: { 
          type: 'string',
          enum: ['USD', 'EUR', 'UAH', 'RUB', 'IRR'],
          example: 'USD',
        },
        displayCurrency: { 
          type: 'string',
          enum: ['USD', 'EUR', 'UAH', 'RUB', 'IRR'],
          example: 'USD',
        },
      },
      required: ['deliveryType'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: { type: 'string', enum: ['DRAFT', 'PUBLISHED'] },
        deliveryType: { type: 'string', enum: ['AUTO_KEY', 'MANUAL'] },
        categoryId: { type: 'string', format: 'uuid', nullable: true },
        title: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
        basePrice: { type: 'number', nullable: true },
        baseCurrency: { type: 'string', nullable: true },
        displayCurrency: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Validation failed' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string', example: 'title' },
              message: { type: 'string', example: 'Title is required' },
            },
          },
        },
      },
    },
  })
  async create(@Body() body: unknown): Promise<any> {
    try {
      // Import contract for validation
      const { createProductContract } = await import('../contracts/products/create-product.contract');
      
      // Validate request body using contract schema
      const validatedData = createProductContract.request.body.parse(body);
      
      // Business logic
      const product = await this.productsService.createFromContract(validatedData);
      
      // Return matches contract response schema
      return product;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Validation failed',
            errors: error.errors.map((err) => ({
              path: err.path.join('.'),
              message: err.message,
            })),
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
  }

}
