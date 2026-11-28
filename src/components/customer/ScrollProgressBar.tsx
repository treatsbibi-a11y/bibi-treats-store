'use client';

import React, { useEffect, useState } from 'react';

export default function ScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateScrollProgress = () => {
      const winScroll = window.scrollY || document.documentElement.scrollTop;
      const height =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (height > 0) {
        const scrolled = (winScroll / height) * 100;
        setScrollProgress(Math.min(100, Math.max(0, scrolled)));
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateScrollProgress();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Do not show the bar when at top of page (avoids any flash or clutter on initial load)
  if (scrollProgress <= 1) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 h-[2px] bg-transparent pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full w-full origin-left bg-stone-700/80 transition-transform duration-75 ease-out will-change-transform"
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
      />
    </div>
  );
}
