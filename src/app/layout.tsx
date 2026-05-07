import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DemoBanner from "@/components/DemoBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FindWhoAmAI — AI-powered guessing game",
  description:
    "An AI-powered take on the classic 'Perfil' guessing game. Add players, draw a card, race to guess the answer.",
  metadataBase: new URL("https://findwhoamai.com"),
  openGraph: {
    title: "FindWhoAmAI — AI-powered guessing game",
    description:
      "An AI-powered take on the classic 'Perfil' guessing game. Add players, draw a card, race to guess the answer.",
    url: "https://findwhoamai.com",
    siteName: "FindWhoAmAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FindWhoAmAI — AI-powered guessing game",
    description: "An AI-powered take on the classic 'Perfil' guessing game.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
