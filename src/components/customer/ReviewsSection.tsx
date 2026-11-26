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
import { ProductWithImages, ReviewItem, ReviewStats } from '@/types';
import { convertImageToWebP } from '@/lib/image-utils';
import { useSmartPolling } from '@/hooks/useSmartPolling';
import { OrbitCardStack, type OrbitStackItem } from '@/components/ui/OrbitCardStack';

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

interface ReviewsSectionProps {
  products?: ProductWithImages[];
  onSelectProduct?: (productId: string) => void;
}

export default function ReviewsSection({
  products = [],
  onSelectProduct,
}: ReviewsSectionProps) {
  // Server state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Sort state
  const [filterStar, setFilterStar] = useState<FilterStar>('all');
  const [onlyWithImages, setOnlyWithImages] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [stackPage, setStackPage] = useState(0);

  // Carousel pause state
  const [isPaused, setIsPaused] = useState(false);

  // Modals
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // tracks form submission
 // primary






useEffect(() => {
    if (isWriteOpen || selectedReview) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (selectedReview) setSelectedReview(null);
          else if (isWriteOpen && !isSubmitting) setIsWriteOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isWriteOpen, selectedReview, isSubmitting]);

  // Write Review Form state
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [customerName, setCustomerName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [comment, setComment] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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

  useSmartPolling(loadReviews, 5000);

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

  const PAGE_SIZE = 5;
  const totalStackPages = Math.max(1, Math.ceil(displayedReviews.length / PAGE_SIZE));



useEffect(() => {
    setStackPage(0);
  }, [filterStar, onlyWithImages, sortBy]);



useEffect(() => {
    if (stackPage >= totalStackPages) {
      setStackPage(0);
    }
  }, [stackPage, totalStackPages]);

  const visibleStackReviews = useMemo(() => {
    const start = stackPage * PAGE_SIZE;
    return displayedReviews.slice(start, start + PAGE_SIZE);
  }, [displayedReviews, stackPage]);

  const orbitItems: OrbitStackItem[] = useMemo(
    () =>
      visibleStackReviews.map((r) => ({
        id: r.id,
        name: r.customerName,
        role: `${r.rating} ดาว`,
        rating: r.rating,
        description: r.comment,
        image: r.images?.[0],
        productId: r.productId ?? null,
        stat:
          r.images && r.images.length > 1
            ? `${formatThaiDate(r.createdAt)} · ${r.images.length} รูป`
            : formatThaiDate(r.createdAt),
      })),
    [visibleStackReviews]
  );

  const handleScroll = useCallback(
    (direction: 'left' | 'right') => {
      if (totalStackPages <= 1) return;
      setStackPage((prev) =>
        direction === 'right'
          ? (prev + 1) % totalStackPages
          : (prev - 1 + totalStackPages) % totalStackPages
      );
    },
    [totalStackPages]
  );

  // Auto-cycle 5-card batches every 6 seconds when multiple pages exist


useEffect(() => {
    if (isPaused || isWriteOpen || selectedReview || totalStackPages <= 1) {
      return;
    }
    const timer = setInterval(() => {
      handleScroll('right');
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, isWriteOpen, selectedReview, totalStackPages, handleScroll]);

  const resetWriteModal = () => {
    setRating(0);
    setHoverRating(0);
    setCustomerName('');
    setSelectedProductId('');
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
        const webpFile = await convertImageToWebP(file);
        const formData = new FormData();
        formData.append('file', webpFile);
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
      const selectedProduct = products.find((p) => p.id === selectedProductId);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          rating,
          comment: comment.trim(),
          images: uploadedImages,
          productId: selectedProduct?.id ?? null,
          productName: selectedProduct?.name ?? null,
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
        setStackPage(0);
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
        {/* 1. Top Header (h1, h2) + Borderless Rating & Write Review Button on the right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              ความประทับใจจากลูกค้าของเรา
            </h1>
            <h2 className="text-sm sm:text-base font-semibold text-brand-700 tracking-tight">
              ทุกคำรีวิวคือกำลังใจของ Bibi&apos;s Treats
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center gap-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <FontAwesomeIcon key={s} icon={faStar} className="w-3.5 h-3.5" />
                ))}
              </div>
              <div className="h-4 w-px bg-slate-300/80" />
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
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-[transform,background-color] duration-150 ease-[var(--ease-out)] active:scale-95 cursor-pointer"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
              <span>เขียนรีวิว</span>
            </button>
          </div>
        </div>

        {/* Review Carousel Cards */}
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
          <div className="space-y-3">
            <div className="relative group">
              {totalStackPages > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => handleScroll('left')}
                    aria-label="ชุดรีวิวก่อนหน้า"
                    className="hidden sm:flex absolute left-2 lg:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/95 hover:bg-brand-50 border border-slate-200/90 hover:border-brand-200 text-slate-700 hover:text-brand-700 items-center justify-center shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto transition-[opacity,transform,background-color,border-color,color] duration-200 ease-[var(--ease-out)] active:scale-95 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScroll('right')}
                    aria-label="ชุดรีวิวถัดไป"
                    className="hidden sm:flex absolute right-2 lg:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/95 hover:bg-brand-50 border border-slate-200/90 hover:border-brand-200 text-slate-700 hover:text-brand-700 items-center justify-center shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto transition-[opacity,transform,background-color,border-color,color] duration-200 ease-[var(--ease-out)] active:scale-95 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              <OrbitCardStack
                key={`stack-page-${stackPage}-${filterStar}-${onlyWithImages}-${sortBy}`}
                items={orbitItems}
                defaultActiveIndex={Math.floor(Math.max(0, orbitItems.length - 1) / 2)}
                onBoundarySwipe={handleScroll}
                onArrowClick={(item) => {
                  const menuEl = document.getElementById('menu');
                  if (menuEl) {
                    menuEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                  if (item.productId && onSelectProduct) {
                    onSelectProduct(item.productId);
                  }
                }}
              />
            </div>

            {totalStackPages > 1 && (
              <div
                className="flex items-center justify-center gap-2 pt-1"
                role="navigation"
                aria-label="ตัวเลือกหน้ารีวิว"
              >
                {Array.from({ length: totalStackPages }).map((_, idx) => {
                  const isActive = idx === stackPage;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setStackPage(idx)}
                      aria-label={`หน้ารีวิวที่ ${idx + 1}`}
                      aria-current={isActive ? 'page' : undefined}
                      className={`h-2 rounded-full transition-[width,background-color] duration-200 ease-[var(--ease-out)] cursor-pointer ${
                        isActive
                          ? 'w-7 bg-slate-300'
                          : 'w-2 bg-slate-200 hover:bg-slate-300/80'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      <AnimatePresence>
        {isWriteOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="เขียนรีวิวจากลูกค้า"
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
          >
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

                  {/* Menu Selection Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      เลือกเมนูที่ต้องการรีวิว
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 text-slate-700"
                    >
                      <option value="">ภาพรวมร้าน / ไม่ระบุเมนู</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
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
                    <label className="text-xs font-semibold text-slate-700 block">
                      แนบรูปภาพ (สูงสุด 5 รูป)
                    </label>

                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-5 gap-2">
                        {uploadedImages.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 group"
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
                      </div>
                    )}

                    {uploadedImages.length < 5 && (
                      <label className="w-full py-5 px-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-400 bg-slate-50/70 hover:bg-brand-50/40 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-slate-400 hover:text-brand-600">
                        {isUploadingImage ? (
                          <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin text-brand-600" />
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faImage} className="w-5 h-5" />
                            <span className="text-xs font-medium">เพิ่มรูป</span>
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

                  {formError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                      {formError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || isUploadingImage}
                    className="w-full py-3 px-5 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-[transform,background-color,opacity] duration-150 ease-[var(--ease-out)] active:scale-[0.99] cursor-pointer"
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
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`รีวิวจาก ${selectedReview.customerName}`}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
          >
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

              {selectedReview.productName && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-sky-50 text-brand-700 border border-sky-100 text-xs font-medium">
                  เมนู: {selectedReview.productName}
                </div>
              )}

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
                      className="block rounded-2xl overflow-hidden bg-slate-100"
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
