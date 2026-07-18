import type { Metadata } from "next";
import "./globals.css";
import { NavbarFull } from "@/components/navbar-full";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import { CookieConsent } from "@/components/CookieConsent";
import { EmailConfirmationBanner } from "@/components/ui/email-confirmation-banner";
import { PageTransition } from "@/components/page-transition";


export const metadata: Metadata = {
  metadataBase: new URL('https://nexart.fr'),
  title: {
    default: 'Nexart — Marketplace créateurs & marchés artisanaux',
    template: '%s — Nexart',
  },
  description: 'Nexart connecte créateurs, artisans et organisateurs de marchés artisanaux en France. Candidatez à des marchés, pop-ups, salons et festivals en quelques clics.',
  keywords: ['marché artisanal', 'créateurs', 'artisans', 'pop-up', 'salon artisanat', 'marketplace artisan', 'événement artisanal', 'France', 'candidature marché'],
  authors: [{ name: 'Nexart', url: 'https://nexart.fr' }],
  creator: 'Nexart',
  publisher: 'Nexart',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://nexart.fr',
    siteName: 'Nexart',
    title: 'Nexart — Marketplace créateurs & marchés artisanaux',
    description: 'Nexart connecte créateurs, artisans et organisateurs de marchés artisanaux en France.',
    images: [{ url: '/logo-full.png', width: 502, height: 594, alt: 'Nexart — Marketplace artisanale' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@nexartfr',
    creator: '@nexartfr',
    title: 'Nexart — Marketplace créateurs & marchés artisanaux',
    description: 'Nexart connecte créateurs, artisans et organisateurs de marchés artisanaux en France.',
    images: ['/logo-full.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon-180.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  manifest: '/manifest.json',
  alternates: { canonical: 'https://nexart.fr' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className="h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
        <noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet" /></noscript>
      </head>
      <body className="flex min-h-screen flex-col bg-white text-gray-900">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:font-semibold">
          Aller au contenu principal
        </a>
        <Providers>
          <NavbarFull />
          <EmailConfirmationBanner />
          <main id="main-content" className="flex-1 pt-[58px]">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
          <CookieConsent />
        </Providers>
        {/* Framer Motion safety net — force visibilité si animation bloquée après 1s */}
        <script dangerouslySetInnerHTML={{ __html: `
          setTimeout(function(){
            document.querySelectorAll('[style*="opacity:0"],[style*="opacity: 0"]').forEach(function(el){
              el.style.opacity='1';
              el.style.transform='none';
            });
          }, 1000);
        `}} />
      </body>
    </html>
  );
}
