import { z } from 'zod';

export const createWebsiteSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers and hyphens')
    .optional(),
  category: z.string().min(2).max(60),
  description: z.string().max(2000).optional().nullable(),
  brandName: z.string().max(120).optional().nullable(),
  templateKey: z.string().max(60).optional().nullable(),
});

export const updateWebsiteSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  category: z.string().min(2).max(60).optional(),
  description: z.string().max(2000).optional().nullable(),
  brandName: z.string().max(120).optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export const listWebsitesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(12),
  search: z.string().max(120).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});
