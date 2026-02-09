"use client";

import * as React from "react";
import { AlertTriangle, Mail } from "lucide-react";
import { Alert, Button } from "@workspace/ui";
import { useToast } from "@workspace/ui/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { apiResendVerification } from "@/lib/auth";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSending, setIsSending] = React.useState(false);

  if (!user || user.isEmailVerified) return null;

  async function handleResend() {
    setIsSending(true);
    try {
      await apiResendVerification();
      toast({
        title: "Verification email sent",
        description: "Check your inbox for the verification link.",
      });
    } catch (err) {
      toast({
        title: "Could not send email",
        description: err instanceof Error ? err.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Alert className="rounded-none border-x-0 border-t-0 flex items-center gap-3 py-3 px-4">
      <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          Verify your email
        </p>
        <p className="text-xs text-muted-foreground">
          To publish offers and receive payouts, verify your email address.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleResend}
        disabled={isSending}
        className="shrink-0"
      >
        <Mail className="mr-1.5 h-3.5 w-3.5" />
        {isSending ? "Sending..." : "Resend email"}
      </Button>
    </Alert>
  );
}
