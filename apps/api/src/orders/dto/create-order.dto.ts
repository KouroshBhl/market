import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsObject } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Buyer ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  buyerId: string;

  @ApiProperty({
    description: 'Offer ID to purchase',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  offerId: string;

  @ApiPropertyOptional({
    description: 'Buyer-provided requirements data (keys match template field keys)',
    example: { email: 'user@example.com', username: 'myusername' },
  })
  @IsOptional()
  @IsObject()
  requirementsPayload?: Record<string, unknown>;
}
