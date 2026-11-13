import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export async function POST(req: Request) {
  try {
    const { model = "flux-pro", prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ success: false, error: "يرجى كتابة الوصف أولاً" }, { status: 400 });
    }

    const db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    const provider = model === "luma-dream" ? "comet" : "kie";
    const result = await db.execute({
      sql: "SELECT api_key FROM api_keys WHERE provider = ? AND is_active = 1 ORDER BY priority ASC LIMIT 1",
      args: [provider],
    });

    const firstRow = result.rows.at(0) as any;
    const apiKey = firstRow?.api_key as string;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: `لا يوجد مفتاح نشط للمزود: ${provider}` }, { status: 404 });
    }

    if (provider === "kie") {
      // مسار Flux الرسمي في Kie.ai أو مسار المهام العام
      const endpoint = model === "kling-video"
        ? "https://kie.ai"
        : "https://kie.ai";

      const payload = model === "kling-video"
        ? { model: "kling/v2-1-master-text-to-video", input: { prompt } }
        : { prompt, aspectRatio: "16:9", model: "flux-kontext-pro" };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (text.trim().startsWith("<")) {
        return NextResponse.json({ success: false, error: "خادم Kie.ai أعاد صفحة ويب؛ تأكد من صحة رابط API في حسابك." });
      }
      return NextResponse.json({ success: res.ok, taskId: text, error: res.ok ? null : text });
    } else {
      const res = await fetch("https://cometapi.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const text = await res.text();
      if (text.trim().startsWith("<")) {
        return NextResponse.json({ success: false, error: "خادم CometAPI أعاد صفحة ويب؛ تأكد من تفعيل المفتاح والرصيد في حسابك." });
      }
      return NextResponse.json({ success: res.ok, taskId: text, error: res.ok ? null : text });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
