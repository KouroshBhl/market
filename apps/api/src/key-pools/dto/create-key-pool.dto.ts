import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateKeyPoolDto {
  @ApiProperty({
    description: 'Offer ID to create key pool for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  offerId: string;
}
