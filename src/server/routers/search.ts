import { z } from 'zod';
import { router, publicProcedure } from '@/server/trpc';
import db from '@/server/lib/db';
import { runSearch, type SearchObject } from '@/server/lib/searchBuilder';

// Zod schemas for validation
const BaseFilterSchema = z.object({
  and: z.array(z.string()),
  or: z.array(z.string()),
  none: z.array(z.string()),
  removeDuplicates: z.boolean(),
  filteringType: z.enum(['together', 'individual'])
});

const NumberFilterSchema = z.object({
  totalTechnologies: z.number().min(0),
  technologiesPerCategory: z.number().min(0)
});

const SearchObjectSchema = z.object({
  technologyFilter: BaseFilterSchema,
  countryFilter: BaseFilterSchema,
  categoryFilter: BaseFilterSchema,
  nameFilter: BaseFilterSchema,
  domainFilter: BaseFilterSchema,
  numberFilter: NumberFilterSchema
});

export const searchRouter = router({
  // Main search endpoint
  search: publicProcedure
    .input(SearchObjectSchema)
    .mutation(async ({ input }) => {
      const startTime = Date.now();
      
      const results = await runSearch(db, input);
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: results,
        totalResults: results.length,
        executionTime
      };
    }),
});

export type SearchRouter = typeof searchRouter;