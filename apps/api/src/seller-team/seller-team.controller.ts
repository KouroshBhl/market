import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SellerTeamService } from './seller-team.service';
import { AuthGuard } from '../auth/auth.guard';
import { SellerMemberGuard } from '../auth/seller-member.guard';
import { SellerPermissionGuard } from '../auth/seller-permission.guard';
import { RequireSellerPermission } from '../auth/seller-permission.decorator';
import type {
  GetSellerTeamResponse,
  InviteMemberRequest,
  InviteMemberResponse,
  ChangeRoleRequest,
  ChangeRoleResponse,
  RemoveMemberResponse,
  GetMembershipsResponse,
  RevokeInviteResponse,
  AcceptInviteRequest,
  AcceptInviteResponse,
} from '@workspace/contracts';

@ApiTags('Seller Team')
@Controller()
export class SellerTeamController {
  constructor(private readonly sellerTeamService: SellerTeamService) {}

  // ============================================
  // GET /seller/:sellerId/members
  // Requires: membership (any role can view team)
  // ============================================

  @Get('seller/:sellerId/members')
  @UseGuards(AuthGuard, SellerMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List team members and pending invites',
    description: 'Any active member can view the team.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Team members and invites' })
  @ApiResponse({ status: 403, description: 'Not a member of this organization' })
  async getTeamMembers(
    @Param('sellerId') sellerId: string,
  ): Promise<GetSellerTeamResponse> {
    return this.sellerTeamService.getTeamMembers(sellerId);
  }

  // ============================================
  // POST /seller/:sellerId/invite
  // Requires: team.manage (owner/admin only)
  // ============================================

  @Post('seller/:sellerId/invite')
  @UseGuards(AuthGuard, SellerMemberGuard, SellerPermissionGuard)
  @RequireSellerPermission('team.manage')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Invite a team member',
    description: 'Owner/admin can invite new members. Cannot invite as OWNER.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiResponse({ status: 201, description: 'Invite created' })
  @ApiResponse({ status: 403, description: 'Insufficient permission' })
  @ApiResponse({ status: 409, description: 'User already a member or invite exists' })
  async inviteMember(
    @Param('sellerId') sellerId: string,
    @Body() body: InviteMemberRequest,
    @Req() req: any,
  ): Promise<InviteMemberResponse> {
    return this.sellerTeamService.inviteMember(
      sellerId,
      req.sellerMember.role,
      body.email,
      body.role,
    );
  }

  // ============================================
  // POST /seller/:sellerId/members/:userId/role
  // Requires: team.manage (owner/admin only)
  // ============================================

  @Patch('seller/:sellerId/members/:userId/role')
  @UseGuards(AuthGuard, SellerMemberGuard, SellerPermissionGuard)
  @RequireSellerPermission('team.manage')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change a team member\'s role',
    description: 'Owner/admin can change roles. Owner cannot be downgraded. Cannot promote to OWNER.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'userId', description: 'Target user ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 403, description: 'Insufficient permission or invalid role change' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async changeMemberRole(
    @Param('sellerId') sellerId: string,
    @Param('userId') userId: string,
    @Body() body: ChangeRoleRequest,
    @Req() req: any,
  ): Promise<ChangeRoleResponse> {
    return this.sellerTeamService.changeMemberRole(
      sellerId,
      req.sellerMember.role,
      userId,
      body.role,
    );
  }

  // ============================================
  // DELETE /seller/:sellerId/members/:userId
  // Requires: team.manage (owner/admin only)
  // ============================================

  @Delete('seller/:sellerId/members/:userId')
  @UseGuards(AuthGuard, SellerMemberGuard, SellerPermissionGuard)
  @RequireSellerPermission('team.manage')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove a team member',
    description: 'Owner/admin can remove members. Owner cannot be removed.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'userId', description: 'Target user ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Member removed' })
  @ApiResponse({ status: 403, description: 'Insufficient permission or target is owner' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async removeMember(
    @Param('sellerId') sellerId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ): Promise<RemoveMemberResponse> {
    return this.sellerTeamService.removeMember(
      sellerId,
      req.sellerMember.role,
      req.sellerMember.userId,
      userId,
    );
  }

  // ============================================
  // DELETE /seller/:sellerId/invites/:inviteId
  // Requires: team.manage (owner/admin only)
  // ============================================

  @Delete('seller/:sellerId/invites/:inviteId')
  @UseGuards(AuthGuard, SellerMemberGuard, SellerPermissionGuard)
  @RequireSellerPermission('team.manage')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Revoke a pending invite',
    description: 'Owner/admin can revoke pending invites.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'inviteId', description: 'Invite ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Invite revoked' })
  @ApiResponse({ status: 403, description: 'Insufficient permission' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  async revokeInvite(
    @Param('sellerId') sellerId: string,
    @Param('inviteId') inviteId: string,
    @Req() req: any,
  ): Promise<RevokeInviteResponse> {
    return this.sellerTeamService.revokeInvite(
      sellerId,
      req.sellerMember.role,
      inviteId,
    );
  }

  // ============================================
  // POST /seller/:sellerId/invites/:inviteId/resend
  // Requires: team.manage (owner/admin only)
  // ============================================

  @Post('seller/:sellerId/invites/:inviteId/resend')
  @UseGuards(AuthGuard, SellerMemberGuard, SellerPermissionGuard)
  @RequireSellerPermission('team.manage')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Resend an invite email',
    description: 'Generates a fresh token, extends expiry, and resends the invitation email.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'inviteId', description: 'Invite ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Invite resent' })
  @ApiResponse({ status: 403, description: 'Insufficient permission' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  async resendInvite(
    @Param('sellerId') sellerId: string,
    @Param('inviteId') inviteId: string,
    @Req() req: any,
  ): Promise<RevokeInviteResponse> {
    return this.sellerTeamService.resendInvite(
      sellerId,
      req.sellerMember.role,
      inviteId,
    );
  }

  // ============================================
  // POST /invite/accept
  // Requires: authenticated user (no seller membership yet)
  // ============================================

  @Post('invite/accept')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Accept a team invite',
    description: 'Authenticated user accepts an invite using the token from the invite email.',
  })
  @ApiResponse({ status: 200, description: 'Invite accepted, membership created' })
  @ApiResponse({ status: 400, description: 'Invite expired or already accepted' })
  @ApiResponse({ status: 403, description: 'Email mismatch' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  async acceptInvite(
    @Body() body: AcceptInviteRequest,
    @Req() req: any,
  ): Promise<AcceptInviteResponse> {
    return this.sellerTeamService.acceptInvite(body.token, req.user.userId);
  }

  // ============================================
  // GET /user/memberships
  // Requires: authenticated user
  // Returns all seller orgs the user belongs to (for seller switcher)
  // ============================================

  @Get('user/memberships')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user seller memberships',
    description: 'Returns all seller organizations the authenticated user belongs to.',
  })
  @ApiResponse({ status: 200, description: 'List of memberships' })
  async getUserMemberships(
    @Req() req: any,
  ): Promise<GetMembershipsResponse> {
    return this.sellerTeamService.getUserMemberships(req.user.userId);
  }
}
