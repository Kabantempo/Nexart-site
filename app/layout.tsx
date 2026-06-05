import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavbarFull } from "@/components/navbar-full";
import { Footer } from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexart — Marketplace créateurs & marchés",
  description: "Connectez créateurs, artisans et marchés artisanaux en France",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="flex min-h-screen flex-col"
        style={{
          backgroundColor: '#FFFFFF',
          color: '#1A1A1A',
        }}
      >
        <NavbarFull />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
