import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize, ArrayMaxSize, MaxLength, MinLength } from 'class-validator';

export class UploadKeysDto {
  @ApiProperty({
    description: 'Array of key codes to upload (one per element)',
    example: ['KEY-ABC123', 'KEY-DEF456', 'KEY-GHI789'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one key is required' })
  @ArrayMaxSize(1000, { message: 'Maximum 1000 keys per upload' })
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  keys: string[];
}
