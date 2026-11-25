"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { HeadlineTextRepel } from "@/components/ui/TextRepel";
import { MultiWordFlip } from "@/components/ui/FlippingWordSwap";

export interface ImageCard {
  id: string;
  src: string;
  alt: string;
  rotation: number;
}

export interface ImageCarouselHeroProps {
  title?: string;
  images?: ImageCard[];
}

const DEFAULT_IMAGES: ImageCard[] = [
  {
    id: "1",
    src: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1000&auto=format&fit=crop",
    alt: "Dark Chocolate Fudge Layer Cake",
    rotation: -6,
  },
  {
    id: "2",
    src: "https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=1000&auto=format&fit=crop",
    alt: "Pastel Macaron Box",
    rotation: 8,
  },
  {
    id: "3",
    src: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=1000&auto=format&fit=crop",
    alt: "Strawberry Shortcake Cup",
    rotation: -4,
  },
  {
    id: "4",
    src: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1000&auto=format&fit=crop",
    alt: "Artisanal French Butter Croissant",
    rotation: 6,
  },
  {
    id: "5",
    src: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=1000&auto=format&fit=crop",
    alt: "Signature Dark Chocolate Brownie",
    rotation: -8,
  },
  {
    id: "6",
    src: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=1000&auto=format&fit=crop",
    alt: "Matcha Kyoto Cream Choux Bun",
    rotation: 5,
  },
];

export function ImageCarouselHero({
  images = DEFAULT_IMAGES,
}: ImageCarouselHeroProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hoveredIndexRef = useRef<number | null>(null);
  const isMobileRef = useRef(false);
  const isHoveringRef = useRef(false);
  const mousePosRef = useRef({ x: 0.5, y: 0.5 });
  const angleRef = useRef(0);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const cardElementsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Direct GPU transform update on DOM nodes without React re-renders (Butter smooth 60-120fps)
  const updateCardTransforms = useCallback((baseAngle: number) => {
    const isMob = isMobileRef.current;
    // Widened horizontal radius for a relaxed, balanced, panorama spread
    const radiusX = isMob ? 165 : 315;
    const radiusY = isMob ? 58 : 92;
    const pX = (mousePosRef.current.x - 0.5) * 16;
    const pY = (mousePosRef.current.y - 0.5) * -16;

    cardElementsRef.current.forEach((el, index) => {
      if (!el || !images[index]) return;
      const cardAngleDeg = (baseAngle + index * (360 / images.length)) % 360;
      const angleRad = cardAngleDeg * (Math.PI / 180);
      const x = Math.cos(angleRad) * radiusX;
      const y = Math.sin(angleRad) * radiusY;

      // Natural 3D depth scaling (0.84 back to 1.08 front)
      const depthScale = 0.84 + ((y + radiusY) / (radiusY * 2)) * 0.24;
      const zIndex = Math.round(depthScale * 100);
      const rotZ = images[index].rotation;

      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotateX(${pY.toFixed(2)}deg) rotateY(${pX.toFixed(2)}deg) rotateZ(${rotZ}deg) scale(${depthScale.toFixed(3)})`;
      el.style.zIndex = hoveredIndexRef.current === index ? "999" : `${zIndex}`;
    });
  }, [images]);

  // Responsive mobile detection to adjust 3D orbit radius
  useEffect(() => {
    const handleResize = () => {
      isMobileRef.current = window.innerWidth < 640;
      updateCardTransforms(angleRef.current);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateCardTransforms]);

  // Silky 60/120 FPS RequestAnimationFrame Animation Loop
  // Stops completely when hovered (Pause on Hover) with zero stutter and zero jumps
  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current !== undefined) {
        const delta = Math.min(time - lastTimeRef.current, 100);
        if (!isHoveringRef.current) {
          // Ultra-slow cinema drift (~5.5-6 degrees per second), serene, elegant and relaxed
          angleRef.current = (angleRef.current + 0.0055 * delta) % 360;
          updateCardTransforms(angleRef.current);
        }
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [updateCardTransforms]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // If a card is hovered, lock tilt 100% still under mouse to prevent flickering/jittering
    if (hoveredIndexRef.current !== null || isHoveringRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mousePosRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
    updateCardTransforms(angleRef.current);
  };

  const handleContainerMouseEnter = () => {
    isHoveringRef.current = true;
  };

  const handleContainerMouseLeave = () => {
    isHoveringRef.current = false;
    hoveredIndexRef.current = null;
    setHoveredIndex(null);
    mousePosRef.current = { x: 0.5, y: 0.5 };
    updateCardTransforms(angleRef.current);
  };

  const handleCardMouseEnter = (index: number) => {
    isHoveringRef.current = true;
    hoveredIndexRef.current = index;
    setHoveredIndex(index);
    const el = cardElementsRef.current[index];
    if (el) {
      el.style.zIndex = "999";
    }
  };

  const handleCardMouseLeave = () => {
    hoveredIndexRef.current = null;
    setHoveredIndex(null);
    updateCardTransforms(angleRef.current);
  };

  const handleScrollToMenu = () => {
    const menuSection = document.getElementById("menu");
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div id="home" className="relative w-full min-h-0 sm:min-h-[78vh] lg:min-h-[82vh] bg-gradient-to-b from-[#F0F7FF] via-[#FAFCFE] to-white overflow-hidden pt-4 sm:pt-8 md:pt-10 pb-4 sm:pb-14 md:pb-16 border-b border-slate-200/80">
      {/* Scoped Keyframes for Hand-Drawn Yellow Brush Draw-on Animation */}
      <style>{`
        @keyframes brushDrawOn {
          0% {
            stroke-dashoffset: 420;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        .draw-brush-main {
          stroke-dasharray: 420;
          stroke-dashoffset: 420;
          animation: brushDrawOn 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
        }
        .draw-brush-bottom {
          stroke-dasharray: 420;
          stroke-dashoffset: 420;
          animation: brushDrawOn 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.22s forwards;
        }
        .draw-brush-top {
          stroke-dasharray: 420;
          stroke-dashoffset: 420;
          animation: brushDrawOn 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }
        .draw-brush-flourish {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: brushDrawOn 0.45s ease-out 0.95s forwards;
        }
        @keyframes softSkyDrift1 {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(25px, -18px) scale(1.05);
          }
          66% {
            transform: translate(-15px, 20px) scale(0.97);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        @keyframes softSkyDrift2 {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          40% {
            transform: translate(-22px, 25px) scale(1.04);
          }
          75% {
            transform: translate(20px, -12px) scale(0.96);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        @keyframes softSkyDrift3 {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          50% {
            transform: translate(18px, 16px) scale(1.06);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .sky-drift-orb-1 {
          background: radial-gradient(circle, rgba(186, 224, 253, 0.28) 0%, rgba(224, 242, 254, 0.16) 45%, rgba(240, 249, 255, 0.02) 75%);
          animation: softSkyDrift1 14s ease-in-out infinite alternate;
        }
        .sky-drift-orb-2 {
          background: radial-gradient(circle, rgba(199, 230, 254, 0.26) 0%, rgba(224, 242, 254, 0.14) 50%, rgba(240, 249, 255, 0.02) 75%);
          animation: softSkyDrift2 16s ease-in-out infinite alternate;
        }
        .sky-drift-orb-3 {
          background: radial-gradient(circle, rgba(186, 224, 253, 0.22) 0%, rgba(219, 239, 254, 0.12) 48%, rgba(240, 249, 255, 0.02) 75%);
          animation: softSkyDrift3 12s ease-in-out infinite alternate;
        }
        @keyframes bannerEntrance {
          0% {
            opacity: 0;
            transform: translateY(36px) scale(0.94);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }
        .banner-entrance-anim {
          animation: bannerEntrance 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .banner-entrance-anim {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }
          .draw-brush-main,
          .draw-brush-bottom,
          .draw-brush-top,
          .draw-brush-flourish {
            stroke-dashoffset: 0 !important;
            animation: none !important;
          }
          .sky-drift-orb-1,
          .sky-drift-orb-2,
          .sky-drift-orb-3 {
            animation: none !important;
          }
        }
      `}</style>

      {/* Animated Pale Sky Blue Ambient Blur Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="sky-drift-orb-1 absolute -top-24 -right-20 sm:right-10 w-[34rem] sm:w-[46rem] h-[34rem] sm:h-[46rem] rounded-full blur-[100px] opacity-80 transition-all" />
        <div className="sky-drift-orb-2 absolute top-1/4 -left-28 sm:left-4 w-[32rem] sm:w-[44rem] h-[32rem] sm:h-[44rem] rounded-full blur-[95px] opacity-75 transition-all" />
        <div className="sky-drift-orb-3 absolute -bottom-24 left-1/4 w-[30rem] sm:w-[40rem] h-[30rem] sm:h-[40rem] rounded-full blur-[90px] opacity-70 transition-all" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 3D Rotating Cards Carousel Container - Smooth Slide-up & Horizontal Panorama Spread */}
        <div
          className="relative w-full max-w-6xl h-[280px] sm:h-[400px] md:h-[460px] lg:h-[500px] mb-4 sm:mb-6 banner-entrance-anim"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleContainerMouseEnter}
          onMouseLeave={handleContainerMouseLeave}
        >
          {/* Rotating Image Cards with 3D Orbit */}
          <div className="absolute inset-0 flex items-center justify-center perspective-[1200px]">
            {images.map((image, index) => {
              const isHovered = hoveredIndex === index;
              const initialAngleDeg = index * (360 / images.length);
              const initialAngleRad = initialAngleDeg * (Math.PI / 180);
              const initialRadiusX = 315;
              const initialRadiusY = 92;
              const initX = Math.cos(initialAngleRad) * initialRadiusX;
              const initY = Math.sin(initialAngleRad) * initialRadiusY;
              const initDepthScale = 0.84 + ((initY + initialRadiusY) / (initialRadiusY * 2)) * 0.24;
              const initZIndex = Math.round(initDepthScale * 100);

              return (
                <div
                  key={image.id}
                  ref={(el) => {
                    cardElementsRef.current[index] = el;
                  }}
                  className="absolute w-28 h-40 sm:w-40 sm:h-54 md:w-48 md:h-64 lg:w-52 lg:h-68 will-change-transform"
                  style={{
                    transform: `translate3d(${initX.toFixed(2)}px, ${initY.toFixed(2)}px, 0) rotateZ(${image.rotation}deg) scale(${initDepthScale.toFixed(3)})`,
                    transformStyle: "preserve-3d",
                    zIndex: isHovered ? 999 : initZIndex,
                  }}
                >
                  <div
                    onClick={handleScrollToMenu}
                    onMouseEnter={() => handleCardMouseEnter(index)}
                    onMouseLeave={handleCardMouseLeave}
                    className={cn(
                      "relative w-full h-full rounded-2xl overflow-hidden bg-white",
                      "border-2 border-white/95 shadow-xl shadow-slate-950/10",
                      "cursor-pointer",
                      "transition-transform duration-200 ease-out",
                      isHovered
                        ? "scale-110 shadow-2xl shadow-slate-900/25 border-2 border-white"
                        : "scale-100"
                    )}
                    style={{
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <Image
                      src={image.src || "/placeholder.svg"}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 640px) 128px, (max-width: 768px) 176px, (max-width: 1024px) 208px, 224px"
                      className={cn(
                        "object-cover transition-transform duration-300",
                        isHovered ? "scale-105" : "scale-100"
                      )}
                      priority={index < 4}
                    />

                    {/* Gradient Overlay & Name Tooltip - Display immediately without jitter */}
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent flex items-end p-3 sm:p-3.5 pointer-events-none select-none",
                        "transition-opacity duration-150",
                        isHovered ? "opacity-100" : "opacity-0"
                      )}
                    >
                      <p className="text-xs sm:text-sm font-semibold text-white truncate drop-shadow-md">
                        {image.alt}
                      </p>
                    </div>

                    {/* Gloss shine effect */}
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none transition-opacity duration-200",
                        isHovered ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Section (Prompt & Rubik Typography with Animated Hand-Drawn Yellow Brush Underline) */}
        <div className="relative z-20 text-center max-w-4xl mx-auto px-4">
          <h1 className="flex flex-col items-center justify-center font-sans">
            <span className="block text-2xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-light text-slate-800 tracking-[0.04em] sm:tracking-[0.05em] leading-[1.25] sm:leading-[1.2] mb-1.5 sm:mb-2.5">
              ขนมอบสดใหม่สไตล์โฮมเมด
            </span>

            <span className="block text-2xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-brand-600 tracking-tight leading-[1.2] sm:leading-[1.15] whitespace-nowrap">
              <HeadlineTextRepel prefix="คัดสรร" highlight="วัตถุดิบคุณภาพ">
                {/* Animated Hand-Drawn Yellow Paint Brush Stroke SVG */}
                <span
                  className="absolute -bottom-2 sm:-bottom-3.5 md:-bottom-4 left-0 right-0 w-[104%] -left-[2%] h-4 sm:h-5 md:h-6 pointer-events-none select-none z-0"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 360 26"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full overflow-visible drop-shadow-[0_2px_4px_rgba(245,158,11,0.25)]"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="yellowBrushGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="45%" stopColor="#FBBF24" />
                        <stop offset="85%" stopColor="#FCD34D" />
                        <stop offset="100%" stopColor="#F59E0B" />
                      </linearGradient>
                      <linearGradient id="yellowBrushAccent" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#D97706" />
                        <stop offset="50%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#FBBF24" />
                      </linearGradient>
                    </defs>

                    <path
                      d="M 16 20 C 65 23.5, 125 24, 195 21.5 C 260 19, 310 16.5, 346 14.5"
                      stroke="url(#yellowBrushAccent)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="draw-brush-bottom"
                    />

                    <path
                      d="M 8 15 C 52 18, 110 19, 180 16.5 C 248 14, 302 11.5, 352 10.5"
                      stroke="url(#yellowBrushGrad)"
                      strokeWidth="8.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="draw-brush-main"
                    />

                    <path
                      d="M 28 11 C 78 13.5, 145 14, 220 11.5 C 275 9.5, 318 8.5, 338 8.5"
                      stroke="#FEF08A"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      className="draw-brush-top"
                    />

                    <path
                      d="M 338 13.5 C 345 12.5, 352 10.5, 356 8"
                      stroke="url(#yellowBrushGrad)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="draw-brush-flourish"
                    />
                  </svg>
                </span>
              </HeadlineTextRepel>
            </span>

            {/* Line 3: 'Bibi's [Treats / Snacks / Sweets...]' Flipping Word Swap in Google Font: Great Vibes */}
            <span
              className="block mt-4 sm:mt-10 md:mt-14 mb-1 sm:mb-2 text-4xl sm:text-5xl md:text-[3.25rem] font-normal tracking-normal text-slate-900 select-none py-1 font-signature"
              style={{ fontFamily: "'Great Vibes', cursive" }}
            >
              <MultiWordFlip
                prefix="Bibi's "
                words={["Treats", "Snacks", "Sweets", "Goodies", "Delicacies", "Tidbits"]}
                duration={420}
                stagger={44}
                interval={2600}
              />
            </span>
          </h1>
        </div>
      </div>
    </div>
  );
}

export default HeroBanner;
function HeroBanner() {
  return <ImageCarouselHero />;
}
