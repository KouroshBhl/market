import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { VersionModule } from './version/version.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { OpenApiModule } from './openapi/openapi.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    HealthModule,
    VersionModule,
    ProductsModule,
    CategoriesModule,
    OpenApiModule,
  ],
})
export class AppModule {}
