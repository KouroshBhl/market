"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSeller } from "@/components/seller-provider";
import { authedFetch } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds
const ACTIVITY_THROTTLE_MS = 5_000;   // throttle activity detection to 5s

/**
 * Sends presence heartbeats to the backend while the user is on
 * authenticated seller routes. Tracks activity events (keydown,
 * pointerdown, scroll, mousemove) and reports lastActiveAt.
 *
 * Usage: call once in the dashboard layout.
 */
export function usePresenceHeartbeat() {
  const { activeSeller } = useSeller();
  const sellerId = activeSeller?.sellerId;

  // Track the latest activity timestamp
  const lastActivityRef = useRef<number>(Date.now());
  const activityThrottleRef = useRef<number>(0);

  // Update activity timestamp (throttled)
  const onActivity = useCallback(() => {
    const now = Date.now();
    if (now - activityThrottleRef.current < ACTIVITY_THROTTLE_MS) return;
    activityThrottleRef.current = now;
    lastActivityRef.current = now;
  }, []);

  // Send heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!sellerId) return;

    const body: { lastActiveAt?: string } = {};

    // Include lastActiveAt if activity happened within the last 2 minutes
    const activityAge = Date.now() - lastActivityRef.current;
    if (activityAge < 2 * 60 * 1000) {
      body.lastActiveAt = new Date(lastActivityRef.current).toISOString();
    }

    try {
      await authedFetch(
        `${API_URL}/seller/${sellerId}/presence/heartbeat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
    } catch {
      // Silently ignore — presence is non-critical
    }
  }, [sellerId]);

  useEffect(() => {
    if (!sellerId) return;

    // Activity event listeners
    const events: Array<keyof DocumentEventMap> = [
      "keydown",
      "pointerdown",
      "scroll",
      "mousemove",
    ];

    events.forEach((evt) => document.addEventListener(evt, onActivity, { passive: true }));

    // Visibility change: mark activity when tab becomes visible
    function onVisibility() {
      if (document.visibilityState === "visible") {
        onActivity();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    // Send initial heartbeat immediately
    sendHeartbeat();

    // Interval
    const interval = setInterval(() => {
      // Don't send when tab is hidden
      if (document.visibilityState === "hidden") return;
      sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      events.forEach((evt) => document.removeEventListener(evt, onActivity));
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
  }, [sellerId, onActivity, sendHeartbeat]);
}
