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

  if (!res.ok) throw new Error(`Kie API error: ${res.status}`);
  const data = await res.json();
  return { taskId: data.data?.taskId || data.taskId };
}
