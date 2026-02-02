import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum KeyStatusFilter {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  DELIVERED = 'DELIVERED',
  INVALID = 'INVALID',
}

export class ListKeysQueryDto {
  @ApiPropertyOptional({
    description: 'Seller ID (UUID)',
  })
  @IsOptional()
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by key status',
    enum: KeyStatusFilter,
    example: 'AVAILABLE',
  })
  @IsOptional()
  @IsEnum(KeyStatusFilter)
  status?: KeyStatusFilter;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 50;
}

export class KeyListItemDto {
  @ApiProperty({
    description: 'Key ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Masked key code (last 4 characters visible)',
    example: '****ABCD',
  })
  maskedCode: string;

  @ApiProperty({
    description: 'Key status',
    enum: KeyStatusFilter,
    example: 'AVAILABLE',
  })
  status: string;

  @ApiProperty({
    description: 'When the key was uploaded',
    example: '2026-02-03T12:00:00.000Z',
  })
  createdAt: string;

  @ApiPropertyOptional({
    description: 'When the key was reserved (if applicable)',
  })
  reservedAt?: string | null;

  @ApiPropertyOptional({
    description: 'When the key was delivered (if applicable)',
  })
  deliveredAt?: string | null;
}

export class ListKeysResponseDto {
  @ApiProperty({
    description: 'List of keys with masked codes',
    type: [KeyListItemDto],
  })
  keys: KeyListItemDto[];

  @ApiProperty({
    description: 'Total count matching the filter',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 50,
  })
  pageSize: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  totalPages: number;
}
