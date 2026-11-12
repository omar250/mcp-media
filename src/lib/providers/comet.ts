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

  if (!res.ok) throw new Error(`Comet API error: ${res.status}`);
  const data = await res.json();
  return { taskId: data.id || data.task_id };
}
