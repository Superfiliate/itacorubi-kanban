import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { env } from "@/lib/validate-env";

const client = createClient({
  url: env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
