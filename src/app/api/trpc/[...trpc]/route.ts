import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';

const handler = (req: Request) =>
  //fetchRequestsHandler turns incoming HTTP requests into tRPC calls
  fetchRequestHandler({
    //specifie the API endpoint, passes the incoming request object, passes the router to route requests and provides an empty context object (could contains session/user info)
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({}),
  });

  //exports the handler for both GET and POST HTTP requests methods so it can server tRPC requests
export { handler as GET, handler as POST };