'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Button,
  Label,
  Textarea,
  Badge,
  Alert,
  AlertDescription,
  toast,
} from '@workspace/ui';
import { uploadKeys } from '@/lib/api';
import type { UploadKeysResponse } from '@workspace/contracts';
import { Upload, FileText, X } from 'lucide-react';

interface KeyUploadPanelProps {
  poolId: string;
  offerId: string;
  onUploadSuccess?: () => void;
}

export function KeyUploadPanel({ poolId, offerId, onUploadSuccess }: KeyUploadPanelProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [keysText, setKeysText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadKeysResponse | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (payload: { keys?: string[]; rawText?: string }) =>
      uploadKeys(poolId, payload),
    onSuccess: (data) => {
      setUploadResult(data);
      setKeysText('');
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['key-pool', offerId] });
      queryClient.invalidateQueries({ queryKey: ['keys', poolId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Keys Uploaded',
        description: `Added ${data.added} keys`,
        variant: 'success',
      });
      onUploadSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleTextareaUpload = () => {
    const keys = keysText
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keys.length === 0) {
      toast({
        title: 'No keys entered',
        description: 'Please enter at least one key',
        variant: 'destructive',
      });
      return;
    }

    uploadMutation.mutate({ keys });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a .txt file',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      const text = await selectedFile.text();
      uploadMutation.mutate({ rawText: text });
    } catch {
      toast({
        title: 'Failed to read file',
        description: 'Could not read the selected file',
        variant: 'destructive',
      });
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const keyCount = keysText.split('\n').filter((k) => k.trim().length > 0).length;

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-foreground mb-1">Upload Keys</h3>
        <p className="text-sm text-muted-foreground">
          Add keys to your pool. Duplicates are automatically detected and skipped.
        </p>
      </div>

      {/* Textarea Upload */}
      <div className="space-y-2">
        <Label htmlFor="keys-textarea">Paste keys (one per line)</Label>
        <Textarea
          id="keys-textarea"
          className="min-h-[8rem] font-mono text-sm"
          placeholder="XXXX-XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY-YYYY&#10;ZZZZ-ZZZZ-ZZZZ-ZZZZ"
          value={keysText}
          onChange={(e) => setKeysText(e.target.value)}
          disabled={uploadMutation.isPending}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {keyCount} {keyCount === 1 ? 'key' : 'keys'} entered
          </span>
          <Button
            size="sm"
            onClick={handleTextareaUpload}
            disabled={uploadMutation.isPending || keyCount === 0}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload from text'}
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or</span>
        </div>
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label>Upload from .txt file</Label>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            <FileText className="h-4 w-4 mr-2" />
            Choose file
          </Button>
          {selectedFile && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
              <span className="text-sm">{selectedFile.name}</span>
              <button
                onClick={clearFile}
                className="text-muted-foreground hover:text-foreground"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {selectedFile && (
            <Button
              size="sm"
              onClick={handleFileUpload}
              disabled={uploadMutation.isPending}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadMutation.isPending ? 'Uploading...' : 'Upload file'}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Each line in the file will be treated as a separate key.
        </p>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <Alert>
          <AlertDescription>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-medium">Upload complete:</span>
              <Badge variant="default">{uploadResult.added} added</Badge>
              {uploadResult.duplicates > 0 && (
                <Badge variant="secondary">{uploadResult.duplicates} duplicates</Badge>
              )}
              {uploadResult.invalid > 0 && (
                <Badge variant="destructive">{uploadResult.invalid} invalid</Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
