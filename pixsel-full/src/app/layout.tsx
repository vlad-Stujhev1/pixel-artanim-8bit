import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PixelAnim8 - 8-bit GIF Generator",
  description: "Transform your images into nostalgic 8-bit animated GIFs",
  keywords: ["8-bit", "GIF", "pixel art", "animation", "retro", "NES", "Game Boy"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className={`${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
