import { Module } from '@nestjs/common';
import { KeyPoolsController } from './key-pools.controller';
import { KeyPoolsService } from './key-pools.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [KeyPoolsController],
  providers: [KeyPoolsService],
  exports: [KeyPoolsService],
})
export class KeyPoolsModule {}
