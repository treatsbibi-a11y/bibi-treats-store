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

        // Gracefully dissolve into storefront after 1.8 seconds
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 1800);

        return () => clearTimeout(timer);
      }
    } catch {
      // Fallback
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
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#FAF8F5] select-none cursor-pointer px-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col items-center text-center max-w-sm"
          >
            {/* Elegant Brand Emblem */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm bg-white p-1 mb-5">
              <img
                src="/icons/icon-512x512.png"
                alt="Bibi's Treats"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            {/* Typography */}
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-stone-500 font-medium mb-1.5">
              Artisanal Bakery & Confectionery
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight mb-2">
              Bibi&apos;s Treats
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
              ยินดีต้อนรับสู่ร้านขนมอบโฮมเมดเนยสดแท้
            </p>

            {/* Minimalist Progress Indicator */}
            <div className="mt-8 w-12 h-[2px] bg-stone-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.6, ease: 'easeInOut' }}
                className="w-full h-full bg-stone-800 rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
