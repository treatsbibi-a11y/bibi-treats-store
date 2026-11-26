'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const EASE_DRAWER: [number, number, number, number] = [0.32, 0.72, 0, 1];
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: DrawerProps) {
  const reduceMotion = useReducedMotion();

  // Prevent background scrolling and handle Escape key when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title || 'Cart'}
          className="fixed inset-0 z-50 overflow-hidden"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto pointer-events-none">
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { x: '100%' }}
              animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { x: '100%' }}
              transition={{ duration: reduceMotion ? 0.16 : 0.32, ease: EASE_DRAWER }}
              className="pointer-events-auto w-full sm:w-screen sm:max-w-md bg-white shadow-2xl flex flex-col h-[100dvh] max-h-[100dvh]"
            >
              {/* Header */}
              <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                <h2 className="text-base font-bold text-slate-900">{title || 'Cart'}</h2>
                <button
                  onClick={onClose}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-[transform,color,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                  aria-label="Close panel"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="border-t border-slate-200 p-4 sm:p-5 pb-[calc(5rem+env(safe-area-inset-bottom,1rem))] sm:pb-5 bg-slate-50/95 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
