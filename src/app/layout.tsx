import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "مولد الوسائط الذكي - MCP",
  description: "لوحة تحكم وإدارة مفاتيح توليد الصور والفيديو",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#0f172a", color: "#f8fafc", margin: 0, padding: "20px" }}>
        {children}
      </body>
    </html>
  );
}
