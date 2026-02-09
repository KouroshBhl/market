"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, Alert } from "@workspace/ui";
import { apiSellerSetup } from "@/lib/auth";
import { useAuth } from "@/components/auth-provider";

export default function SetupPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // If user already has a seller profile, redirect
  React.useEffect(() => {
    if (user?.sellerId) {
      router.push("/");
    }
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (displayName.trim().length < 2) {
      setError("Display name must be at least 2 characters");
      return;
    }

    setIsLoading(true);

    try {
      await apiSellerSetup(displayName.trim());
      await refreshUser();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Set up your seller profile
          </h1>
          <p className="text-muted-foreground">
            Choose a display name for your store. Buyers will see this name.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <p className="text-sm">{error}</p>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="My Awesome Store"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              2-100 characters. You can change this later.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating profile..." : "Continue"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
