# BACKEND RULES

Single source of truth for API conventions, validation, database operations, and code standards.

---

## API Design Rules

### RESTful Conventions
```
GET    /resources          → List
GET    /resources/:id      → Get one
POST   /resources          → Create
PATCH  /resources/:id      → Update
DELETE /resources/:id      → Delete
POST   /resources/:id/action → Custom action (e.g., /publish)
```

### Response Format
```typescript
// Success
{ data: T }
// or direct object for simple responses
{ id, name, ... }

// Error
{
  statusCode: number,
  message: string,
  errors?: Array<{ path: string, message: string }>
}
```

### HTTP Status Codes
| Code | Usage |
|------|-------|
| 200 | Success (GET, PATCH, actions) |
| 201 | Created (POST) |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 500 | Server error |

---

## Validation Rules (Zod Only)

### Request Validation
```typescript
// In controller
@Post()
async create(@Body() body: unknown) {
  const validated = createSchema.parse(body);
  return this.service.create(validated);
}
```

### FORBIDDEN
- class-validator decorators
- class-transformer
- Manual validation logic

### Error Handling
```typescript
try {
  const validated = schema.parse(body);
} catch (error) {
  if (error instanceof ZodError) {
    throw new HttpException({
      statusCode: 400,
      message: 'Validation failed',
      errors: error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    }, HttpStatus.BAD_REQUEST);
  }
  throw error;
}
```

---

## Database Rules (Prisma)

### Money Handling
```typescript
// ✅ Store as Int (cents)
priceAmount Int  // 1999 = $19.99

// ❌ NEVER use Float for money
price Float
```

### Date Handling
```typescript
// In Prisma
createdAt DateTime @default(now())

// In API response - always ISO string
{
  createdAt: product.createdAt.toISOString()
}

// ❌ NEVER return Date objects to frontend
```

### UUID Generation
```prisma
id String @id @default(uuid())
```

### Column Mapping
```prisma
model Product {
  sellerId  String   @map("seller_id")
  createdAt DateTime @map("created_at")
  
  @@map("products")
}
```

### Transactions
```typescript
// For multi-table operations
await prisma.$transaction(async (tx) => {
  await tx.product.update({ ... });
  await tx.config.create({ ... });
});
```

---

## Service Layer Rules

### Structure
```typescript
@Injectable()
export class ProductsService {
  constructor(
    private readonly categoriesService: CategoriesService,
  ) {}

  // Public methods
  async findAll(): Promise<Product[]> { }
  async findOne(id: string): Promise<Product> { }
  async create(data: CreateDto): Promise<Product> { }
  
  // Private helpers
  private mapToContract(product: PrismaProduct): Product { }
  private validateDeliveryConfig(data: any): void { }
}
```

### Validation Placement
- **Input validation**: In controller (Zod parse)
- **Business validation**: In service (category is child, delivery config matches type)
- **Database constraints**: In Prisma schema (unique, foreign keys)

---

## Controller Rules

### Swagger Documentation Required
```typescript
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Success' })
  findAll() { }

  @Post()
  @ApiOperation({ summary: 'Create product' })
  @ApiBody({ schema: { ... } })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() body: unknown) { }
}
```

### Parameter Decorators
```typescript
@Get(':id')
@ApiParam({ name: 'id', description: 'Product ID' })
findOne(@Param('id') id: string) { }

@Get()
@ApiQuery({ name: 'categoryId', required: false })
findAll(@Query('categoryId') categoryId?: string) { }
```

---

## Migration Rules

### Development
```bash
# Quick iteration (no migration file)
pnpm db:push
pnpm db:generate
```

### Production
```bash
# Create migration file
pnpm prisma migrate dev --name add_feature

# Deploy to production
pnpm prisma migrate deploy
```

### Migration Best Practices
1. **Test on copy of production data** before deploying
2. **Make migrations backward compatible** when possible
   - Add columns as nullable first
   - Backfill data in separate step
   - Make required in next migration
3. **Never edit migration files** after they're applied
4. **Keep migrations small and focused**

### Rollback Strategy
```bash
# Mark failed migration as rolled back
pnpm prisma migrate resolve --rolled-back MIGRATION_NAME

# Or restore from backup (recommended for production)
```

---

## Security Rules

### Key Encryption
- Use AES-256-GCM for sensitive data
- Store encryption key in environment variable
- Never log or return raw keys in list endpoints

### Row-Level Locking
```sql
-- For atomic operations (e.g., key delivery)
SELECT ... FOR UPDATE SKIP LOCKED
```

### Access Control
- Verify sellerId matches authenticated user
- Verify buyerId for order access
- Use guards/middleware for authentication

### FORBIDDEN
- Committing `.env` files
- Logging sensitive data
- Returning raw keys in list endpoints
- Skipping ownership verification

---

## Error Handling

### Standard Pattern
```typescript
// Not found
throw new NotFoundException(`Product ${id} not found`);

// Validation
throw new BadRequestException('Invalid category. Must be child category.');

// Forbidden
throw new ForbiddenException('Not authorized to access this resource');
```

### Custom Error Messages
- Be specific: "Variant WOW-GT-EU-30D does not support auto-key delivery"
- Include IDs when helpful
- Never expose internal errors to clients

---

## Environment Validation

### Schema
```typescript
// apps/api/src/config/env.schema.ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  CORS_ORIGINS: z.string(),
  ENCRYPTION_KEY: z.string().length(64).optional(),
});
```

### Usage
```typescript
// Fails fast on startup if invalid
const env = envSchema.parse(process.env);
```

---

## Module Organization

### Feature Module Structure
```
src/
├── products/
│   ├── products.module.ts
│   ├── products.controller.ts
│   ├── products.service.ts
│   └── dto/  (if needed, but prefer contracts)
├── categories/
│   ├── categories.module.ts
│   ├── categories.controller.ts
│   └── categories.service.ts
└── app.module.ts  (imports all feature modules)
```

### Module Dependencies
```typescript
@Module({
  imports: [CategoriesModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
```

---

## Testing Strategy

### Contract Tests
```bash
pnpm test:contracts
```
- All contracts registered
- No duplicate paths/methods
- OpenAPI generates successfully

### Unit Tests
- Service methods
- Validation logic
- Business rules

### Integration Tests
- Full request/response cycle
- Database operations
- Error scenarios

---

## Quick Reference

### DO
- Use Zod for all validation
- Store money as Int (cents)
- Return dates as ISO strings
- Use transactions for multi-table operations
- Document all endpoints with Swagger decorators
- Validate environment on startup
- Use meaningful error messages

### DO NOT
- Use class-validator or class-transformer
- Use Float for money
- Return Date objects to frontend
- Skip Swagger documentation
- Commit .env files
- Log sensitive data
- Edit deployed migration files
