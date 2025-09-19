//imports the base "router" helper and the "searchRouter"
import { router } from '../trpc';
import { searchRouter } from './search';

//combines multiple routers into a root "appRouter" where the "search" key maps to the "searchRouter"
export const appRouter = router({
  search: searchRouter,
});

//creates a type alias "AppRouter" which holds the full router's TypeScript type for client/server type safety
export type AppRouter = typeof appRouter;