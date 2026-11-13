export async function generateWithComet(
  apiKey: string,
  model: string,
  prompt: string
): Promise<{ taskId: string }> {
  const res = await fetch("https://cometapi.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "flux-schnell",
      prompt,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Comet API (${res.status}): ${text.slice(0, 150)}`);
  }

  try {
    const data = JSON.parse(text);
    const url = data.data?.[0]?.url || data.url || data.id;
    return { taskId: url || "تم الإرسال بنجاح" };
  } catch {
    throw new Error(`رد غير متوقع (${res.status}): ${text.slice(0, 100)}`);
  }
}
