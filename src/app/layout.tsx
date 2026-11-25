import type { Metadata } from 'next';
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
    <html lang="th" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Rubik:wght@300;400;500;600;700&display=swap"
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
