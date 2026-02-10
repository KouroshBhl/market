import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { PublicOffersController } from './public-offers.controller';
import { PublicOffersService } from './public-offers.service';
import { CatalogModule } from '../catalog/catalog.module';
import { KeyPoolsModule } from '../key-pools/key-pools.module';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, CatalogModule, KeyPoolsModule, SettingsModule],
  controllers: [OffersController, PublicOffersController],
  providers: [OffersService, PublicOffersService],
  exports: [OffersService],
})
export class OffersModule {}
