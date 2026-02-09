"use client";

import * as React from "react";
import { useSeller } from "@/components/seller-provider";
import { getPresenceList } from "@/lib/team-api";
import type { PresenceEntry } from "@/lib/team-api";

const POLL_INTERVAL_MS = 10_000; // 10 seconds

interface PresenceContextValue {
  /** Map of userId → PresenceEntry */
  presenceMap: Record<string, PresenceEntry>;
  /** Number of online members */
  onlineCount: number;
  /** Force an immediate refresh */
  refresh: () => void;
}

const PresenceContext = React.createContext<PresenceContextValue>({
  presenceMap: {},
  onlineCount: 0,
  refresh: () => {},
});

export function usePresence() {
  return React.useContext(PresenceContext);
}

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { activeSeller } = useSeller();
  const sellerId = activeSeller?.sellerId;

  const [presenceMap, setPresenceMap] = React.useState<
    Record<string, PresenceEntry>
  >({});

  const fetchRef = React.useRef(0); // generation counter to ignore stale responses

  const poll = React.useCallback(async () => {
    if (!sellerId) return;
    const gen = ++fetchRef.current;

    try {
      const data = await getPresenceList(sellerId);
      // Ignore if a newer fetch has started
      if (gen !== fetchRef.current) return;

      const map: Record<string, PresenceEntry> = {};
      for (const p of data.presences) map[p.userId] = p;
      setPresenceMap(map);
    } catch {
      // non-critical — silently ignore
    }
  }, [sellerId]);

  // Poll on mount + interval + visibility change
  React.useEffect(() => {
    if (!sellerId) {
      setPresenceMap({});
      return;
    }

    // Immediate first fetch
    poll();

    // Regular polling
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    // Re-poll immediately when tab becomes visible
    function onVisibility() {
      if (document.visibilityState === "visible") {
        poll();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [sellerId, poll]);

  const onlineCount = React.useMemo(() => {
    return Object.values(presenceMap).filter((p) => p.status === "online")
      .length;
  }, [presenceMap]);

  const value = React.useMemo(
    () => ({ presenceMap, onlineCount, refresh: poll }),
    [presenceMap, onlineCount, poll],
  );

  return (
    <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
  );
}
