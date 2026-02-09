"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, Button } from "@workspace/ui";

/**
 * /auth/verified?status=success|invalid
 *
 * Email verification result page.
 * On success: shows confirmation + auto-redirects to dashboard after 3s.
 */
export default function VerifiedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get("status");
  const isSuccess = status === "success";

  // Auto-redirect to dashboard after 3 seconds on success
  React.useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => {
      router.push("/");
    }, 3000);
    return () => clearTimeout(timer);
  }, [isSuccess, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-4">
        {isSuccess ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-foreground" />
            <h1 className="text-xl font-bold text-foreground">
              Email verified
            </h1>
            <p className="text-muted-foreground">
              Your email has been verified successfully. You now have full
              access to all seller features.
            </p>
            <p className="text-xs text-muted-foreground">
              Redirecting to dashboard in a few seconds...
            </p>
            <Link href="/">
              <Button className="mt-1">Go to Dashboard</Button>
            </Link>
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="text-xl font-bold text-foreground">
              Verification failed
            </h1>
            <p className="text-muted-foreground">
              This verification link is invalid or has expired. Please request a
              new one from your dashboard.
            </p>
            <Link href="/">
              <Button className="mt-1">Go to Dashboard</Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
