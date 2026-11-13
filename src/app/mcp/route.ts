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
              description: "توليد صور وفيديوهات عبر Kie.ai أو CometAPI",
              inputSchema: {
                type: "object",
                properties: {
                  model: { type: "string", enum: ["flux-pro", "kling-video", "luma-dream"] },
                  prompt: { type: "string" },
                },
                required: ["prompt"],
              },
            },
          ],
        },
      });
    }

    if (method === "tools/call") {
      const { model = "kling-video", prompt } = params?.arguments || {};
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
          result: { content: [{ type: "text", text: `لا يوجد مفتاح نشط للمزود ${provider}` }], isError: true },
        });
      }

      if (provider === "kie") {
        const isVideo = model === "kling-video";
        const endpoint = isVideo
          ? "https://kie.ai"
          : "https://kie.ai";

        const payload = isVideo
          ? { model: "kling/v2-1-master-text-to-video", input: { prompt, aspect_ratio: "16:9", duration: "5" } }
          : { prompt, aspectRatio: "16:9", model: "flux-kontext-pro" };

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        if (text.trim().startsWith("<")) {
          return NextResponse.json({
            jsonrpc,
            id,
            result: { content: [{ type: "text", text: "أعاد Kie.ai صفحة ويب؛ تأكد من شحن رصيد وتفعيل المفتاح." }], isError: true },
          });
        }

        const data = JSON.parse(text);
        const taskId = data.data?.taskId || data.taskId;
        if (!taskId) {
          return NextResponse.json({
            jsonrpc,
            id,
            result: { content: [{ type: "text", text: data.msg || text }], isError: true },
          });
        }

        return NextResponse.json({
          jsonrpc,
          id,
          result: { taskId, provider, content: [{ type: "text", text: `تم بدء التوليد! رقم المهمة: ${taskId}` }] },
        });
      } else {
        const res = await fetch("https://cometapi.com", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: prompt }] }),
        });
        const text = await res.text();
        if (text.trim().startsWith("<")) {
          return NextResponse.json({
            jsonrpc,
            id,
            result: { content: [{ type: "text", text: "أعاد CometAPI صفحة ويب؛ تأكد من شحن الرصيد وتفعيل المفتاح." }], isError: true },
          });
        }
        return NextResponse.json({
          jsonrpc,
          id,
          result: { content: [{ type: "text", text }] },
        });
      }
    }

    return NextResponse.json({ jsonrpc, id, error: { code: -32601, message: "Method not found" } });
  } catch (err: any) {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32000, message: err.message } }, { status: 500 });
  }
}
