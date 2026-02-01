import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { 
  ProductSchema, 
  CreateProductSchema, 
  ProductDraftSchema,
  CreateProductDraftSchema,
  type Product, 
  type CreateProduct,
  type ProductDraft,
  type CreateProductDraft
} from '@workspace/contracts';
import { ZodError } from 'zod';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Returns all products sorted by creation date (newest first)' })
  async findAll(): Promise<Product[]> {
    const products = await this.productsService.findAll();
    // Validate response array
    products.forEach((product) => ProductSchema.parse(product));
    return products;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({
    description: 'Product data',
    schema: {
      type: 'object',
      properties: {
        deliveryType: { type: 'string', enum: ['AUTO_KEY', 'MANUAL'], example: 'MANUAL' },
        title: { type: 'string', example: 'Premium Widget' },
        description: { type: 'string', example: 'A high-quality widget', nullable: true },
        basePrice: { type: 'number', example: 9999, description: 'Price in smallest currency unit (cents)' },
        baseCurrency: { type: 'string', enum: ['USD', 'EUR', 'UAH', 'RUB', 'IRR'], example: 'USD' },
        displayCurrency: { type: 'string', enum: ['USD', 'EUR', 'UAH', 'RUB', 'IRR'], example: 'USD' },
      },
      required: ['deliveryType', 'title', 'basePrice', 'baseCurrency', 'displayCurrency'],
    },
  })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() body: unknown): Promise<Product> {
    try {
      // Validate request body with Zod
      const validatedData: CreateProduct = CreateProductSchema.parse(body);
      
      // Create product
      const product = await this.productsService.create(validatedData);
      
      // Validate response
      ProductSchema.parse(product);
      
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

  @Post('draft')
  @ApiOperation({ summary: 'Create a product draft' })
  @ApiBody({
    description: 'Product draft data',
    schema: {
      type: 'object',
      properties: {
        deliveryType: { 
          type: 'string', 
          enum: ['AUTO_KEY', 'MANUAL'], 
          example: 'AUTO_KEY',
          description: 'Type of product delivery: AUTO_KEY for automatic key delivery, MANUAL for manual fulfillment'
        },
      },
      required: ['deliveryType'],
    },
  })
  @ApiResponse({ status: 201, description: 'Product draft created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createDraft(@Body() body: unknown): Promise<ProductDraft> {
    try {
      // Validate request body with Zod
      const validatedData: CreateProductDraft = CreateProductDraftSchema.parse(body);
      
      // Create product draft
      const draft = await this.productsService.createDraft(validatedData);
      
      // Validate response
      ProductDraftSchema.parse(draft);
      
      return draft;
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
