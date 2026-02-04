import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import type {
  PlatformFeeConfig,
  UpdatePlatformFee,
} from '@workspace/contracts';
import { UpdatePlatformFeeSchema } from '@workspace/contracts';

@ApiTags('Settings')
@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('settings/platform-fee')
  @ApiOperation({
    summary: 'Get platform fee configuration',
    description: 'Returns the current platform commission fee in basis points and percentage. Single-row settings table.',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform fee configuration',
    schema: {
      type: 'object',
      properties: {
        platformFeeBps: { type: 'number', example: 300, description: 'Basis points (300 = 3%)' },
        platformFeePercent: { type: 'number', example: 3.0, description: 'Percentage (3.0 = 3%)' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getPlatformFee(): Promise<PlatformFeeConfig> {
    return this.settingsService.getPlatformSettings();
  }

  @Patch('admin/settings/platform-fee')
  @ApiOperation({
    summary: 'Update platform fee configuration (Admin only)',
    description: 'Update the platform commission fee. Range: 0-5000 bps (0-50%). Requires admin authentication (stubbed for MVP).',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform fee updated successfully',
    schema: {
      type: 'object',
      properties: {
        platformFeeBps: { type: 'number', example: 350, description: 'Basis points (350 = 3.5%)' },
        platformFeePercent: { type: 'number', example: 3.5, description: 'Percentage (3.5 = 3.5%)' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid fee value (must be 0-5000 bps / 0-50%)',
  })
  async updatePlatformFee(@Body() body: unknown): Promise<PlatformFeeConfig> {
    const validated = UpdatePlatformFeeSchema.parse(body);
    return this.settingsService.updatePlatformFeeBps(validated);
  }
}
