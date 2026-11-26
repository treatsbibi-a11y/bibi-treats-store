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
  faStore,
} from '@fortawesome/free-solid-svg-icons';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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

    const installed = checkIsInstalled();

    // If installed, never show prompt
    if (installed) {
      setIsOpen(false);
      return;
    }

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Listen for Chrome/Edge/Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // If uninstalled or entering site, notify every visit as requested
      setTimeout(() => {
        if (!checkIsInstalled()) {
          setIsOpen(true);
        }
      }, 1500);
    };

    // 5. Listen for App Installed event
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsOpen(false);
      setDeferredPrompt(null);
    };

    // 6. Listen for display-mode changes (e.g. uninstalled / opened in browser)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      if (!e.matches) {
        // App is uninstalled / reopened in regular browser -> show prompt again
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

    // Fallback trigger for iOS (which doesn't support beforeinstallprompt)
    if (isIosDevice && !installed) {
      const iosTimer = setTimeout(() => {
        if (!checkIsInstalled()) {
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

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      // If browser doesn't offer deferredPrompt directly, show guide
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

  // If already installed (standalone mode), DO NOT RENDER ANYTHING
  if (isStandalone) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed bottom-3 inset-x-3 sm:left-auto sm:right-6 sm:bottom-6 z-40 max-w-sm sm:max-w-md w-auto">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-amber-200/90 p-4 sm:p-5 overflow-hidden ring-1 ring-amber-500/10"
          >
            {/* Warm Bakery Ambient Glow */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

            <div className="relative">
              {/* Header with App Icon */}
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-200 shadow-sm shrink-0 bg-white p-0.5">
                    <img
                      src="/uploads/bibi-1795498989551-27zh7uk.png"
                      alt="Bibi's Treats App"
                      className="w-full h-full object-cover rounded-lg scale-110"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                        Bibi&apos;s Treats App
                      </h4>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded-full">
                        PWA
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ติดตั้งลงหน้าจอมือถือ สั่งขนมง่าย ไวขึ้น 2 เท่า
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
                  aria-label="ปิดการแจ้งเตือน"
                >
                  <FontAwesomeIcon icon={faTimes} className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* iOS Installation Instruction Guide */}
              {showIOSGuide ? (
                <div className="mt-3 p-3 rounded-xl bg-amber-50/90 border border-amber-200/70 text-xs text-slate-700 space-y-2">
                  <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faMobileScreenButton} className="w-3.5 h-3.5 text-amber-700" />
                    วิธีติดตั้งบน iPhone / iPad (Safari)
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 leading-relaxed">
                    <li>
                      แตะปุ่มแชร์ <FontAwesomeIcon icon={faShareFromSquare} className="inline w-3 h-3 text-sky-600 mx-0.5" /> ด้านล่างของ Safari
                    </li>
                    <li>
                      เลื่อนลงมาแล้วเลือก <strong className="text-slate-800">&quot;เพิ่มไปยังหน้าจอโฮม&quot;</strong> (Add to Home Screen) <FontAwesomeIcon icon={faPlusSquare} className="inline w-3 h-3 text-amber-600 mx-0.5" />
                    </li>
                    <li>แตะ &quot;เพิ่ม&quot; (Add) ที่มุมขวาบน</li>
                  </ol>
                  <button
                    type="button"
                    onClick={() => setShowIOSGuide(false)}
                    className="w-full mt-2 py-1.5 text-center text-xs text-amber-800 font-medium hover:underline"
                  >
                    เข้าใจแล้ว
                  </button>
                </div>
              ) : (
                <div className="mt-3.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="flex-1 py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold shadow-sm shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5" />
                    <span>ติดตั้งแอปฟรี</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors"
                  >
                    ไว้คราวหน้า
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
