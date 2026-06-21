import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YPU Music Downloader",
  description: "Download Spotify playlists directly as MP3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
