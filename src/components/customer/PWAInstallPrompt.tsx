'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faTimes,
  faShareFromSquare,
  faPlusSquare,
  faMobileScreenButton,
} from '@fortawesome/free-solid-svg-icons';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWA_DISMISSED_KEY = 'bibi_pwa_dismissed_until';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('PWA service worker registration failed:', err);
      });
    }

    // 2. Check if currently running in Standalone (Installed) mode
    const checkIsInstalled = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    // 3. Check if user dismissed recently (today and tomorrow suppression)
    const checkIsDismissed = () => {
      try {
        const dismissedUntil = localStorage.getItem(PWA_DISMISSED_KEY);
        if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
          return true;
        }
      } catch {}
      return false;
    };

    const installed = checkIsInstalled();
    if (installed || checkIsDismissed()) {
      setIsOpen(false);
      return;
    }

    // 4. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 5. Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => {
        if (!checkIsInstalled() && !checkIsDismissed()) {
          setIsOpen(true);
        }
      }, 1500);
    };

    // 6. Listen for App Installed event
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsOpen(false);
      setDeferredPrompt(null);
    };

    // 7. Listen for display-mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      if (!e.matches && !checkIsDismissed()) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    } else {
      mediaQuery.addListener(handleDisplayModeChange);
    }

    // iOS fallback prompt
    if (isIosDevice && !installed && !checkIsDismissed()) {
      const iosTimer = setTimeout(() => {
        if (!checkIsInstalled() && !checkIsDismissed()) {
          setIsOpen(true);
        }
      }, 2000);
      return () => clearTimeout(iosTimer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      } else {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    setShowIOSGuide(false);
    try {
      // Suppress reminder for the rest of today and the entire next day
      const suppressUntil = new Date();
      suppressUntil.setDate(suppressUntil.getDate() + 1);
      suppressUntil.setHours(23, 59, 59, 999);
      localStorage.setItem(PWA_DISMISSED_KEY, suppressUntil.getTime().toString());
    } catch {}
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      setShowIOSGuide(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsStandalone(true);
        setIsOpen(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  if (isStandalone) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed bottom-3 inset-x-3 sm:left-auto sm:right-6 sm:bottom-6 z-40 max-w-sm sm:max-w-md w-auto">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="bg-white/98 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200/90 p-4 sm:p-5 overflow-hidden ring-1 ring-black/5"
          >
            <div className="relative">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl overflow-hidden border border-stone-200 shadow-sm shrink-0 bg-stone-50 p-0.5">
                    <img
                      src="/icons/bibi-ultra-192-v4.png"
                      alt="Bibi's Treats"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-900 text-sm sm:text-base leading-tight">
                      Bibi&apos;s Treats
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5 leading-snug">
                      ติดตั้งแอปเพื่อความสะดวกในการเข้าชมและสั่งซื้อ
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-7 h-7 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center transition-colors shrink-0"
                  aria-label="ปิดการแจ้งเตือน"
                >
                  <FontAwesomeIcon icon={faTimes} className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* iOS Guide */}
              {showIOSGuide ? (
                <div className="mt-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-700 space-y-2">
                  <div className="font-medium text-stone-900 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faMobileScreenButton} className="w-3.5 h-3.5 text-stone-600" />
                    วิธีติดตั้งแอป (Safari iOS)
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-stone-600 pl-1 leading-relaxed">
                    <li>
                      แตะปุ่มแชร์ <FontAwesomeIcon icon={faShareFromSquare} className="inline w-3 h-3 text-sky-600 mx-0.5" /> ที่แถบด้านล่าง
                    </li>
                    <li>
                      เลื่อนลงแล้วเลือก <strong className="text-stone-800">&quot;เพิ่มไปยังหน้าจอโฮม&quot;</strong> <FontAwesomeIcon icon={faPlusSquare} className="inline w-3 h-3 text-amber-600 mx-0.5" />
                    </li>
                    <li>แตะ &quot;เพิ่ม&quot; ที่มุมขวาบน</li>
                  </ol>
                  <button
                    type="button"
                    onClick={() => setShowIOSGuide(false)}
                    className="w-full mt-2 py-1.5 text-center text-xs text-stone-800 font-medium hover:underline"
                  >
                    ย้อนกลับ
                  </button>
                </div>
              ) : (
                <div className="mt-3.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="flex-1 py-2.5 px-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5" />
                    <span>ติดตั้งแอป</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-medium transition-colors"
                  >
                    ไว้คราวหลัง
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
