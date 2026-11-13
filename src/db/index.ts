import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type DB = NodePgDatabase<typeof schema>;

let instance: DB | undefined;

/**
 * Creates the client on first use, so `next build` can import this module
 * without DATABASE_URL being set. Uses Neon's HTTP driver in production and
 * plain node-postgres for a local Postgres.
 */
function getDb(): DB {
  if (instance) return instance;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it in your environment (Vercel: Settings > Environment Variables).");
  const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  instance = (isLocal
    ? drizzlePg(new Pool({ connectionString: url }), { schema })
    : drizzleNeon(neon(url), { schema })) as unknown as DB;
  return instance;
}

export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
