"use client";

import { Button } from "@workspace/ui";
import type { VariantSummary } from "@/lib/api";

/** Derive the unique values for each axis from the variant list. */
function deriveAxes(variants: VariantSummary[]) {
  const regions = [...new Set(variants.map((v) => v.region))];
  const durations = [
    ...new Set(variants.map((v) => v.durationDays).filter((d): d is number => d !== null)),
  ].sort((a, b) => a - b);
  const editions = [
    ...new Set(variants.map((v) => v.edition).filter((e): e is string => e !== null)),
  ];
  return { regions, durations, editions };
}

function formatDuration(days: number): string {
  if (days <= 1) return "1 Day";
  if (days < 30) return `${days} Days`;
  if (days === 30) return "30 Days";
  if (days === 90) return "90 Days";
  if (days === 365) return "1 Year";
  return `${days} Days`;
}

export function VariantPicker({
  variants,
  selectedId,
  onSelect,
}: {
  variants: VariantSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { regions, durations, editions } = deriveAxes(variants);

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  if (!selected) return null;

  const showRegions = regions.length > 1;
  const showDurations = durations.length > 1;
  const showEditions = editions.length > 1;

  if (!showRegions && !showDurations && !showEditions) return null;

  /** Find the best matching variant when user picks a new axis value. */
  function pickVariant(
    region: string,
    duration: number | null,
    edition: string | null,
  ): string {
    const match = variants.find(
      (v) =>
        v.region === region &&
        v.durationDays === duration &&
        v.edition === edition,
    );
    if (match) return match.id;
    // Fallback: find closest match on region
    const fallback = variants.find((v) => v.region === region);
    return fallback?.id ?? variants[0]!.id;
  }

  return (
    <div className="space-y-3">
      {showRegions && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Region</p>
          <div className="flex flex-wrap gap-1.5">
            {regions.map((r) => (
              <Button
                key={r}
                variant={selected.region === r ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() =>
                  onSelect(
                    pickVariant(r, selected.durationDays, selected.edition),
                  )
                }
              >
                {r}
              </Button>
            ))}
          </div>
        </div>
      )}

      {showDurations && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Duration</p>
          <div className="flex flex-wrap gap-1.5">
            {durations.map((d) => (
              <Button
                key={d}
                variant={selected.durationDays === d ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() =>
                  onSelect(pickVariant(selected.region, d, selected.edition))
                }
              >
                {formatDuration(d)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {showEditions && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Edition</p>
          <div className="flex flex-wrap gap-1.5">
            {editions.map((e) => (
              <Button
                key={e}
                variant={selected.edition === e ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() =>
                  onSelect(
                    pickVariant(selected.region, selected.durationDays, e),
                  )
                }
              >
                {e}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
