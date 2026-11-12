export async function generateWithKie(
  apiKey: string,
  model: string,
  prompt: string
): Promise<{ taskId: string }> {
  const res = await fetch("https://kie.ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, prompt }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Kie API error (${res.status}): ${text.slice(0, 120)}`);
  }

  const data = text ? JSON.parse(text) : {};
  return { taskId: data.data?.taskId || data.taskId || "sent-ok" };
}
