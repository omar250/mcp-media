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
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: `صِف مشهداً بصرياً قصيراً لـ: ${prompt}` }],
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Comet API (${res.status}): ${text.slice(0, 120)}`);
  }

  try {
    const data = JSON.parse(text);
    const reply = data.choices?.[0]?.message?.content;
    return { taskId: reply || data.id || "sent-ok" };
  } catch {
    throw new Error(`رد غير متوقع (${res.status}): ${text.slice(0, 100)}`);
  }
}
