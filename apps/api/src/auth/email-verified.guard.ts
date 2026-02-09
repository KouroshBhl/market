import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { prisma } from '@workspace/db';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('Not authenticated');
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { emailVerifiedAt: true },
    });

    if (!dbUser || !dbUser.emailVerifiedAt) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Email not verified. Please verify your email to perform this action.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    return true;
  }
}
