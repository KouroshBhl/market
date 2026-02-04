import { z } from 'zod';

// ============================================
// BUYER REQUIREMENTS - Admin-managed templates
// ============================================

export const RequirementFieldTypeSchema = z.enum([
  'TEXT',
  'EMAIL',
  'NUMBER',
  'SELECT',
  'TEXTAREA',
  'ACCOUNT_CREDENTIALS', // Special type for username/password pairs (always sensitive)
]);
export type RequirementFieldType = z.infer<typeof RequirementFieldTypeSchema>;

// Validation rules for fields
export const FieldValidationSchema = z.object({
  minLength: z.number().int().optional(),
  maxLength: z.number().int().optional(),
  pattern: z.string().optional(), // Regex pattern
  min: z.number().optional(), // For NUMBER type
  max: z.number().optional(), // For NUMBER type
}).passthrough();

export type FieldValidation = z.infer<typeof FieldValidationSchema>;

// Individual field in a requirement template
export const RequirementFieldSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  key: z.string(),
  label: z.string(),
  type: RequirementFieldTypeSchema,
  required: z.boolean(),
  helpText: z.string().nullable(),
  placeholder: z.string().nullable(),
  options: z.array(z.string()).nullable(), // For SELECT type
  validation: FieldValidationSchema.nullable(),
  sensitive: z.boolean(), // If true, value is encrypted at rest
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RequirementField = z.infer<typeof RequirementFieldSchema>;

// Requirement template (admin-managed)
export const RequirementTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RequirementTemplate = z.infer<typeof RequirementTemplateSchema>;

// Template with fields (for public API response)
export const RequirementTemplateWithFieldsSchema = RequirementTemplateSchema.extend({
  fields: z.array(RequirementFieldSchema),
});

export type RequirementTemplateWithFields = z.infer<typeof RequirementTemplateWithFieldsSchema>;

// ============================================
// PUBLIC API - Get requirements for variant
// ============================================

// GET /catalog/variants/:id/requirements response
export const GetVariantRequirementsResponseSchema = z.object({
  hasRequirements: z.boolean(),
  template: RequirementTemplateWithFieldsSchema.nullable(),
});

export type GetVariantRequirementsResponse = z.infer<typeof GetVariantRequirementsResponseSchema>;

// ============================================
// ADMIN API - Manage templates
// ============================================

// POST /admin/requirement-templates - Create template
export const CreateRequirementTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  isActive: z.boolean().optional().default(true),
  fields: z.array(z.object({
    key: z.string().min(1).max(50).regex(/^[a-z_][a-z0-9_]*$/, 'Key must be lowercase with underscores'),
    label: z.string().min(1).max(200),
    type: RequirementFieldTypeSchema,
    required: z.boolean().optional().default(true),
    helpText: z.string().max(500).nullable().optional(),
    placeholder: z.string().max(200).nullable().optional(),
    options: z.array(z.string()).nullable().optional(), // For SELECT type
    validation: FieldValidationSchema.nullable().optional(),
    sensitive: z.boolean().optional().default(false),
    sortOrder: z.number().int().optional().default(0),
  })).min(1),
});

export type CreateRequirementTemplate = z.infer<typeof CreateRequirementTemplateSchema>;

// PATCH /admin/requirement-templates/:id - Update template
export const UpdateRequirementTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
  // For fields updates, we'll use separate endpoints or replace all
  fields: z.array(z.object({
    id: z.string().uuid().optional(), // If provided, updates existing; if not, creates new
    key: z.string().min(1).max(50).regex(/^[a-z_][a-z0-9_]*$/, 'Key must be lowercase with underscores'),
    label: z.string().min(1).max(200),
    type: RequirementFieldTypeSchema,
    required: z.boolean().optional().default(true),
    helpText: z.string().max(500).nullable().optional(),
    placeholder: z.string().max(200).nullable().optional(),
    options: z.array(z.string()).nullable().optional(),
    validation: FieldValidationSchema.nullable().optional(),
    sensitive: z.boolean().optional().default(false),
    sortOrder: z.number().int().optional().default(0),
  })).optional(),
});

export type UpdateRequirementTemplate = z.infer<typeof UpdateRequirementTemplateSchema>;

// Admin response with field count and variant count
export const RequirementTemplateAdminResponseSchema = RequirementTemplateWithFieldsSchema.extend({
  variantCount: z.number().int(), // How many variants use this template
});

export type RequirementTemplateAdminResponse = z.infer<typeof RequirementTemplateAdminResponseSchema>;

// GET /admin/requirement-templates response
export const GetRequirementTemplatesResponseSchema = z.object({
  templates: z.array(RequirementTemplateAdminResponseSchema),
});

export type GetRequirementTemplatesResponse = z.infer<typeof GetRequirementTemplatesResponseSchema>;

// ============================================
// BUYER REQUIREMENTS PAYLOAD (for orders)
// ============================================

// Dynamic payload based on template fields
// Keys match field.key, values are the buyer-provided data
export const RequirementsPayloadSchema = z.record(z.string(), z.unknown());

export type RequirementsPayload = z.infer<typeof RequirementsPayloadSchema>;
