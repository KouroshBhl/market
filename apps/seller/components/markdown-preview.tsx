'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

/**
 * Safe Markdown rendering - NO dangerouslySetInnerHTML.
 * Uses react-markdown for secure parsing and rendering.
 */
export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  if (!content?.trim()) {
    return (
      <p className={`text-muted-foreground text-sm italic ${className}`}>
        Preview will appear here…
      </p>
    );
  }

  return (
    <div
      className={`text-foreground text-sm [&_p]:mb-2 [&_ul]:list-disc [&_ul]:list-inside [&_ol]:list-decimal [&_ol]:list-inside [&_strong]:font-semibold [&_em]:italic ${className}`}
      data-testid="markdown-preview"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Use semantic elements, avoid raw HTML
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-medium mt-2 mb-1">{children}</h3>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
