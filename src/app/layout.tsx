import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AccentProvider } from "@/components/accent-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Road to Mastock",
  description: "Track your gym sessions. Get mastock.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mastock",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FE6B00",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`dark ${geistSans.variable}`}>
      <body>
        <AccentProvider>
          <div className="mx-auto min-h-dvh max-w-lg">{children}</div>
        </AccentProvider>
      </body>
    </html>
  );
}
