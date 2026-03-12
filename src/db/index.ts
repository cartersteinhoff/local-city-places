import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// For query purposes
const queryClient = postgres(connectionString, {
  max: 3,              // Limit pool size (Neon free tier has low limits)
  idle_timeout: 20,    // Close idle connections after 20s
  connect_timeout: 10, // Fail fast if can't connect in 10s
});
export const db = drizzle(queryClient, { schema });

// Export schema for use in other files
export * from "./schema";
