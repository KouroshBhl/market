import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle(configService.get<string>('app.name') || 'Market API')
    .setDescription('Market monorepo API')
    .setVersion(configService.get<string>('app.version') || '0.0.1')
    .addTag('Health', 'Health check endpoints')
    .addTag('Version', 'Version information endpoints')
    .addTag('Products', 'Product management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  console.log(`🚀 API running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
