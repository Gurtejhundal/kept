import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

const siteUrl = "https://reelrecall-archive.gurtejbirsinghh.chatgpt.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Kept — Find what you saved",
  description: "A private, visual archive for the useful links, posts, and ideas you want to find again.",
  applicationName: "Kept",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Kept",
    title: "Kept — Find what you saved",
    description: "Keep useful links, posts, and ideas in one calm, searchable visual archive.",
    images: [{ url: "/kept-social-card.svg", width: 1200, height: 630, alt: "Kept visual archive" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kept — Find what you saved",
    description: "A calm, searchable visual archive for the things worth keeping.",
    images: ["/kept-social-card.svg"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f8" },
    { media: "(prefers-color-scheme: dark)", color: "#17181c" },
  ],
};

const themeBootstrap = `(() => { try { const p = localStorage.getItem('kept-theme') || 'system'; const dark = matchMedia('(prefers-color-scheme: dark)').matches; document.documentElement.dataset.themePreference = p; document.documentElement.dataset.theme = p === 'system' ? (dark ? 'dark' : 'light') : p; } catch {} })();`;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Kept",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  description: "A private, visual archive for links, posts, and ideas.",
  url: siteUrl,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
