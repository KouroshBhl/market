import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { EmailVerifiedGuard } from './email-verified.guard';

@Module({
  imports: [ConfigModule, PassportModule.register({ defaultStrategy: 'google' })],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, AuthGuard, RolesGuard, EmailVerifiedGuard],
  exports: [AuthService, AuthGuard, RolesGuard, EmailVerifiedGuard],
})
export class AuthModule {}
