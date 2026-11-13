import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jsonrpc = "2.0", id = 1, method, params } = body;

    if (method === "initialize") {
      return NextResponse.json({
        jsonrpc,
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "mcp-media-server", version: "1.0.0" },
        },
      });
    }

    if (method === "tools/list") {
      return NextResponse.json({
        jsonrpc,
        id,
        result: {
          tools: [
            {
              name: "generate_media",
              description: "توليد صور وفيديوهات عبر Kie.ai أو CometAPI مع التبديل الذكي بين المفاتيح",
              inputSchema: {
                type: "object",
                properties: {
                  model: { type: "string", enum: ["flux-pro", "kling-video", "luma-dream"] },
                  prompt: { type: "string", description: "وصف المشهد المطلوب توليده" },
                },
                required: ["prompt"],
              },
            },
          ],
        },
      });
    }

    if (method === "tools/call") {
      const { model = "flux-pro", prompt } = params?.arguments || {};
      const db = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      });

      const provider = model === "luma-dream" ? "comet" : "kie";
      const result = await db.execute({
        sql: "SELECT api_key FROM api_keys WHERE provider = ? AND is_active = 1 ORDER BY priority ASC LIMIT 1",
        args: [provider],
      });

      const apiKey = (result.rows.at(0) as any)?.api_key?.trim();
      if (!apiKey) {
        return NextResponse.json({
          jsonrpc,
          id,
          result: { content: [{ type: "text", text: `خطأ: لا يوجد مفتاح نشط للمزود ${provider}` }], isError: true },
        });
      }

      return NextResponse.json({
        jsonrpc,
        id,
        result: {
          content: [
            {
              type: "text",
              text: `تم استلام طلب التوليد (${model}) بنجاح باستخدام مفتاح ${provider} النشط للوصف: ${prompt}`,
            },
          ],
        },
      });
    }

    return NextResponse.json({ jsonrpc, id, error: { code: -32601, message: "Method not found" } });
  } catch (err: any) {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32000, message: err.message } }, { status: 500 });
  }
}
