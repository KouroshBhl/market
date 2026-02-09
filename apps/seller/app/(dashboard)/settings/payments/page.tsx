"use client";

import * as React from "react";
import {
  Card,
  Badge,
  Switch,
  Skeleton,
  Alert,
  Button,
  SidebarTrigger,
  Separator,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui";
import { useToast } from "@workspace/ui/hooks/use-toast";
import { useSeller } from "@/components/seller-provider";
import { useAuth } from "@/components/auth-provider";
import { getSellerGateways, updateSellerGateway } from "@/lib/gateway-api";
import { CreditCard, Lock, Ban } from "lucide-react";
import type { SellerGatewayItem } from "@workspace/contracts";

// ============================================
// Page shell (header bar matching other settings pages)
// ============================================

function PaymentsPageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Settings</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Payments</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          {children}
        </div>
      </div>
    </>
  );
}

// ============================================
// Status helpers
// ============================================

function StatusLabel({ status }: { status: string }) {
  if (status === "GLOBALLY_DISABLED") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Ban className="h-3.5 w-3.5" />
        <span>Currently unavailable</span>
      </div>
    );
  }
  if (status === "ADMIN_LOCKED") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        <span>Managed by platform</span>
      </div>
    );
  }
  return null;
}

// ============================================
// Gateway Row
// ============================================

function GatewayRow({
  item,
  onToggle,
  isToggling,
}: {
  item: SellerGatewayItem;
  onToggle: (gatewayId: string, newEnabled: boolean) => void;
  isToggling: string | null;
}) {
  const canToggle = item.status === "AVAILABLE";
  const isBusy = isToggling === item.gateway.id;

  return (
    <div className="flex items-center justify-between gap-4 py-4 px-1">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-accent/50">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {item.gateway.name}
            </p>
            <Badge variant="outline" className="text-xs shrink-0">
              {item.gateway.provider}
            </Badge>
          </div>
          <StatusLabel status={item.status} />
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Switch
          checked={item.effectiveEnabled}
          onCheckedChange={(checked) => onToggle(item.gateway.id, checked)}
          disabled={!canToggle || isBusy}
          aria-label={`Toggle ${item.gateway.name}`}
        />
      </div>
    </div>
  );
}

// ============================================
// Page
// ============================================

export default function PaymentsPage() {
  const { isLoading: authLoading } = useAuth();
  const { activeSeller, isLoading: sellerLoading } = useSeller();
  const { toast } = useToast();

  const [gateways, setGateways] = React.useState<SellerGatewayItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const sellerId = activeSeller?.sellerId;

  // Fetch gateways
  const fetchGateways = React.useCallback(async () => {
    if (!sellerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(null);

    try {
      const data = await getSellerGateways(sellerId);
      setGateways(data.gateways);
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to load gateways",
      );
    } finally {
      setIsLoading(false);
    }
  }, [sellerId]);

  React.useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  // Toggle handler
  async function handleToggle(gatewayId: string, newEnabled: boolean) {
    if (!sellerId) return;
    setTogglingId(gatewayId);

    // Optimistic update
    const prevGateways = [...gateways];
    setGateways((prev) =>
      prev.map((g) =>
        g.gateway.id === gatewayId
          ? { ...g, effectiveEnabled: newEnabled }
          : g,
      ),
    );

    try {
      const updated = await updateSellerGateway(sellerId, gatewayId, newEnabled);
      // Apply server response
      setGateways((prev) =>
        prev.map((g) =>
          g.gateway.id === gatewayId
            ? {
                gateway: updated.gateway,
                sellerPreference: updated.sellerPreference,
                effectiveEnabled: updated.effectiveEnabled,
                status: updated.status,
              }
            : g,
        ),
      );
      toast({
        title: newEnabled ? "Gateway enabled" : "Gateway disabled",
        description: `${updated.gateway.name} has been ${newEnabled ? "enabled" : "disabled"}.`,
      });
    } catch (err) {
      // Revert optimistic update
      setGateways(prevGateways);
      toast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "Failed to update gateway",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  }

  // ---- Auth/Seller still loading ----
  if (authLoading || sellerLoading) {
    return (
      <PaymentsPageShell>
        <Skeleton className="h-8 w-48" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </Card>
      </PaymentsPageShell>
    );
  }

  // ---- No seller profile ----
  if (!sellerId) {
    return (
      <PaymentsPageShell>
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <Card className="p-12 flex flex-col items-center text-center">
          <CreditCard className="h-10 w-10 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold text-foreground">
            No organization selected
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Set up your seller profile first to manage payment methods.
          </p>
        </Card>
      </PaymentsPageShell>
    );
  }

  // ---- Fetching gateways ----
  if (isLoading) {
    return (
      <PaymentsPageShell>
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <Card className="p-6 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </Card>
      </PaymentsPageShell>
    );
  }

  // ---- Fetch error ----
  if (fetchError) {
    return (
      <PaymentsPageShell>
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <Card className="p-12 flex flex-col items-center text-center">
          <Alert variant="destructive" className="mb-4">
            <p className="text-sm">{fetchError}</p>
          </Alert>
          <Button variant="outline" onClick={fetchGateways}>
            Retry
          </Button>
        </Card>
      </PaymentsPageShell>
    );
  }

  return (
    <PaymentsPageShell>
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payment Methods</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enable or disable payment gateways for your store.
        </p>
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        At least one payment method must stay enabled.
      </p>

      {/* Gateway list */}
      <Card>
        <div className="px-6 pt-5 pb-2">
          <h2 className="text-base font-semibold text-foreground">
            Available Gateways
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {gateways.length}
            </span>
          </h2>
        </div>

        {gateways.length === 0 ? (
          <div className="px-6 pb-8 pt-4 flex flex-col items-center text-center">
            <CreditCard className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No payment gateways are configured yet.
            </p>
          </div>
        ) : (
          <div className="px-6 pb-4 divide-y divide-border">
            {gateways.map((item) => (
              <GatewayRow
                key={item.gateway.id}
                item={item}
                onToggle={handleToggle}
                isToggling={togglingId}
              />
            ))}
          </div>
        )}
      </Card>
    </PaymentsPageShell>
  );
}
