import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { KeyPoolsModule } from '../key-pools/key-pools.module';
import { RequirementsModule } from '../requirements/requirements.module';
import { CryptoModule } from '../crypto/crypto.module';

@Module({
  imports: [KeyPoolsModule, RequirementsModule, CryptoModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
