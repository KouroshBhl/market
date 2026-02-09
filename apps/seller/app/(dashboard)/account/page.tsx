"use client";

import * as React from "react";
import {
  Card,
  Label,
  Input,
  Button,
  Alert,
  Separator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@workspace/ui";
import { useToast } from "@workspace/ui/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { apiSetPassword, apiChangePassword } from "@/lib/auth";

// ============================================
// Set Password Dialog (Google-only users)
// ============================================

function SetPasswordDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function reset() {
    setNewPassword("");
    setConfirmPassword("");
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

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 10) {
      setError("Password must be at least 10 characters");
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword)) {
      setError("Password must include at least 1 letter");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError("Password must include at least 1 number");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiSetPassword(newPassword);
      toast({ title: "Password set", description: "Your password has been set successfully." });
      handleOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set a password</DialogTitle>
          <DialogDescription>
            Create a password so you can also sign in with email and password.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <p className="text-sm">{error}</p>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="set-new-password">New password</Label>
            <Input
              id="set-new-password"
              type="password"
              placeholder="At least 10 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={10}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              Min 10 characters, at least 1 letter and 1 number.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="set-confirm-password">Confirm password</Label>
            <Input
              id="set-confirm-password"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Setting..." : "Set password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Change Password Dialog
// ============================================

function ChangePasswordDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function reset() {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
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

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 10) {
      setError("Password must be at least 10 characters");
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword)) {
      setError("Password must include at least 1 letter");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError("Password must include at least 1 number");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiChangePassword(oldPassword, newPassword);
      toast({ title: "Password changed", description: "Your password has been updated successfully." });
      handleOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <p className="text-sm">{error}</p>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="change-old-password">Current password</Label>
            <Input
              id="change-old-password"
              type="password"
              placeholder="Enter current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="change-new-password">New password</Label>
            <Input
              id="change-new-password"
              type="password"
              placeholder="At least 10 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={10}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              Min 10 characters, at least 1 letter and 1 number.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="change-confirm-password">Confirm new password</Label>
            <Input
              id="change-confirm-password"
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Changing..." : "Change password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Account Page
// ============================================

export default function AccountPage() {
  const { user, isLoading, refreshUser } = useAuth();
  const [setPasswordOpen, setSetPasswordOpen] = React.useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground">Account</h1>
        <Card className="p-6 space-y-4">
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
        </Card>
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.displayName || user.email.split("@")[0] || user.email;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Account</h1>

      {/* ---- Profile Section ---- */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Display name</Label>
            <p className="text-sm font-medium text-foreground">{displayName}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Email</Label>
            <p className="text-sm font-medium text-foreground">{user.email}</p>
          </div>
        </div>
      </Card>

      {/* ---- Security Section ---- */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Security</h2>
        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Password</Label>
            <p className="text-sm font-medium text-foreground">
              {user.hasPassword ? "Set" : "Not set"}
            </p>
            {!user.hasPassword && (
              <p className="text-xs text-muted-foreground">
                You signed up with Google. Set a password to also sign in with email.
              </p>
            )}
          </div>
          <div>
            {user.hasPassword ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChangePasswordOpen(true)}
              >
                Change password
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSetPasswordOpen(true)}
              >
                Set password
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ---- Dialogs ---- */}
      <SetPasswordDialog
        open={setPasswordOpen}
        onOpenChange={setSetPasswordOpen}
        onSuccess={() => { refreshUser(); }}
      />

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
        onSuccess={() => { refreshUser(); }}
      />
    </div>
  );
}
