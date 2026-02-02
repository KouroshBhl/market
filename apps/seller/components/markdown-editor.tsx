'use client';

import { Label, Textarea } from '@workspace/ui';
import { MarkdownPreview } from './markdown-preview';

const PLACEHOLDER = `Add your offer description here! ✨

**Bold text** and _italic_ are supported.
- Bullet lists
- Work great

Headings and emojis 🎮 🔑 ✅`;

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  maxLength?: number;
  disabled?: boolean;
  'data-testid'?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  label = 'Description',
  helperText = 'Supports **bold**, _italic_, lists, headings, and emojis.',
  maxLength = 5000,
  disabled = false,
  'data-testid': dataTestId,
}: MarkdownEditorProps) {
  const trimmed = value?.trim() ?? '';
  const charCount = trimmed.length;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="markdown-editor">{label}</Label>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Textarea
              id="markdown-editor"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={PLACEHOLDER}
              maxLength={maxLength}
              disabled={disabled}
              className="min-h-[200px] font-mono text-sm"
              data-testid={dataTestId}
            />
            <p className="text-xs text-muted-foreground">
              {helperText}
            </p>
            <p className="text-xs text-muted-foreground">
              {charCount} / {maxLength} characters
            </p>
          </div>
          <div className="border border-border rounded-md p-4 bg-card min-h-[200px]">
            <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
            <MarkdownPreview content={value} />
          </div>
        </div>
      </div>
    </div>
  );
}
