"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  LogIn,
  UserPlus,
  Mail,
} from "lucide-react";
import { Card, Button } from "@workspace/ui";
import { acceptInvite } from "@/lib/team-api";
import { getAccessToken } from "@/lib/auth";
import { useAuth } from "@/components/auth-provider";

type PageState = "no-token" | "auth-gate" | "accepting" | "success" | "error";

export default function InviteAcceptPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const token = searchParams.get("token");

  const [state, setState] = React.useState<PageState>(
    token ? "auth-gate" : "no-token",
  );
  const [sellerName, setSellerName] = React.useState("");
  const [role, setRole] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");

  // Ref to ensure we only fire the accept call once
  const acceptedRef = React.useRef(false);

  const returnUrl = token
    ? `/invite/accept?token=${encodeURIComponent(token)}`
    : "";

  // Derive a stable boolean: "do I have a token right now?"
  const isAuthenticated = !!getAccessToken();

  React.useEffect(() => {
    if (!token) return;
    if (acceptedRef.current) return; // Already fired — don't re-fire

    if (!isAuthenticated) {
      setState("auth-gate");
      return;
    }

    // We have a token and are authenticated — fire accept exactly once
    acceptedRef.current = true;
    setState("accepting");

    acceptInvite(token)
      .then((result) => {
        setSellerName(result.membership.sellerName);
        setRole(result.membership.role);
        setState("success");
      })
      .catch((err) => {
        setErrorMsg(
          err instanceof Error ? err.message : "Failed to accept invite",
        );
        setState("error");
        // Allow retry on error
        acceptedRef.current = false;
      });
    // `user` is included so the effect re-evaluates when AuthProvider
    // resolves (e.g. after login redirect), but the ref prevents double-fire.
  }, [token, isAuthenticated, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-5">
        {/* ---- No token ---- */}
        {state === "no-token" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="text-xl font-bold text-foreground">
              Invalid invite link
            </h1>
            <p className="text-sm text-muted-foreground">
              This invite link is missing the token. Please use the link from
              your invitation email.
            </p>
            <Link href="/">
              <Button variant="outline">Go to Dashboard</Button>
            </Link>
          </>
        )}

        {/* ---- Auth gate ---- */}
        {state === "auth-gate" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
              <Mail className="h-7 w-7 text-accent-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              You&apos;ve been invited to a team
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              To accept this invitation, sign in or create an account using{" "}
              <span className="font-medium text-foreground">
                the same email address
              </span>{" "}
              that received this invite.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href={`/auth/login?next=${encodeURIComponent(returnUrl)}`}
                className="w-full"
              >
                <Button className="w-full">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </Button>
              </Link>
              <Link
                href={`/auth/signup?next=${encodeURIComponent(returnUrl)}`}
                className="w-full"
              >
                <Button variant="outline" className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create account
                </Button>
              </Link>
            </div>
          </>
        )}

        {/* ---- Accepting ---- */}
        {state === "accepting" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
            <h1 className="text-xl font-bold text-foreground">
              Accepting invitation...
            </h1>
            <p className="text-sm text-muted-foreground">
              Please wait a moment.
            </p>
          </>
        )}

        {/* ---- Success ---- */}
        {state === "success" && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-foreground" />
            <h1 className="text-xl font-bold text-foreground">
              You&apos;re in!
            </h1>
            <p className="text-sm text-muted-foreground">
              You&apos;ve joined{" "}
              <span className="font-medium text-foreground">{sellerName}</span>
              {role && (
                <>
                  {" "}as{" "}
                  <span className="font-medium text-foreground">{role}</span>
                </>
              )}
              .
            </p>
            <Link href="/settings/team">
              <Button>Go to Team</Button>
            </Link>
          </>
        )}

        {/* ---- Error ---- */}
        {state === "error" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="text-xl font-bold text-foreground">
              Invitation failed
            </h1>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <Link href="/">
              <Button variant="outline">Go to Dashboard</Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
