import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PRAMANA • Stateful Agentic Truth & Evidentiary Verification Engine",
  description:
    "Extract atomic claims, flag ambiguity, verify slots against evidence, detect timeline conflicts, and generate non-leading cognitive interview questions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark bg-slate-950 text-slate-100 antialiased`}
    >
      <body className="min-h-screen bg-slate-950 flex flex-col font-sans">{children}</body>
    </html>
  );
}
