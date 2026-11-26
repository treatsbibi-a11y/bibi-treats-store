'use client';

import { cn } from '@/lib/utils';
import { ArrowUpRight, Star } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import {
  type CSSProperties,
  type FocusEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface OrbitStackItem {
  id?: string;
  name: string;
  role: string;
  description: string;
  rating?: number;
  accent?: string;
  initials?: string;
  stat?: string;
  image?: string;
  productId?: string | null;
}

interface OrbitCardStackProps {
  items: OrbitStackItem[];
  className?: string;
  cardClassName?: string;
  defaultActiveIndex?: number;
  spread?: number;
  lift?: number;
  onActiveChange?: (item: OrbitStackItem, index: number) => void;
  onItemOpen?: (item: OrbitStackItem, index: number) => void;
  onArrowClick?: (item: OrbitStackItem, index: number) => void;
  onBoundarySwipe?: (direction: 'left' | 'right') => void;
}

function inRange(index: number, length: number) {
  return Math.min(Math.max(0, index), Math.max(0, length - 1));
}

function initialsFor(item: OrbitStackItem) {
  if (item.initials) return item.initials;
  const cleaned = item.name.replace(/^(คุณ|K\.|Khun)\s*/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.at(0) ?? ''}${parts[1]?.at(0) ?? ''}`.toUpperCase();
  }
  return Array.from(cleaned || item.name)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const PORTRAIT_ACCENTS = ['#bae6fd', '#e0f2fe', '#fde68a', '#ddd6fe', '#fbcfe8'];

function Portrait({ item, index }: { item: OrbitStackItem; index: number }) {
  const accent = item.accent ?? PORTRAIT_ACCENTS[index % PORTRAIT_ACCENTS.length];
  const shared =
    'relative flex aspect-[1.42] w-full overflow-hidden bg-sky-50/70';

  if (item.image) {
    return (
      <div className={shared}>
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={shared}
      style={{ '--portrait-accent': accent } as CSSProperties}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,var(--portrait-accent),transparent_30%),radial-gradient(circle_at_85%_72%,rgba(255,255,255,0.7),transparent_32%)] opacity-65" />
      <div className="absolute inset-x-9 bottom-0 h-[70%] rounded-t-[999px] border-2 border-slate-900 bg-white" />
      <div className="absolute left-1/2 top-[22%] size-20 -translate-x-1/2 rounded-[45%_55%_48%_52%] border-2 border-slate-900 bg-[#f8fbff]">
        <span className="absolute left-[27%] top-[34%] size-2 rounded-full bg-slate-900" />
        <span className="absolute right-[27%] top-[34%] size-2 rounded-full bg-slate-900" />
        <span className="absolute left-1/2 top-[52%] h-5 w-3.5 -translate-x-1/2 rounded-b-full border-b-2 border-slate-900" />
        <span
          className="absolute -top-4 left-1/2 h-8 w-20 -translate-x-1/2 rounded-t-full border-2 border-b-0 border-slate-900"
          style={{ backgroundColor: accent }}
        />
      </div>
    </div>
  );
}

export function OrbitCardStack({
  items,
  className,
  cardClassName,
  defaultActiveIndex,
  spread = 164,
  lift = 30,
  onActiveChange,
  onItemOpen,
  onArrowClick,
  onBoundarySwipe,
}: OrbitCardStackProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const cards = items;
  const restingIndex = inRange(
    defaultActiveIndex ?? Math.floor(Math.max(0, cards.length - 1) / 2),
    cards.length
  );
  const [activeIndex, setActiveIndex] = useState(restingIndex);
  const [open, setOpen] = useState(false);
  const [stageWidth, setStageWidth] = useState(960);
  const stageRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setActiveIndex(inRange(restingIndex, cards.length));
  }, [restingIndex, cards.length]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => setStageWidth(el.clientWidth || 960);
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isCompact = stageWidth < 640;
  const effectiveSpread = useMemo(() => {
    if (cards.length <= 1) return 0;
    if (isCompact) {
      // Keep even outermost fanned cards fully inside narrow mobile screens without edge clipping
      return Math.min(20, Math.max(10, (stageWidth - 285) / Math.max(1, cards.length - 1)));
    }
    const maxSafeSpread = Math.max(64, (stageWidth - 320) / Math.max(1, cards.length - 1));
    return Math.min(spread, maxSafeSpread);
  }, [cards.length, isCompact, spread, stageWidth]);

  const midpoint = (cards.length - 1) / 2;

  const layouts = useMemo(
    () =>
      cards.map((_, index) => {
        const orbit = index - midpoint;
        const stack = index - restingIndex;
        return {
          open: {
            x: orbit * effectiveSpread,
            y: isCompact
              ? Math.abs(orbit) * 10
              : Math.abs(orbit) * 26 + Math.max(0, Math.abs(orbit) - 1) * 8,
            rotation: orbit * (isCompact ? 4.2 : 8),
          },
          closed: {
            x: stack * (isCompact ? 6 : 10),
            y: Math.abs(stack) * 4,
            rotation: stack * (isCompact ? 1.8 : 2.6),
          },
        };
      }),
    [cards, effectiveSpread, isCompact, midpoint, restingIndex]
  );

  const activate = (index: number) => {
    const next = inRange(index, cards.length);
    setOpen(true);
    setActiveIndex(next);
    if (cards[next]) onActiveChange?.(cards[next], next);
  };

  const close = () => {
    setOpen(false);
    setActiveIndex(restingIndex);
  };

  const leaveFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) close();
  };

  if (cards.length === 0) return null;

  return (
    <div
      className={cn(
        'relative isolate flex w-full items-center justify-center overflow-hidden px-2 py-6 sm:px-6 sm:py-8',
        className
      )}
    >
      <div
        ref={stageRef}
        className="relative h-[430px] sm:h-[465px] w-full max-w-[980px]"
        onMouseLeave={close}
        onBlur={leaveFocus}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(delta) > 36) {
            if (delta < 0) {
              if (activeIndex >= cards.length - 1 && onBoundarySwipe) {
                onBoundarySwipe('right');
              } else {
                activate((activeIndex + 1) % cards.length);
              }
            } else {
              if (activeIndex <= 0 && onBoundarySwipe) {
                onBoundarySwipe('left');
              } else {
                activate((activeIndex - 1 + cards.length) % cards.length);
              }
            }
          }
        }}
        role="list"
        aria-label="รีวิวจากลูกค้า"
      >
        {cards.map((item, index) => {
          const position = open ? layouts[index]!.open : layouts[index]!.closed;
          const active = index === activeIndex;
          const currentLift = open && active ? (isCompact ? 18 : lift) : 0;
          const style: CSSProperties = {
            zIndex: active ? 20 : 10 - Math.abs(index - activeIndex),
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${
              position.y - currentLift
            }px)) rotate(${position.rotation}deg) scale(${
              open ? (active ? 1 : 0.965) : 0.96
            })`,
            transitionDuration: reduceMotion ? '0ms' : '420ms',
          };

          return (
            <article
              key={item.id ?? `${item.name}-${index}`}
              role="listitem"
              tabIndex={0}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'absolute left-1/2 top-1/2 w-[min(68vw,17.5rem)] sm:w-[20.5rem] origin-bottom cursor-pointer rounded-[1.85rem] border bg-white overflow-hidden text-slate-900 outline-none',
                active
                  ? 'border-brand-300 shadow-[0_18px_40px_-14px_rgba(14,165,233,0.22)] ring-1 ring-brand-400/20'
                  : 'border-slate-200/90 shadow-[0_12px_28px_-14px_rgba(15,23,42,0.14)]',
                'transition-[transform,border-color,box-shadow] ease-[cubic-bezier(.2,.8,.2,1)] focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                cardClassName
              )}
              style={style}
              onMouseEnter={() => activate(index)}
              onFocus={() => activate(index)}
              onClick={() => {
                if (open && active && onItemOpen) {
                  onItemOpen(item, index);
                } else {
                  activate(index);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                  event.preventDefault();
                  const next = (index + 1) % cards.length;
                  activate(next);
                  stageRef.current
                    ?.querySelectorAll<HTMLElement>('[role=listitem]')
                    [next]?.focus();
                } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  const next = (index - 1 + cards.length) % cards.length;
                  activate(next);
                  stageRef.current
                    ?.querySelectorAll<HTMLElement>('[role=listitem]')
                    [next]?.focus();
                } else if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onItemOpen?.(item, index);
                } else if (event.key === 'Escape') {
                  event.currentTarget.blur();
                  close();
                }
              }}
            >
              <div className="relative">
                <Portrait item={item} index={index} />
                <button
                  type="button"
                  aria-label={item.productId ? `ดูเมนูที่รีวิวจาก ${item.name}` : `ดูเมนูร้านค้า`}
                  onClick={(e) => {
                    e.stopPropagation();
                    activate(index);
                    (onArrowClick ?? onItemOpen)?.(item, index);
                  }}
                  className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-slate-900/90 text-white shadow-md shadow-slate-900/20 transition-colors hover:bg-brand-600 cursor-pointer"
                >
                  <ArrowUpRight className="size-4" aria-hidden />
                </button>
              </div>

              <div className="px-4 pb-4 pt-3.5 sm:px-5 sm:pb-5 sm:pt-4">
                {typeof item.rating === 'number' ? (
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, starIdx) => (
                      <Star
                        key={starIdx}
                        className={cn(
                          'size-3.5',
                          starIdx < item.rating!
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-200 text-slate-200'
                        )}
                        aria-hidden
                      />
                    ))}
                    <span className="ml-1.5 text-[11px] font-semibold text-slate-400">
                      {item.rating}/5
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {item.role}
                  </p>
                )}

                <h3 className="mt-2 truncate text-[1.45rem] sm:text-[1.65rem] font-semibold leading-tight tracking-[-0.03em] text-slate-900">
                  {item.name}
                </h3>

                <p className="mt-2.5 line-clamp-3 min-h-[3.9rem] text-[0.9rem] font-normal leading-[1.45] text-slate-600">
                  {item.description}
                </p>

                {item.stat && (
                  <div className="mt-3.5 border-t border-slate-100 pt-3 text-[11px] font-medium tracking-wide text-slate-400">
                    {item.stat}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
