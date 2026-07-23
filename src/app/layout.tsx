import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "대학 창업자 현황 관리",
  description: "재학생·졸업생 창업자 레지스트리 및 지원 연계 시스템",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
