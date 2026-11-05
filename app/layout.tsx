import "./globals.css";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "QR Code Tracker - Create, Track & Manage QR Codes",
    template: "%s | QR Code Tracker",
  },
  description:
    "Create, track, and manage QR codes with analytics. Generate custom QR codes and monitor scan activity in real-time.",
  keywords: [
    "qr code",
    "qr code generator",
    "qr tracker",
    "analytics",
    "scan tracking",
    "custom qr codes",
  ],
  authors: [{ name: "QR Tracker" }],
  creator: "QR Tracker",
  publisher: "QR Tracker",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "QR Code Tracker - Create, Track & Manage QR Codes",
    description:
      "Create, track, and manage QR codes with analytics. Generate custom QR codes and monitor scan activity in real-time.",
    siteName: "QR Code Tracker",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "QR Code Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QR Code Tracker - Create, Track & Manage QR Codes",
    description:
      "Create, track, and manage QR codes with analytics. Generate custom QR codes and monitor scan activity in real-time.",
    images: ["/og-image.png"],
    creator: "@qrtracker",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icon.svg" }],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}