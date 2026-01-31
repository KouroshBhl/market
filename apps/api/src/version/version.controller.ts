import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VersionResponseSchema, type VersionResponse } from '@workspace/contracts';

@ApiTags('Version')
@Controller('version')
export class VersionController {
  constructor(private configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get API version' })
  @ApiResponse({ status: 200, description: 'Returns API version information' })
  getVersion(): VersionResponse {
    const response = {
      name: this.configService.get<string>('app.name') || 'Market API',
      version: this.configService.get<string>('app.version') || '0.0.1',
    };
    VersionResponseSchema.parse(response); // Validate response
    return response;
  }
}
