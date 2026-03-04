import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "صح ولا؟",
  description: "Arabic game-show quiz with wallet-based credits",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
