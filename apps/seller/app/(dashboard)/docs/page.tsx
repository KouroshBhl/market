'use client';

import { useEffect, useRef } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * API Documentation Page
 * 
 * Displays interactive Swagger UI documentation
 * Automatically stays in sync with API contracts
 */
export default function DocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className='min-h-screen bg-background'>
      <header className='border-b'>
        <div className='container mx-auto px-4 py-4'>
          <h1 className='text-2xl font-bold text-foreground'>API Documentation</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Auto-generated from API contracts • Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </header>

      <div className='container mx-auto px-4 py-6' ref={containerRef}>
        <SwaggerUI
          url={`${API_URL}/api/openapi.json`}
          docExpansion='list'
          defaultModelsExpandDepth={1}
          displayRequestDuration={true}
          filter={true}
          tryItOutEnabled={true}
        />
      </div>
    </div>
  );
}
