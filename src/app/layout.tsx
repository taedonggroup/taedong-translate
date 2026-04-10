import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Taedong Translate",
  description: "태동 AI 번역 관리 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 bg-gray-50/50">{children}</main>
      </body>
    </html>
  );
}
