import { z } from 'zod';

// Schema for icon provider parameter
export const providerParamSchema = z.object({
  params: z.object({
    provider: z.string().min(1, 'Provider name is required'),
  }),
});

// Schema for icon name parameter
export const iconNameParamSchema = z.object({
  params: z.object({
    provider: z.string().min(1, 'Provider name is required'),
    icon_name: z.string().min(1, 'Icon name is required'),
  }),
});

// Schema for icon size query parameter
export const iconSizeQuerySchema = z.object({
  query: z.object({
    size: z
      .string()
      .optional()
      .transform(val => (val ? parseInt(val, 10) : undefined))
      .refine(val => !val || (val >= 16 && val <= 512), {
        message: 'Size must be between 16 and 512 pixels',
      }),
    format: z.enum(['json', 'svg']).optional().default('json'),
  }),
});

// Schema for search query parameter
export const searchQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    limit: z
      .string()
      .optional()
      .transform(val => (val ? parseInt(val, 10) : undefined))
      .refine(val => !val || (val > 0 && val <= 1000), {
        message: 'Limit must be between 1 and 1000',
      }),
    page: z
      .string()
      .optional()
      .transform(val => (val ? parseInt(val, 10) : undefined))
      .refine(val => !val || val > 0, {
        message: 'Page must be greater than 0',
      }),
  }),
});

// Schema for cloud providers endpoint (no parameters needed)
export const cloudProvidersSchema = z.object({
  // Empty schema as this endpoint doesn't take any parameters
  // But we still want to validate the request to ensure it meets the expected format
});

// Combined schemas for different endpoints
export const getIconsSchema = providerParamSchema.merge(searchQuerySchema);
export const getIconByNameSchema = iconNameParamSchema.merge(iconSizeQuerySchema);
