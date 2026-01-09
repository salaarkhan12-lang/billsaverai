import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ErrorBoundary } from "@/components/blackbox_ErrorBoundary";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BillSaver | Medical Documentation Intelligence",
  description: "AI-powered medical documentation analysis to optimize billing accuracy and prevent revenue loss from undercoding.",
  keywords: ["medical billing", "documentation audit", "E/M coding", "HCC", "revenue optimization"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-[#0a0a0f] text-white min-h-screen`}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
