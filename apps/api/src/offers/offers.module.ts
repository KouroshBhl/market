import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { CatalogModule } from '../catalog/catalog.module';
import { KeyPoolsModule } from '../key-pools/key-pools.module';

@Module({
  imports: [CatalogModule, KeyPoolsModule],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
