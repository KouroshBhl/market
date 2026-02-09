import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cookieParser = require('cookie-parser');
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookie parsing for refresh token cookies
  app.use(cookieParser());

  // Enable validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Auto-transform payloads to DTO instances
    }),
  );

  const configService = app.get(ConfigService);
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  const corsOrigins = configService.get<string[]>('cors.origins') || ['http://localhost:3000'];

  // Enable CORS - allow all origins in development for simplicity
  app.enableCors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  });

  // Swagger/OpenAPI setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get<string>('app.name') || 'Market API')
    .setDescription('Market monorepo API - Auto-generated documentation')
    .setVersion(configService.get<string>('app.version') || '1.0.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication and authorization endpoints')
    .addTag('Categories', 'Category management endpoints')
    .addTag('Products', 'Product management endpoints (Legacy)')
    .addTag('Catalog', 'Marketplace catalog endpoints')
    .addTag('Offers', 'Seller offer management endpoints')
    .addTag('Key Pools', 'Auto-Key pool management (seller-only)')
    .addTag('Orders', 'Order and fulfillment endpoints')
    .addTag('Seller Team', 'Seller team management, invites, and RBAC')
    .addTag('Presence', 'Real-time team presence (online/away/offline)')
    .addTag('Health', 'Health check endpoints')
    .addTag('Version', 'Version information endpoints')
    .addServer('http://localhost:4000', 'Development server')
    .addServer('http://localhost:4000', 'Local server')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  
  // Serve Swagger UI at /docs
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Market API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    ],
  });

  // Expose raw OpenAPI JSON at /api/openapi.json
  // This is done by creating a simple GET handler
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(document);
  });

  await app.listen(port);
  console.log(`🚀 API running on: http://localhost:${port}`);
  console.log(`📚 Swagger UI: http://localhost:${port}/docs`);
  console.log(`📄 OpenAPI JSON: http://localhost:${port}/api/openapi.json`);
}

bootstrap();
