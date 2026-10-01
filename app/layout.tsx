import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/locales/i18n-context";
import { DynamicTranslationProvider } from "@/locales/dynamic-translation";

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
    <html lang="en">
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <I18nProvider>
          <DynamicTranslationProvider>{children}</DynamicTranslationProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
