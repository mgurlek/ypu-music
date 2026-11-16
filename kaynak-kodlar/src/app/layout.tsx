import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YPU Music Downloader",
  description: "Download Spotify playlists and songs as MP3 files on your own computer.",
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
