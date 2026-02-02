'use client';

import { Card, Badge } from '@workspace/ui';
import type { KeyPoolStats } from '@workspace/contracts';

interface KeyStatsCardProps {
  stats: KeyPoolStats;
  isOutOfStock?: boolean;
}

export function KeyStatsCard({ stats, isOutOfStock }: KeyStatsCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Key Pool Statistics</h3>
        {isOutOfStock && (
          <Badge variant="destructive">Out of Stock</Badge>
        )}
        {!isOutOfStock && stats.available > 0 && (
          <Badge variant="success">In Stock</Badge>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatBox label="Total" value={stats.total} />
        <StatBox
          label="Available"
          value={stats.available}
          variant={stats.available === 0 ? 'warning' : 'success'}
        />
        <StatBox label="Reserved" value={stats.reserved} variant="secondary" />
        <StatBox label="Delivered" value={stats.delivered} variant="muted" />
        <StatBox label="Invalid" value={stats.invalid} variant="destructive" />
      </div>
    </Card>
  );
}

function StatBox({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: number;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'muted';
}) {
  const bgClass =
    variant === 'success'
      ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900'
      : variant === 'warning'
        ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900'
        : variant === 'destructive'
          ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
          : variant === 'secondary'
            ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900'
            : 'bg-muted/50 border-border';

  return (
    <div className={`p-3 rounded-lg border ${bgClass}`}>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
