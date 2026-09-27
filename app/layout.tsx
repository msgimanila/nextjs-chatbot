import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Support Chatbot Demo",
  description: "A simple Next.js chatbot answering from local docs, with Groq AI fallback.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="text-slate-900">{children}</body>
    </html>
  );
}
