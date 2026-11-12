import { NextResponse } from "next/server";
import { resolveModel } from "@/lib/models";
import { executeWithFallback } from "@/lib/coordinator";
import { generateWithKie } from "@/lib/providers/kie";
import { generateWithComet } from "@/lib/providers/comet";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { model = "flux-pro", prompt } = body;
    if (!prompt) {
      return NextResponse.json({ success: false, error: "يرجى كتابة وصف المشهد أولاً" }, { status: 400 });
    }

    const config = resolveModel(model);
    const result = await executeWithFallback(config.provider, (apiKey) =>
      config.provider === "kie"
        ? generateWithKie(apiKey, config.upstreamModel, prompt)
        : generateWithComet(apiKey, config.upstreamModel, prompt)
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "حدث خطأ أثناء الاتصال بالمزود" },
      { status: 500 }
    );
  }
}
