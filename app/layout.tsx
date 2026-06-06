import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavbarFull } from "@/components/navbar-full";
import { Footer } from "@/components/footer";
import { Analytics } from "@/components/analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexart — Marketplace créateurs & marchés artisanaux",
  description: "Nexart connecte créateurs, artisans et organisateurs de marchés artisanaux en France. Trouvez des événements, postulez à des stands, rencontrez des talents.",
  keywords: "artisanat, marché artisanal, créateurs, artisans, événements, France, stands, marketplace",
  openGraph: {
    title: "Nexart — Marketplace créateurs & marchés artisanaux",
    description: "Connectez créateurs, artisans et marchés artisanaux en France",
    siteName: "Nexart",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexart — Marketplace créateurs & marchés",
    description: "Connectez créateurs, artisans et marchés artisanaux en France",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Nexart',
    description: 'Marketplace connectant créateurs, artisans et organisateurs de marchés artisanaux en France',
    url: 'https://nexart.fr',
    logo: 'https://nexart.fr/logo.png',
    sameAs: [
      'https://instagram.com/nexart.fr',
      'https://facebook.com/nexart.fr',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'contact@nexart.fr',
    },
  }

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
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
        <Analytics />
      </body>
    </html>
  );
}
