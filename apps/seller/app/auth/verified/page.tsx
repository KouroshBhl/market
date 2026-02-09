"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, Button } from "@workspace/ui";

export default function VerifiedPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const isSuccess = status === "success";

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
              Your email address has been verified. You now have full access to
              all seller features.
            </p>
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
          </>
        )}

        <Link href="/">
          <Button className="mt-2">Go to Dashboard</Button>
        </Link>
      </Card>
    </div>
  );
}
