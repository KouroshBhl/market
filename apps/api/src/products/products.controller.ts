import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Param, 
  HttpException, 
  HttpStatus, 
  HttpCode 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ZodError } from 'zod';
import { 
  SaveProductDraftSchema, 
  UpdateProductDraftSchema,
  UpdateProductStatusSchema,
  type ProductDraft,
  type Product,
} from '@workspace/contracts';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /products
   * Get all products
   */
  @Get()
  @ApiOperation({ 
    summary: 'Get all products',
    description: 'Returns all products for the authenticated seller, sorted by creation date (newest first)'
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
          sellerId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['draft', 'active', 'inactive'] },
          deliveryType: { type: 'string', enum: ['AUTO_KEY', 'MANUAL'] },
          categoryId: { type: 'string', format: 'uuid', nullable: true },
          title: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
          priceAmount: { type: 'number', nullable: true },
          currency: { type: 'string', enum: ['USD', 'EUR', 'UAH', 'RUB', 'IRR'], nullable: true },
          publishedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  /**
   * GET /products/:id
   * Get a single product by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Returns a single product with full details including delivery configuration'
  })
  @ApiParam({ name: 'id', description: 'Product UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Product found',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async findOne(@Param('id') id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  /**
   * POST /products/draft
   * Create or save a product draft
   */
  @Post('draft')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Save a new product draft',
    description: 'Creates a new product draft. Only deliveryType and sellerId are required initially. Other fields can be added progressively through the wizard.',
  })
  @ApiBody({
    description: 'Product draft data',
    schema: {
      type: 'object',
      properties: {
        sellerId: { 
          type: 'string', 
          format: 'uuid',
          description: 'Seller UUID (required)',
          example: '00000000-0000-0000-0000-000000000001'
        },
        deliveryType: { 
          type: 'string', 
          enum: ['AUTO_KEY', 'MANUAL'],
          description: 'Type of product delivery (required)',
          example: 'AUTO_KEY'
        },
        categoryId: { 
          type: 'string', 
          format: 'uuid',
          description: 'Child category UUID (optional)',
          example: '10000000-0000-0000-0000-000000000001',
        },
        title: { 
          type: 'string',
          minLength: 1,
          maxLength: 200,
          description: 'Product title (optional)',
          example: 'World of Warcraft Gold - 1000g',
        },
        description: { 
          type: 'string',
          maxLength: 5000,
          description: 'Product description (optional)',
          example: 'Fast and secure delivery of WoW gold',
        },
        priceAmount: { 
          type: 'number',
          description: 'Price in smallest currency unit (cents) (optional)',
          example: 9999,
        },
        currency: { 
          type: 'string',
          enum: ['USD', 'EUR', 'UAH', 'RUB', 'IRR'],
          description: 'Currency (optional)',
          example: 'USD',
        },
        autoKeyConfig: {
          type: 'object',
          description: 'Auto key delivery configuration (only for AUTO_KEY products)',
          properties: {
            keyPoolId: { type: 'string', format: 'uuid', nullable: true },
            autoDelivery: { type: 'boolean', default: true },
            stockAlert: { type: 'number', nullable: true },
          },
        },
        manualDeliveryConfig: {
          type: 'object',
          description: 'Manual delivery configuration (only for MANUAL products)',
          properties: {
            deliveryInstructions: { type: 'string', maxLength: 5000, nullable: true },
            estimatedDeliverySLA: { type: 'number', description: 'Estimated delivery time in hours', nullable: true },
          },
        },
      },
      required: ['sellerId', 'deliveryType'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Product draft created successfully',
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
              path: { type: 'string', example: 'categoryId' },
              message: { type: 'string', example: 'Invalid category' },
            },
          },
        },
      },
    },
  })
  async saveDraft(@Body() body: unknown): Promise<ProductDraft> {
    try {
      const validatedData = SaveProductDraftSchema.parse(body);
      return await this.productsService.saveDraft(validatedData);
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

  /**
   * PATCH /products/:id/draft
   * Update an existing product draft
   */
  @Patch(':id/draft')
  @ApiOperation({
    summary: 'Update a product draft',
    description: 'Updates an existing draft product. Only draft status products can be updated via this endpoint.',
  })
  @ApiParam({ name: 'id', description: 'Product UUID', type: 'string' })
  @ApiBody({
    description: 'Fields to update',
    schema: {
      type: 'object',
      properties: {
        categoryId: { 
          type: 'string', 
          format: 'uuid',
          description: 'Child category UUID',
        },
        title: { 
          type: 'string',
          minLength: 1,
          maxLength: 200,
        },
        description: { 
          type: 'string',
          maxLength: 5000,
        },
        priceAmount: { 
          type: 'number',
          description: 'Price in smallest currency unit (cents)',
        },
        currency: { 
          type: 'string',
          enum: ['USD', 'EUR', 'UAH', 'RUB', 'IRR'],
        },
        autoKeyConfig: {
          type: 'object',
          properties: {
            keyPoolId: { type: 'string', format: 'uuid', nullable: true },
            autoDelivery: { type: 'boolean' },
            stockAlert: { type: 'number', nullable: true },
          },
        },
        manualDeliveryConfig: {
          type: 'object',
          properties: {
            deliveryInstructions: { type: 'string', maxLength: 5000, nullable: true },
            estimatedDeliverySLA: { type: 'number', nullable: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Draft updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or product is not a draft',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async updateDraft(
    @Param('id') id: string,
    @Body() body: unknown
  ): Promise<ProductDraft> {
    try {
      const validatedData = UpdateProductDraftSchema.parse(body);
      return await this.productsService.updateDraft(id, validatedData);
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

  /**
   * POST /products/:id/publish
   * Publish a draft product (validate and set to active)
   */
  @Post(':id/publish')
  @ApiOperation({
    summary: 'Publish a product',
    description: 'Validates all required fields and publishes a draft product by setting status to active. Required fields: categoryId (child), title, priceAmount, currency, and delivery configuration.',
  })
  @ApiParam({ name: 'id', description: 'Product UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Product published successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed - missing required fields',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Validation failed. Cannot publish product.' },
        errors: {
          type: 'array',
          items: { type: 'string' },
          example: ['Category is required', 'Title is required', 'Price is required'],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async publishDraft(@Param('id') id: string): Promise<Product> {
    return this.productsService.publishDraft(id);
  }

  /**
   * PATCH /products/:id/status
   * Toggle product status between active and inactive
   */
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update product status',
    description: 'Toggle product status between active and inactive. Cannot be used on draft products - publish them first.',
  })
  @ApiParam({ name: 'id', description: 'Product UUID', type: 'string' })
  @ApiBody({
    description: 'New status',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'inactive'],
          example: 'inactive',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot change status of draft products',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: unknown
  ): Promise<Product> {
    try {
      const validatedData = UpdateProductStatusSchema.parse(body);
      return await this.productsService.updateStatus(id, validatedData);
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
