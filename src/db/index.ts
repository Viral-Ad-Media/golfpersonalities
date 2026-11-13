import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

/**
 * Neon's HTTP driver in production; plain node-postgres for a local
 * Postgres (handy for development without a Neon branch).
 */
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);

export const db = (isLocal
  ? drizzlePg(new Pool({ connectionString: url }), { schema })
  : drizzleNeon(neon(url), { schema })) as unknown as NodePgDatabase<typeof schema>;

export { schema };
