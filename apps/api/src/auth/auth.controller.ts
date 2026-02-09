import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard as GoogleAuthGuard } from '@nestjs/passport';
import { ZodError } from 'zod';
import { ConfigService } from '@nestjs/config';
import {
  SignupRequestSchema,
  LoginRequestSchema,
  SellerSetupRequestSchema,
  ExchangeCodeRequestSchema,
} from '@workspace/contracts';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

const REFRESH_COOKIE_NAME = 'refresh_token';

function setCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };
}

function handleZodError(error: unknown): never {
  if (error instanceof ZodError) {
    throw new HttpException(
      {
        statusCode: 400,
        message: 'Validation failed',
        errors: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
      HttpStatus.BAD_REQUEST,
    );
  }
  throw error;
}

@ApiTags('Auth')
@Controller()
export class AuthController {
  private readonly isProduction: boolean;
  private readonly sellerAppUrl: string;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    this.sellerAppUrl =
      this.configService.get<string>('SELLER_APP_URL') || 'http://localhost:3002';
  }

  // ============================================
  // SIGNUP
  // ============================================

  @Post('auth/signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register with email and password' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Signup successful, tokens returned' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async signup(@Body() body: unknown, @Res({ passthrough: true }) res: any) {
    let validated;
    try {
      validated = SignupRequestSchema.parse(body);
    } catch (error) {
      handleZodError(error);
    }

    const { accessToken, expiresIn, refreshToken } = await this.authService.signup(
      validated.email,
      validated.password,
    );

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, setCookieOptions(this.isProduction));

    return { accessToken, expiresIn };
  }

  // ============================================
  // LOGIN
  // ============================================

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Login successful, tokens returned' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: any) {
    let validated;
    try {
      validated = LoginRequestSchema.parse(body);
    } catch (error) {
      handleZodError(error);
    }

    const { accessToken, expiresIn, refreshToken } = await this.authService.login(
      validated.email,
      validated.password,
    );

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, setCookieOptions(this.isProduction));

    return { accessToken, expiresIn };
  }

  // ============================================
  // REFRESH
  // ============================================

  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({ status: 200, description: 'New access token returned' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      throw new HttpException(
        { statusCode: 401, message: 'No refresh token provided' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const { accessToken, expiresIn, refreshToken: newRefreshToken } =
      await this.authService.refresh(refreshToken);

    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, setCookieOptions(this.isProduction));

    return { accessToken, expiresIn };
  }

  // ============================================
  // LOGOUT
  // ============================================

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/auth' });

    return { success: true };
  }

  // ============================================
  // ME
  // ============================================

  @Get('auth/me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user info' })
  @ApiResponse({ status: 200, description: 'Current user info' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@Req() req: any) {
    const user = await this.authService.getMe(req.user.userId);
    return { user };
  }

  // ============================================
  // GOOGLE OAUTH
  // ============================================

  @Get('auth/google/start')
  @UseGuards(GoogleAuthGuard('google'))
  @ApiOperation({ summary: 'Start Google OAuth flow (redirects to Google)' })
  @ApiResponse({ status: 302, description: 'Redirects to Google consent screen' })
  async googleStart() {
    // Passport handles the redirect
  }

  @Get('auth/google/callback')
  @UseGuards(GoogleAuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to seller app with auth code' })
  async googleCallback(@Req() req: any, @Res() res: any) {
    const googleUser = req.user;

    const tokens = await this.authService.handleGoogleUser({
      googleSub: googleUser.googleSub,
      email: googleUser.email,
      name: googleUser.name,
    });

    // Create a one-time auth code
    const payload = this.authService.verifyAccessToken(tokens.accessToken);
    const code = await this.authService.createAuthCode(payload.sub);

    // Redirect to seller app with the code
    const redirectUrl = `${this.sellerAppUrl}/auth/callback?code=${code}`;
    res.redirect(redirectUrl);
  }

  // ============================================
  // EXCHANGE CODE
  // ============================================

  @Post('auth/exchange-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange one-time auth code for tokens' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['code'],
      properties: {
        code: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Tokens returned' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async exchangeCode(@Body() body: unknown, @Res({ passthrough: true }) res: any) {
    let validated;
    try {
      validated = ExchangeCodeRequestSchema.parse(body);
    } catch (error) {
      handleZodError(error);
    }

    const { accessToken, expiresIn, refreshToken } = await this.authService.exchangeCode(
      validated.code,
    );

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, setCookieOptions(this.isProduction));

    return { accessToken, expiresIn };
  }

  // ============================================
  // SELLER SETUP
  // ============================================

  @Post('seller/setup')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create seller profile (onboarding)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['displayName'],
      properties: {
        displayName: { type: 'string', minLength: 2, maxLength: 100 },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Seller profile created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Seller profile already exists' })
  @HttpCode(HttpStatus.CREATED)
  async sellerSetup(@Req() req: any, @Body() body: unknown) {
    let validated;
    try {
      validated = SellerSetupRequestSchema.parse(body);
    } catch (error) {
      handleZodError(error);
    }

    return this.authService.setupSeller(req.user.userId, validated.displayName);
  }
}
