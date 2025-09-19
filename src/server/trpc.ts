//initTRPC is the core tRPC API fopr creating routers and procedures
import { initTRPC } from "@trpc/server";

//creates a new tRPC router instance
const t = initTRPC.create();

//exports the "router" function to define routers(collection of routes)
export const router = t.router;
//"publicProcedure" for defining publicly accessible routes(procedures) without authentication by default
export const publicProcedure = t.procedure;

//this file centralizes tRPC core helpers for re-use across the app