import { ApiProperty } from '@nestjs/swagger';

export class KeyPoolStatsDto {
  @ApiProperty({
    description: 'Total number of keys in the pool',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Number of available keys (ready to sell)',
    example: 50,
  })
  available: number;

  @ApiProperty({
    description: 'Number of reserved keys (pending delivery)',
    example: 5,
  })
  reserved: number;

  @ApiProperty({
    description: 'Number of delivered keys (fulfilled orders)',
    example: 40,
  })
  delivered: number;

  @ApiProperty({
    description: 'Number of invalid keys (soft-deleted)',
    example: 5,
  })
  invalid: number;
}
