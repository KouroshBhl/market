import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { VersionModule } from './version/version.module';
import { CategoriesModule } from './categories/categories.module';
import { CatalogModule } from './catalog/catalog.module';
import { OffersModule } from './offers/offers.module';
import { OpenApiModule } from './openapi/openapi.module';
import { CryptoModule } from './crypto/crypto.module';
import { KeyPoolsModule } from './key-pools/key-pools.module';
import { OrdersModule } from './orders/orders.module';
import { SettingsModule } from './settings/settings.module';
import { RequirementsModule } from './requirements/requirements.module';
import { SellerTeamModule } from './seller-team/seller-team.module';
import { PresenceModule } from './presence/presence.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { SellerGatewaysModule } from './seller-gateways/seller-gateways.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    CryptoModule, // Global module for encryption
    EmailModule, // Global module for sending emails
    AuthModule,
    HealthModule,
    VersionModule,
    CategoriesModule,
    CatalogModule,
    OffersModule,
    KeyPoolsModule,
    OrdersModule,
    SettingsModule,
    RequirementsModule,
    SellerTeamModule,
    SellerGatewaysModule,
    PresenceModule,
    OpenApiModule,
  ],
})
export class AppModule {}
