import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export async function POST() {
  try {
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    const result = await db.execute({
      sql: "SELECT api_key FROM api_keys WHERE api_key LIKE 'hf_%' AND is_active = 1 ORDER BY id DESC LIMIT 1",
      args: [],
    });
    const row = result.rows.at(0) as any;
    return NextResponse.json({ apiKey: row?.api_key || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
