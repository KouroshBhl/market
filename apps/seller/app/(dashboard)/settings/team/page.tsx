"use client";

import * as React from "react";
import {
  Card,
  Button,
  Input,
  Label,
  Select,
  Badge,
  Alert,
  Avatar,
  AvatarFallback,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Skeleton,
  SidebarTrigger,
  Separator,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui";
import { useToast } from "@workspace/ui/hooks/use-toast";
import { useSeller } from "@/components/seller-provider";
import { useAuth } from "@/components/auth-provider";
import {
  getTeamMembers,
  inviteMember,
  changeMemberRole,
  removeMember,
  revokeInvite,
  resendInvite,
} from "@/lib/team-api";
import { usePresence } from "@/components/presence-provider";
import { ROLE_LABELS, ASSIGNABLE_ROLES, ROLE_PERMISSIONS } from "@/lib/permissions";
import type {
  SellerTeamMember,
  SellerInvite,
  SellerTeamRole,
} from "@workspace/contracts";
import { UserPlus, Shield, Trash2, Clock, Users, Mail, RotateCw } from "lucide-react";

// ============================================
// Invite Dialog
// ============================================

function InviteDialog({
  open,
  onOpenChange,
  sellerId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<SellerTeamRole>("SUPPORT");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function reset() {
    setEmail("");
    setRole("SUPPORT");
    setError(null);
    setIsSubmitting(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await inviteMember(sellerId, email, role);
      toast({
        title: "Invite sent",
        description: `Invitation sent to ${email} as ${ROLE_LABELS[role]}.`,
      });
      handleOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setIsSubmitting(false);
    }
  }

  const roleDescription: Record<string, string> = {
    ADMIN: "Full access except billing and payouts.",
    OPS: "Can manage orders (resend, refund, cancel).",
    CATALOG: "Can manage offers, products, and keys.",
    SUPPORT: "Read-only access to orders and customers.",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            Send an invitation email. The recipient will need to accept it to
            join your team.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <p className="text-sm">{error}</p>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as SellerTeamRole)}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              {roleDescription[role] ?? ""}
            </p>
          </div>

          {/* Permission preview for selected role */}
          <div className="rounded-md border border-border p-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Permissions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(ROLE_PERMISSIONS[role] ?? []).map((perm) => (
                <Badge key={perm} variant="secondary" className="text-xs">
                  {perm}
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Mail className="h-4 w-4 mr-2" />
              {isSubmitting ? "Sending..." : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Change Role Dialog
// ============================================

function ChangeRoleDialog({
  open,
  onOpenChange,
  sellerId,
  member,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  member: SellerTeamMember | null;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [role, setRole] = React.useState<SellerTeamRole>("SUPPORT");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (member && member.role !== "OWNER") {
      setRole(member.role);
    }
  }, [member]);

  function reset() {
    setError(null);
    setIsSubmitting(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await changeMemberRole(sellerId, member.userId, role);
      toast({
        title: "Role updated",
        description: `${member.user.name || member.user.email} is now ${ROLE_LABELS[role]}.`,
      });
      handleOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change role");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            Update the role for{" "}
            <span className="font-medium text-foreground">
              {member.user.name || member.user.email}
            </span>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <p className="text-sm">{error}</p>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="change-role">New role</Label>
            <Select
              id="change-role"
              value={role}
              onChange={(e) => setRole(e.target.value as SellerTeamRole)}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </div>

          {/* Permission preview */}
          <div className="rounded-md border border-border p-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Permissions for {ROLE_LABELS[role]}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(ROLE_PERMISSIONS[role] ?? []).map((perm) => (
                <Badge key={perm} variant="secondary" className="text-xs">
                  {perm}
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || role === member.role}>
              {isSubmitting ? "Saving..." : "Save role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Confirm Remove Dialog
// ============================================

function RemoveDialog({
  open,
  onOpenChange,
  sellerId,
  member,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  member: SellerTeamMember | null;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setError(null);
      setIsSubmitting(false);
    }
    onOpenChange(next);
  }

  async function handleConfirm() {
    if (!member) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await removeMember(sellerId, member.userId);
      toast({
        title: "Member removed",
        description: `${member.user.name || member.user.email} has been removed from the team.`,
      });
      handleOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove team member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove{" "}
            <span className="font-medium text-foreground">
              {member.user.name || member.user.email}
            </span>{" "}
            from the team? They will lose all access to this organization
            immediately.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <p className="text-sm">{error}</p>
          </Alert>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Removing..." : "Remove member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Role Badge
// ============================================

function RoleBadge({ role }: { role: SellerTeamRole }) {
  const variantMap: Record<SellerTeamRole, "default" | "secondary" | "outline"> = {
    OWNER: "default",
    ADMIN: "secondary",
    OPS: "outline",
    CATALOG: "outline",
    SUPPORT: "outline",
  };
  return <Badge variant={variantMap[role]}>{ROLE_LABELS[role]}</Badge>;
}

// ============================================
// Helpers
// ============================================

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

// ============================================
// Presence helpers
// ============================================

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-500",
  away: "bg-yellow-500",
  offline: "bg-muted-foreground/40",
};

function PresenceDot({ status }: { status: string }) {
  return (
    <span
      className={`absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full ring-2 ring-card ${STATUS_COLORS[status] ?? STATUS_COLORS.offline}`}
      title={status}
    />
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ============================================
// Page shell (header bar matching other dashboard pages)
// ============================================

function TeamPageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Settings</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Team</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          {children}
        </div>
      </div>
    </>
  );
}

// ============================================
// Team Page
// ============================================

export default function TeamPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { activeSeller, hasPermission, isLoading: sellerLoading } = useSeller();
  const { toast } = useToast();

  const [members, setMembers] = React.useState<SellerTeamMember[]>([]);
  const [invites, setInvites] = React.useState<SellerInvite[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // Shared presence from context (polled by PresenceProvider)
  const { presenceMap, onlineCount } = usePresence();

  // Dialog states
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [changeRoleMember, setChangeRoleMember] =
    React.useState<SellerTeamMember | null>(null);
  const [removeMemberTarget, setRemoveMemberTarget] =
    React.useState<SellerTeamMember | null>(null);

  const sellerId = activeSeller?.sellerId;
  const canManage = hasPermission("team.manage");

  // Fetch team data
  const fetchTeam = React.useCallback(async () => {
    if (!sellerId) {
      // No seller selected — stop loading immediately
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(null);

    try {
      const data = await getTeamMembers(sellerId);
      setMembers(data.members);
      setInvites(data.invites);
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to load team",
      );
    } finally {
      setIsLoading(false);
    }
  }, [sellerId]);

  React.useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // ---- Auth/Seller still loading ----
  if (authLoading || sellerLoading) {
    return (
      <TeamPageShell>
        <Skeleton className="h-8 w-40" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card>
      </TeamPageShell>
    );
  }

  // ---- No seller profile ----
  if (!sellerId) {
    return (
      <TeamPageShell>
        <h1 className="text-2xl font-bold text-foreground">Team</h1>
        <Card className="p-12 flex flex-col items-center text-center">
          <Users className="h-10 w-10 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold text-foreground">
            No organization selected
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Set up your seller profile first to manage your team.
          </p>
        </Card>
      </TeamPageShell>
    );
  }

  // ---- Fetching team data ----
  if (isLoading) {
    return (
      <TeamPageShell>
        <h1 className="text-2xl font-bold text-foreground">Team</h1>
        <Card className="p-6 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card>
      </TeamPageShell>
    );
  }

  // ---- Fetch error ----
  if (fetchError) {
    return (
      <TeamPageShell>
        <h1 className="text-2xl font-bold text-foreground">Team</h1>
        <Card className="p-12 flex flex-col items-center text-center">
          <Alert variant="destructive" className="mb-4">
            <p className="text-sm">{fetchError}</p>
          </Alert>
          <Button variant="outline" onClick={fetchTeam}>
            Retry
          </Button>
        </Card>
      </TeamPageShell>
    );
  }

  return (
    <TeamPageShell>
      {/* ---- Page header ---- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage who has access to{" "}
            <span className="font-medium text-foreground">
              {activeSeller?.sellerDisplayName}
            </span>
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite member
          </Button>
        )}
      </div>

      {/* ---- Members ---- */}
      <Card>
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">
              Members
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {members.length}
              </span>
            </h2>
            {onlineCount > 0 && (
              <Badge variant="success" className="text-xs">
                {onlineCount} online
              </Badge>
            )}
          </div>
        </div>

        {members.length === 0 ? (
          <div className="px-6 pb-8 pt-4 flex flex-col items-center text-center">
            <Users className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No team members yet. Invite someone to get started.
            </p>
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setInviteOpen(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Invite member
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Member</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {canManage && (
                  <TableHead className="text-right pr-6">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isOwner = member.role === "OWNER";
                const isSelf = member.userId === user?.id;
                const presence = presenceMap[member.userId];
                const status = presence?.status ?? "offline";

                return (
                  <TableRow key={member.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar size="sm">
                            <AvatarFallback>
                              {getInitials(member.user.name, member.user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <PresenceDot status={status} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {member.user.name || member.user.email.split("@")[0]}
                            {isSelf && (
                              <span className="ml-1.5 text-xs text-muted-foreground">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {presence
                              ? status === "online"
                                ? "Active now"
                                : status === "away"
                                  ? `Active ${timeAgo(presence.lastActiveAt)}`
                                  : `Seen ${timeAgo(presence.lastSeenAt)}`
                              : member.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs capitalize text-muted-foreground">
                        <span className={`inline-block h-2 w-2 rounded-full ${STATUS_COLORS[status]}`} />
                        {status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={member.role} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right pr-6">
                        {!isOwner && !isSelf ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setChangeRoleMember(member)}
                              aria-label={`Change role for ${member.user.email}`}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Role
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRemoveMemberTarget(member)}
                              aria-label={`Remove ${member.user.email}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            &mdash;
                          </span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* ---- Pending Invites ---- */}
      {canManage && invites.length > 0 && (
        <Card>
          <div className="px-6 pt-5 pb-3">
            <h2 className="text-base font-semibold text-foreground">
              Pending invites
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {invites.length}
              </span>
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground">
                        {invite.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={invite.role} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (!sellerId) return;
                          resendInvite(sellerId, invite.id)
                            .then(() => {
                              toast({
                                title: "Invite resent",
                                description: `A new invitation email was sent to ${invite.email}.`,
                              });
                              fetchTeam();
                            })
                            .catch((err) => {
                              toast({
                                title: "Error",
                                description:
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to resend invite",
                              });
                            });
                        }}
                        aria-label={`Resend invite to ${invite.email}`}
                      >
                        <RotateCw className="h-4 w-4 mr-1" />
                        Resend
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (!sellerId) return;
                          revokeInvite(sellerId, invite.id)
                            .then(() => {
                              toast({
                                title: "Invite revoked",
                                description: `Invitation to ${invite.email} has been revoked.`,
                              });
                              fetchTeam();
                            })
                            .catch((err) => {
                              toast({
                                title: "Error",
                                description:
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to revoke invite",
                              });
                            });
                        }}
                        aria-label={`Revoke invite for ${invite.email}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ---- Dialogs ---- */}
      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        sellerId={sellerId}
        onSuccess={fetchTeam}
      />

      <ChangeRoleDialog
        open={!!changeRoleMember}
        onOpenChange={(open) => {
          if (!open) setChangeRoleMember(null);
        }}
        sellerId={sellerId}
        member={changeRoleMember}
        onSuccess={fetchTeam}
      />

      <RemoveDialog
        open={!!removeMemberTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveMemberTarget(null);
        }}
        sellerId={sellerId}
        member={removeMemberTarget}
        onSuccess={fetchTeam}
      />
    </TeamPageShell>
  );
}
