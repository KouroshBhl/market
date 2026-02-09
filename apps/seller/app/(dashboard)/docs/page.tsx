'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * API Documentation Page
 *
 * Renders Swagger UI via CDN in an iframe, pointing at the API's
 * auto-generated OpenAPI JSON endpoint. Zero extra dependencies.
 */
export default function DocsPage() {
  const specUrl = `${API_URL}/api/openapi.json`;

  // Inline HTML that loads Swagger UI from CDN
  const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; }
    #swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "${specUrl}",
      dom_id: '#swagger-ui',
      docExpansion: 'list',
      defaultModelsExpandDepth: 1,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    });
  </script>
</body>
</html>`.trim();

  const src = `data:text/html;charset=utf-8,${encodeURIComponent(swaggerHtml)}`;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <header className="border-b border-border px-6 py-4 shrink-0">
        <h1 className="text-2xl font-bold text-foreground">API Documentation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Auto-generated from API contracts
        </p>
      </header>

      <iframe
        src={src}
        title="API Documentation"
        className="flex-1 w-full border-0"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
