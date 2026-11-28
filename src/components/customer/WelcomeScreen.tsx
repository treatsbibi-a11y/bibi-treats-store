'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WELCOME_SESSION_KEY = 'bibi_welcome_shown_session';

export default function WelcomeScreen() {
  // Start visible at 0ms (pre-hydration) so there is zero pop-in jitter or flash
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const alreadyShown = sessionStorage.getItem(WELCOME_SESSION_KEY);
      if (alreadyShown) {
        // Return visitor in same session: immediately hide without animation
        setIsVisible(false);
        return;
      }

      // First time in session: show for 0.5 seconds, then immediately dissolve into storefront
      sessionStorage.setItem(WELCOME_SESSION_KEY, 'true');
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 500);

      return () => clearTimeout(timer);
    } catch {
      setIsVisible(false);
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
            scale: 1.01,
            filter: 'blur(4px)',
            transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
          }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF7F2] text-stone-900 select-none cursor-pointer px-6 overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center max-w-sm sm:max-w-md w-full"
          >
            {/* Haute Pâtisserie Brand Emblem Header */}
            <span className="font-luxury uppercase text-[11px] sm:text-xs tracking-[0.38em] text-stone-500 font-medium mb-2.5 select-none">
              B I B I &apos; S &nbsp; T R E A T S
            </span>

            {/* Main Thai Heading - Noto Serif Thai */}
            <h1 className="font-thaiSerif text-2xl sm:text-3xl text-stone-900 font-normal tracking-[0.04em] leading-snug mb-3">
              ยินดีต้อนรับสู่ร้าน Bibi&apos;s Treats
            </h1>

            {/* Artisanal Hairline Accent */}
            <div className="w-8 h-[1px] bg-stone-300/80 mb-3" />

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
