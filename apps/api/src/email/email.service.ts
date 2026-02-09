import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PostmarkResponse {
  ErrorCode: number;
  Message: string;
  MessageID?: string;
  To?: string;
  SubmittedAt?: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private readonly postmarkToken: string | undefined;
  private readonly messageStream: string;
  private readonly from: string;
  private readonly apiBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.get<string>('POSTMARK_SERVER_TOKEN');
    this.postmarkToken = token && token.length > 0 ? token : undefined;
    this.messageStream = this.configService.get<string>('POSTMARK_MESSAGE_STREAM') || 'transactional';
    this.from = this.configService.get<string>('EMAIL_FROM') || 'VendorsGG <owner@vendorsgg.com>';
    this.apiBaseUrl =
      this.configService.get<string>('API_BASE_URL') ||
      `http://localhost:${this.configService.get<string>('PORT') || '4000'}`;
  }

  onModuleInit() {
    if (this.postmarkToken) {
      this.logger.log(`Postmark configured (From: ${this.from}, Stream: ${this.messageStream})`);
    } else {
      this.logger.warn(
        'POSTMARK_SERVER_TOKEN not set — emails will be logged to console only.',
      );
    }
  }

  /**
   * Send a verification email. Throws on failure so callers can decide
   * whether to surface or swallow the error.
   */
  async sendVerificationEmail(email: string, rawToken: string, userId: string): Promise<void> {
    const verifyUrl = `${this.apiBaseUrl}/auth/verify-email?token=${rawToken}`;

    const subject = 'Verify your email address';
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #18181b;">Verify your email</h2>
        <p style="margin: 0 0 24px; color: #3f3f46; font-size: 14px; line-height: 1.6;">
          Click the button below to verify your email address and unlock all seller features on VendorsGG.
        </p>
        <p style="margin: 0 0 24px;">
          <a href="${verifyUrl}"
             style="display: inline-block; padding: 12px 24px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
            Verify Email
          </a>
        </p>
        <p style="color: #71717a; font-size: 12px; line-height: 1.5;">
          This link expires in 30 minutes. If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `.trim();

    const textBody = `Verify your email address by visiting: ${verifyUrl}\n\nThis link expires in 30 minutes. If you didn't create an account, you can safely ignore this email.`;

    // Pre-send logging (never log rawToken)
    this.logger.log(`Preparing verification email: userId=${userId}, to=${email}`);

    if (!this.postmarkToken) {
      this.logger.log(`[DEV] No Postmark token — logging verification URL to console`);
      this.logger.log(`[DEV] Verify URL: ${verifyUrl}`);
      return;
    }

    await this.sendViaPostmark(email, subject, htmlBody, textBody);
  }

  private async sendViaPostmark(
    to: string,
    subject: string,
    htmlBody: string,
    textBody: string,
  ): Promise<void> {
    const payload = {
      From: this.from,
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: textBody,
      MessageStream: this.messageStream,
    };

    this.logger.log(`Postmark request: From=${this.from}, To=${to}, Stream=${this.messageStream}`);

    let response: Response;
    try {
      response = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': this.postmarkToken!,
        },
        body: JSON.stringify(payload),
      });
    } catch (networkError) {
      this.logger.error(`Postmark network error: ${networkError}`);
      throw new Error(`Email delivery failed: network error`);
    }

    const result = (await response.json()) as PostmarkResponse;

    this.logger.log(
      `Postmark response: HTTP ${response.status}, ErrorCode=${result.ErrorCode}, ` +
      `Message="${result.Message}", MessageID=${result.MessageID ?? 'none'}`,
    );

    if (!response.ok || result.ErrorCode !== 0) {
      const errorMsg = `Postmark send failed (HTTP ${response.status}): ` +
        `ErrorCode=${result.ErrorCode} — ${result.Message}`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.logger.log(`Verification email delivered to ${to} (MessageID: ${result.MessageID})`);
  }
}
