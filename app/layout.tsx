import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  weight: ["400", "500", "700"]
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://frequency.theg0d.ai'),
  title: "FREQUENCY | Cosmic Frequency",
  description: "Cosmic Frequency Radio. Music tuned to the stars. 6 frequencies streaming now.",
  keywords: ["radio", "music", "cosmic", "frequency", "streaming", "GΦD"],
  authors: [{ name: "GΦD Empire" }],
  manifest: "/manifest.json",
  
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://frequency.theg0d.ai",
    siteName: "FREQUENCY",
    title: "FREQUENCY | Cosmic Frequency",
    description: "Cosmic Frequency Radio. Music tuned to the stars.",
  },
  
  twitter: {
    card: "summary_large_image",
    title: "FREQUENCY | Cosmic Frequency",
    description: "Cosmic Frequency Radio. Music tuned to the stars.",
    creator: "@theg0d",
  },
  
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RADIO",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={spaceGrotesk.className}>{children}</body>
    </html>
  );
}
