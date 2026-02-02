import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class EditKeyDto {
  @ApiProperty({
    description: 'New key code value (will be encrypted at rest)',
    example: 'NEW-KEY-CODE-1234',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @MinLength(1, { message: 'Key code cannot be empty' })
  @MaxLength(500, { message: 'Key code is too long (max 500 characters)' })
  code: string;
}

export class EditKeyResponseDto {
  @ApiProperty({
    description: 'Whether the edit was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Key ID that was edited',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  keyId: string;

  @ApiProperty({
    description: 'New masked code (last 4 characters visible)',
    example: '****1234',
  })
  maskedCode: string;
}
