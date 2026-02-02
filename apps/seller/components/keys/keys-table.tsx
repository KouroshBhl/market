'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  Card,
  Button,
  Badge,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
  Label,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
} from '@workspace/ui';
import { listKeys, invalidateKey, editKey, revealKey } from '@/lib/api';
import type { KeyListItem } from '@workspace/contracts';
import { Pencil, Trash2, Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface KeysTableProps {
  poolId: string;
}

type KeyStatus = 'AVAILABLE' | 'RESERVED' | 'DELIVERED' | 'INVALID';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'INVALID', label: 'Invalid' },
];

export function KeysTable({ poolId }: KeysTableProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Modal states
  const [editModal, setEditModal] = useState<{ key: KeyListItem; newCode: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<KeyListItem | null>(null);
  const [revealModal, setRevealModal] = useState<KeyListItem | null>(null);
  const [revealedCode, setRevealedCode] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['keys', poolId, statusFilter, page, pageSize],
    queryFn: () =>
      listKeys(poolId, {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        pageSize,
      }),
  });

  const invalidateMutation = useMutation({
    mutationFn: (keyId: string) => invalidateKey(poolId, keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys', poolId] });
      queryClient.invalidateQueries({ queryKey: ['key-pool'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteModal(null);
      toast({
        title: 'Key invalidated',
        description: 'The key has been marked as invalid.',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to invalidate key',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ keyId, newCode }: { keyId: string; newCode: string }) =>
      editKey(poolId, keyId, newCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys', poolId] });
      setEditModal(null);
      toast({
        title: 'Key updated',
        description: 'The key has been updated successfully.',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update key',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const revealMutation = useMutation({
    mutationFn: (keyId: string) => revealKey(poolId, keyId),
    onSuccess: (data) => {
      setRevealedCode(data.code);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to reveal key',
        description: error.message,
        variant: 'destructive',
      });
      setRevealModal(null);
    },
  });

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const canEdit = (key: KeyListItem) => key.status === 'AVAILABLE';
  const canDelete = (key: KeyListItem) => key.status === 'AVAILABLE';
  const canReveal = (key: KeyListItem) =>
    key.status === 'AVAILABLE' || key.status === 'INVALID';

  const getStatusBadge = (status: KeyStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="success">Available</Badge>;
      case 'RESERVED':
        return <Badge variant="warning">Reserved</Badge>;
      case 'DELIVERED':
        return <Badge variant="secondary">Delivered</Badge>;
      case 'INVALID':
        return <Badge variant="destructive">Invalid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const closeRevealModal = () => {
    setRevealModal(null);
    setRevealedCode(null);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Uploaded Keys</h3>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onChange={handleStatusChange}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          Failed to load keys. <Button variant="link" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : !data || data.keys.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No keys found. Upload some keys to get started.
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Masked Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-mono">{key.maskedCode}</TableCell>
                    <TableCell>{getStatusBadge(key.status as KeyStatus)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={!canReveal(key)}
                                  onClick={() => setRevealModal(key)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {canReveal(key)
                                ? 'Reveal full key'
                                : 'Cannot reveal delivered or reserved keys'}
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={!canEdit(key)}
                                  onClick={() => setEditModal({ key, newCode: '' })}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {canEdit(key)
                                ? 'Edit key'
                                : 'Only available keys can be edited'}
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={!canDelete(key)}
                                  onClick={() => setDeleteModal(key)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {canDelete(key)
                                ? 'Invalidate key'
                                : 'Only available keys can be invalidated'}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, data.total)} of {data.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Key</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Current: <span className="font-mono">{editModal.key.maskedCode}</span>
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-code">New key code</Label>
                <Input
                  id="new-code"
                  value={editModal.newCode}
                  onChange={(e) =>
                    setEditModal({ ...editModal, newCode: e.target.value })
                  }
                  placeholder="Enter new key code"
                  className="font-mono"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditModal(null)}
                  disabled={editMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    editMutation.mutate({
                      keyId: editModal.key.id,
                      newCode: editModal.newCode,
                    })
                  }
                  disabled={editMutation.isPending || !editModal.newCode.trim()}
                >
                  {editMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Invalidate Key</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to invalidate this key?
              <br />
              <span className="font-mono">{deleteModal.maskedCode}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              This action cannot be undone. The key will be marked as invalid
              and cannot be used for orders.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteModal(null)}
                disabled={invalidateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => invalidateMutation.mutate(deleteModal.id)}
                disabled={invalidateMutation.isPending}
              >
                {invalidateMutation.isPending ? 'Invalidating...' : 'Invalidate'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reveal Modal */}
      {revealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Reveal Key</h3>
            {!revealedCode ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Are you sure you want to reveal this key?
                  <br />
                  <span className="font-mono">{revealModal.maskedCode}</span>
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  This action will be logged for security purposes.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeRevealModal}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => revealMutation.mutate(revealModal.id)}
                    disabled={revealMutation.isPending}
                  >
                    {revealMutation.isPending ? 'Revealing...' : 'Reveal'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-2">Full key code:</p>
                <div className="p-3 bg-muted rounded-md font-mono text-sm break-all select-all">
                  {revealedCode}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(revealedCode);
                      toast({
                        title: 'Copied',
                        description: 'Key copied to clipboard',
                        variant: 'success',
                      });
                    }}
                  >
                    Copy
                  </Button>
                  <Button onClick={closeRevealModal}>Close</Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </Card>
  );
}
