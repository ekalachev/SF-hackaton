/**
 * Zod validation schemas for API routes
 * Following Interface Segregation Principle - specific schemas for each endpoint
 */

import { z } from 'zod';

/**
 * Query parameter schema for GET /api/wells
 */
export const getWellsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  minProduction: z.coerce.number().min(0).optional(),
  maxProduction: z.coerce.number().min(0).optional(),
  minDiscount: z.coerce.number().min(0).max(100).optional(),
  county: z.string().min(1).max(100).optional(),
  status: z.enum(['active', 'plugged', 'depleted']).optional(),
  sortBy: z.enum(['production', 'discount', 'valuation']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type GetWellsQuery = z.infer<typeof getWellsQuerySchema>;

/**
 * Path parameter schema for GET /api/wells/:id
 * Accepts UUID or well_id string
 */
export const wellIdParamSchema = z.object({
  id: z.string()
    .min(1)
    .refine(
      (val) => {
        // Valid UUID format: 8-4-4-4-12 hexadecimal digits with hyphens
        const validUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        // If it's a valid UUID, accept it
        if (validUuidRegex.test(val)) {
          return true;
        }

        // Check if it looks like a malformed UUID (has UUID-like structure but invalid)
        // e.g., "invalid-uuid", "123-456-789", etc.
        const uuidLikePattern = /^[a-z]+-[a-z]+$/i;
        if (uuidLikePattern.test(val) && val.split('-').length <= 5) {
          // Looks like someone tried to provide a UUID but it's malformed
          return false;
        }

        // Otherwise, treat as well_id: alphanumeric, hyphens, underscores
        // Well IDs typically have numeric patterns like "42-123-12345"
        const wellIdRegex = /^[a-zA-Z0-9_-]+$/;
        return wellIdRegex.test(val);
      },
      {
        message: 'Invalid ID format',
      }
    ),
});

export type WellIdParam = z.infer<typeof wellIdParamSchema>;

/**
 * Query parameter schema for GET /api/wells/:id/similar
 */
export const similarWellsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  threshold: z.coerce.number().min(0).max(1).optional().default(0.7),
});

export type SimilarWellsQuery = z.infer<typeof similarWellsQuerySchema>;

/**
 * Request body schema for POST /api/search/semantic
 */
export const semanticSearchBodySchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().int().min(1).max(100).optional().default(10),
  threshold: z.number().min(0).max(1).optional().default(0.7),
  filters: z.object({
    county: z.string().optional(),
    status: z.enum(['active', 'plugged', 'depleted']).optional(),
    minDiscount: z.number().min(0).max(100).optional(),
  }).optional(),
});

export type SemanticSearchBody = z.infer<typeof semanticSearchBodySchema>;
