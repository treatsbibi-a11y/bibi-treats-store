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

        // Pure typographic welcome for 1.6 seconds, then dissolves smoothly into storefront
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 1600);

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
            transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
          }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#FAF7F2] text-stone-900 select-none cursor-pointer px-6 overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center max-w-sm w-full"
          >
            <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight leading-tight mb-2">
              ยินดีต้อนรับสู่ร้าน Bibi&apos;s Treats
            </h1>
            <p className="text-sm sm:text-base text-stone-600 font-light tracking-wide">
              อบสดใหม่จากเตาทุกวัน
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
