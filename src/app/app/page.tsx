"use client";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [keys, setKeys] = useState<any[]>([]);
  const [provider, setProvider] = useState("kie");
  const [apiKey, setApiKey] = useState("");
  const [priority, setPriority] = useState(1);

  const loadKeys = async () => {
    const res = await fetch("/api/keys");
    const data = await res.json();
    setKeys(data.keys || []);
  };

  useEffect(() => { loadKeys(); }, []);

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
    return (
    <main style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>لوحة إدارة مفاتيح MCP</h1>
      <form onSubmit={addKey} style={{ display: "flex", gap: "10px", marginBottom: "30px", flexWrap: "wrap" }}>
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
          <div key={k.id} style={{ padding: "15px", backgroundColor: "#1e293b", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
            <span><strong>{k.provider}</strong> (الأولوية: {k.priority})</span>
            <span style={{ color: k.is_active ? "#4ade80" : "#f87171" }}>{k.is_active ? "نشط" : "متوقف"}</span>
          </div>
        ))}
      </div>
    </main>
  );
}

