"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@workspace/ui";
import { apiExchangeCode, apiGetMe } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setError("No authorization code provided");
      return;
    }

    async function exchange() {
      try {
        await apiExchangeCode(code!);
        const me = await apiGetMe();

        if (me && !me.sellerId) {
          router.push("/setup");
        } else {
          router.push("/");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Authentication failed"
        );
      }
    }

    exchange();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-foreground">
            Authentication Error
          </h1>
          <p className="text-muted-foreground">{error}</p>
          <a
            href="/auth/login"
            className="text-foreground underline underline-offset-4"
          >
            Back to login
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-4">
        <h1 className="text-xl font-bold text-foreground">
          Completing sign in...
        </h1>
        <p className="text-muted-foreground">Please wait while we verify your credentials.</p>
      </Card>
    </div>
  );
}
