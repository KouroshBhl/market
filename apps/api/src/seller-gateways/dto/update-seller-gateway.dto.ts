import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSellerGatewayDto {
  @ApiProperty({
    description: 'Whether to enable or disable this gateway for the seller',
    example: true,
  })
  @IsBoolean()
  isEnabled: boolean;
}
