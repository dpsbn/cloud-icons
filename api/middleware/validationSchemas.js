"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIconByNameSchema = exports.getIconsSchema = exports.cloudProvidersSchema = exports.searchQuerySchema = exports.iconSizeQuerySchema = exports.iconNameParamSchema = exports.providerParamSchema = void 0;
const zod_1 = require("zod");
// Schema for icon provider parameter
exports.providerParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        provider: zod_1.z.string().min(1, 'Provider name is required'),
    }),
});
// Schema for icon name parameter
exports.iconNameParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        provider: zod_1.z.string().min(1, 'Provider name is required'),
        icon_name: zod_1.z.string().min(1, 'Icon name is required'),
    }),
});
// Schema for icon size query parameter
exports.iconSizeQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        size: zod_1.z
            .string()
            .optional()
            .transform(val => (val ? parseInt(val, 10) : undefined))
            .refine(val => !val || (val >= 16 && val <= 512), {
            message: 'Size must be between 16 and 512 pixels',
        }),
        format: zod_1.z.enum(['json', 'svg']).optional().default('json'),
    }),
});
// Schema for search query parameter
exports.searchQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        search: zod_1.z.string().optional(),
        limit: zod_1.z
            .string()
            .optional()
            .transform(val => (val ? parseInt(val, 10) : undefined))
            .refine(val => !val || (val > 0 && val <= 1000), {
            message: 'Limit must be between 1 and 1000',
        }),
        page: zod_1.z
            .string()
            .optional()
            .transform(val => (val ? parseInt(val, 10) : undefined))
            .refine(val => !val || val > 0, {
            message: 'Page must be greater than 0',
        }),
    }),
});
// Schema for cloud providers endpoint (no parameters needed)
exports.cloudProvidersSchema = zod_1.z.object({
// Empty schema as this endpoint doesn't take any parameters
// But we still want to validate the request to ensure it meets the expected format
});
// Combined schemas for different endpoints
exports.getIconsSchema = exports.providerParamSchema.merge(exports.searchQuerySchema);
exports.getIconByNameSchema = exports.iconNameParamSchema.merge(exports.iconSizeQuerySchema);
