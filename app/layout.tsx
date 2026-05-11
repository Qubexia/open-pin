import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { TabBar } from "@/components/tab-bar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OnePin — Peptide & Compound Tracker",
  description:
    "Track protocols, plan syringe loads, rotate injection sites. For research purposes only.",
  applicationName: "OnePin",
  appleWebApp: { capable: true, title: "OnePin", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                const theme = localStorage.getItem('onepin_theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            })()
          `
        }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <header className="sticky top-0 z-20 w-full border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur"
          style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2.5">
            <Link href="/home" className="text-sm font-semibold tracking-tight">OnePin</Link>
            <Link href="/more/settings" className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted)] hover:text-foreground">
              ⚙
            </Link>
          </div>
        </header>
        <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-24">{children}</main>
        <TabBar />
      </body>
    </html>
  );
}
