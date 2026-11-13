"use client";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [keys, setKeys] = useState<any[]>([]);
  const [provider, setProvider] = useState("kie");
  const [apiKey, setApiKey] = useState("");
  const [priority, setPriority] = useState(1);

  const [model, setModel] = useState("kling-video");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);

  const loadKeys = async () => {
    try {
      const res = await fetch("/api/keys");
      if (!res.ok) return;
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const addKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return;
    await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, api_key: apiKey, priority }),
    });
    setApiKey("");
    loadKeys();
  };

  const generateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "generate_media", arguments: { model, prompt } },
        }),
      });

      const data = await res.json();
      const firstContent = Array.isArray(data.result?.content) ? data.result.content.at(0) : null;
      const textReply = firstContent?.text;
      const isErr = data.result?.isError || data.error;

      if (isErr) {
        setResult({ success: false, error: textReply || data.error?.message || "حدث خطأ" });
      } else {
        setResult({
          success: true,
          message: textReply,
          taskId: data.result?.taskId || null,
          provider: data.result?.provider || "kie",
          mediaUrl: null,
        });
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    }
    setLoading(false);
  };

  const checkStatus = async () => {
    if (!result?.taskId) return;
    setChecking(true);
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: result.taskId, provider: result.provider }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error);
      } else if (data.mediaUrl) {
        setResult({ ...result, mediaUrl: data.mediaUrl, message: "✅ الفيديو جاهز!" });
      } else {
        alert(`حالة الفيديو الحالية: ${data.state} (انتظر 20 ثانية واضغط فحص مرة أخرى)`);
      }
    } catch (err: any) {
      alert(err.message);
    }
    setChecking(false);
  };

  return (
    <main style={{ maxWidth: "600px", margin: "0 auto", display: "grid", gap: "30px" }}>
      <section style={{ backgroundColor: "#1e293b", padding: "20px", borderRadius: "12px" }}>
        <h1 style={{ fontSize: "22px", marginTop: 0, marginBottom: "15px" }}>🎬 استوديو التوليد واستخراج الفيديو</h1>
        <form onSubmit={generateMedia} style={{ display: "grid", gap: "12px" }}>
          <select value={model} onChange={(e) => setModel(e.target.value)} style={{ padding: "12px", borderRadius: "8px", color: "#000" }}>
            <option value="kling-video">فيديو - Kling AI (Kie.ai)</option>
            <option value="flux-pro">صورة - Flux Pro (Kie.ai)</option>
            <option value="luma-dream">فيديو - Luma Dream (CometAPI)</option>
          </select>
          <textarea rows={3} placeholder="اكتب وصف الفيديو أو الصورة هنا..." value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{ padding: "12px", borderRadius: "8px", color: "#000" }} />
          <button type="submit" disabled={loading} style={{ padding: "12px", backgroundColor: "#10b981", color: "#fff", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            {loading ? "جاري الإرسال..." : "توليد الآن 🚀"}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: "15px", padding: "12px", backgroundColor: "#0f172a", borderRadius: "8px", fontSize: "14px", wordBreak: "break-all" }}>
            {result.success ? (
              <div style={{ display: "grid", gap: "10px" }}>
                <p style={{ margin: 0, color: "#4ade80" }}>{result.message}</p>
                {result.taskId && !result.mediaUrl && (
                  <button onClick={checkStatus} disabled={checking} style={{ padding: "10px", backgroundColor: "#f59e0b", color: "#000", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                    {checking ? "جاري الفحص..." : "🔄 فحص واستخراج الفيديو الآن"}
                  </button>
                )}
                {result.mediaUrl && (
                  <div>
                    <video src={result.mediaUrl} controls autoPlay loop style={{ width: "100%", borderRadius: "8px" }} />
                    <a href={result.mediaUrl} target="_blank" download style={{ display: "block", marginTop: "10px", padding: "10px", backgroundColor: "#3b82f6", color: "#fff", textAlign: "center", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
                      ⬇️ تحميل الفيديو MP4
                    </a>
                  </div>
                )}
              </div>
            ) : (
              `❌ خطأ: ${result.error}`
            )}
          </div>
        )}
      </section>

      <section style={{ backgroundColor: "#1e293b", padding: "20px", borderRadius: "12px" }}>
        <h2 style={{ fontSize: "20px", marginTop: 0, marginBottom: "15px" }}>🔑 إدارة مفاتيح API</h2>
        <form onSubmit={addKey} style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          <select value={provider} onChange={(e) => setProvider(e.target.value)} style={{ padding: "10px", borderRadius: "8px", color: "#000" }}>
            <option value="kie">Kie.ai</option>
            <option value="comet">CometAPI</option>
          </select>
          <input type="text" placeholder="أدخل مفتاح API هنا" value={apiKey} onChange={(e) => setApiKey(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "8px", color: "#000" }} />
          <input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} style={{ width: "60px", padding: "10px", borderRadius: "8px", color: "#000" }} />
          <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>إضافة</button>
        </form>
        <div style={{ display: "grid", gap: "10px" }}>
          {keys.map((k) => (
            <div key={k.id} style={{ padding: "12px", backgroundColor: "#0f172a", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
              <span><strong>{k.provider}</strong> (الأولوية: {k.priority})</span>
              <span style={{ color: k.is_active ? "#4ade80" : "#f87171" }}>{k.is_active ? "نشط" : "متوقف"}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
