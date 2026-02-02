import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  MinLength,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class UploadKeysDto {
  @ApiPropertyOptional({
    description: 'Array of key codes to upload (one per element). Either keys or rawText is required.',
    example: ['KEY-ABC123', 'KEY-DEF456', 'KEY-GHI789'],
    type: [String],
  })
  @ValidateIf((o) => !o.rawText)
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one key is required' })
  @ArrayMaxSize(1000, { message: 'Maximum 1000 keys per upload' })
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  keys?: string[];

  @ApiPropertyOptional({
    description: 'Raw text with keys separated by newlines. Either keys or rawText is required.',
    example: 'KEY-ABC123\nKEY-DEF456\nKEY-GHI789',
  })
  @ValidateIf((o) => !o.keys || o.keys.length === 0)
  @IsOptional()
  @IsString()
  @MaxLength(500000, { message: 'Raw text is too large (max 500KB)' })
  rawText?: string;
}

export class UploadKeysResponseDto {
  @ApiProperty({
    description: 'Number of keys successfully added',
    example: 10,
  })
  added: number;

  @ApiProperty({
    description: 'Number of duplicate keys skipped (already exist in any pool)',
    example: 2,
  })
  duplicates: number;

  @ApiProperty({
    description: 'Number of invalid keys skipped (empty, too long, etc.)',
    example: 1,
  })
  invalid: number;

  @ApiProperty({
    description: 'Total available keys in the pool after upload',
    example: 50,
  })
  totalAvailable: number;
}
