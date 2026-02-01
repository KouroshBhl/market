import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  type RouteConfig,
} from '@asteasolutions/zod-to-openapi';
import { ALL_CONTRACTS } from './index';
import type { ApiContract } from './base';

/**
 * Generate OpenAPI 3.0 specification from contracts
 */
export function generateOpenApiSpec() {
  const registry = new OpenAPIRegistry();

  // Register all contracts
  for (const contract of ALL_CONTRACTS) {
    registerContract(registry, contract);
  }

  // Generate the OpenAPI document
  const generator = new OpenApiGeneratorV3(registry.definitions);
  
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Marketplace API',
      version: '1.0.0',
      description: 'API for the marketplace platform. All endpoints follow a contract-first design using Zod schemas.',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:4000',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Categories',
        description: 'Category management endpoints',
      },
      {
        name: 'Products',
        description: 'Product management endpoints',
      },
    ],
  });
}

/**
 * Register a single contract with the OpenAPI registry
 */
function registerContract(registry: OpenAPIRegistry, contract: ApiContract): void {
  const routeConfig: RouteConfig = {
    method: contract.method,
    path: contract.path,
    tags: contract.tags,
    summary: contract.summary,
    description: contract.description,
    request: {},
    responses: {},
  };

  // Add request schemas if they exist
  if (contract.request?.params) {
    routeConfig.request.params = contract.request.params as any;
  }
  if (contract.request?.query) {
    routeConfig.request.query = contract.request.query as any;
  }
  if (contract.request?.body) {
    routeConfig.request.body = {
      content: {
        'application/json': {
          schema: contract.request.body,
        },
      },
    };
  }

  // Add response schemas
  for (const [statusCode, response] of Object.entries(contract.responses)) {
    routeConfig.responses[statusCode] = {
      description: response.description,
      content: {
        'application/json': {
          schema: response.schema,
        },
      },
    };
  }

  registry.registerPath(routeConfig);
}

/**
 * Validate that all contracts are properly registered
 * Useful for testing to ensure no contracts are missed
 */
export function validateContracts(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (ALL_CONTRACTS.length === 0) {
    errors.push('No contracts registered! Check contracts/index.ts');
  }

  for (const contract of ALL_CONTRACTS) {
    if (!contract.method) {
      errors.push(`Contract missing method: ${contract.path}`);
    }
    if (!contract.path) {
      errors.push(`Contract missing path`);
    }
    if (!contract.responses || Object.keys(contract.responses).length === 0) {
      errors.push(`Contract missing responses: ${contract.path}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
