import { Module, Global } from '@nestjs/common';
import { CryptoService } from './crypto.service';

@Global() // Make CryptoService available everywhere without importing
@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
