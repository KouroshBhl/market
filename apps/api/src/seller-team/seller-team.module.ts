import { Module } from '@nestjs/common';
import { SellerTeamController } from './seller-team.controller';
import { SellerTeamService } from './seller-team.service';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [AuthModule, EmailModule],
  controllers: [SellerTeamController],
  providers: [SellerTeamService],
  exports: [SellerTeamService],
})
export class SellerTeamModule {}
