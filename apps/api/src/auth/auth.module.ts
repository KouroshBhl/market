import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { EmailVerifiedGuard } from './email-verified.guard';
import { SellerMemberGuard } from './seller-member.guard';
import { SellerPermissionGuard } from './seller-permission.guard';

@Module({
  imports: [ConfigModule, PassportModule.register({ defaultStrategy: 'google' })],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    AuthGuard,
    RolesGuard,
    EmailVerifiedGuard,
    SellerMemberGuard,
    SellerPermissionGuard,
  ],
  exports: [
    AuthService,
    AuthGuard,
    RolesGuard,
    EmailVerifiedGuard,
    SellerMemberGuard,
    SellerPermissionGuard,
  ],
})
export class AuthModule {}
