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
    body: JSON.stringify({ model, prompt }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Comet API (${res.status}): ${text.slice(0, 100)}`);
  }

  try {
    const data = JSON.parse(text);
    return { taskId: data.data?.[0]?.url || data.taskId || data.id || "sent-ok" };
  } catch {
    throw new Error("أعاد خادم CometAPI صفحة HTML بدلاً من JSON؛ تحقق من رابط API الخاص به.");
  }
}
