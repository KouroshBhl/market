import { describe, it, expect } from '@jest/globals';
import { ALL_CONTRACTS } from '../src/contracts';
import { validateContracts, generateOpenApiSpec } from '../src/contracts/openapi';

/**
 * Contract Registry Tests
 * 
 * These tests ensure:
 * 1. All contracts are properly registered
 * 2. Contracts follow the correct structure
 * 3. OpenAPI spec can be generated without errors
 * 
 * When adding a new endpoint:
 * - If this test fails, you forgot to export your contract from contracts/index.ts
 */
describe('Contract Registry', () => {
  it('should have at least one contract registered', () => {
    expect(ALL_CONTRACTS.length).toBeGreaterThan(0);
  });

  it('should have all contracts properly structured', () => {
    const validation = validateContracts();
    
    if (!validation.valid) {
      console.error('Contract validation errors:', validation.errors);
    }
    
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should generate valid OpenAPI spec', () => {
    const spec = generateOpenApiSpec();
    
    expect(spec).toBeDefined();
    expect(spec.openapi).toBe('3.0.0');
    expect(spec.info).toBeDefined();
    expect(spec.paths).toBeDefined();
    
    // Check that all contracts are included
    const pathCount = Object.keys(spec.paths).length;
    expect(pathCount).toBe(ALL_CONTRACTS.length);
  });

  it('should have unique paths and methods', () => {
    const pathMethods = new Set<string>();
    
    for (const contract of ALL_CONTRACTS) {
      const key = `${contract.method.toUpperCase()} ${contract.path}`;
      
      if (pathMethods.has(key)) {
        throw new Error(`Duplicate contract found: ${key}`);
      }
      
      pathMethods.add(key);
    }
  });

  it('should have all contracts with responses', () => {
    for (const contract of ALL_CONTRACTS) {
      expect(contract.responses).toBeDefined();
      expect(Object.keys(contract.responses).length).toBeGreaterThan(0);
      
      // At least one 2xx response
      const has2xx = Object.keys(contract.responses).some(
        (code) => code.startsWith('2')
      );
      expect(has2xx).toBe(true);
    }
  });
});

/**
 * Individual Contract Tests
 * Add specific tests for your contracts here
 */
describe('Categories Contracts', () => {
  it('should have GET /categories contract', () => {
    const contract = ALL_CONTRACTS.find(
      (c) => c.method === 'get' && c.path === '/categories'
    );
    
    expect(contract).toBeDefined();
    expect(contract?.responses[200]).toBeDefined();
  });
});

describe('Products Contracts', () => {
  it('should have POST /products contract', () => {
    const contract = ALL_CONTRACTS.find(
      (c) => c.method === 'post' && c.path === '/products'
    );
    
    expect(contract).toBeDefined();
    expect(contract?.request?.body).toBeDefined();
    expect(contract?.responses[201]).toBeDefined();
    expect(contract?.responses[400]).toBeDefined();
  });
});
