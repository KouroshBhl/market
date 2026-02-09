"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Eye,
  Gift,
  Info,
  Lock,
  Package,
  Shield,
  ShieldCheck,
  Unlock,
  X,
  Zap,
  CheckCircle2,
  Circle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertTitle,
  AlertDescription,
  Label,
  Select,
  Separator,
  SidebarTrigger,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui";

import type { SellerState } from "./_home/mockSellerState";
import { TIER_META } from "./_home/mockSellerState";
import {
  MOCK_OFFERS,
  MOCK_ORDERS,
  FAQ_ITEMS,
  type MockOffer,
  type MockOrder,
} from "./_home/mockData";
import { offersColumns } from "./_home/offers.columns";
import { ordersColumns } from "./_home/orders.columns";
import {
  PREVIEW_PRESETS,
  PRESET_OPTIONS,
  type PresetKey,
} from "./_home/previewPresets";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCap(value: number): string {
  return value === Infinity ? "Unlimited" : `${value} USDT / day`;
}

function formatLimit(value: number): string {
  return value === Infinity ? "Unlimited" : String(value);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Simple progress bar built with semantic tokens (no Progress primitive). */
function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 w-full rounded-full bg-secondary" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Timeline step for the Payout & Bond tab. */
function TimelineStep({
  label,
  detail,
  done,
  active,
  last,
}: {
  label: string;
  detail?: string;
  done: boolean;
  active: boolean;
  last?: boolean;
}) {
  return (
    <div className="flex gap-3">
      {/* icon + connector */}
      <div className="flex flex-col items-center">
        {done ? (
          <CheckCircle2 className="size-5 text-primary" />
        ) : active ? (
          <Circle className="size-5 text-primary" />
        ) : (
          <Circle className="size-5 text-muted-foreground/40" />
        )}
        {!last && (
          <div className={`w-px flex-1 min-h-6 ${done ? "bg-primary" : "bg-border"}`} />
        )}
      </div>
      {/* text */}
      <div className="pb-6">
        <p className={`text-sm font-medium ${done || active ? "text-foreground" : "text-muted-foreground"}`}>
          {label}
        </p>
        {detail && (
          <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function SellerOverviewPage() {
  // ---- Preview mode ---------------------------------------------------------
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isPreviewMode =
    searchParams.get("preview") === "1" ||
    process.env.NODE_ENV !== "production";

  const [presetKey, setPresetKey] = useState<PresetKey>("real");
  const state: SellerState = PREVIEW_PRESETS[presetKey];

  const [activeTab, setActiveTab] = useState<"offers" | "orders" | "payout">("offers");

  const tierMeta = TIER_META[state.tier];

  function handlePresetChange(key: PresetKey) {
    setPresetKey(key);
  }

  function exitPreview() {
    setPresetKey("real");
    // If preview mode was activated via query param, remove it
    if (searchParams.get("preview") === "1") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("preview");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
  }

  // ---- Derived --------------------------------------------------------------
  const activeOffersCount = MOCK_OFFERS.filter((o) => o.status === "active").length;

  // ---- Tables ---------------------------------------------------------------
  const offersTable = useReactTable<MockOffer>({
    data: MOCK_OFFERS,
    columns: offersColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const ordersTable = useReactTable<MockOrder>({
    data: MOCK_ORDERS,
    columns: ordersColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  // ---- Tier-specific CTA ----------------------------------------------------
  const nextStepCTA = useMemo(() => {
    if (state.tier === 0) {
      if (!state.hasBondPaid) {
        return {
          icon: <Lock className="size-5" />,
          title: "Get started: Pay the 25 USDT bond",
          description:
            "Paying the bond instantly unlocks Tier 1 — more offers, higher payout limits, and faster withdrawals.",
          action: "Pay Bond",
          href: "#",
          variant: "default" as const,
        };
      }
      return {
        icon: <Package className="size-5" />,
        title: "Publish your first offer",
        description:
          "Create an offer so buyers can find and purchase from you.",
        action: "Create Offer",
        href: "/products/new",
        variant: "default" as const,
      };
    }

    if (state.tier === 1) {
      const ordersNeeded = 10 - state.successfulOrdersCount;
      const daysNeeded = 14 - state.daysSinceFirstPaidOrder;
      return {
        icon: <Zap className="size-5" />,
        title: "Unlock Tier 2 — Trusted Seller",
        description: `Complete ${Math.max(0, ordersNeeded)} more successful order${ordersNeeded === 1 ? "" : "s"} OR maintain a clean record for ${Math.max(0, daysNeeded)} more day${daysNeeded === 1 ? "" : "s"}.`,
        action: "View Orders",
        href: "/orders",
        variant: "default" as const,
        progress: {
          orders: { current: state.successfulOrdersCount, target: 10 },
          days: { current: state.daysSinceFirstPaidOrder, target: 14 },
        },
      };
    }

    // Tier 2
    return {
      icon: <ShieldCheck className="size-5" />,
      title: "You're fully unlocked!",
      description:
        "Unlimited offers, unlimited orders, fastest payouts, and your bond has been released.",
      action: "Go to Offers",
      href: "/products",
      variant: "secondary" as const,
    };
  }, [state]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl space-y-6">

          {/* ============================================================= */}
          {/* PREVIEW MODE BANNER                                             */}
          {/* Only visible when ?preview=1 or NODE_ENV !== production          */}
          {/* ============================================================= */}
          {isPreviewMode && (
            <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-accent/30 px-3 py-1.5 text-xs">
              <Eye className="size-3 text-muted-foreground shrink-0" />
              <span className="font-semibold text-muted-foreground uppercase tracking-wide">Dev Preview</span>
              <span className="text-muted-foreground hidden sm:inline">— not visible to sellers</span>
              <Separator orientation="vertical" className="h-3.5 mx-1" />
              <Label htmlFor="preset-select" className="sr-only">
                Scenario
              </Label>
              <Select
                id="preset-select"
                value={presetKey}
                onChange={(e) => handlePresetChange(e.target.value as PresetKey)}
                className="h-7 max-w-[200px] text-xs"
              >
                {PRESET_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={exitPreview}
                className="h-6 px-2 text-xs gap-1 ml-auto shrink-0"
              >
                <X className="size-3" />
                Exit
              </Button>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION A — STATUS STRIP                                        */}
          {/* ============================================================= */}
          <section aria-label="Seller status overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tier Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Tier</CardTitle>
                  <Badge variant={tierMeta.badgeVariant}>{tierMeta.label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-foreground">{tierMeta.name}</p>
                <p className="text-sm text-foreground mt-1">
                  {state.tier === 0 && "You're just getting started. Limits are temporary."}
                  {state.tier === 1 && "You're active, but still limited."}
                  {state.tier === 2 && "You're fully unlocked."}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{tierMeta.description}</p>
              </CardContent>
            </Card>

            {/* Limits Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Limits</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Active offers</dt>
                    <dd className="font-medium text-foreground">{formatLimit(state.activeOffersLimit)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Active orders</dt>
                    <dd className="font-medium text-foreground">{formatLimit(state.activeOrdersLimit)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Payout cap</dt>
                    <dd className="font-medium text-foreground">{formatCap(state.payoutDailyCap)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Payout delay</dt>
                    <dd className="font-medium text-foreground">{state.payoutDelayHours}h</dd>
                  </div>
                </dl>
                <p className="text-xs text-muted-foreground mt-2">
                  {state.tier === 0 && "Limits are intentionally low to protect buyers."}
                  {state.tier === 1 && "Limits increase automatically as you complete orders."}
                  {state.tier === 2 && "No limits apply."}
                </p>
              </CardContent>
            </Card>

            {/* Bond Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Bond</CardTitle>
                  {state.bondStatus === "LOCKED" && <Lock className="size-4 text-muted-foreground" />}
                  {state.bondStatus === "RELEASED" && <Unlock className="size-4 text-primary" />}
                  {state.bondStatus === "SLASHED" && <XCircle className="size-4 text-destructive" />}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-foreground">
                  {state.hasBondPaid ? `${state.bondAmount} USDT` : "Not paid"}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge
                    variant={
                      state.bondStatus === "RELEASED"
                        ? "success"
                        : state.bondStatus === "SLASHED"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {state.bondStatus === "SLASHED" ? "Forfeited" : state.bondStatus}
                  </Badge>
                  {state.bondStatus === "LOCKED" && state.hasBondPaid && (
                    <Badge variant="outline" className="text-xs">Refundable</Badge>
                  )}
                </div>
                {state.bondStatus === "LOCKED" && state.hasBondPaid && (
                  <p className="text-xs text-muted-foreground mt-2">
                    This bond is fully refundable once conditions are met. Released after 10 successful orders or 14 days without buyer complaints.
                  </p>
                )}
                {state.bondStatus === "SLASHED" && (
                  <p className="text-xs text-destructive mt-2">
                    Bond forfeited due to policy violation.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Risk Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <TooltipProvider>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Open disputes</dt>
                      <dd className="font-medium text-foreground">
                        {state.disputesOpenCount > 0 ? (
                          <Badge variant="destructive">{state.disputesOpenCount}</Badge>
                        ) : (
                          <Badge variant="success">0</Badge>
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="underline decoration-dotted cursor-help">Reserve</span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px] text-xs">
                            A small portion of each payout is held temporarily as a safety buffer until you reach Tier 2.
                          </TooltipContent>
                        </Tooltip>
                      </dt>
                      <dd className="font-medium text-foreground">
                        {state.tier < 2 ? "Active" : "None"}
                      </dd>
                    </div>
                  </dl>
                </TooltipProvider>
                {state.disputesOpenCount > 0 && (
                  <p className="text-xs text-destructive mt-2">
                    Resolve disputes quickly to avoid bond penalties.
                  </p>
                )}
                {state.disputesOpenCount === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    No issues — keep it up!
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          {/* ============================================================= */}
          {/* SECTION A2 — WHAT YOU UNLOCK NEXT (seller-facing, read-only)    */}
          {/* ============================================================= */}
          {state.tier < 2 && (
            <NextTierPreview
              tier={state.tier as 0 | 1}
              successfulOrdersCount={state.successfulOrdersCount}
              daysSinceFirstPaidOrder={state.daysSinceFirstPaidOrder}
              onShowHowTiersWork={() => setActiveTab("payout")}
            />
          )}

          {/* ============================================================= */}
          {/* SECTION B — WHAT TO DO NEXT (PRIMARY CTA)                       */}
          {/* ============================================================= */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center size-10 rounded-lg bg-secondary text-foreground shrink-0 mt-0.5">
                  {nextStepCTA.icon}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-lg font-semibold text-foreground">{nextStepCTA.title}</h2>
                    {/* CTA button for non-progress scenarios (Tier 0, Tier 2) */}
                    {!("progress" in nextStepCTA) && (
                      <Link href={nextStepCTA.href} className="shrink-0">
                        <Button variant={nextStepCTA.variant}>
                          {nextStepCTA.action}
                          <ArrowRight className="size-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{nextStepCTA.description}</p>

                  {/* Progress bars + inline CTA for Tier 1 */}
                  {"progress" in nextStepCTA && nextStepCTA.progress && (
                    <div className="space-y-3 pt-3">
                      <TooltipProvider>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Successful orders</span>
                              <span>{nextStepCTA.progress.orders.current} / {nextStepCTA.progress.orders.target}</span>
                            </div>
                            <ProgressBar value={nextStepCTA.progress.orders.current} max={nextStepCTA.progress.orders.target} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="underline decoration-dotted cursor-help">Days without complaints</span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[220px] text-xs">
                                  Consecutive days with no buyer disputes or reports since your first paid order.
                                </TooltipContent>
                              </Tooltip>
                              <span>{nextStepCTA.progress.days.current} / {nextStepCTA.progress.days.target}</span>
                            </div>
                            <ProgressBar value={nextStepCTA.progress.days.current} max={nextStepCTA.progress.days.target} />
                          </div>
                        </div>
                      </TooltipProvider>
                      <Link href={nextStepCTA.href}>
                        <Button variant={nextStepCTA.variant} size="sm">
                          {nextStepCTA.action}
                          <ArrowRight className="size-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ============================================================= */}
          {/* SECTION C — TABS (Offers / Orders / Payout & Bond)              */}
          {/* ============================================================= */}
          <div className="space-y-4">
            {/* Tab bar */}
            <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Dashboard sections">
              {(
                [
                  { key: "offers", label: "Offers", icon: <Package className="size-4" /> },
                  { key: "orders", label: "Orders", icon: <Gift className="size-4" /> },
                  { key: "payout", label: "Payout & Bond", icon: <Shield className="size-4" /> },
                ] as const
              ).map((tab) => (
                <Button
                  key={tab.key}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  variant={activeTab === tab.key ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-b-none gap-1.5 ${activeTab === tab.key ? "border-b-2 border-primary" : ""}`}
                >
                  {tab.icon}
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Tab panels */}
            <div role="tabpanel" aria-label={activeTab}>
              {/* ---- Offers Tab ---- */}
              {activeTab === "offers" && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Your Offers</CardTitle>
                        <CardDescription className="mt-1">
                          Active offers used:{" "}
                          <span className="font-semibold text-foreground">
                            {activeOffersCount} / {formatLimit(state.activeOffersLimit)}
                          </span>
                        </CardDescription>
                      </div>
                      <Link href="/products/new">
                        <Button size="sm">
                          Add Offer
                          <ArrowRight className="size-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {MOCK_OFFERS.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Package className="size-10 text-muted-foreground mb-3" />
                        <p className="text-sm font-medium text-foreground">No offers yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Create your first offer to start selling.
                        </p>
                        <Link href="/products/new" className="mt-4">
                          <Button size="sm">Create Offer</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            {offersTable.getHeaderGroups().map((hg) => (
                              <TableRow key={hg.id}>
                                {hg.headers.map((h) => (
                                  <TableHead key={h.id}>
                                    {h.isPlaceholder
                                      ? null
                                      : flexRender(h.column.columnDef.header, h.getContext())}
                                  </TableHead>
                                ))}
                              </TableRow>
                            ))}
                          </TableHeader>
                          <TableBody>
                            {offersTable.getRowModel().rows.map((row) => (
                              <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                  <TableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ---- Orders Tab ---- */}
              {activeTab === "orders" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>
                      Click an order ID to view details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {MOCK_ORDERS.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Gift className="size-10 text-muted-foreground mb-3" />
                        <p className="text-sm font-medium text-foreground">No orders yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Orders will appear here once buyers purchase your offers.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            {ordersTable.getHeaderGroups().map((hg) => (
                              <TableRow key={hg.id}>
                                {hg.headers.map((h) => (
                                  <TableHead key={h.id}>
                                    {h.isPlaceholder
                                      ? null
                                      : flexRender(h.column.columnDef.header, h.getContext())}
                                  </TableHead>
                                ))}
                              </TableRow>
                            ))}
                          </TableHeader>
                          <TableBody>
                            {ordersTable.getRowModel().rows.map((row) => (
                              <TableRow
                                key={row.id}
                                className="cursor-pointer hover:bg-accent/50 transition-colors"
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <TableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ---- Payout & Bond Tab ---- */}
              {activeTab === "payout" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: Explanation */}
                  <Card>
                    <CardHeader>
                      <CardTitle>How Payouts Work</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex gap-3">
                          <Clock className="size-5 text-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">Payout Delay: {state.payoutDelayHours} hours</p>
                            <p>
                              After a buyer pays, your earnings are held for{" "}
                              <span className="font-medium text-foreground">{state.payoutDelayHours} hours</span>{" "}
                              before you can withdraw. This protects against chargebacks. Example: if you sell 20 USDT
                              worth, the payout appears after {state.payoutDelayHours}h.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex gap-3">
                          <ArrowRight className="size-5 text-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">
                              Daily Cap: {formatCap(state.payoutDailyCap)}
                            </p>
                            <p>
                              {state.payoutDailyCap === Infinity
                                ? "You have no daily withdrawal limit. Withdraw as much as you earn."
                                : `You can withdraw up to ${state.payoutDailyCap} USDT per day. This limit increases as you move up tiers.`}
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex gap-3">
                          <Shield className="size-5 text-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">Reserve Policy</p>
                            <p>
                              {state.tier < 2
                                ? "A small portion of each payout is held temporarily as a safety buffer. This reserve is released automatically once you reach Tier 2 — it is not lost."
                                : "No reserve is applied. You receive 100% of your earnings after the payout delay."}
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex gap-3">
                          <Lock className="size-5 text-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">Bond Release Rules</p>
                            <p>
                              Your {state.bondAmount} USDT bond is returned when you complete 10 successful orders OR
                              go 14 days without any buyer complaints after your first paid order — whichever comes first.
                              If you violate platform rules, the bond may be permanently forfeited.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Right: Timeline + Alerts */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Bond Timeline</CardTitle>
                        <CardDescription>Your journey to bond release.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-0">
                          <TimelineStep
                            label="Bond paid"
                            detail={state.hasBondPaid ? `${state.bondAmount} USDT deposited` : "Not yet paid"}
                            done={state.hasBondPaid}
                            active={!state.hasBondPaid}
                          />
                          <TimelineStep
                            label="First paid order"
                            detail={
                              state.daysSinceFirstPaidOrder > 0
                                ? `${state.daysSinceFirstPaidOrder} day${state.daysSinceFirstPaidOrder === 1 ? "" : "s"} ago`
                                : "Waiting for your first sale"
                            }
                            done={state.daysSinceFirstPaidOrder > 0}
                            active={state.hasBondPaid && state.daysSinceFirstPaidOrder === 0}
                          />
                          <TimelineStep
                            label="10 successful orders or 14 days without complaints"
                            detail={`${state.successfulOrdersCount}/10 orders · ${state.daysSinceFirstPaidOrder}/14 days`}
                            done={state.successfulOrdersCount >= 10 || state.daysSinceFirstPaidOrder >= 14}
                            active={
                              state.daysSinceFirstPaidOrder > 0 &&
                              state.successfulOrdersCount < 10 &&
                              state.daysSinceFirstPaidOrder < 14
                            }
                          />
                          <TimelineStep
                            label="Bond released"
                            detail={
                              state.bondStatus === "RELEASED"
                                ? "Your bond has been returned to your wallet"
                                : state.bondStatus === "SLASHED"
                                  ? "Bond forfeited due to policy violation"
                                  : "Pending — complete the requirements above"
                            }
                            done={state.bondStatus === "RELEASED"}
                            active={false}
                            last
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Bond status alerts */}
                    {state.bondStatus === "LOCKED" && state.hasBondPaid && (
                      <Alert>
                        <Info className="size-4" />
                        <AlertTitle>Bond is locked — fully refundable</AlertTitle>
                        <AlertDescription>
                          {state.successfulOrdersCount < 10 && state.daysSinceFirstPaidOrder < 14
                            ? `Estimated release: ${Math.max(0, 10 - state.successfulOrdersCount)} more order${10 - state.successfulOrdersCount === 1 ? "" : "s"} or ${Math.max(0, 14 - state.daysSinceFirstPaidOrder)} more day${14 - state.daysSinceFirstPaidOrder === 1 ? "" : "s"} without buyer complaints.`
                            : "You have met the requirements. Bond will be released soon."}
                        </AlertDescription>
                      </Alert>
                    )}

                    {state.bondStatus === "SLASHED" && (
                      <Alert variant="destructive">
                        <XCircle className="size-4" />
                        <AlertTitle>Bond forfeited due to policy violation</AlertTitle>
                        <AlertDescription>
                          {state.slashReason || "Your bond has been permanently forfeited. Contact support if you believe this is an error."}
                        </AlertDescription>
                      </Alert>
                    )}

                    {state.bondStatus === "RELEASED" && (
                      <Alert>
                        <CheckCircle2 className="size-4" />
                        <AlertTitle>Bond released</AlertTitle>
                        <AlertDescription>
                          Your {state.bondAmount} USDT bond has been returned to your wallet. No further holds apply.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================= */}
          {/* SECTION D — FAQ (Collapsible)                                    */}
          {/* ============================================================= */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>Common questions about selling on the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              {FAQ_ITEMS.map((faq, idx) => (
                <FaqCollapsible key={idx} question={faq.question} answer={faq.answer} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Next Tier Preview — seller-facing, read-only
// ---------------------------------------------------------------------------

interface NextTierBenefit {
  text: string;
}

const TIER_1_BENEFITS: NextTierBenefit[] = [
  { text: "Up to 5 active offers (currently 1)" },
  { text: "Up to 10 active orders (currently 2)" },
  { text: "200 USDT/day payout cap (currently 50)" },
  { text: "Faster payouts — 48h delay (currently 72h)" },
  { text: "Bond secures your seller status" },
];

const TIER_2_BENEFITS: NextTierBenefit[] = [
  { text: "Unlimited active offers" },
  { text: "Unlimited active orders" },
  { text: "Unlimited daily payouts" },
  { text: "Fastest payouts — 24h delay" },
  { text: "Bond released back to your wallet" },
];

function NextTierPreview({
  tier,
  successfulOrdersCount,
  daysSinceFirstPaidOrder,
  onShowHowTiersWork,
}: {
  tier: 0 | 1;
  successfulOrdersCount: number;
  daysSinceFirstPaidOrder: number;
  onShowHowTiersWork: () => void;
}) {
  const isUpgradeToTier1 = tier === 0;
  const nextTierName = isUpgradeToTier1 ? "Tier 1 — Bonded Seller" : "Tier 2 — Trusted Seller";
  const benefits = isUpgradeToTier1 ? TIER_1_BENEFITS : TIER_2_BENEFITS;

  const ordersRemaining = Math.max(0, 10 - successfulOrdersCount);
  const daysRemaining = Math.max(0, 14 - daysSinceFirstPaidOrder);

  return (
    <Card className="bg-accent/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            What you unlock next
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {nextTierName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Benefits list */}
        <ul className="space-y-1.5" aria-label={`Benefits of ${nextTierName}`}>
          {benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <span>{b.text}</span>
            </li>
          ))}
        </ul>

        <Separator />

        {/* Unlock conditions */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">How to unlock</p>
          {isUpgradeToTier1 ? (
            <p className="text-sm text-muted-foreground">
              Pay the 25 USDT bond to unlock instantly.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete{" "}
              <span className="font-medium text-foreground">{ordersRemaining} more successful order{ordersRemaining === 1 ? "" : "s"}</span>
              {" "}OR maintain{" "}
              <span className="font-medium text-foreground">{daysRemaining} more day{daysRemaining === 1 ? "" : "s"} without buyer complaints</span>.
            </p>
          )}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-2">
          <Link href={isUpgradeToTier1 ? "#" : "/orders"}>
            <Button size="sm">
              {isUpgradeToTier1 ? "Pay Bond" : "View Orders"}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={onShowHowTiersWork}>
            How tiers work
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// FAQ Collapsible Item
// ---------------------------------------------------------------------------

function FaqCollapsible({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between rounded-none border-b border-border py-4 h-auto text-left font-medium text-sm"
        >
          {question}
          <ChevronRight className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 py-3 text-sm text-muted-foreground">
          {answer}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
