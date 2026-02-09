import { Module } from '@nestjs/common';
import { SellerGatewaysController } from './seller-gateways.controller';
import { SellerGatewaysService } from './seller-gateways.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SellerGatewaysController],
  providers: [SellerGatewaysService],
  exports: [SellerGatewaysService],
})
export class SellerGatewaysModule {}
