'use client';

import * as React from 'react';
import {
  BookOpen,
  Settings2,
  SquareTerminal,
  ShoppingCart,
  UserPlus,
  Users,
} from 'lucide-react';

import { NavMain } from '@workspace/ui/components/nav-main';
import { NavUser } from '@workspace/ui/components/nav-user';
import {
  Avatar,
  AvatarFallback,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  Select,
  Badge,
  Alert,
} from '@workspace/ui';
import { useToast } from '@workspace/ui/hooks/use-toast';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@workspace/ui/components/sidebar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useSeller } from '@/components/seller-provider';
import { ROLE_LABELS, ASSIGNABLE_ROLES, ROLE_PERMISSIONS } from '@/lib/permissions';
import { inviteMember, getTeamMembers } from '@/lib/team-api';
import { usePresence } from '@/components/presence-provider';
import type { SellerTeamRole, SellerTeamMember } from '@workspace/contracts';

// ============================================
// Inline Invite Dialog (opened from sidebar header)
// ============================================

function SidebarInviteDialog({
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
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<SellerTeamRole>('SUPPORT');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function reset() {
    setEmail('');
    setRole('SUPPORT');
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
        title: 'Invite sent',
        description: `Invitation sent to ${email} as ${ROLE_LABELS[role]}.`,
      });
      handleOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            They&apos;ll get an email to join your team.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant='destructive'>
            <p className='text-sm'>{error}</p>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='sidebar-invite-email'>Email</Label>
            <Input
              id='sidebar-invite-email'
              type='email'
              placeholder='colleague@example.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete='email'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='sidebar-invite-role'>Role</Label>
            <Select
              id='sidebar-invite-role'
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
          <div className='rounded-md border border-border p-3 space-y-1.5'>
            <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
              Permissions
            </p>
            <div className='flex flex-wrap gap-1'>
              {(ROLE_PERMISSIONS[role] ?? []).map((perm) => (
                <Badge key={perm} variant='secondary' className='text-xs'>
                  {perm}
                </Badge>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Sidebar Team Header
// ============================================

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

const PRESENCE_DOT_COLORS: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-muted-foreground/40',
};

function SidebarTeamHeader() {
  const { state: sidebarState } = useSidebar();
  const { activeSeller, hasPermission } = useSeller();
  const { presenceMap, onlineCount } = usePresence();
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [teamMembers, setTeamMembers] = React.useState<SellerTeamMember[]>([]);
  const router = useRouter();

  const sellerId = activeSeller?.sellerId;
  const canManage = hasPermission('team.manage');
  const isCollapsed = sidebarState === 'collapsed';

  // Fetch team members
  const refreshTeam = React.useCallback(() => {
    if (!sellerId) return;
    getTeamMembers(sellerId)
      .then((data) => setTeamMembers(data.members))
      .catch(() => {});
  }, [sellerId]);

  React.useEffect(() => {
    refreshTeam();
  }, [refreshTeam]);

  const previewMembers = teamMembers.slice(0, 4);

  // When collapsed, show only a single icon button
  if (isCollapsed) {
    return (
      <div className='flex items-center justify-center py-2'>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 relative'
          onClick={() => router.push('/settings/team')}
          aria-label='Team'
        >
          <Users className='h-4 w-4' />
          {onlineCount > 0 && (
            <span className='absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[9px] font-bold text-white ring-2 ring-sidebar'>
              {onlineCount}
            </span>
          )}
        </Button>
      </div>
    );
  }

  // Expanded state
  return (
    <div className='px-3 py-3 space-y-3'>
      {/* Seller name + online badge */}
      <div className='px-1 flex items-start justify-between'>
        <div className='min-w-0'>
          <p className='text-sm font-semibold text-foreground truncate'>
            {activeSeller?.sellerName ?? 'My Store'}
          </p>
          <p className='text-xs text-muted-foreground'>
            {activeSeller?.role ? ROLE_LABELS[activeSeller.role] : ''}
          </p>
        </div>
        {onlineCount > 0 && (
          <span className='inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400 shrink-0 mt-0.5'>
            <span className='h-1.5 w-1.5 rounded-full bg-green-500' />
            {onlineCount}
          </span>
        )}
      </div>

      {/* Team row: avatars with presence dots + member count + invite button */}
      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={() => router.push('/settings/team')}
          className='flex items-center gap-1.5 group cursor-pointer bg-transparent border-0 p-0'
          aria-label='View team'
        >
          <div className='flex -space-x-1.5'>
            {previewMembers.map((m) => {
              const status = presenceMap[m.userId]?.status ?? 'offline';
              return (
                <div key={m.id} className='relative'>
                  <Avatar size='sm' className='ring-2 ring-sidebar'>
                    <AvatarFallback>
                      {getInitials(m.user.name, m.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 block h-2 w-2 rounded-full ring-[1.5px] ring-sidebar ${PRESENCE_DOT_COLORS[status]}`}
                  />
                </div>
              );
            })}
            {previewMembers.length === 0 && (
              <Avatar size='sm' className='ring-2 ring-sidebar'>
                <AvatarFallback>
                  <Users className='h-3 w-3' />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <span className='text-xs text-muted-foreground group-hover:text-foreground transition-colors'>
            {teamMembers.length === 0
              ? 'Team'
              : `${teamMembers.length} member${teamMembers.length !== 1 ? 's' : ''}`}
          </span>
        </button>

        <div className='flex-1' />

        {canManage && sellerId && (
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 shrink-0'
            onClick={() => setInviteOpen(true)}
            aria-label='Add team member'
          >
            <UserPlus className='h-4 w-4' />
          </Button>
        )}
      </div>

      {/* Invite dialog */}
      {sellerId && (
        <SidebarInviteDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          sellerId={sellerId}
          onSuccess={refreshTeam}
        />
      )}
    </div>
  );
}

// ============================================
// Static nav items
// ============================================

const STATIC_NAV = [
  {
    title: 'Offers',
    url: '/products',
    icon: SquareTerminal,
    isActive: true,
    items: [
      { title: 'All Offers', url: '/products' },
      { title: 'New Offer', url: '/products/new' },
    ],
  },
  {
    title: 'Orders',
    url: '/orders',
    icon: ShoppingCart,
    items: [{ title: 'All Orders', url: '/orders' }],
  },
];

// ============================================
// AppSidebar
// ============================================

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading, logout } = useAuth();
  const { hasPermission } = useSeller();
  const router = useRouter();

  const navMain = React.useMemo(() => {
    const settingsItems = [
      { title: 'Identity', url: '/settings/identity' },
      { title: 'Team', url: '/settings/team' },
      { title: 'Payments', url: '/settings/payments' },
    ];

    if (hasPermission('payouts.manage')) {
      settingsItems.push({ title: 'Billing', url: '#' });
    }

    return [
      ...STATIC_NAV,
      {
        title: 'Settings',
        url: '#',
        icon: Settings2,
        items: settingsItems,
      },
      {
        title: 'Documentation',
        url: '/docs',
        icon: BookOpen,
        items: [{ title: 'Get Started', url: '/docs' }],
      },
    ];
  }, [hasPermission]);

  const navUser = React.useMemo(() => {
    if (!user) return null;
    const displayName =
      user.displayName || user.email.split('@')[0] || user.email;
    return { name: displayName, email: user.email };
  }, [user]);

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <SidebarTeamHeader />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={navUser}
          isLoading={isLoading}
          onLogout={logout}
          onAccountClick={() => router.push('/account')}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
