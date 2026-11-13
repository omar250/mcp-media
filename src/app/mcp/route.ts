import { NextResponse } from "next/server";

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
              description: "توليد صور عالية الجودة مجاناً",
              inputSchema: {
                type: "object",
                properties: {
                  prompt: { type: "string", description: "وصف الصورة المطلوبة" },
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
      if (!prompt) {
        return NextResponse.json({
          jsonrpc,
          id,
          result: { content: [{ type: "text", text: "يرجى كتابة وصف الصورة أولاً." }], isError: true },
        });
      }

      const imageUrl = `https://pollinations.ai{encodeURIComponent(prompt)}?width=1024&height=576&nologo=true&seed=${Date.now()}`;
      const res = await fetch(imageUrl);

      if (!res.ok) {
        return NextResponse.json({
          jsonrpc,
          id,
          result: { content: [{ type: "text", text: `فشل التوليد من الخادم: ${res.status}` }], isError: true },
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
          content: [{ type: "text", text: "✅ تم توليد الصورة بنجاح!" }],
        },
      });
    }

    return NextResponse.json({ jsonrpc, id, error: { code: -32601, message: "Method not found" } });
  } catch (err: any) {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32000, message: err.message } }, { status: 500 });
  }
}
