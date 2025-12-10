import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SetupGuard } from "@/components/setup/setup-guard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iJornada",
  description: "Sistema de Gestión de Fichaje Laboral",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <SetupGuard>
          {children}
        </SetupGuard>
        <footer className="w-full py-4 text-center text-xs text-muted-foreground border-t mt-auto">
          <span>slider66 © 2025 | </span>
          <a
            href="https://github.com/slider66/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-foreground transition-colors"
          >
            https://github.com/slider66/
          </a>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
