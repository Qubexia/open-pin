import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              try {
                const raw = localStorage.getItem('onepin_ui_settings');
                const settings = raw ? JSON.parse(raw) : {};
                const theme = settings.theme || localStorage.getItem('onepin_theme') || 'dark';

                document.documentElement.setAttribute('data-theme', theme);
                document.documentElement.setAttribute('data-accent', settings.accent || 'green');
                document.documentElement.setAttribute('data-density', settings.density || 'comfortable');
                document.documentElement.setAttribute('data-motion', settings.motion || 'full');
              } catch (e) {}
            })()
          `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
