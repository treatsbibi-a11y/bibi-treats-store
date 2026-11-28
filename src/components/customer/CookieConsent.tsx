'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCookieBite,
  faSliders,
  faCheck,
  faTimes,
  faShieldHalved,
  faChartLine,
  faBullhorn,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  consentedAt?: string;
}

const COOKIE_STORAGE_KEY = 'bibi_cookie_consent';

export default function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: true,
    marketing: false,
    preferences: true,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!stored) {
        // Show banner after welcome screen transition completes (3.2 seconds)
        const timer = setTimeout(() => setIsOpen(true), 3200);
        return () => clearTimeout(timer);
      } else {
        const parsed: CookiePreferences = JSON.parse(stored);
        setPrefs(parsed);
        applyGtmConsent(parsed);
      }
    } catch {
      setIsOpen(true);
    }
  }, []);

  const applyGtmConsent = (preferences: CookiePreferences) => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as { dataLayer: Record<string, unknown>[] };
      win.dataLayer = win.dataLayer || [];
      win.dataLayer.push({
        event: 'cookie_consent_update',
        consent_analytics: preferences.analytics,
        consent_marketing: preferences.marketing,
        consent_preferences: preferences.preferences,
      });
    }
  };

  const saveConsent = (preferences: CookiePreferences) => {
    const updated = {
      ...preferences,
      necessary: true,
      consentedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Unable to save cookie consent', e);
    }
    setPrefs(updated);
    applyGtmConsent(updated);
    setIsOpen(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  };

  const handleSavePreferences = () => {
    saveConsent(prefs);
  };

  return (
    <>
      {/* Floating Widget Trigger to reopen consent if already saved */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowPreferences(true);
            setIsOpen(true);
          }}
          className="fixed bottom-4 left-4 z-40 bg-white/95 hover:bg-white text-slate-700 p-2.5 rounded-full shadow-md border border-slate-200/80 backdrop-blur-md flex items-center justify-center gap-2 group transition-all"
          title="การตั้งค่าคุกกี้และความเป็นส่วนตัว"
          aria-label="การตั้งค่าคุกกี้"
        >
          <FontAwesomeIcon icon={faCookieBite} className="w-4 h-4 text-slate-600 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-medium text-slate-700 hidden sm:inline-block pr-1">ตั้งค่าคุกกี้</span>
        </motion.button>
      )}

      {/* Floating Banner (Bottom-Right) */}
      <AnimatePresence>
        {isOpen && !showPreferences && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-4 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/90 p-5 overflow-hidden ring-1 ring-slate-900/5"
          >
            <div className="relative">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <FontAwesomeIcon icon={faCookieBite} className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                    การใช้งานคุกกี้
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    เราใช้คุกกี้ที่จำเป็นและคุกกี้วิเคราะห์เพื่อปรับปรุงและพัฒนาประสบการณ์การสั่งซื้อของคุณ
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="w-full sm:flex-1 py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition-colors flex items-center justify-center"
                >
                  ยอมรับทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={handleRejectNonEssential}
                  className="w-full sm:w-auto py-2 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
                >
                  ปฏิเสธ
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreferences(true)}
                  className="w-full sm:w-auto py-2 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faSliders} className="w-3 h-3 text-slate-400" />
                  <span>ตั้งค่า</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preferences Modal (PDPA Detailed Category Selection) */}
      <AnimatePresence>
        {isOpen && showPreferences && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <FontAwesomeIcon icon={faSliders} className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      ตั้งค่าความยินยอมคุกกี้
                    </h2>
                    <p className="text-xs text-slate-500">เลือกประเภทคุกกี้ที่คุณอนุญาตให้เราใช้งาน</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPreferences(false);
                    // if already consented earlier, close all
                    try {
                      if (localStorage.getItem(COOKIE_STORAGE_KEY)) setIsOpen(false);
                    } catch {}
                  }}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                </button>
              </div>

              {/* Categories list */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
                {/* 1. Necessary */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 text-xs sm:text-sm">
                          คุกกี้ที่จำเป็น (Strictly Necessary)
                        </h4>
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-full">
                          จำเป็นเสมอ
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        จำเป็นสำหรับการทำงานพื้นฐานของเว็บไซต์ เช่น ระบบตะกร้าสินค้า การสั่งซื้อ และความปลอดภัย
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="mt-1 w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-not-allowed opacity-60"
                  />
                </div>

                {/* 2. Analytics */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-colors flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <FontAwesomeIcon icon={faChartLine} className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-xs sm:text-sm">
                        คุกกี้เพื่อการวิเคราะห์ (Analytics)
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        ช่วยให้เราเข้าใจการใช้งานเว็บไซต์ผ่าน Google Analytics เพื่อปรับปรุงประสิทธิภาพหน้าเว็บ
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={prefs.analytics}
                      onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>

                {/* 3. Marketing */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-colors flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <FontAwesomeIcon icon={faBullhorn} className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-xs sm:text-sm">
                        คุกกี้เพื่อการตลาด (Marketing)
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        ใช้เพื่อนำเสนอโปรโมชัน ข่าวสาร และแคมเปญพิเศษที่ตรงตามความสนใจของคุณ
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={prefs.marketing}
                      onChange={(e) => setPrefs({ ...prefs, marketing: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={handleRejectNonEssential}
                  className="w-full sm:w-auto text-xs text-slate-500 hover:text-slate-800 font-medium py-2 px-3"
                >
                  ปฏิเสธคุกกี้ที่ไม่จำเป็น
                </button>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="flex-1 sm:flex-initial py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors"
                  >
                    ยอมรับทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    className="flex-1 sm:flex-initial py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>บันทึกการตั้งค่า</span>
                    <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
