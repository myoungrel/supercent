import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game Risk Patcher | 하이퍼캐주얼 게임 기획 리스크 진단",
  description:
    "게임 기획안을 입력하면 과거 유저 불만 패턴(RAG)을 기반으로 리스크를 사전에 진단합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-900 text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
