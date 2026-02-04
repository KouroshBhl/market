import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@workspace/db';
import type {
  RequirementTemplate,
  RequirementTemplateWithFields,
  RequirementField,
  GetVariantRequirementsResponse,
  CreateRequirementTemplate,
  UpdateRequirementTemplate,
  RequirementTemplateAdminResponse,
  GetRequirementTemplatesResponse,
  RequirementsPayload,
} from '@workspace/contracts';

@Injectable()
export class RequirementsService {
  /**
   * Get requirements template for a variant (public API)
   */
  async getVariantRequirements(variantId: string): Promise<GetVariantRequirementsResponse> {
    const variant = await prisma.catalogVariant.findUnique({
      where: { id: variantId },
      include: {
        requirementTemplate: {
          include: {
            fields: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${variantId} not found`);
    }

    if (!variant.requirementTemplate || !variant.requirementTemplate.isActive) {
      return {
        hasRequirements: false,
        template: null,
      };
    }

    return {
      hasRequirements: true,
      template: this.mapTemplateWithFieldsToContract(variant.requirementTemplate),
    };
  }

  /**
   * Validate requirements payload against template
   */
  async validateRequirementsPayload(
    variantId: string,
    payload: RequirementsPayload | undefined,
  ): Promise<{ valid: boolean; errors: string[]; sensitiveFields: string[] }> {
    const { template } = await this.getVariantRequirements(variantId);
    
    // No requirements = always valid
    if (!template) {
      return { valid: true, errors: [], sensitiveFields: [] };
    }

    const errors: string[] = [];
    const sensitiveFields: string[] = [];

    for (const field of template.fields) {
      const value = payload?.[field.key];
      
      // Track sensitive fields
      if (field.sensitive) {
        sensitiveFields.push(field.key);
      }

      // Check required
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field.label} is required`);
        continue;
      }

      // Skip validation if not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type-specific validation
      if (field.type === 'EMAIL' && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${field.label} must be a valid email address`);
        }
      }

      if (field.type === 'NUMBER') {
        if (typeof value !== 'number' && isNaN(Number(value))) {
          errors.push(`${field.label} must be a number`);
        }
      }

      if (field.type === 'SELECT' && field.options) {
        if (!field.options.includes(value as string)) {
          errors.push(`${field.label} must be one of: ${field.options.join(', ')}`);
        }
      }

      // Apply custom validation rules
      if (field.validation && typeof value === 'string') {
        const validation = field.validation as Record<string, unknown>;
        if (validation.minLength && value.length < (validation.minLength as number)) {
          errors.push(`${field.label} must be at least ${validation.minLength} characters`);
        }
        if (validation.maxLength && value.length > (validation.maxLength as number)) {
          errors.push(`${field.label} must be at most ${validation.maxLength} characters`);
        }
        if (validation.pattern) {
          const regex = new RegExp(validation.pattern as string);
          if (!regex.test(value)) {
            errors.push(`${field.label} has invalid format`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sensitiveFields,
    };
  }

  /**
   * Get all templates (admin API)
   */
  async getTemplates(): Promise<GetRequirementTemplatesResponse> {
    const templates = await prisma.requirementTemplate.findMany({
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { variants: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      templates: templates.map((t) => ({
        ...this.mapTemplateWithFieldsToContract(t),
        variantCount: t._count.variants,
      })),
    };
  }

  /**
   * Get single template by ID (admin API)
   */
  async getTemplateById(id: string): Promise<RequirementTemplateAdminResponse> {
    const template = await prisma.requirementTemplate.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { variants: true },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Requirement template with ID ${id} not found`);
    }

    return {
      ...this.mapTemplateWithFieldsToContract(template),
      variantCount: template._count.variants,
    };
  }

  /**
   * Create a new requirement template (admin API)
   */
  async createTemplate(data: CreateRequirementTemplate): Promise<RequirementTemplateAdminResponse> {
    // Validate field keys are unique
    const keys = data.fields.map((f) => f.key);
    if (new Set(keys).size !== keys.length) {
      throw new BadRequestException('Field keys must be unique within a template');
    }

    const template = await prisma.requirementTemplate.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
        fields: {
          create: data.fields.map((field, index) => ({
            key: field.key,
            label: field.label,
            type: field.type,
            required: field.required ?? true,
            helpText: field.helpText ?? null,
            placeholder: field.placeholder ?? null,
            options: field.options ?? null,
            validation: field.validation ?? null,
            sensitive: field.sensitive ?? false,
            sortOrder: field.sortOrder ?? index,
          })),
        },
      },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { variants: true },
        },
      },
    });

    return {
      ...this.mapTemplateWithFieldsToContract(template),
      variantCount: template._count.variants,
    };
  }

  /**
   * Update a requirement template (admin API)
   */
  async updateTemplate(
    id: string,
    data: UpdateRequirementTemplate,
  ): Promise<RequirementTemplateAdminResponse> {
    // Verify exists
    await this.getTemplateById(id);

    // If updating fields, validate keys are unique
    if (data.fields) {
      const keys = data.fields.map((f) => f.key);
      if (new Set(keys).size !== keys.length) {
        throw new BadRequestException('Field keys must be unique within a template');
      }
    }

    // Update in transaction
    const template = await prisma.$transaction(async (tx) => {
      // Update template properties
      const updated = await tx.requirementTemplate.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      // If fields provided, replace all fields
      if (data.fields) {
        // Delete existing fields
        await tx.requirementField.deleteMany({
          where: { templateId: id },
        });

        // Create new fields
        await tx.requirementField.createMany({
          data: data.fields.map((field, index) => ({
            templateId: id,
            key: field.key,
            label: field.label,
            type: field.type,
            required: field.required ?? true,
            helpText: field.helpText ?? null,
            placeholder: field.placeholder ?? null,
            options: field.options ?? null,
            validation: field.validation ?? null,
            sensitive: field.sensitive ?? false,
            sortOrder: field.sortOrder ?? index,
          })),
        });
      }

      return updated;
    });

    // Fetch updated template with fields
    return this.getTemplateById(id);
  }

  /**
   * Delete a requirement template (admin API)
   */
  async deleteTemplate(id: string): Promise<void> {
    const template = await this.getTemplateById(id);
    
    // Check if template is in use
    if (template.variantCount > 0) {
      throw new BadRequestException(
        `Cannot delete template that is assigned to ${template.variantCount} variant(s). ` +
        'Unassign it from all variants first, or deactivate it instead.',
      );
    }

    await prisma.requirementTemplate.delete({
      where: { id },
    });
  }

  /**
   * Helper: Map Prisma RequirementField to contract
   */
  private mapFieldToContract(field: any): RequirementField {
    return {
      id: field.id,
      templateId: field.templateId,
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      helpText: field.helpText,
      placeholder: field.placeholder,
      options: field.options,
      validation: field.validation,
      sensitive: field.sensitive,
      sortOrder: field.sortOrder,
      createdAt: field.createdAt.toISOString(),
      updatedAt: field.updatedAt.toISOString(),
    };
  }

  /**
   * Helper: Map Prisma RequirementTemplate to contract
   */
  private mapTemplateToContract(template: any): RequirementTemplate {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      isActive: template.isActive,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  /**
   * Helper: Map Prisma RequirementTemplate with fields to contract
   */
  private mapTemplateWithFieldsToContract(template: any): RequirementTemplateWithFields {
    return {
      ...this.mapTemplateToContract(template),
      fields: template.fields.map(this.mapFieldToContract.bind(this)),
    };
  }
}
