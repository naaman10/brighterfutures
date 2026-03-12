import type { Metadata } from "next";
import { National_Park } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const nationalPark = National_Park({
  variable: "--font-national-park",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brighter Futures",
  description: "Client dashboard for sending emails",
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${nationalPark.variable} ${nationalPark.className} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
