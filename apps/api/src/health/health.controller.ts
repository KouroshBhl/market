import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthResponseSchema, type HealthResponse } from '@workspace/contracts';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check(): HealthResponse {
    const response = { ok: true };
    HealthResponseSchema.parse(response); // Validate response
    return response;
  }
}
