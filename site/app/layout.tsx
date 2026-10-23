import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agrigos — Grow together",
  description: "A place for farmers to share, connect, and grow together.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
