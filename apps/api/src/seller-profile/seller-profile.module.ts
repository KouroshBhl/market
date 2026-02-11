import { Module } from '@nestjs/common';
import { SellerProfileController } from './seller-profile.controller';
import { SellerProfileService } from './seller-profile.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SellerProfileController],
  providers: [SellerProfileService],
  exports: [SellerProfileService],
})
export class SellerProfileModule {}
