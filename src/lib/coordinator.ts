import { db, ensureSchema } from "./turso";

export async function getActiveKeys(provider: string): Promise<string[]> {
  await ensureSchema();
  const res = await db.execute({
    sql: "SELECT api_key FROM api_keys WHERE provider = ? AND is_active = 1 ORDER BY priority ASC",
    args: [provider],
  });
  return res.rows.map((r) => String(r.api_key));
}

export async function executeWithFallback<T>(
  provider: string,
  taskFn: (apiKey: string) => Promise<T>
): Promise<T> {
  const keys = await getActiveKeys(provider);
  if (!keys.length) throw new Error(`لا توجد مفاتيح نشطة للمزود: ${provider}`);

  let lastError: unknown;
  for (const key of keys) {
    try {
      return await taskFn(key);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("فشلت جميع المفاتيح المتاحة");
}
