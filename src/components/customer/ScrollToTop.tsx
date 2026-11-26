'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp } from '@fortawesome/free-solid-svg-icons';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled past hero section (> 400px)
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="กลับขึ้นด้านบน"
      title="กลับขึ้นด้านบน"
      className={`fixed right-5 sm:right-8 bottom-20 sm:bottom-8 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/90 hover:bg-slate-950 text-white backdrop-blur-md border border-white/20 shadow-xl shadow-slate-950/30 flex items-center justify-center transition-[opacity,transform,background-color,box-shadow] duration-200 ease-[var(--ease-out)] group active:scale-95 [@media(hover:hover)_and_(pointer:fine)]:hover:scale-105 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-2xl ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <FontAwesomeIcon
        icon={faChevronUp}
        className="w-4 h-4 text-white group-hover:-translate-y-0.5 transition-transform duration-200"
      />
    </button>
  );
}
