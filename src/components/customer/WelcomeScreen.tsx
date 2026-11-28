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

        // Pure Haute Pâtisserie typographic welcome for 1.8 seconds, then dissolves smoothly into storefront
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 1800);

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
            scale: 1.015,
            filter: 'blur(6px)',
            transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
          }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#FAF7F2] text-stone-900 select-none cursor-pointer px-6 overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center max-w-sm sm:max-w-md w-full"
          >
            {/* Haute Pâtisserie Brand Emblem Header */}
            <span className="font-luxury uppercase text-[11px] sm:text-xs tracking-[0.36em] text-stone-500 font-medium mb-3 select-none">
              B I B I &apos; S &nbsp; T R E A T S
            </span>

            {/* Main Thai Heading - Noto Serif Thai */}
            <h1 className="font-thaiSerif text-2xl sm:text-3xl text-stone-900 font-normal tracking-[0.04em] leading-snug mb-3.5">
              ยินดีต้อนรับสู่ร้าน Bibi&apos;s Treats
            </h1>

            {/* Artisanal Hairline Accent */}
            <div className="w-8 h-[1px] bg-stone-300/80 mb-3.5" />

            {/* Slogan - Refined Thai Serif with letter-spacing */}
            <p className="font-thaiSerif text-xs sm:text-sm text-stone-600 font-light tracking-[0.1em] leading-relaxed">
              อบสดใหม่จากเตาทุกวัน
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
