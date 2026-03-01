import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Karaoke Party",
  description: "Add songs and sing karaoke with friends!",
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
