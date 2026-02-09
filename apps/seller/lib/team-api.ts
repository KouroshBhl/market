/**
 * Seller Team API helpers — invite, role change, remove, memberships.
 */

import type {
  GetSellerTeamResponse,
  InviteMemberResponse,
  ChangeRoleResponse,
  RemoveMemberResponse,
  GetMembershipsResponse,
  RevokeInviteResponse,
  AcceptInviteResponse,
  SellerTeamRole,
} from "@workspace/contracts";
import { authedFetch } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ============================================
// Team Members
// ============================================

export async function getTeamMembers(
  sellerId: string,
): Promise<GetSellerTeamResponse> {
  const res = await authedFetch(`${API_URL}/seller/${sellerId}/members`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch team members");
  }
  return res.json();
}

export async function inviteMember(
  sellerId: string,
  email: string,
  role: SellerTeamRole,
): Promise<InviteMemberResponse> {
  const res = await authedFetch(`${API_URL}/seller/${sellerId}/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to invite member");
  }
  return res.json();
}

export async function changeMemberRole(
  sellerId: string,
  userId: string,
  role: SellerTeamRole,
): Promise<ChangeRoleResponse> {
  const res = await authedFetch(
    `${API_URL}/seller/${sellerId}/members/${userId}/role`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to change role");
  }
  return res.json();
}

export async function removeMember(
  sellerId: string,
  userId: string,
): Promise<RemoveMemberResponse> {
  const res = await authedFetch(
    `${API_URL}/seller/${sellerId}/members/${userId}`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to remove member");
  }
  return res.json();
}

// ============================================
// Invites
// ============================================

export async function resendInvite(
  sellerId: string,
  inviteId: string,
): Promise<{ success: boolean }> {
  const res = await authedFetch(
    `${API_URL}/seller/${sellerId}/invites/${inviteId}/resend`,
    { method: "POST" },
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to resend invite");
  }
  return res.json();
}

export async function revokeInvite(
  sellerId: string,
  inviteId: string,
): Promise<RevokeInviteResponse> {
  const res = await authedFetch(
    `${API_URL}/seller/${sellerId}/invites/${inviteId}`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to revoke invite");
  }
  return res.json();
}

export async function acceptInvite(
  token: string,
): Promise<AcceptInviteResponse> {
  const res = await authedFetch(`${API_URL}/invite/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to accept invite");
  }
  return res.json();
}

// ============================================
// Presence
// ============================================

export interface PresenceEntry {
  userId: string;
  lastSeenAt: string;
  lastActiveAt: string | null;
  status: "online" | "away" | "offline";
}

export async function getPresenceList(
  sellerId: string,
): Promise<{ presences: PresenceEntry[] }> {
  const res = await authedFetch(`${API_URL}/seller/${sellerId}/presence`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch presence");
  }
  return res.json();
}

// ============================================
// Memberships (seller switcher)
// ============================================

export async function getUserMemberships(): Promise<GetMembershipsResponse> {
  const res = await authedFetch(`${API_URL}/user/memberships`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch memberships");
  }
  return res.json();
}
