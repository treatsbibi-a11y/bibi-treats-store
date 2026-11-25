'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems, isDrawerOpen, openDrawer, closeDrawer } = useCart();
  const [activeTab, setActiveTab] = useState<'home' | 'menu' | 'cart' | 'tracking'>('home');
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

  // Hide on admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }

  // Reactive active tab detection
  useEffect(() => {
    if (isDrawerOpen) {
      setActiveTab('cart');
      return;
    }

    if (pathname.startsWith('/tracking') || pathname.startsWith('/order-success')) {
      setActiveTab('tracking');
      return;
    }

    if (pathname === '/cart' || pathname === '/checkout') {
      setActiveTab('cart');
      return;
    }

    if (pathname === '/') {
      const handleScroll = () => {
        const menuEl = document.getElementById('menu');
        if (menuEl) {
          const rect = menuEl.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveTab('menu');
          } else {
            setActiveTab('home');
          }
        }
      };

      handleScroll();
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [pathname, isDrawerOpen]);

  const handleHomeClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      closeDrawer();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveTab('home');
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    closeDrawer();
    if (pathname === '/') {
      e.preventDefault();
      const menuEl = document.getElementById('menu');
      if (menuEl) {
        menuEl.scrollIntoView({ behavior: 'smooth' });
        setActiveTab('menu');
      }
    } else {
      router.push('/#menu');
    }
  };

  const handleCartClick = () => {
    if (isDrawerOpen) {
      closeDrawer();
    } else {
      openDrawer();
      setActiveTab('cart');
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 pt-1.5 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Home (หน้าแรก) */}
        <Link
          href="/"
          onClick={handleHomeClick}
          className={`flex flex-col items-center justify-center min-h-[46px] min-w-[58px] py-1 px-2 text-[11px] transition-all rounded-xl active:scale-95 ${
            activeTab === 'home'
              ? 'text-slate-900 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-normal'
          }`}
        >
          {activeTab === 'home' ? (
            /* Solid Filled House Icon */
            <svg
              className="w-5 h-5 mb-0.5 text-slate-900 transition-transform duration-200"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11.26 2.45a1.14 1.14 0 0 1 1.48 0l8.25 6.87A1.14 1.14 0 0 1 21.37 10v9.88A2.12 2.12 0 0 1 19.25 22H14.5a1 1 0 0 1-1-1v-4.5a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1V21a1 1 0 0 1-1 1H4.75a2.12 2.12 0 0 1-2.12-2.12V10a1.14 1.14 0 0 1 .38-.68l8.25-6.87z" />
            </svg>
          ) : (
            /* Minimal Outline House Icon */
            <svg
              className="w-5 h-5 mb-0.5 text-slate-400 transition-transform duration-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 14 20v-4.5a1.5 1.5 0 0 0-1.5-1.5h-1A1.5 1.5 0 0 0 10 15.5V20A1.5 1.5 0 0 1 8.5 21.5h-4A1.5 1.5 0 0 1 3 20v-9.5z" />
            </svg>
          )}
          <span>หน้าแรก</span>
        </Link>

        {/* 2. Menu (Menu) */}
        <Link
          href="/#menu"
          onClick={handleMenuClick}
          className={`flex flex-col items-center justify-center min-h-[46px] min-w-[58px] py-1 px-2 text-[11px] transition-all rounded-xl active:scale-95 ${
            activeTab === 'menu'
              ? 'text-slate-900 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-normal'
          }`}
        >
          {activeTab === 'menu' ? (
            /* Solid Filled 4-Grid Menu Icon */
            <svg
              className="w-5 h-5 mb-0.5 text-slate-900 transition-transform duration-200"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
              <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
              <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
              <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
            </svg>
          ) : (
            /* Minimal Outline 4-Grid Menu Icon */
            <svg
              className="w-5 h-5 mb-0.5 text-slate-400 transition-transform duration-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
              <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
              <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
              <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
            </svg>
          )}
          <span>Menu</span>
        </Link>

        {/* 3. Cart (ตะกร้า) */}
        <button
          onClick={handleCartClick}
          className={`relative flex flex-col items-center justify-center min-h-[46px] min-w-[58px] py-1 px-2 text-[11px] transition-all rounded-xl active:scale-95 ${
            activeTab === 'cart'
              ? 'text-slate-900 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-normal'
          }`}
          aria-label="เปิดตะกร้าสินค้า"
        >
          <div className={`relative transition-all duration-300 ${isCartBouncing ? 'scale-110 text-brand-600' : ''}`}>
            {activeTab === 'cart' ? (
              /* Solid Filled Luxury Shopping Bag */
              <svg
                className="w-5 h-5 mb-0.5 text-slate-900 transition-transform duration-200"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9 4.5A3.5 3.5 0 0 1 12.5 1a3.5 3.5 0 0 1 3.5 3.5V6h3.25a1.75 1.75 0 0 1 1.74 1.93l-1.16 11.66A2.75 2.75 0 0 1 17.1 22H6.9a2.75 2.75 0 0 1-2.73-2.41L3.01 7.93A1.75 1.75 0 0 1 4.75 6H8v-1.5zm2 1.5h2V4.5a1.5 1.5 0 0 0-3 0V6z"
                />
              </svg>
            ) : (
              /* Minimal Outline Luxury Shopping Bag */
              <svg
                className="w-5 h-5 mb-0.5 text-slate-400 transition-transform duration-200"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8.5h12l1.2 11.5a2 2 0 0 1-2 2H6.8a2 2 0 0 1-2-2L6 8.5z" />
                <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
              </svg>
            )}

            {/* Red Circular Cart Badge (Pure borderless solid red) */}
            {totalItems > 0 && (
              <span className={`absolute -top-1.5 -right-2 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-xs pointer-events-none transition-transform duration-300 ${
                isCartBouncing ? 'scale-110' : ''
              }`}>
                {totalItems}
              </span>
            )}
          </div>
          <span>ตะกร้า</span>
        </button>

        {/* 4. Tracking (ติดตาม) */}
        <Link
          href="/tracking"
          onClick={() => {
            closeDrawer();
            setActiveTab('tracking');
          }}
          className={`flex flex-col items-center justify-center min-h-[46px] min-w-[58px] py-1 px-2 text-[11px] transition-all rounded-xl active:scale-95 ${
            activeTab === 'tracking'
              ? 'text-slate-900 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-normal'
          }`}
        >
          {activeTab === 'tracking' ? (
            /* Solid Filled Minimal Package Icon */
            <svg
              className="w-5 h-5 mb-0.5 text-slate-900 transition-transform duration-200"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2.2a1.2 1.2 0 0 1 .6.16l8.4 4.8a1.2 1.2 0 0 1 .6 1.04v7.6a1.2 1.2 0 0 1-.6 1.04l-8.4 4.8a1.2 1.2 0 0 1-1.2 0l-8.4-4.8a1.2 1.2 0 0 1-.6-1.04V8.2a1.2 1.2 0 0 1 .6-1.04l8.4-4.8a1.2 1.2 0 0 1 .6-.16zm-1 2.2L4.65 8 11 11.64V4.4zm2 0v7.24L19.35 8 13 4.4zm-8.8 5.4v6.2l6.8 3.88V13.6L4.2 9.8zm15.6 0l-6.8 3.8v6.28l6.8-3.88V9.8z" />
            </svg>
          ) : (
            /* Minimal Outline Package Icon */
            <svg
              className="w-5 h-5 mb-0.5 text-slate-400 transition-transform duration-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 7.5l-9-5-9 5 9 5 9-5z" />
              <path d="M3 7.5v9l9 5 9-5v-9" />
              <path d="M12 12.5v9" />
            </svg>
          )}
          <span>ติดตาม</span>
        </Link>
      </div>
    </nav>
  );
}
