import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID') || 'not-set';
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET') || 'not-set';
    const callbackURL =
      configService.get<string>('GOOGLE_CALLBACK_URL') ||
      'http://localhost:4000/auth/google/callback';

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: { id: string; emails?: Array<{ value: string }>; displayName?: string },
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('No email found in Google profile'), undefined);
      return;
    }

    const user = {
      googleSub: profile.id,
      email,
      name: profile.displayName,
    };

    done(null, user);
  }
}
