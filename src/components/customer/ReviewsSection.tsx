'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStar,
  faPenToSquare,
  faCamera,
  faChevronLeft,
  faChevronRight,
  faXmark,
  faTrashCan,
  faSpinner,
  faUser,
  faCircleCheck,
  faImage,
  faArrowUpWideShort,
} from '@fortawesome/free-solid-svg-icons';
import { ReviewItem, ReviewStats } from '@/types';

type FilterStar = 'all' | 5 | 4 | 3 | 2 | 1;
type SortOption = 'latest' | 'highest' | 'lowest';

const EMPTY_STATS: ReviewStats = {
  averageRating: 0,
  totalCount: 0,
  breakdown: [
    { star: 5, count: 0, percentage: 0 },
    { star: 4, count: 0, percentage: 0 },
    { star: 3, count: 0, percentage: 0 },
    { star: 2, count: 0, percentage: 0 },
    { star: 1, count: 0, percentage: 0 },
  ],
};

function formatThaiDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function ReviewsSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Server state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Sort state
  const [filterStar, setFilterStar] = useState<FilterStar>('all');
  const [onlyWithImages, setOnlyWithImages] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  // Carousel pause state
  const [isPaused, setIsPaused] = useState(false);

  // Modals
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [isWriteOpen, setIsWriteOpen] = useState(false);

  // Write Review Form state
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [customerName, setCustomerName] = useState('');
  const [comment, setComment] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setStats(data.stats || EMPTY_STATS);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Client-side instant filter + sort over fetched visible reviews
  const displayedReviews = useMemo(() => {
    let list = [...reviews];

    if (filterStar !== 'all') {
      list = list.filter((r) => r.rating === filterStar);
    }
    if (onlyWithImages) {
      list = list.filter((r) => r.images && r.images.length > 0);
    }

    if (sortBy === 'highest') {
      list.sort(
        (a, b) =>
          b.rating - a.rating ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === 'lowest') {
      list.sort(
        (a, b) =>
          a.rating - b.rating ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return list;
  }, [reviews, filterStar, onlyWithImages, sortBy]);

  const handleScroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const step = 336;
    if (direction === 'right') {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 16) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    } else {
      if (el.scrollLeft <= 16) {
        el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: -step, behavior: 'smooth' });
      }
    }
  }, []);

  // Auto-slide every 5 seconds unless paused or modal open
  useEffect(() => {
    if (isPaused || isWriteOpen || selectedReview || displayedReviews.length <= 1) {
      return;
    }
    const timer = setInterval(() => {
      handleScroll('right');
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, isWriteOpen, selectedReview, displayedReviews.length, handleScroll]);

  const resetWriteModal = () => {
    setRating(0);
    setHoverRating(0);
    setCustomerName('');
    setComment('');
    setUploadedImages([]);
    setFormError(null);
    setSubmitSuccess(false);
  };

  const openWriteModal = () => {
    resetWriteModal();
    setIsWriteOpen(true);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const remainingSlots = 5 - uploadedImages.length;
    if (remainingSlots <= 0) {
      setFormError('แนบรูปภาพได้สูงสุด 5 รูปเท่านั้น');
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxBytes = 5 * 1024 * 1024;

    for (const file of filesToUpload) {
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setFormError('รองรับเฉพาะไฟล์รูปภาพ JPG, JPEG, PNG และ WEBP เท่านั้น');
        return;
      }
      if (file.size > maxBytes) {
        setFormError('ขนาดรูปภาพต้องไม่เกิน 5MB ต่อรูป');
        return;
      }
    }

    setFormError(null);
    setIsUploadingImage(true);

    try {
      const newUrls: string[] = [];
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || 'อัปโหลดรูปภาพไม่สำเร็จ');
        }
        newUrls.push(data.url);
      }
      setUploadedImages((prev) => [...prev, ...newUrls].slice(0, 5));
    } catch (err: any) {
      setFormError(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = (idx: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (rating < 1 || rating > 5) {
      setFormError('กรุณาเลือกให้คะแนนดาว 1–5 ดาว');
      return;
    }
    if (!customerName.trim()) {
      setFormError('กรุณากรอกชื่อของคุณ');
      return;
    }
    if (comment.trim().length < 3) {
      setFormError('กรุณาเขียนความคิดเห็นอย่างน้อย 3 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          rating,
          comment: comment.trim(),
          images: uploadedImages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'บันทึกรีวิวไม่สำเร็จ');
      }

      // Immediately update UI list & live calculated stats
      if (data.review) {
        setReviews((prev) => [data.review, ...prev]);
      }
      if (data.stats) {
        setStats(data.stats);
      }
      setFilterStar('all');
      setOnlyWithImages(false);
      setSortBy('latest');
      setSubmitSuccess(true);

      setTimeout(() => {
        setIsWriteOpen(false);
        resetWriteModal();
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        }
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'เกิดข้อผิดพลาดในการส่งรีวิว');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="reviews"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className="relative py-14 sm:py-20 bg-gradient-to-b from-[#F0F7FF] via-white to-[#FAFCFE] border-t border-slate-200/70 overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7 sm:space-y-9">
        {/* 1. Top Header + Live Rating Pill + Write Review Button + Carousel Arrows */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-medium">
              <span>Verified Customer Reviews</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              รีวิวจากลูกค้า
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
              ความประทับใจจากลูกค้าตัวจริงที่หลงรักรสชาติขนมอบสดใหม่ของ Bibi&apos;s Treats
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live Rating Pill (matching reference design) */}
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-subtle">
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <FontAwesomeIcon key={s} icon={faStar} className="w-3.5 h-3.5" />
                ))}
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <span className="font-bold text-slate-900 text-base font-mono">
                {stats.totalCount > 0 ? stats.averageRating.toFixed(2) : '0.00'}
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs sm:text-sm text-slate-600 font-medium">
                {stats.totalCount.toLocaleString()} รีวิว
              </span>
            </div>

            {/* Write Review CTA */}
            <button
              type="button"
              onClick={openWriteModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
              <span>เขียนรีวิว</span>
            </button>
          </div>
        </div>

        {/* 2. Rating Breakdown Card (5★ -> 1★ Auto-calculated Percentages) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Big Score */}
            <div className="md:col-span-4 flex items-center md:flex-col md:items-start justify-between md:justify-center gap-4 pb-4 md:pb-0 border-b md:border-b-0 md:border-r border-slate-100 md:pr-6">
              <div>
                <div className="text-4xl sm:text-5xl font-bold text-slate-900 font-mono tracking-tight">
                  {stats.totalCount > 0 ? stats.averageRating.toFixed(2) : '0.00'}
                </div>
                <div className="flex items-center gap-1 text-amber-400 mt-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FontAwesomeIcon key={s} icon={faStar} className="w-4 h-4" />
                  ))}
                </div>
              </div>
              <div className="text-right md:text-left">
                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                  คะแนนเฉลี่ยจากผู้ซื้อจริง
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  ทั้งหมด {stats.totalCount.toLocaleString()} รีวิว
                </p>
              </div>
            </div>

            {/* Right 5-1 Star Percentage Bars */}
            <div className="md:col-span-8 space-y-2">
              {stats.breakdown.map((row) => {
                const isActive = filterStar === row.star;
                return (
                  <button
                    key={row.star}
                    type="button"
                    onClick={() =>
                      setFilterStar((prev) => (prev === row.star ? 'all' : row.star))
                    }
                    className={`w-full flex items-center gap-3 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                      isActive ? 'bg-brand-50/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1 w-24 shrink-0 text-amber-400 text-xs">
                      {Array.from({ length: row.star }).map((_, idx) => (
                        <FontAwesomeIcon key={idx} icon={faStar} className="w-3 h-3" />
                      ))}
                    </div>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-500"
                        style={{ width: `${row.percentage}%` }}
                      />
                    </div>
                    <div className="w-12 text-right text-xs font-mono font-semibold text-slate-700 shrink-0">
                      {row.percentage}%
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Filter Pills + Sort + Carousel Navigation */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setFilterStar('all');
                setOnlyWithImages(false);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                filterStar === 'all' && !onlyWithImages
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/90 hover:border-brand-300'
              }`}
            >
              ทั้งหมด
            </button>
            {([5, 4, 3, 2, 1] as const).map((star) => (
              <button
                key={star}
                type="button"
                onClick={() =>
                  setFilterStar((prev) => (prev === star ? 'all' : star))
                }
                className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  filterStar === star
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200/90 hover:border-brand-300'
                }`}
              >
                <FontAwesomeIcon
                  icon={faStar}
                  className={`w-3 h-3 ${
                    filterStar === star ? 'text-amber-300' : 'text-amber-400'
                  }`}
                />
                <span>{star} ดาว</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setOnlyWithImages((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                onlyWithImages
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/90 hover:border-brand-300'
              }`}
            >
              <FontAwesomeIcon icon={faCamera} className="w-3 h-3" />
              <span>มีรูปภาพ</span>
            </button>
          </div>

          {/* Sort & Carousel Prev/Next Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs">
              <FontAwesomeIcon icon={faArrowUpWideShort} className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="เรียงลำดับรีวิว"
                className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="latest">รีวิวล่าสุด</option>
                <option value="highest">คะแนนสูงสุด</option>
                <option value="lowest">คะแนนต่ำสุด</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-brand-50 border border-slate-200/90 hover:border-brand-200 text-slate-700 hover:text-brand-700 text-xs font-medium transition-all active:scale-95 cursor-pointer"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
                <span className="hidden sm:inline">รีวิวก่อนหน้า</span>
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-brand-50 border border-slate-200/90 hover:border-brand-200 text-slate-700 hover:text-brand-700 text-xs font-medium transition-all active:scale-95 cursor-pointer"
              >
                <span className="hidden sm:inline">รีวิวถัดไป</span>
                <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Review Carousel Cards */}
        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="shrink-0 w-[285px] sm:w-[320px] h-64 bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse space-y-4"
              >
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-16 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : displayedReviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              ไม่พบรีวิวตามเงื่อนไขที่เลือก
            </p>
            <p className="text-xs text-slate-500">
              ลองล้างตัวกรอง หรือเป็นคนแรกที่เขียนรีวิวความอร่อยได้เลยค่ะ
            </p>
            <div className="pt-2 flex justify-center gap-2">
              {(filterStar !== 'all' || onlyWithImages) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterStar('all');
                    setOnlyWithImages(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  ดูรีวิวทั้งหมด
                </button>
              )}
              <button
                type="button"
                onClick={openWriteModal}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold cursor-pointer"
              >
                ✍️ เขียนรีวิว
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {displayedReviews.map((review) => (
              <div
                key={review.id}
                onClick={() => setSelectedReview(review)}
                className="snap-start shrink-0 w-[285px] sm:w-[320px] bg-white rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
              >
                <div className="space-y-3">
                  {/* Customer Header & Stars */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 border border-brand-200/70 flex items-center justify-center shrink-0">
                        <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-sm truncate">
                          {review.customerName}
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400 mt-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <FontAwesomeIcon
                              key={idx}
                              icon={faStar}
                              className={`w-3 h-3 ${
                                idx < review.rating ? 'text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Review Comment */}
                  <p className="text-slate-700 text-xs sm:text-sm leading-relaxed line-clamp-4">
                    “{review.comment}”
                  </p>

                  {/* Attached Images Grid */}
                  {review.images && review.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      {review.images.slice(0, 3).map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200/60"
                        >
                          <img
                            src={imgUrl}
                            alt={`รีวิวจาก ${review.customerName}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {idx === 2 && review.images.length > 3 && (
                            <div className="absolute inset-0 bg-slate-900/55 text-white text-xs font-bold flex items-center justify-center">
                              +{review.images.length - 3}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Date */}
                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{formatThaiDate(review.createdAt)}</span>
                  <span className="text-brand-600 font-medium">อ่านเพิ่มเติม →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      <AnimatePresence>
        {isWriteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsWriteOpen(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative z-10 w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto"
            >
              {submitSuccess ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center mx-auto">
                    <FontAwesomeIcon icon={faCircleCheck} className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    ขอบคุณสำหรับรีวิว ❤️
                  </h3>
                  <p className="text-sm text-slate-500">
                    ความคิดเห็นของคุณถูกบันทึกและแสดงบนหน้าเว็บไซต์เรียบร้อยแล้ว
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        เขียนรีวิวจากลูกค้า
                      </h3>
                      <p className="text-xs text-slate-500">
                        แบ่งปันความประทับใจต่อขนม Bibi&apos;s Treats
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsWriteOpen(false)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                      aria-label="ปิดหน้าต่าง"
                    >
                      <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Interactive 1-5 Star Selector */}
                  <div className="space-y-2 text-center py-2 bg-brand-50/50 rounded-2xl border border-brand-100">
                    <label className="text-xs font-semibold text-slate-700 block">
                      ให้คะแนนสินค้า
                    </label>
                    <div className="flex items-center justify-center gap-2.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = star <= (hoverRating || rating);
                        return (
                          <motion.button
                            key={star}
                            type="button"
                            whileTap={{ scale: 1.3 }}
                            whileHover={{ scale: 1.15 }}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                            className="p-1 cursor-pointer focus:outline-none"
                            aria-label={`ให้คะแนน ${star} ดาว`}
                          >
                            <FontAwesomeIcon
                              icon={faStar}
                              className={`w-8 h-8 transition-colors duration-150 ${
                                active ? 'text-amber-400 drop-shadow-xs' : 'text-slate-300'
                              }`}
                            />
                          </motion.button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {rating > 0 ? `คุณเลือก ${rating} ดาว` : 'แตะที่ดาวเพื่อให้คะแนน 1–5 ดาว'}
                    </p>
                  </div>

                  {/* Customer Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      ชื่อของคุณ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      maxLength={60}
                      placeholder="เช่น Aisyah หรือ คุณพิมพ์ชนก"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
                    />
                  </div>

                  {/* Comment */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700">
                        เขียนรีวิวของคุณ... <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {comment.length}/1000
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={1000}
                      placeholder="ขนมอร่อยมากค่ะ แพ็กสินค้าดีมาก ประทับใจมาก ❤️"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 resize-none"
                    />
                  </div>

                  {/* Photo Upload (up to 5) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">
                        แนบรูปภาพ (สูงสุด 5 รูป)
                      </label>
                      <span className="text-[11px] text-slate-400">
                        JPG, PNG, WEBP ไม่เกิน 5MB ({uploadedImages.length}/5)
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {uploadedImages.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group"
                        >
                          <img
                            src={url}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/70 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] cursor-pointer"
                            aria-label="ลบรูปภาพ"
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}

                      {uploadedImages.length < 5 && (
                        <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-400 bg-slate-50/70 hover:bg-brand-50/40 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-slate-400 hover:text-brand-600">
                          {isUploadingImage ? (
                            <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin text-brand-600" />
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faImage} className="w-4 h-4" />
                              <span className="text-[10px] font-medium">เพิ่มรูป</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            multiple
                            disabled={isUploadingImage}
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {formError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                      {formError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || isUploadingImage}
                    className="w-full py-3 px-5 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                  >
                    {isSubmitting && <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />}
                    <span>{isSubmitting ? 'กำลังบันทึกรีวิว...' : 'ส่งรีวิว'}</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Reader & Photo Viewer Modal */}
      <AnimatePresence>
        {selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReview(null)}
              className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative z-10 w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-700 border border-brand-200/70 flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-base">
                      {selectedReview.customerName}
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 mt-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <FontAwesomeIcon
                          key={idx}
                          icon={faStar}
                          className={`w-3.5 h-3.5 ${
                            idx < selectedReview.rating ? 'text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                      <span className="text-xs text-slate-400 ml-2">
                        {formatThaiDate(selectedReview.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                  aria-label="ปิดหน้าต่าง"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                <p className="text-slate-800 text-sm sm:text-base leading-relaxed">
                  “{selectedReview.comment}”
                </p>
              </div>

              {selectedReview.images && selectedReview.images.length > 0 && (
                <div
                  className={`grid gap-2 ${
                    selectedReview.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                  }`}
                >
                  {selectedReview.images.map((imgUrl, idx) => (
                    <a
                      key={idx}
                      href={imgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100"
                    >
                      <img
                        src={imgUrl}
                        alt={`รูปรีวิว ${idx + 1}`}
                        className="w-full h-48 sm:h-56 object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
