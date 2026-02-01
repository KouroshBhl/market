import { Controller, Get, Header } from '@nestjs/common';
import { generateOpenApiSpec } from '../contracts/openapi';

@Controller('api')
export class OpenApiController {
  /**
   * GET /api/openapi.json
   * Returns the auto-generated OpenAPI 3.0 specification
   */
  @Get('openapi.json')
  @Header('Content-Type', 'application/json')
  @Header('Cache-Control', 'no-store')
  getOpenApiSpec() {
    return generateOpenApiSpec();
  }
}
