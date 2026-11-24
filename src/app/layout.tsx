import type { Metadata } from 'next';
import { Rubik, Prompt, Alex_Brush, Great_Vibes, Just_Another_Hand } from 'next/font/google';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import './globals.css';
import { CartProvider } from '@/context/CartContext';

config.autoAddCss = false;
import Navbar from '@/components/customer/Navbar';
import BottomNav from '@/components/customer/BottomNav';
import Footer from '@/components/customer/Footer';
import { CartDrawer } from '@/components/customer/CartDrawer';
import ScrollProgressBar from '@/components/customer/ScrollProgressBar';
import ScrollToTop from '@/components/customer/ScrollToTop';

const rubik = Rubik({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-rubik',
  display: 'swap',
});

const prompt = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-prompt',
  display: 'swap',
});

const alexBrush = Alex_Brush({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-alex-brush',
  display: 'swap',
});

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-signature',
  display: 'swap',
});

const justAnotherHand = Just_Another_Hand({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-just-another-hand',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Bibi's Treats | Artisanal Confectionery & Pastries",
  description: 'Small-batch artisanal bakery crafted with 100% pure butter and single-origin chocolate. Fresh daily delivery in Bangkok.',
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
    <html lang="th" className={`${rubik.variable} ${prompt.variable} ${alexBrush.variable} ${greatVibes.variable} ${justAnotherHand.variable} scroll-smooth`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Great+Vibes&family=Just+Another+Hand&family=Prompt:wght@300;400;500;600;700&family=Rubik:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-surface-ground text-slate-900 antialiased selection:bg-brand-100 selection:text-brand-900">
        <ScrollProgressBar />
        <CartProvider>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
          <ScrollToTop />
          <BottomNav />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
