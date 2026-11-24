"use client";

import { cn } from "@/lib/utils";
import gsap from "gsap";
import type { CSSProperties } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";

const graphemeSegmenter =
  typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

function segmentCharacters(text: string) {
  if (!graphemeSegmenter) return Array.from(text);
  return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment);
}

export interface FlippingWordSwapProps {
  /** The word or short phrase shown at rest. */
  word1: string;
  /** The word or short phrase revealed on interaction. */
  word2: string;
  /** Duration of each character flip in milliseconds. */
  duration?: number;
  /** Delay between neighboring character flips in milliseconds. */
  stagger?: number;
  /** Additional classes applied to the interactive container. */
  className?: string;
  /** Additional classes applied only to the revealed word. */
  toClassName?: string;
  /** Inline styles applied to the interactive container. */
  style?: CSSProperties;
  /** Inline styles applied only to the revealed word. */
  toStyle?: CSSProperties;
}

export function FlippingWordSwap({
  word1,
  word2,
  duration = 400,
  stagger = 44,
  className,
  toClassName,
  style,
  toStyle,
}: FlippingWordSwapProps) {
  const containerRef = useRef<HTMLButtonElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const swappedRef = useRef(false);
  const [isSwapped, setIsSwapped] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const resolvedDuration = prefersReducedMotion
      ? 0
      : Math.max(180, duration) / 1000;
    const resolvedStagger = prefersReducedMotion
      ? 0
      : Math.max(0, stagger) / 1000;

    const context = gsap.context(() => {
      const firstWord = gsap.utils.toArray<HTMLElement>(
        '[data-flip-word="first"]',
      );
      const secondWord = gsap.utils.toArray<HTMLElement>(
        '[data-flip-word="second"]',
      );

      gsap.set(firstWord, {
        rotationX: 0,
        opacity: 1,
        transformOrigin: "center top",
      });
      gsap.set(secondWord, {
        rotationX: -82,
        opacity: 0,
        transformOrigin: "center bottom",
      });

      const timeline = gsap.timeline({ paused: true });
      timeline
        .to(firstWord, {
          rotationX: 82,
          opacity: 0,
          duration: resolvedDuration,
          stagger: resolvedStagger,
          ease: "power2.in",
        })
        .to(
          secondWord,
          {
            rotationX: 0,
            opacity: 1,
            duration: resolvedDuration,
            stagger: resolvedStagger,
            ease: "power2.out",
          },
          `<${resolvedDuration * 0.62}`,
        );

      if (swappedRef.current) timeline.progress(1);
      timelineRef.current = timeline;
    }, containerRef);

    return () => {
      timelineRef.current = null;
      context.revert();
    };
  }, [duration, stagger, word1, word2]);

  const updateSwap = useCallback((next: boolean) => {
    swappedRef.current = next;
    setIsSwapped(next);

    if (next) {
      timelineRef.current?.play();
    } else {
      timelineRef.current?.reverse();
    }
  }, []);

  const renderCharacters = (text: string, layer: "first" | "second") =>
    segmentCharacters(text).map((character, index) => (
      <span
        key={`${layer}-${index}-${character}`}
        data-flip-word={layer}
        className="inline-block whitespace-pre [backface-visibility:hidden] [will-change:transform,opacity] text-slate-900"
        style={
          layer === "second"
            ? {
                opacity: 0,
                transform: "rotateX(-82deg)",
                transformOrigin: "center bottom",
              }
            : {
                opacity: 1,
                transform: "rotateX(0deg)",
                transformOrigin: "center top",
              }
        }
      >
        {character === " " ? "\u00a0" : character}
      </span>
    ));

  return (
    <button
      ref={containerRef}
      type="button"
      className={cn(
        "relative inline-grid cursor-pointer select-none border-0 bg-transparent p-0 align-baseline font-[inherit] leading-[inherit] tracking-[inherit] text-[inherit]",
        "rounded-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/30 focus-visible:ring-offset-2",
        className,
      )}
      aria-label={isSwapped ? word2 : word1}
      aria-pressed={isSwapped}
      style={style}
      onMouseEnter={() => updateSwap(true)}
      onMouseLeave={() => updateSwap(false)}
      onPointerUp={(event) => {
        if (event.pointerType !== "mouse") updateSwap(!swappedRef.current);
      }}
      onFocus={(event) => {
        if (event.currentTarget.matches(":focus-visible")) updateSwap(true);
      }}
      onBlur={() => updateSwap(false)}
    >
      <span className="col-start-1 row-start-1 inline-grid overflow-hidden [perspective:800px]">
        <span
          className="col-start-1 row-start-1 inline-flex items-baseline justify-center gap-[0.012em] whitespace-pre"
          aria-hidden="true"
        >
          {renderCharacters(word1, "first")}
        </span>
        <span
          className={cn(
            "col-start-1 row-start-1 inline-flex items-baseline justify-center gap-[0.012em] whitespace-pre",
            toClassName,
          )}
          aria-hidden="true"
          style={toStyle}
        >
          {renderCharacters(word2, "second")}
        </span>
      </span>
    </button>
  );
}

export interface MultiWordFlipProps {
  /** Static prefix (e.g. "Bibi's ") */
  prefix?: string;
  /** List of words to cycle through */
  words?: string[];
  /** Duration of flip in ms */
  duration?: number;
  /** Stagger between characters in ms */
  stagger?: number;
  /** Auto-cycle interval in ms (default: 2600ms) */
  interval?: number;
  /** Additional class for container */
  className?: string;
  /** Style for container */
  style?: CSSProperties;
}

const DEFAULT_WORDS = [
  "Treats",
  "Snacks",
  "Sweets",
  "Goodies",
  "Delicacies",
  "Tidbits",
];

export function MultiWordFlip({
  prefix = "Bibi's ",
  words = DEFAULT_WORDS,
  duration = 420,
  stagger = 40,
  interval = 2800,
  className,
  style,
}: MultiWordFlipProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currIndex, setCurrIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const isAnimatingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const word1 = words[currIndex];
  const word2 = words[nextIndex];
  // Longest word dynamically calculated to lock the slot width so Bibi's never shifts
  const longestWord = words.reduce((max, w) => (w.length > max.length ? w : max), words[0] || "");

  const runFlip = useCallback(() => {
    if (isAnimatingRef.current || !containerRef.current) return;
    isAnimatingRef.current = true;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const resolvedDuration = prefersReducedMotion ? 0 : Math.max(180, duration) / 1000;
    const resolvedStagger = prefersReducedMotion ? 0 : Math.max(0, stagger) / 1000;

    const firstChars = containerRef.current.querySelectorAll<HTMLElement>(
      '[data-flip-layer="first"]',
    );
    const secondChars = containerRef.current.querySelectorAll<HTMLElement>(
      '[data-flip-layer="second"]',
    );

    gsap.killTweensOf([firstChars, secondChars]);

    gsap.set(firstChars, {
      rotationX: 0,
      opacity: 1,
      transformOrigin: "center top",
    });
    gsap.set(secondChars, {
      rotationX: -82,
      opacity: 0,
      transformOrigin: "center bottom",
    });

    const tl = gsap.timeline({
      onComplete: () => {
        setCurrIndex(nextIndex);
        setNextIndex((nextIndex + 1) % words.length);
        isAnimatingRef.current = false;
      },
    });

    tl.to(firstChars, {
      rotationX: 82,
      opacity: 0,
      duration: resolvedDuration,
      stagger: resolvedStagger,
      ease: "power2.in",
    }).to(
      secondChars,
      {
        rotationX: 0,
        opacity: 1,
        duration: resolvedDuration,
        stagger: resolvedStagger,
        ease: "power2.out",
      },
      `<${resolvedDuration * 0.45}`,
    );
  }, [duration, stagger, nextIndex, words.length]);

  // Auto-play timer loop
  useEffect(() => {
    timerRef.current = setInterval(() => {
      runFlip();
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runFlip, interval]);

  // Trigger next word on hover/click
  const handleTrigger = () => {
    if (!isAnimatingRef.current) {
      if (timerRef.current) clearInterval(timerRef.current);
      runFlip();
      timerRef.current = setInterval(() => {
        runFlip();
      }, interval);
    }
  };

  const renderCharacters = (text: string, layer: "first" | "second", wordIdx: number) =>
    segmentCharacters(text).map((char, i) => (
      <span
        key={`${layer}-${wordIdx}-${text}-${i}-${char}`}
        data-flip-layer={layer}
        className="inline-block whitespace-pre [backface-visibility:hidden] [will-change:transform,opacity] text-slate-900"
        style={
          layer === "second"
            ? {
                opacity: 0,
                transform: "rotateX(-82deg)",
                transformOrigin: "center bottom",
                backfaceVisibility: "hidden",
                display: "inline-block",
              }
            : {
                opacity: 1,
                transform: "rotateX(0deg)",
                transformOrigin: "center top",
                backfaceVisibility: "hidden",
                display: "inline-block",
              }
        }
      >
        {char === " " ? "\u00a0" : char}
      </span>
    ));

  return (
    <div
      ref={containerRef}
      className={cn(
        "inline-flex items-baseline justify-center cursor-pointer select-none leading-none text-slate-900 whitespace-nowrap",
        className,
      )}
      style={style}
      onMouseEnter={handleTrigger}
      onClick={handleTrigger}
      title="Click or hover to flip"
    >
      {/* Static Brand Prefix: Fixed and permanently stable */}
      <span className="whitespace-pre text-slate-900 shrink-0">{prefix}</span>

      {/* 3D Flipping Word Slot: Locked to maximum width so Bibi's never shifts position */}
      <span className="relative inline-grid overflow-hidden [perspective:800px] text-left text-slate-900 shrink-0">
        {/* Invisible Sizer (Locks the slot to the widest word width so Bibi's NEVER moves) */}
        <span
          className="col-start-1 row-start-1 inline-flex items-baseline justify-start gap-[0.012em] whitespace-pre opacity-0 pointer-events-none select-none invisible"
          aria-hidden="true"
        >
          {segmentCharacters(longestWord).map((char, i) => (
            <span key={`sizer-${i}-${char}`} className="inline-block whitespace-pre">
              {char === " " ? "\u00a0" : char}
            </span>
          ))}
        </span>

        {/* Layer 1: Active Current Word */}
        <span
          className="col-start-1 row-start-1 inline-flex items-baseline justify-start gap-[0.012em] whitespace-pre text-slate-900"
          aria-hidden="true"
        >
          {renderCharacters(word1, "first", currIndex)}
        </span>

        {/* Layer 2: Incoming Flipped Word */}
        <span
          className="col-start-1 row-start-1 inline-flex items-baseline justify-start gap-[0.012em] whitespace-pre text-slate-900 pointer-events-none"
          aria-hidden="true"
        >
          {renderCharacters(word2, "second", nextIndex)}
        </span>
      </span>
    </div>
  );
}
