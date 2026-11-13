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
              description: "توليد الصور مجاناً باستخدام Flux عبر Hugging Face",
              inputSchema: {
                type: "object",
                properties: {
                  model: { type: "string" },
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
      const { prompt } = params?.arguments || {};
      const db = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      });

      const result = await db.execute({
        sql: "SELECT api_key FROM api_keys WHERE api_key LIKE 'hf_%' AND is_active = 1 ORDER BY id DESC LIMIT 1",
        args: [],
      });

      const apiKey = (result.rows.at(0) as any)?.api_key?.trim();
      if (!apiKey) {
        return NextResponse.json({
          jsonrpc,
          id,
          result: { content: [{ type: "text", text: "لم يتم العثور على مفتاح hf_؛ يرجى لصق المفتاح المجاني والضغط على إضافة." }], isError: true },
        });
      }

      const res = await fetch(
        "https://huggingface.co",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: prompt }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({
          jsonrpc,
          id,
          result: { content: [{ type: "text", text: `خطأ من Hugging Face (${res.status}): ${errText.slice(0, 120)}` }], isError: true },
        });
      }

      const arrayBuffer = await res.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString("base64");
      const dataUrl = `data:image/jpeg;base64,${base64Image}`;

      return NextResponse.json({
        jsonrpc,
        id,
        result: {
          imageUrl: dataUrl,
          content: [{ type: "text", text: "✅ تم توليد الصورة بنجاح مجاناً!" }],
        },
      });
    }

    return NextResponse.json({ jsonrpc, id, error: { code: -32601, message: "Method not found" } });
  } catch (err: any) {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32000, message: err.message } }, { status: 500 });
  }
}
