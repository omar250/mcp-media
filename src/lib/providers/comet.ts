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
    throw new Error(`Comet API error (${res.status}): ${text.slice(0, 120)}`);
  }

  const data = text ? JSON.parse(text) : {};
  return { taskId: data.data?.taskId || data.task_id || data.id || "sent-ok" };
}
