"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import type { AuthUser } from "@workspace/contracts";
import { apiGetMe, apiLogout, clearAccessToken, getAccessToken } from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null | void>;
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return React.useContext(AuthContext);
}

const PUBLIC_PATHS = ["/auth/login", "/auth/signup", "/auth/callback"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  const refreshUser = React.useCallback(async () => {
    try {
      const me = await apiGetMe();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const logout = React.useCallback(async () => {
    await apiLogout();
    setUser(null);
    router.push("/auth/login");
  }, [router]);

  React.useEffect(() => {
    let cancelled = false;

    async function check() {
      const token = getAccessToken();

      if (!token && !isPublicPath) {
        setIsLoading(false);
        router.push("/auth/login");
        return;
      }

      if (!token && isPublicPath) {
        setIsLoading(false);
        return;
      }

      try {
        const me = await apiGetMe();
        if (cancelled) return;

        if (!me) {
          clearAccessToken();
          if (!isPublicPath) {
            router.push("/auth/login");
          }
          setIsLoading(false);
          return;
        }

        setUser(me);

        // If user has no seller profile, redirect to setup (unless already there)
        if (!me.sellerId && pathname !== "/setup" && !isPublicPath) {
          router.push("/setup");
        }

        // If on a public path and authenticated with a seller profile, go to home
        if (isPublicPath && me.sellerId) {
          router.push("/");
        }
      } catch {
        if (cancelled) return;
        clearAccessToken();
        if (!isPublicPath) {
          router.push("/auth/login");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    check();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const value = React.useMemo(
    () => ({ user, isLoading, logout, refreshUser }),
    [user, isLoading, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
