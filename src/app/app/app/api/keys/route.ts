import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/turso";

export async function GET() {
  await ensureSchema();
  const res = await db.execute("SELECT id, provider, is_active, priority FROM api_keys ORDER BY priority ASC");
  return NextResponse.json({ keys: res.rows });
}

export async function POST(req: Request) {
  await ensureSchema();
  const { provider, api_key, priority = 0 } = await req.json();
  const id = crypto.randomUUID();
  await db.execute({
    sql: "INSERT INTO api_keys (id, provider, api_key, is_active, priority, created_at) VALUES (?, ?, ?, 1, ?, ?)",
    args: [id, provider, api_key, priority, new Date().toISOString()],
  });
  return NextResponse.json({ success: true, id });
}
