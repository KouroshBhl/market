import { Module } from '@nestjs/common';
import { SellerTeamController } from './seller-team.controller';
import { SellerTeamService } from './seller-team.service';

@Module({
  controllers: [SellerTeamController],
  providers: [SellerTeamService],
  exports: [SellerTeamService],
})
export class SellerTeamModule {}
