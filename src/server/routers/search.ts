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

// Main search endpoint
//defines "searchRouter" with one procedure "search"
export const searchRouter = router({
  search: publicProcedure
    //validates input against "SearchObjectSchema"
    .input(SearchObjectSchema)
    //mutation is a procedure that creates, deletes or updates data
    .mutation(async ({ input }) => {
      //measures the time it takes to run the search
      const startTime = Date.now();
      
      //runs the search logic "runSearch" using database and input filters
      const results = await runSearch(db, input);
      const executionTime = Date.now() - startTime;
      
      //returns the structred response with success, data, total results, and time.
      return {
        success: true,
        data: results,
        totalResults: results.length,
        executionTime
      };
    }),
});

//exports the typescript ytpe "searchRouter" for client/server type safety
export type SearchRouter = typeof searchRouter;