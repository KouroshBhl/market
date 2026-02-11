"use client";

import * as React from "react";
import { Bold, Italic, List, Link as LinkIcon } from "lucide-react";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { cn } from "../lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  id?: string;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  maxLength = 2000,
  rows = 6,
  id,
  className,
}: MarkdownEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newText);

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleBold = () => insertMarkdown("**", "**");
  const handleItalic = () => insertMarkdown("*", "*");
  const handleList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const newText =
      value.substring(0, lineStart) + "- " + value.substring(lineStart);

    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + 2, lineStart + 2);
    }, 0);
  };

  const handleLink = () => insertMarkdown("[", "](https://)");

  return (
    <div className={cn("space-y-2", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 rounded-md border border-border bg-background p-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBold}
          className="h-8 w-8 p-0"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          className="h-8 w-8 p-0"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleList}
          className="h-8 w-8 p-0"
          title="List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLink}
          className="h-8 w-8 p-0"
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">
          {value.length}/{maxLength}
        </span>
      </div>

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="font-mono text-sm"
      />

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Supports Markdown: <strong>**bold**</strong>, <em>*italic*</em>, lists, and links
      </p>
    </div>
  );
}
