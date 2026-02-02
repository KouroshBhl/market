import { Module } from '@nestjs/common';
import { KeyPoolsController } from './key-pools.controller';
import { KeyPoolsService } from './key-pools.service';

@Module({
  controllers: [KeyPoolsController],
  providers: [KeyPoolsService],
  exports: [KeyPoolsService],
})
export class KeyPoolsModule {}
