import { ApiProperty } from '@nestjs/swagger';

export class RevealKeyResponseDto {
  @ApiProperty({
    description: 'The decrypted key code',
    example: 'XXXX-YYYY-ZZZZ-ABCD',
  })
  code: string;

  @ApiProperty({
    description: 'Key ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  keyId: string;

  @ApiProperty({
    description: 'Key status',
    example: 'AVAILABLE',
  })
  status: string;
}
