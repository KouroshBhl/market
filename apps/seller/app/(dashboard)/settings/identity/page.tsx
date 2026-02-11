"use client";

import * as React from "react";
import {
  Card,
  Button,
  Input,
  Label,
  Alert,
  Skeleton,
  SidebarTrigger,
  Separator,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  TimezoneCombobox,
  MarkdownEditor,
} from "@workspace/ui";
import { useToast } from "@workspace/ui/hooks/use-toast";
import { useSeller } from "@/components/seller-provider";
import { getStoreIdentity, updateStoreIdentity, changeStoreSlug } from "@/lib/api";
import { Lock, Save, AlertTriangle, ExternalLink } from "lucide-react";

// ============================================
// Types
// ============================================

interface StoreIdentity {
  id: string;
  slug: string;
  sellerDisplayName: string;
  logoUrl: string | null;
  bio: string | null;
  timezone: string | null;
  slugChangeCount: number;
  slugChangedAt: string | null;
  canChangeSlug: boolean;
}

// ============================================
// Change Slug Modal
// ============================================

function ChangeSlugModal({
  open,
  onOpenChange,
  currentSlug,
  sellerId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSlug: string;
  sellerId: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [newSlug, setNewSlug] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function reset() {
    setNewSlug("");
    setError(null);
    setIsSubmitting(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await changeStoreSlug(sellerId, newSlug.toLowerCase().trim());
      toast({
        title: "Store handle changed",
        description: `Your store is now at vendorsgg.com/seller/${newSlug}. Old links will redirect automatically.`,
      });
      handleOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change store handle");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Change Store Handle (One Time Only)
          </DialogTitle>
          <DialogDescription>
            Your store handle is your public identity. This change can only be done <strong>once</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <div className="ml-2">
              <p className="text-sm font-medium">Before you change your handle:</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>This is your <strong>public identity</strong> — buyers know you by this handle</li>
                <li>You can only change this <strong>once</strong></li>
                <li>Old links will automatically redirect to your new handle</li>
                <li>Choose carefully — this cannot be undone</li>
              </ul>
            </div>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <p className="text-sm">{error}</p>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-slug">Current Handle</Label>
              <Input
                id="current-slug"
                type="text"
                value={`vendorsgg.com/seller/${currentSlug}`}
                readOnly
                disabled
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-slug">New Handle</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">vendorsgg.com/seller/</span>
                <Input
                  id="new-slug"
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="my-store"
                  required
                  minLength={3}
                  maxLength={30}
                  className="font-mono text-sm"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                3-30 characters. Lowercase letters, numbers, and hyphens. No leading/trailing/consecutive hyphens.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !newSlug.trim()}>
                {isSubmitting ? "Changing..." : "Change Handle Permanently"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Page Shell
// ============================================

function IdentityPageShell({ children }: { children: React.ReactNode }) {
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
              <BreadcrumbPage>Identity</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <div className="mx-auto w-full max-w-3xl space-y-6">{children}</div>
      </div>
    </>
  );
}

// ============================================
// Identity Settings Page
// ============================================

export default function IdentitySettingsPage() {
  const { activeSeller, hasPermission, isLoading: sellerLoading } = useSeller();
  const { toast } = useToast();

  const [identity, setIdentity] = React.useState<StoreIdentity | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [changeSlugOpen, setChangeSlugOpen] = React.useState(false);

  // Form state
  const [sellerDisplayName, setSellerDisplayName] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [timezone, setTimezone] = React.useState<string | null>(null);

  const sellerId = activeSeller?.sellerId;
  const canManage = hasPermission("team.manage");

  // Track if form has changes
  const hasChanges = React.useMemo(() => {
    if (!identity) return false;
    return (
      sellerDisplayName !== identity.sellerDisplayName ||
      logoUrl !== (identity.logoUrl || "") ||
      bio !== (identity.bio || "") ||
      timezone !== identity.timezone
    );
  }, [identity, sellerDisplayName, logoUrl, bio, timezone]);

  // Fetch identity
  const fetchIdentity = React.useCallback(async () => {
    if (!sellerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(null);

    try {
      const data = await getStoreIdentity(sellerId);
      setIdentity(data);
      setSellerDisplayName(data.sellerDisplayName);
      setLogoUrl(data.logoUrl || "");
      setBio(data.bio || "");
      setTimezone(data.timezone);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }, [sellerId]);

  React.useEffect(() => {
    fetchIdentity();
  }, [fetchIdentity]);

  // Handle save
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!sellerId || !canManage) return;

    setIsSaving(true);

    try {
      await updateStoreIdentity(sellerId, {
        sellerDisplayName: sellerDisplayName.trim(),
        logoUrl: logoUrl.trim() || null,
        bio: bio.trim() || null,
        timezone: timezone,
      });

      toast({
        title: "Settings saved",
        description: "Store identity updated successfully.",
      });

      fetchIdentity();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  // ---- Loading ----
  if (sellerLoading || isLoading) {
    return (
      <IdentityPageShell>
        <Skeleton className="h-8 w-40" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </IdentityPageShell>
    );
  }

  if (!sellerId) {
    return (
      <IdentityPageShell>
        <h1 className="text-2xl font-bold text-foreground">Store Identity</h1>
        <Card className="p-12 flex flex-col items-center text-center">
          <h2 className="text-lg font-semibold text-foreground">No store found</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Set up your seller profile first.
          </p>
        </Card>
      </IdentityPageShell>
    );
  }

  if (fetchError) {
    return (
      <IdentityPageShell>
        <h1 className="text-2xl font-bold text-foreground">Store Identity</h1>
        <Card className="p-12 flex flex-col items-center text-center">
          <Alert variant="destructive" className="mb-4">
            <p className="text-sm">{fetchError}</p>
          </Alert>
          <Button variant="outline" onClick={fetchIdentity}>Retry</Button>
        </Card>
      </IdentityPageShell>
    );
  }

  if (!canManage) {
    return (
      <IdentityPageShell>
        <h1 className="text-2xl font-bold text-foreground">Store Identity</h1>
        <Card className="p-12 flex flex-col items-center text-center">
          <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            You don't have permission to manage store settings.
          </p>
        </Card>
      </IdentityPageShell>
    );
  }

  return (
    <IdentityPageShell>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Store Identity</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your store handle is your public identity. Buyers find you by this URL.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── Store Handle / URL ── */}
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Store Handle</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This is your public identity on the marketplace. Buyers see this in URLs and store pages.
              </p>
            </div>
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="slug">Store URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="slug"
                  type="text"
                  value={`vendorsgg.com/seller/${identity?.slug || ""}`}
                  readOnly
                  disabled
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(`https://vendorsgg.com/seller/${identity?.slug}`, "_blank")}
                  title="View store"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {identity?.canChangeSlug ? (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setChangeSlugOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Change Handle (One Time Only)
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  You can change your store handle once. Old links will redirect automatically.
                </p>
              </div>
            ) : (
              <Alert>
                <Lock className="h-4 w-4" />
                <p className="text-sm ml-2">
                  Handle was changed on {identity?.slugChangedAt ? new Date(identity.slugChangedAt).toLocaleDateString() : "a previous date"}. No further changes allowed. Old links redirect automatically.
                </p>
              </Alert>
            )}
          </div>
        </Card>

        {/* ── Internal Display Name ── */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Seller Display Name</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your internal name shown in the seller dashboard and team areas. This does not affect your public store URL or how buyers see you.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sellerDisplayName">Display Name</Label>
            <Input
              id="sellerDisplayName"
              type="text"
              value={sellerDisplayName}
              onChange={(e) => setSellerDisplayName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
              placeholder="Your name or team name"
            />
            <p className="text-xs text-muted-foreground">
              You can change this anytime. 2-100 characters.
            </p>
          </div>
        </Card>

        {/* ── Branding ── */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Branding</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Visual identity for your store page.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              Direct image link (PNG/JPG/WebP). Image upload coming soon.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Store Bio</Label>
            <MarkdownEditor
              id="bio"
              value={bio}
              onChange={setBio}
              placeholder="Tell buyers about your store..."
              maxLength={2000}
              rows={6}
            />
          </div>
        </Card>

        {/* ── Settings ── */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Regional and operational settings.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <TimezoneCombobox
              id="timezone"
              value={timezone}
              onChange={setTimezone}
              placeholder="Select your timezone..."
            />
            <p className="text-xs text-muted-foreground">
              Your primary business timezone.
            </p>
          </div>
        </Card>

        {/* ── Save ── */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={fetchIdentity}
            disabled={!hasChanges || isSaving}
          >
            Reset
          </Button>
          <Button type="submit" disabled={!hasChanges || isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      {identity && (
        <ChangeSlugModal
          open={changeSlugOpen}
          onOpenChange={setChangeSlugOpen}
          currentSlug={identity.slug}
          sellerId={sellerId}
          onSuccess={fetchIdentity}
        />
      )}
    </IdentityPageShell>
  );
}
