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
    body: JSON.stringify({
      model,
      input: { prompt },
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Kie API (${res.status}): ${text.slice(0, 120)}`);
  }

  try {
    const data = JSON.parse(text);
    if (data.code && data.code !== 200) {
      throw new Error(`Kie error (${data.code}): ${data.msg || text.slice(0, 100)}`);
    }
    return { taskId: data.data?.taskId || data.taskId || "sent-ok" };
  } catch (e: any) {
    throw new Error(e.message || `استجابة غير صالحة من Kie: ${text.slice(0, 80)}`);
  }
}
