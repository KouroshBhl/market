import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { RequirementsService } from './requirements.service';
import type {
  GetVariantRequirementsResponse,
  CreateRequirementTemplate,
  UpdateRequirementTemplate,
  RequirementTemplateAdminResponse,
  GetRequirementTemplatesResponse,
} from '@workspace/contracts';

@ApiTags('Requirements')
@Controller()
export class RequirementsController {
  constructor(private readonly requirementsService: RequirementsService) {}

  // ============================================
  // PUBLIC API - Get requirements for variant
  // ============================================

  @Get('catalog/variants/:variantId/requirements')
  @ApiOperation({
    summary: 'Get buyer requirements for a variant',
    description: 'Returns the requirement template fields that buyers must fill out when purchasing this variant.',
  })
  @ApiParam({
    name: 'variantId',
    description: 'Catalog Variant ID (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Requirements template or empty if none configured',
  })
  @ApiResponse({
    status: 404,
    description: 'Variant not found',
  })
  async getVariantRequirements(
    @Param('variantId') variantId: string,
  ): Promise<GetVariantRequirementsResponse> {
    return this.requirementsService.getVariantRequirements(variantId);
  }

  // ============================================
  // ADMIN API - Manage requirement templates
  // ============================================

  @Get('admin/requirement-templates')
  @ApiOperation({
    summary: 'List all requirement templates (Admin)',
    description: 'Returns all requirement templates with their fields and variant counts.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of requirement templates',
  })
  async getTemplates(): Promise<GetRequirementTemplatesResponse> {
    return this.requirementsService.getTemplates();
  }

  @Get('admin/requirement-templates/:id')
  @ApiOperation({
    summary: 'Get requirement template by ID (Admin)',
    description: 'Returns a single requirement template with all fields.',
  })
  @ApiParam({
    name: 'id',
    description: 'Requirement Template ID (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Requirement template details',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  async getTemplateById(
    @Param('id') id: string,
  ): Promise<RequirementTemplateAdminResponse> {
    return this.requirementsService.getTemplateById(id);
  }

  @Post('admin/requirement-templates')
  @ApiOperation({
    summary: 'Create requirement template (Admin)',
    description: 'Create a new requirement template with fields. Templates can then be assigned to catalog variants.',
  })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  async createTemplate(
    @Body() data: CreateRequirementTemplate,
  ): Promise<RequirementTemplateAdminResponse> {
    return this.requirementsService.createTemplate(data);
  }

  @Patch('admin/requirement-templates/:id')
  @ApiOperation({
    summary: 'Update requirement template (Admin)',
    description: 'Update template properties and/or replace all fields.',
  })
  @ApiParam({
    name: 'id',
    description: 'Requirement Template ID (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Template updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  async updateTemplate(
    @Param('id') id: string,
    @Body() data: UpdateRequirementTemplate,
  ): Promise<RequirementTemplateAdminResponse> {
    return this.requirementsService.updateTemplate(id, data);
  }

  @Delete('admin/requirement-templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete requirement template (Admin)',
    description: 'Delete a template. Will fail if template is assigned to any variants.',
  })
  @ApiParam({
    name: 'id',
    description: 'Requirement Template ID (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Template deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Template is in use and cannot be deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  async deleteTemplate(@Param('id') id: string): Promise<void> {
    await this.requirementsService.deleteTemplate(id);
  }
}
