import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { MotionProvider } from '@/components/providers/MotionProvider';

config.autoAddCss = false;
import Navbar from '@/components/customer/Navbar';
import BottomNav from '@/components/customer/BottomNav';
import Footer from '@/components/customer/Footer';
import { CartDrawer } from '@/components/customer/CartDrawer';
import ScrollProgressBar from '@/components/customer/ScrollProgressBar';
import ScrollToTop from '@/components/customer/ScrollToTop';
import CookieConsent from '@/components/customer/CookieConsent';
import PWAInstallPrompt from '@/components/customer/PWAInstallPrompt';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://bibitreats.com'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Bibi's Treats",
  },
  title: "Bibi's Treats | Artisanal Confectionery & Pastries",
  description: 'Small-batch artisanal bakery crafted with 100% pure butter and single-origin chocolate. Fresh daily delivery in Bangkok.',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧁</text></svg>',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="scroll-smooth">
      <head>
        {/* Google Tag Manager / GA4 */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WNH9VSWL');`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Rubik:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-surface-ground text-slate-900 antialiased selection:bg-brand-100 selection:text-brand-900">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WNH9VSWL"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <ScrollProgressBar />
        <MotionProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1 w-full">{children}</main>
            <Footer />
            <ScrollToTop />
            <BottomNav />
            <CartDrawer />
            <CookieConsent />
            <PWAInstallPrompt />
          </CartProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
