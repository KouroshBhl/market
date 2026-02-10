"use client";

import { Button, Badge } from "@workspace/ui";
import type { VariantSummary } from "@/lib/api";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function formatDuration(days: number): string {
  if (days <= 1) return "1 Day";
  if (days === 30) return "30 Days";
  if (days === 90) return "90 Days";
  if (days === 365) return "1 Year";
  return `${days} Days`;
}

function uniqueRegions(variants: VariantSummary[]): string[] {
  return [...new Set(variants.map((v) => v.region))];
}

function uniqueDurations(variants: VariantSummary[]): number[] {
  return [
    ...new Set(
      variants.map((v) => v.durationDays).filter((d): d is number => d !== null),
    ),
  ].sort((a, b) => a - b);
}

function uniqueEditions(variants: VariantSummary[]): string[] {
  return [
    ...new Set(
      variants.map((v) => v.edition).filter((e): e is string => e !== null),
    ),
  ];
}

/** Find the exact variant matching the combination. */
function findVariant(
  variants: VariantSummary[],
  region: string,
  duration: number | null,
  edition: string | null,
): VariantSummary | undefined {
  return variants.find(
    (v) =>
      v.region === region &&
      v.durationDays === duration &&
      v.edition === edition,
  );
}

/** Find the first available variant for a given region (any duration). */
function findAvailableForRegion(
  variants: VariantSummary[],
  region: string,
): VariantSummary | undefined {
  return variants.find((v) => v.region === region && v.offerCount > 0);
}

/** Find the first available variant for a given duration (any region). */
function findAvailableForDuration(
  variants: VariantSummary[],
  duration: number,
): VariantSummary | undefined {
  return variants.find((v) => v.durationDays === duration && v.offerCount > 0);
}

/* -------------------------------------------------------------------------- */
/*  Component — always-visible segmented controls (2 rows)                    */
/* -------------------------------------------------------------------------- */

export function VariantPicker({
  variants,
  selectedId,
  onSelect,
}: {
  variants: VariantSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (variants.length <= 1) return null;

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  if (!selected) return null;

  const regions = uniqueRegions(variants);
  const durations = uniqueDurations(variants);
  const editions = uniqueEditions(variants);

  const showRegion = regions.length > 1;
  const showDuration = durations.length > 1;
  const showEdition = editions.length > 1;

  if (!showRegion && !showDuration && !showEdition) return null;

  function handleRegionClick(region: string) {
    if (!selected) return;
    let match = findVariant(variants, region, selected.durationDays, selected.edition);
    if (!match || match.offerCount === 0) {
      match = findAvailableForRegion(variants, region);
    }
    if (!match) {
      match = variants.find((v) => v.region === region);
    }
    if (match) onSelect(match.id);
  }

  function handleDurationClick(days: number) {
    if (!selected) return;
    let match = findVariant(variants, selected.region, days, selected.edition);
    if (!match || match.offerCount === 0) {
      match = findAvailableForDuration(variants, days);
    }
    if (!match) {
      match = variants.find((v) => v.durationDays === days);
    }
    if (match) onSelect(match.id);
  }

  function handleEditionClick(edition: string) {
    if (!selected) return;
    let match = findVariant(variants, selected.region, selected.durationDays, edition);
    if (!match) {
      match = variants.find((v) => v.edition === edition && v.offerCount > 0);
    }
    if (!match) {
      match = variants.find((v) => v.edition === edition);
    }
    if (match) onSelect(match.id);
  }

  return (
    <div className="space-y-3">
      {showRegion && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Region</p>
          <div className="flex flex-wrap gap-2">
            {regions.map((r) => {
              const isSelected = selected.region === r;
              // Check if this region has ANY offers across all durations
              const hasOffers = variants.some(
                (v) => v.region === r && v.offerCount > 0,
              );

              return (
                <Button
                  key={r}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="text-sm min-w-[80px]"
                  disabled={!hasOffers}
                  onClick={() => handleRegionClick(r)}
                >
                  {r}
                  {!hasOffers && (
                    <Badge
                      variant="outline"
                      className="ml-2 text-[9px] px-1 py-0"
                    >
                      No offers
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {showDuration && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Duration</p>
          <div className="flex flex-wrap gap-2">
            {durations.map((d) => {
              const isSelected = selected.durationDays === d;
              // Check if the current region + this duration has offers
              const combo = findVariant(
                variants,
                selected.region,
                d,
                selected.edition,
              );
              const hasOffers = combo ? combo.offerCount > 0 : false;

              return (
                <Button
                  key={d}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="text-sm min-w-[80px]"
                  disabled={!hasOffers}
                  onClick={() => handleDurationClick(d)}
                >
                  {formatDuration(d)}
                  {!hasOffers && (
                    <Badge
                      variant="outline"
                      className="ml-2 text-[9px] px-1 py-0"
                    >
                      No offers
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {showEdition && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Edition</p>
          <div className="flex flex-wrap gap-2">
            {editions.map((e) => {
              const isSelected = selected.edition === e;
              const combo = findVariant(
                variants,
                selected.region,
                selected.durationDays,
                e,
              );
              const hasOffers = combo ? combo.offerCount > 0 : false;

              return (
                <Button
                  key={e}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="text-sm min-w-[80px]"
                  disabled={!hasOffers}
                  onClick={() => handleEditionClick(e)}
                >
                  {e}
                  {!hasOffers && (
                    <Badge
                      variant="outline"
                      className="ml-2 text-[9px] px-1 py-0"
                    >
                      No offers
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
