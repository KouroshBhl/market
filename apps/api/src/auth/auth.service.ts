import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@workspace/db';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import type { AuthUser, AuthTokensResponse } from '@workspace/contracts';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn = 15 * 60; // 15 minutes in seconds
  private readonly refreshExpiresInMs = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

  constructor(private readonly configService: ConfigService) {
    this.accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') || 'dev-access-secret-change-me';
    this.refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev-refresh-secret-change-me';
  }

  // ============================================
  // SIGNUP
  // ============================================

  async signup(email: string, password: string): Promise<{ accessToken: string; expiresIn: number; refreshToken: string }> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'SELLER',
      },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  // ============================================
  // LOGIN
  // ============================================

  async login(email: string, password: string): Promise<{ accessToken: string; expiresIn: number; refreshToken: string }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  // ============================================
  // REFRESH
  // ============================================

  async refresh(refreshToken: string): Promise<{ accessToken: string; expiresIn: number; refreshToken: string }> {
    // Verify the JWT structure of the refresh token
    let payload: TokenPayload;
    try {
      payload = jwt.verify(refreshToken, this.refreshSecret) as TokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check the hashed token in DB
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Issue new tokens
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  // ============================================
  // LOGOUT
  // ============================================

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;

    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
    });

    if (storedToken) {
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  // ============================================
  // ME
  // ============================================

  async getMe(userId: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { sellerProfile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as AuthUser['role'],
      sellerId: user.sellerProfile?.id ?? null,
      displayName: user.sellerProfile?.displayName ?? null,
    };
  }

  // ============================================
  // GOOGLE OAUTH
  // ============================================

  async handleGoogleUser(profile: {
    googleSub: string;
    email: string;
    name?: string;
  }): Promise<{ accessToken: string; expiresIn: number; refreshToken: string }> {
    // Check if user exists with this googleSub
    let user = await prisma.user.findUnique({
      where: { googleSub: profile.googleSub },
    });

    if (!user) {
      // Check if email already exists (link google to existing account)
      user = await prisma.user.findUnique({ where: { email: profile.email } });
      if (user) {
        // Link Google to existing account
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleSub: profile.googleSub, name: user.name || profile.name },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: profile.email,
            googleSub: profile.googleSub,
            name: profile.name,
            role: 'SELLER',
          },
        });
      }
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  // ============================================
  // AUTH CODE (for OAuth redirect flow)
  // ============================================

  async createAuthCode(userId: string): Promise<string> {
    const code = crypto.randomBytes(32).toString('hex');
    const codeHash = this.hashToken(code);

    await prisma.authCode.create({
      data: {
        userId,
        codeHash,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
      },
    });

    return code;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; expiresIn: number; refreshToken: string }> {
    const codeHash = this.hashToken(code);

    const authCode = await prisma.authCode.findUnique({
      where: { codeHash },
    });

    if (!authCode) {
      throw new BadRequestException('Invalid or expired code');
    }

    if (authCode.usedAt) {
      throw new BadRequestException('Code already used');
    }

    if (authCode.expiresAt < new Date()) {
      throw new BadRequestException('Code expired');
    }

    // Mark code as used
    await prisma.authCode.update({
      where: { id: authCode.id },
      data: { usedAt: new Date() },
    });

    const user = await prisma.user.findUnique({ where: { id: authCode.userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  // ============================================
  // SELLER SETUP
  // ============================================

  async setupSeller(userId: string, displayName: string) {
    const existing = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('Seller profile already exists');
    }

    const profile = await prisma.sellerProfile.create({
      data: {
        userId,
        displayName,
      },
    });

    return {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  // ============================================
  // TOKEN VERIFICATION (used by guard)
  // ============================================

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.accessSecret) as TokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; expiresIn: number; refreshToken: string }> {
    const payload: TokenPayload = { sub: userId, email, role };

    const accessToken = jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiresIn,
    });

    const refreshToken = jwt.sign(payload, this.refreshSecret, {
      expiresIn: '30d',
    });

    // Store hashed refresh token in DB
    const tokenHash = this.hashToken(refreshToken);
    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + this.refreshExpiresInMs),
      },
    });

    return {
      accessToken,
      expiresIn: this.accessExpiresIn,
      refreshToken,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
