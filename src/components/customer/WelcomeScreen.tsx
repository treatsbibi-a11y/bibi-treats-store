'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WELCOME_SESSION_KEY = 'bibi_welcome_shown_session';

export default function WelcomeScreen() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const alreadyShown = sessionStorage.getItem(WELCOME_SESSION_KEY);
      if (!alreadyShown) {
        setIsVisible(true);
        sessionStorage.setItem(WELCOME_SESSION_KEY, 'true');

        // Smooth luxury reveal for 2.4 seconds, then cross-fades into storefront
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 2400);

        return () => clearTimeout(timer);
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="welcome-splash"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.02,
            filter: 'blur(8px)',
            transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
          }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#FAF7F2] select-none cursor-pointer px-4 sm:px-6 overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center text-center max-w-xs sm:max-w-sm w-full"
          >
            {/* Artisanal Poster Showcase Card */}
            <div className="relative w-44 sm:w-52 aspect-[724/1024] rounded-2xl overflow-hidden shadow-2xl border border-amber-900/10 bg-amber-50/40 mb-4 ring-1 ring-black/5">
              <img
                src="/images/bibi-poster.jpg"
                alt="Bibi's Treats Artisanal Bakery"
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            </div>

            {/* Typography - Refined & Unslop */}
            <h1 className="text-xl sm:text-2xl font-serif text-stone-900 tracking-tight mb-1">
              Bibi&apos;s Treats
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
              ขนมอบโฮมเมดเนยสดแท้ อบสดใหม่ทุกวัน
            </p>

            {/* Luxury Progress Bar */}
            <div className="mt-5 w-12 h-[2px] bg-stone-300/70 rounded-full overflow-hidden">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
                className="w-full h-full bg-stone-800 rounded-full"
              />
            </div>

            <span className="mt-3 text-[10px] text-stone-400 font-light">
              แตะเพื่อเข้าสู่ร้านค้า
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
