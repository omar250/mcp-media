import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export async function POST(req: Request) {
  try {
    const { taskId, provider = "kie" } = await req.json();
    if (!taskId) {
      return NextResponse.json({ success: false, error: "رقم المهمة مطلوب" }, { status: 400 });
    }

    const db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    const result = await db.execute({
      sql: "SELECT api_key FROM api_keys WHERE provider = ? AND is_active = 1 ORDER BY priority ASC LIMIT 1",
      args: [provider],
    });

    const apiKey = (result.rows.at(0) as any)?.api_key?.trim();
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "لا يوجد مفتاح نشط" }, { status: 404 });
    }

    // الاستعلام عن حالة المهمة من Kie.ai
    const res = await fetch(`https://kie.ai{encodeURIComponent(taskId)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    const data = await res.json();
    const state = data.data?.state; // waiting, queuing, generating, success, fail
    const resultJson = data.data?.resultJson ? JSON.parse(data.data.resultJson) : null;
    const videoUrl = resultJson?.resultUrls?. || null;

    return NextResponse.json({
      success: true,
      state,
      videoUrl,
      raw: data,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
