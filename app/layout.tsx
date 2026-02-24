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
