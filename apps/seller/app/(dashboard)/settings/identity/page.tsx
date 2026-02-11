"use client";

import * as React from "react";
import {
  Card,
  Button,
  Input,
  Label,
  Textarea,
  Select,
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
  Badge,
} from "@workspace/ui";
import { useToast } from "@workspace/ui/hooks/use-toast";
import { useSeller } from "@/components/seller-provider";
import { getStoreIdentity, updateStoreIdentity } from "@/lib/api";
import { Lock, Save } from "lucide-react";

// ============================================
// Types
// ============================================

interface StoreIdentity {
  id: string;
  slug: string;
  displayName: string;
  logoUrl: string | null;
  bio: string | null;
  supportResponseTime: string | null;
  timezone: string | null;
  languages: string[];
}

// ============================================
// Constants
// ============================================

const SUPPORT_RESPONSE_TIMES = [
  { value: "UNDER_15_MIN", label: "Under 15 minutes" },
  { value: "UNDER_1_HOUR", label: "Under 1 hour" },
  { value: "UNDER_24_HOURS", label: "Under 24 hours" },
];

const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (US)" },
  { value: "America/Chicago", label: "Central Time (US)" },
  { value: "America/Denver", label: "Mountain Time (US)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Istanbul", label: "Istanbul (TRT)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Tehran", label: "Tehran (IRST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
];

const COMMON_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fa", label: "Persian (Farsi)" },
  { value: "ar", label: "Arabic" },
  { value: "tr", label: "Turkish" },
  { value: "ru", label: "Russian" },
  { value: "uk", label: "Ukrainian" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
];

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

  // Form state
  const [displayName, setDisplayName] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [supportResponseTime, setSupportResponseTime] = React.useState("");
  const [timezone, setTimezone] = React.useState("");
  const [selectedLanguages, setSelectedLanguages] = React.useState<string[]>([]);

  const sellerId = activeSeller?.sellerId;
  const canManage = hasPermission("team.manage");

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
      setDisplayName(data.displayName);
      setLogoUrl(data.logoUrl || "");
      setBio(data.bio || "");
      setSupportResponseTime(data.supportResponseTime || "");
      setTimezone(data.timezone || "");
      setSelectedLanguages(data.languages || []);
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
        displayName: displayName.trim(),
        logoUrl: logoUrl.trim() || null,
        bio: bio.trim() || null,
        supportResponseTime: supportResponseTime || null,
        timezone: timezone || null,
        languages: selectedLanguages,
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

  // Toggle language selection
  function toggleLanguage(langCode: string) {
    setSelectedLanguages((prev) =>
      prev.includes(langCode) ? prev.filter((l) => l !== langCode) : [...prev, langCode]
    );
  }

  // ---- Loading states ----
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

  // ---- No seller profile ----
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

  // ---- Fetch error ----
  if (fetchError) {
    return (
      <IdentityPageShell>
        <h1 className="text-2xl font-bold text-foreground">Store Identity</h1>
        <Card className="p-12 flex flex-col items-center text-center">
          <Alert variant="destructive" className="mb-4">
            <p className="text-sm">{fetchError}</p>
          </Alert>
          <Button variant="outline" onClick={fetchIdentity}>
            Retry
          </Button>
        </Card>
      </IdentityPageShell>
    );
  }

  // ---- No permission ----
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
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Store Identity</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your store's public identity and contact information.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Store URL (read-only) */}
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Store URL</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your store's permanent URL. This cannot be changed.
              </p>
            </div>
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>

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
            </div>
            <p className="text-xs text-muted-foreground">
              Store URL cannot be changed.
            </p>
          </div>
        </Card>

        {/* Editable fields */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Basic Information</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Public information about your store.
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
              placeholder="My Awesome Store"
            />
            <p className="text-xs text-muted-foreground">
              Your store's public name. Does not affect the URL.
            </p>
          </div>

          {/* Logo URL */}
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
              Direct link to your store logo image.
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={4}
              placeholder="Tell buyers about your store..."
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/300 characters
            </p>
          </div>
        </Card>

        {/* Support & Communication */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Support & Communication
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Help buyers know what to expect.
            </p>
          </div>

          {/* Support Response Time */}
          <div className="space-y-2">
            <Label htmlFor="supportResponseTime">Support Response Time</Label>
            <Select
              id="supportResponseTime"
              value={supportResponseTime}
              onChange={(e) => setSupportResponseTime(e.target.value)}
            >
              <option value="">Not specified</option>
              {SUPPORT_RESPONSE_TIMES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              Average time to respond to buyer inquiries.
            </p>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="">Not specified</option>
              {COMMON_TIMEZONES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              Your primary business timezone.
            </p>
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <Label>Languages Supported</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_LANGUAGES.map((lang) => (
                <Badge
                  key={lang.value}
                  variant={selectedLanguages.includes(lang.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleLanguage(lang.value)}
                >
                  {lang.label}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Click to select languages you can support.
            </p>
          </div>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </IdentityPageShell>
  );
}
