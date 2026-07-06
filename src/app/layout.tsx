import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "ClassNote AI",
  description: "Lecture recording and study note UI prototype",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
