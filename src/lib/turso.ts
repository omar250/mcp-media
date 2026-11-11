
import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function dbHealthy(): Promise<boolean> {
  try {
    await db.execute("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) return;
    await db.execute(`CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, type TEXT, status TEXT, progress INTEGER, result_url TEXT, error TEXT, created_at TEXT)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS api_keys (id TEXT PRIMARY KEY, provider TEXT, api_key TEXT, is_active INTEGER DEFAULT 1, priority INTEGER DEFAULT 0, created_at TEXT)`);

  schemaReady = true;
}
