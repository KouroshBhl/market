import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { SellerOrdersController } from './seller-orders.controller';
import { OrdersService } from './orders.service';
import { KeyPoolsModule } from '../key-pools/key-pools.module';
import { RequirementsModule } from '../requirements/requirements.module';
import { CryptoModule } from '../crypto/crypto.module';
import { SellerTeamModule } from '../seller-team/seller-team.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, KeyPoolsModule, RequirementsModule, CryptoModule, SellerTeamModule],
  controllers: [OrdersController, SellerOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
