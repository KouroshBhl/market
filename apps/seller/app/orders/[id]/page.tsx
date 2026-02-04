'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Badge, Card, Alert, AlertDescription, Label, Select } from '@workspace/ui';
import { ArrowLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';

type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
type WorkState = 'UNASSIGNED' | 'IN_PROGRESS' | 'DONE' | null;

interface TeamMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'STAFF';
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface OrderDetails {
  order: {
    id: string;
    buyerId: string;
    sellerId: string;
    offerId: string;
    status: OrderStatus;
    basePriceAmount: number;
    platformFeeBpsSnapshot: number;
    feeAmount: number;
    buyerTotalAmount: number;
    currency: string;
    paidAt: string | null;
    fulfilledAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
    requirementsPayload: Record<string, unknown> | null;
    assignedToUserId: string | null;
    workState: WorkState;
    assignedTo: {
      id: string;
      email: string;
      name: string | null;
    } | null;
  };
  offer: {
    id: string;
    deliveryType: string;
    deliveryInstructions: string | null;
    estimatedDeliveryMinutes: number | null;
  };
  requirementTemplate: {
    id: string;
    name: string;
    fields: Array<{
      key: string;
      label: string;
      type: string;
      sensitive: boolean;
    }>;
  } | null;
}

const DEMO_SELLER_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_USER_ID = 'u0000000-0000-0000-0000-000000000001'; // Demo owner
const DEMO_ROLE = 'OWNER'; // Demo: will come from auth

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const queryClient = useQueryClient();
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');

  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ['seller-order', orderId],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:4000/orders/seller/${orderId}?sellerId=${DEMO_SELLER_ID}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      return response.json() as Promise<OrderDetails>;
    },
  });

  const { data: teamData } = useQuery({
    queryKey: ['seller-team', DEMO_SELLER_ID],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:4000/seller/team?sellerId=${DEMO_SELLER_ID}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch team');
      }
      return response.json() as Promise<{ members: TeamMember[] }>;
    },
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `http://localhost:4000/orders/seller/orders/${orderId}/claim?sellerId=${DEMO_SELLER_ID}&userId=${DEMO_USER_ID}`,
        {
          method: 'POST',
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to claim order');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Optimistically update the order details cache
      queryClient.setQueryData(['seller-order', orderId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          order: {
            ...old.order,
            assignedToUserId: DEMO_USER_ID,
            workState: 'IN_PROGRESS',
            assignedAt: new Date().toISOString(),
            assignedTo: {
              id: DEMO_USER_ID,
              email: 'owner@seller.com',
              name: 'John Doe (Owner)',
            },
          },
        };
      });
      // Invalidate list to refresh
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
    },
  });

  const reassignMutation = useMutation({
    mutationFn: async (assignedToUserId: string) => {
      const response = await fetch(
        `http://localhost:4000/orders/seller/orders/${orderId}/assignee?sellerId=${DEMO_SELLER_ID}&userId=${DEMO_USER_ID}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedToUserId }),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reassign order');
      }
      return response.json();
    },
    onSuccess: (data, assignedToUserId) => {
      // Find the team member
      const member = teamData?.members.find((m) => m.userId === assignedToUserId);
      
      // Optimistically update the order details cache
      queryClient.setQueryData(['seller-order', orderId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          order: {
            ...old.order,
            assignedToUserId,
            workState: 'IN_PROGRESS',
            assignedAt: new Date().toISOString(),
            assignedTo: member ? {
              id: member.userId,
              email: member.user.email,
              name: member.user.name,
            } : null,
          },
        };
      });
      // Invalidate list to refresh
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      setSelectedAssignee('');
    },
  });

  const fulfillMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `http://localhost:4000/orders/${orderId}/fulfill-manual?sellerId=${DEMO_SELLER_ID}&userId=${DEMO_USER_ID}`,
        {
          method: 'POST',
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fulfill order');
      }
      return response.json();
    },
    onSuccess: () => {
      // Optimistically update the order details cache
      queryClient.setQueryData(['seller-order', orderId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          order: {
            ...old.order,
            status: 'FULFILLED',
            workState: 'DONE',
            fulfilledAt: new Date().toISOString(),
          },
        };
      });
      // Invalidate list to refresh
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
    },
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return <Badge variant="secondary">Pending Payment</Badge>;
      case 'PAID':
        return <Badge className="bg-blue-500">Paid</Badge>;
      case 'FULFILLED':
        return <Badge variant="success">Fulfilled</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'EXPIRED':
        return <Badge variant="secondary">Expired</Badge>;
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading order...</p>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load order. {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href="/orders">
              <ArrowLeft className="mr-2 size-4" />
              Back to Orders
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { order, offer, requirementTemplate } = orderData;

  // DEBUG: Log assignment state (REMOVE AFTER FIX VERIFIED)
  console.log('🔍 DEBUG Order Assignment State:', {
    orderId: order.id,
    status: order.status,
    deliveryType: offer.deliveryType,
    assignedToUserId: order.assignedToUserId,
    currentUserId: DEMO_USER_ID,
    currentUserRole: DEMO_ROLE,
    workState: order.workState,
    assignedTo: order.assignedTo,
  });

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/orders">
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-foreground text-2xl font-bold">Order Details</h1>
          <p className="text-muted-foreground text-sm">Order ID: {order.id}</p>
        </div>
        <div>{getStatusBadge(order.status)}</div>
      </div>

      {/* Status Timeline */}
      <Card className="p-6">
        <h2 className="text-foreground mb-4 font-semibold">Status Timeline</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-muted-foreground size-5" />
            <div>
              <div className="text-foreground text-sm font-medium">Created</div>
              <div className="text-muted-foreground text-xs">{formatDate(order.createdAt)}</div>
            </div>
          </div>
          <div className="border-border h-px flex-1 border-t" />
          <div className="flex items-center gap-2">
            {order.paidAt ? (
              <CheckCircle className="text-success size-5" />
            ) : (
              <Clock className="text-muted-foreground size-5" />
            )}
            <div>
              <div className="text-foreground text-sm font-medium">Paid</div>
              <div className="text-muted-foreground text-xs">{formatDate(order.paidAt)}</div>
            </div>
          </div>
          <div className="border-border h-px flex-1 border-t" />
          <div className="flex items-center gap-2">
            {order.fulfilledAt ? (
              <CheckCircle className="text-success size-5" />
            ) : (
              <Clock className="text-muted-foreground size-5" />
            )}
            <div>
              <div className="text-foreground text-sm font-medium">Fulfilled</div>
              <div className="text-muted-foreground text-xs">{formatDate(order.fulfilledAt)}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Assignment Section */}
      {order.status === 'PAID' && (
        <Card className="p-6">
          <h2 className="text-foreground mb-4 font-semibold">Assignment</h2>
          <div className="space-y-4">
            {!order.assignedToUserId ? (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Badge variant="outline">Unassigned</Badge>
                  <p className="text-muted-foreground mt-2 text-sm">
                    This order needs to be claimed by a team member
                  </p>
                </div>
                <Button
                  onClick={() => claimMutation.mutate()}
                  disabled={claimMutation.isPending}
                >
                  {claimMutation.isPending ? 'Claiming...' : 'Claim Order'}
                </Button>
              </div>
            ) : (
              <div>
                <Label className="text-muted-foreground text-sm">Assigned To</Label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex-1">
                    {order.assignedTo && (
                      <div className="flex items-center gap-2">
                        {order.assignedTo.id === DEMO_USER_ID ? (
                          <Badge variant="secondary">Me</Badge>
                        ) : (
                          <span className="text-foreground font-medium">
                            {order.assignedTo.name || order.assignedTo.email}
                          </span>
                        )}
                        {order.workState === 'IN_PROGRESS' && (
                          <Badge className="bg-blue-500">In Progress</Badge>
                        )}
                        {order.workState === 'DONE' && (
                          <Badge variant="success">Done</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {DEMO_ROLE === 'OWNER' && teamData && (
                    <div className="flex items-center gap-2">
                      <Select 
                        value={selectedAssignee} 
                        onChange={(e) => setSelectedAssignee(e.target.value)}
                        className="w-[200px]"
                      >
                        <option value="">Reassign to...</option>
                        {teamData.members.map((member) => (
                          <option key={member.userId} value={member.userId}>
                            {member.user.name || member.user.email}
                            {member.role === 'OWNER' && ' (Owner)'}
                          </option>
                        ))}
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => selectedAssignee && reassignMutation.mutate(selectedAssignee)}
                        disabled={!selectedAssignee || reassignMutation.isPending}
                      >
                        {reassignMutation.isPending ? 'Reassigning...' : 'Reassign'}
                      </Button>
                    </div>
                  )}
                </div>
                {claimMutation.isError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>
                      {claimMutation.error instanceof Error
                        ? claimMutation.error.message
                        : 'Failed to claim order'}
                    </AlertDescription>
                  </Alert>
                )}
                {reassignMutation.isError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>
                      {reassignMutation.error instanceof Error
                        ? reassignMutation.error.message
                        : 'Failed to reassign order'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Order Information */}
      <Card className="p-6">
        <h2 className="text-foreground mb-4 font-semibold">Order Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-muted-foreground text-sm">Delivery Type</Label>
            <p className="text-foreground font-medium">{offer.deliveryType}</p>
          </div>
          {offer.deliveryType === 'MANUAL' && offer.estimatedDeliveryMinutes && (
            <div>
              <Label className="text-muted-foreground text-sm">SLA</Label>
              <p className="text-foreground font-medium">
                {offer.estimatedDeliveryMinutes < 60
                  ? `${offer.estimatedDeliveryMinutes} minutes`
                  : `${Math.round(offer.estimatedDeliveryMinutes / 60)} hours`}
              </p>
            </div>
          )}
          <div>
            <Label className="text-muted-foreground text-sm">Buyer Paid</Label>
            <p className="text-foreground font-medium">
              {formatPrice(order.buyerTotalAmount, order.currency)}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Your Revenue</Label>
            <p className="text-foreground font-medium">
              {formatPrice(order.basePriceAmount, order.currency)}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Platform Fee</Label>
            <p className="text-foreground font-medium">
              {formatPrice(order.feeAmount, order.currency)} (
              {order.platformFeeBpsSnapshot / 100}%)
            </p>
          </div>
        </div>
      </Card>

      {/* Delivery Instructions (for seller) */}
      {offer.deliveryType === 'MANUAL' && offer.deliveryInstructions && (
        <Card className="p-6">
          <h2 className="text-foreground mb-4 font-semibold">Your Delivery Instructions</h2>
          <p className="text-foreground whitespace-pre-wrap">{offer.deliveryInstructions}</p>
        </Card>
      )}

      {/* Buyer Requirements */}
      {requirementTemplate && order.requirementsPayload && (
        <Card className="p-6">
          <h2 className="text-foreground mb-4 font-semibold">Buyer Information</h2>
          <div className="space-y-4">
            {requirementTemplate.fields.map((field) => {
              const value = order.requirementsPayload?.[field.key];
              if (value === undefined || value === null) return null;

              return (
                <div key={field.key}>
                  <Label className="text-muted-foreground text-sm">
                    {field.label}
                    {field.sensitive && (
                      <Badge variant="destructive" className="ml-2">
                        Sensitive
                      </Badge>
                    )}
                  </Label>
                  <div className="bg-muted text-foreground mt-1 rounded-md p-3 font-mono text-sm">
                    {String(value)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Actions */}
      {order.status === 'PAID' && offer.deliveryType === 'MANUAL' && (
        <Card className="border-primary bg-accent p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-primary mt-1 size-6" />
            <div className="flex-1">
              <h3 className="text-foreground font-semibold">Action Required</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                This order requires manual fulfillment. Review the buyer information above and
                deliver the product according to your instructions.
              </p>
              
              {/* Authorization check */}
              {(() => {
                const isAssignee = order.assignedToUserId === DEMO_USER_ID;
                const isOwner = DEMO_ROLE === 'OWNER';
                const canFulfill = isAssignee || isOwner;
                const isAssignedToSomeoneElse = order.assignedToUserId && !isAssignee;

                if (!order.assignedToUserId) {
                  return (
                    <Alert className="mt-4">
                      <AlertDescription>
                        Claim this order first before fulfilling.
                      </AlertDescription>
                    </Alert>
                  );
                }

                if (isAssignedToSomeoneElse && !isOwner) {
                  return (
                    <Alert className="mt-4">
                      <AlertDescription>
                        This order is assigned to {order.assignedTo?.name || order.assignedTo?.email}.
                        Only the assignee or team owner can fulfill it.
                      </AlertDescription>
                    </Alert>
                  );
                }

                return (
                  <div className="mt-4">
                    <Button
                      onClick={() => fulfillMutation.mutate()}
                      disabled={fulfillMutation.isPending || !canFulfill}
                    >
                      {fulfillMutation.isPending ? 'Marking Fulfilled...' : 'Mark as Fulfilled'}
                    </Button>
                    {isOwner && isAssignedToSomeoneElse && (
                      <p className="text-muted-foreground mt-2 text-xs">
                        You can fulfill as team owner even though it's assigned to someone else
                      </p>
                    )}
                  </div>
                );
              })()}
              
              {fulfillMutation.isError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>
                    {fulfillMutation.error instanceof Error
                      ? fulfillMutation.error.message
                      : 'Failed to fulfill order'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
