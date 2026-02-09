import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@workspace/db';

export type PresenceStatus = 'online' | 'away' | 'offline';

interface PresenceEntry {
  userId: string;
  lastSeenAt: string;
  lastActiveAt: string | null;
  status: PresenceStatus;
}

// Thresholds
const OFFLINE_THRESHOLD_MS = 90 * 1000;   // 90 seconds
const AWAY_THRESHOLD_MS = 2 * 60 * 1000;  // 2 minutes
const MIN_HEARTBEAT_INTERVAL_MS = 10 * 1000; // 10 seconds

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  // In-memory rate-limit map: `${sellerId}:${userId}` → last heartbeat time
  private readonly lastHeartbeat = new Map<string, number>();

  /**
   * Upsert heartbeat for a seller member.
   * Rate-limited: ignores calls within MIN_HEARTBEAT_INTERVAL_MS of the last one.
   */
  async heartbeat(
    sellerId: string,
    userId: string,
    lastActiveAt?: string,
  ): Promise<{ sellerId: string; userId: string; lastSeenAt: string; lastActiveAt: string | null }> {
    const key = `${sellerId}:${userId}`;
    const now = Date.now();
    const last = this.lastHeartbeat.get(key) ?? 0;

    if (now - last < MIN_HEARTBEAT_INTERVAL_MS) {
      // Throttled — return current record without writing
      const existing = await prisma.sellerPresence.findUnique({
        where: { sellerId_userId: { sellerId, userId } },
      });
      return {
        sellerId,
        userId,
        lastSeenAt: existing?.lastSeenAt?.toISOString() ?? new Date().toISOString(),
        lastActiveAt: existing?.lastActiveAt?.toISOString() ?? null,
      };
    }

    this.lastHeartbeat.set(key, now);

    // Build update data
    const data: any = {
      lastSeenAt: new Date(),
    };

    // Only update lastActiveAt if provided and newer than stored
    if (lastActiveAt) {
      const incoming = new Date(lastActiveAt);
      if (!isNaN(incoming.getTime())) {
        data.lastActiveAt = incoming;
      }
    }

    const record = await prisma.sellerPresence.upsert({
      where: { sellerId_userId: { sellerId, userId } },
      create: {
        sellerId,
        userId,
        lastSeenAt: data.lastSeenAt,
        lastActiveAt: data.lastActiveAt ?? null,
      },
      update: data,
    });

    return {
      sellerId: record.sellerId,
      userId: record.userId,
      lastSeenAt: record.lastSeenAt.toISOString(),
      lastActiveAt: record.lastActiveAt?.toISOString() ?? null,
    };
  }

  /**
   * Get presence list for all members of a seller.
   * Status is computed server-side.
   */
  async getPresenceList(sellerId: string): Promise<PresenceEntry[]> {
    const records = await prisma.sellerPresence.findMany({
      where: { sellerId },
    });

    const now = Date.now();

    return records.map((r) => {
      const seenAgo = now - r.lastSeenAt.getTime();
      const activeAgo = r.lastActiveAt
        ? now - r.lastActiveAt.getTime()
        : Infinity;

      let status: PresenceStatus;
      if (seenAgo > OFFLINE_THRESHOLD_MS) {
        status = 'offline';
      } else if (activeAgo > AWAY_THRESHOLD_MS) {
        status = 'away';
      } else {
        status = 'online';
      }

      return {
        userId: r.userId,
        lastSeenAt: r.lastSeenAt.toISOString(),
        lastActiveAt: r.lastActiveAt?.toISOString() ?? null,
        status,
      };
    });
  }
}
