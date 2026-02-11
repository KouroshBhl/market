import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@workspace/db';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import type { AuthUser } from '@workspace/contracts';
import { EmailService } from '../email/email.service';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn = 15 * 60; // 15 minutes in seconds
  private readonly refreshExpiresInMs = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
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
        // emailVerifiedAt is null by default
      },
    });

    // Send verification email (fire-and-forget, don't block signup)
    this.createAndSendVerification(user.id, user.email).catch((err) => {
      // Don't block signup — user can resend later. But log so we can diagnose.
      this.logger.warn(`Verification email failed on signup for userId=${user.id}: ${err?.message ?? err}`);
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
    let payload: TokenPayload;
    try {
      payload = jwt.verify(refreshToken, this.refreshSecret) as TokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

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

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

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
      include: {
        sellerProfile: true,
        sellerTeamMemberships: {
          where: { status: 'ACTIVE' },
          include: { seller: true },
          orderBy: { createdAt: 'asc' },
        },
      },
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
      hasPassword: !!user.passwordHash,
      isEmailVerified: !!user.emailVerifiedAt,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      memberships: user.sellerTeamMemberships.map((m) => ({
        sellerId: m.sellerId,
        sellerName: m.seller.displayName,
        role: m.role as 'OWNER' | 'ADMIN' | 'OPS' | 'CATALOG' | 'SUPPORT',
      })),
    };
  }

  // ============================================
  // EMAIL VERIFICATION
  // ============================================

  async createAndSendVerification(userId: string, email: string): Promise<void> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
    });

    // Let errors propagate — callers decide whether to swallow (signup) or surface (resend).
    await this.emailService.sendVerificationEmail(email, rawToken, userId);
  }

  async verifyEmail(rawToken: string): Promise<{ success: boolean; alreadyVerified?: boolean }> {
    const tokenHash = this.hashToken(rawToken);

    const token = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!token || token.expiresAt < new Date()) {
      return { success: false };
    }

    // Idempotent: if token was already used, check if user is verified
    if (token.usedAt) {
      const user = await prisma.user.findUnique({ where: { id: token.userId } });
      if (user?.emailVerifiedAt) {
        return { success: true, alreadyVerified: true };
      }
      return { success: false };
    }

    // First verification — mark token + verify user in transaction
    const user = await prisma.user.findUnique({ where: { id: token.userId } });
    const wasAlreadyVerified = !!user?.emailVerifiedAt;

    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: token.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);

    // Send confirmation email only on first-ever verification (not re-verify)
    if (!wasAlreadyVerified && user) {
      this.emailService
        .sendVerifiedConfirmationEmail(user.email)
        .catch((err) => {
          this.logger.warn(`Failed to send verification confirmation to ${user.email}: ${err?.message ?? err}`);
        });
    }

    return { success: true, alreadyVerified: false };
  }

  async resendVerification(userId: string): Promise<{ ok: true }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Already verified — return ok silently
    if (user.emailVerifiedAt) {
      return { ok: true };
    }

    // Rate limit: max 1 per 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentToken = await prisma.emailVerificationToken.findFirst({
      where: {
        userId,
        createdAt: { gt: oneMinuteAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentToken) {
      throw new ForbiddenException('Please wait 60 seconds before requesting another verification email.');
    }

    // Rate limit: max 5 per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyCount = await prisma.emailVerificationToken.count({
      where: {
        userId,
        createdAt: { gt: oneHourAgo },
      },
    });

    if (hourlyCount >= 5) {
      throw new ForbiddenException('Too many verification requests. Please try again later.');
    }

    try {
      await this.createAndSendVerification(userId, user.email);
    } catch (err) {
      this.logger.error(`Resend verification failed for userId=${userId}: ${err instanceof Error ? err.message : err}`);
      throw new BadRequestException('Could not send verification email. Please try again later.');
    }

    return { ok: true };
  }

  // ============================================
  // GOOGLE OAUTH
  // ============================================

  async handleGoogleUser(profile: {
    googleSub: string;
    email: string;
    name?: string;
  }): Promise<{ accessToken: string; expiresIn: number; refreshToken: string }> {
    let user = await prisma.user.findUnique({
      where: { googleSub: profile.googleSub },
    });

    if (!user) {
      user = await prisma.user.findUnique({ where: { email: profile.email } });
      if (user) {
        // Link Google to existing account + mark email as verified (Google verified it)
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleSub: profile.googleSub,
            name: user.name || profile.name,
            emailVerifiedAt: user.emailVerifiedAt || new Date(),
          },
        });
      } else {
        // Create new user — Google-verified email
        user = await prisma.user.create({
          data: {
            email: profile.email,
            googleSub: profile.googleSub,
            name: profile.name,
            role: 'SELLER',
            emailVerifiedAt: new Date(), // Google-verified
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

    // Generate slug from displayName
    const baseSlug = displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Ensure slug is unique by appending a number if needed
    let slug = baseSlug;
    let attempt = 1;
    while (await prisma.sellerProfile.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${attempt}`;
      attempt++;
    }

    // Create seller profile + OWNER membership in a transaction
    const profile = await prisma.$transaction(async (tx) => {
      const p = await tx.sellerProfile.create({
        data: {
          userId,
          displayName,
          slug,
        },
      });

      // Auto-create the OWNER team membership
      await tx.sellerTeamMember.create({
        data: {
          sellerId: p.id,
          userId,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      });

      return p;
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
  // SET PASSWORD (Google-only users)
  // ============================================

  async setPassword(userId: string, newPassword: string): Promise<{ ok: true }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.passwordHash) {
      throw new ConflictException('Password already set. Use change-password instead.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.revokeAllRefreshTokens(userId);

    return { ok: true };
  }

  // ============================================
  // CHANGE PASSWORD
  // ============================================

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ ok: true }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new ConflictException('No password set. Use set-password instead.');
    }

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.revokeAllRefreshTokens(userId);

    return { ok: true };
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

  private async revokeAllRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
