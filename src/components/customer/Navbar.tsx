'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBagShopping } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '@/context/CartContext';

interface NavItem {
  id: string;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', href: '/#home' },
  { id: 'menu', label: 'Menu', href: '/#menu' },
  { id: 'reviews', label: 'Review', href: '/#reviews' },
  { id: 'tracking', label: 'Track order', href: '/tracking' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { totalItems, openDrawer } = useCart();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string>("Bibi's Treats");
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const prevTotalItemsRef = React.useRef(totalItems);

  useEffect(() => {
    if (totalItems > prevTotalItemsRef.current) {
      setIsCartBouncing(true);
      const timer = setTimeout(() => setIsCartBouncing(false), 800);
      prevTotalItemsRef.current = totalItems;
      return () => clearTimeout(timer);
    }
    prevTotalItemsRef.current = totalItems;
  }, [totalItems]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      if (pathname !== '/') return;

      const menuEl = document.getElementById('menu');
      const reviewsEl = document.getElementById('reviews');

      const scrollPos = window.scrollY + 160;

      if (reviewsEl && scrollPos >= reviewsEl.offsetTop) {
        setActiveSection('reviews');
      } else if (menuEl && scrollPos >= menuEl.offsetTop) {
        setActiveSection('menu');
      } else {
        setActiveSection('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith('/tracking')) {
      setActiveSection('tracking');
    } else if (pathname === '/') {
      // check hash if any
      const hash = window.location.hash.replace('#', '');
      if (hash === 'menu' || hash === 'reviews' || hash === 'home') {
        setActiveSection(hash);
      }
    }
  }, [pathname]);

  const fetchSettings = React.useCallback(async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.shopName) setShopName(data.shopName);
      }
    } catch (e) {
      // use fallback defaults
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchSettings();
    }, 5000);
    const onFocus = () => {
      if (document.visibilityState === 'visible') fetchSettings();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [fetchSettings]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    if (pathname === '/' && item.id !== 'tracking') {
      e.preventDefault();
      setActiveSection(item.id);

      if (item.id === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.pushState(null, '', '/');
        return;
      }

      const element = document.getElementById(item.id);
      if (element) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
        window.history.pushState(null, '', `/#${item.id}`);
      }
    }
  };

  return (
    <header
      className={`sticky z-40 transition-[top,padding,background-color,border-color] duration-200 ease-[var(--ease-out)] ${
        isScrolled
          ? 'top-2 sm:top-3.5 px-3 sm:px-6 pointer-events-none bg-transparent border-b-0 border-transparent'
          : 'top-0 px-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 pointer-events-auto'
      }`}
    >
      <div
        className={`mx-auto flex items-center justify-between pointer-events-auto text-slate-900 transition-[height,padding,border-radius,background-color,border-color,box-shadow] duration-200 ease-[var(--ease-out)] ${
          isScrolled
            ? 'max-w-6xl h-14 sm:h-16 px-4 sm:px-6 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/5'
            : 'max-w-7xl w-full h-16 px-4 sm:px-6 lg:px-8 rounded-none border-0 border-transparent ring-0 shadow-none bg-transparent'
        }`}
      >
        {/* Brand Logo - Circular & Borderless with edge-to-edge crop */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {logoUrl ? (
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-transparent border-0 ring-0 shadow-none">
              <img
                src={logoUrl}
                alt={shopName}
                className="w-full h-full rounded-full object-cover scale-110"
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-none border-0">
              BT
            </div>
          )}
          <div>
            <span className="font-semibold text-lg text-slate-900 tracking-wide group-hover:text-amber-700 transition-colors">
              {shopName.replace(/[🩵🧁♡]/g, '').trim() || "BIBI'S TREATS"}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation with Active Pill behind text */}
        <nav className="hidden md:flex items-center space-x-1 text-sm font-medium font-rubik p-1 rounded-full bg-slate-100/90 border border-slate-200/80 backdrop-blur-sm">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            const isHome = item.id === 'home';

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                title={item.label}
                aria-label={item.label}
                className={`relative rounded-full transition-[color,background-color,box-shadow] duration-150 ease-[var(--ease-out)] flex items-center justify-center ${
                  isHome ? 'px-3 py-1.5 min-w-[38px] h-8' : 'px-4 py-1.5 text-xs sm:text-sm'
                } ${
                  isActive
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {isHome ? (
                  isActive ? (
                    /* Solid Filled House Icon */
                    <svg
                      className="w-4 h-4 text-slate-900"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M11.26 2.45a1.14 1.14 0 0 1 1.48 0l8.25 6.87A1.14 1.14 0 0 1 21.37 10v9.88A2.12 2.12 0 0 1 19.25 22H14.5a1 1 0 0 1-1-1v-4.5a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1V21a1 1 0 0 1-1 1H4.75a2.12 2.12 0 0 1-2.12-2.12V10a1.14 1.14 0 0 1 .38-.68l8.25-6.87z" />
                    </svg>
                  ) : (
                    /* Minimal Outline House Icon */
                    <svg
                      className="w-4 h-4 text-slate-500 hover:text-slate-800 transition-colors"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 14 20v-4.5a1.5 1.5 0 0 0-1.5-1.5h-1A1.5 1.5 0 0 0 10 15.5V20A1.5 1.5 0 0 1 8.5 21.5h-4A1.5 1.5 0 0 1 3 20v-9.5z" />
                    </svg>
                  )
                ) : (
                  item.label
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Bag Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={openDrawer}
            className={`relative w-10 h-10 rounded-xl border transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-[var(--ease-out)] flex items-center justify-center shadow-xs hover:shadow active:scale-95 ${
              isCartBouncing
                ? 'scale-105 ring-2 ring-brand-200/80 border-brand-200 bg-brand-50 text-brand-600'
                : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200/90 text-slate-800'
            }`}
            aria-label="เปิดตะกร้าสินค้า"
          >
            <FontAwesomeIcon
              icon={faBagShopping}
              className={`w-4 h-4 transition-[transform,color] duration-200 ease-[var(--ease-out)] ${
                isCartBouncing ? 'text-brand-600 scale-105' : 'text-slate-800'
              }`}
            />
            <span
              className={`absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-mono min-w-[19px] h-[19px] px-1 rounded-full flex items-center justify-center font-bold shadow-sm transition-transform duration-200 ease-[var(--ease-out)] ${
                isCartBouncing ? 'scale-110' : ''
              }`}
            >
              {totalItems}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
