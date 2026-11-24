'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  MotionValue,
  AnimatePresence,
} from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faCheckCircle, faQuoteLeft, faXmark, faArrowRight } from '@fortawesome/free-solid-svg-icons';

export interface ReviewItem {
  id: string;
  name: string;
  initials: string;
  rating: number;
  date: string;
  menuItem: string;
  category: string;
  comment: string;
  highlight: string;
  image: string;
  tagColor?: string;
}

const reviewsData: ReviewItem[] = [
  {
    id: 'rev-1',
    name: 'คุณพิมพ์ชนก ว.',
    initials: 'พว',
    rating: 5,
    date: 'เมื่อวานนี้',
    menuItem: 'Vanilla Bean Custard Choux',
    category: 'ชูครีม & พัฟ',
    comment:
      'แป้งชูส์กรอบเบา ไส้คัสตาร์ดหอมวานิลลาแท้จากมาดากัสการ์มาก หวานกำลังดีไม่เลี่ยนเลย ทานตอนแช่เย็นคือสดชื่นที่สุด สั่งซ้ำแน่นอนค่ะ',
    highlight: 'คัสตาร์ดหอมวานิลลาแท้มาดากัสการ์ แป้งกรอบเบาสดชื่น ทานเย็นอร่อยมาก',
    image:
      'https://images.unsplash.com/photo-1612203985729-70726954388c?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'rev-2',
    name: 'คุณธนกฤต ส.',
    initials: 'ธส',
    rating: 5,
    date: '3 วันที่แล้ว',
    menuItem: 'Basque Burnt Cheesecake',
    category: 'เค้ก & ทาร์ต',
    comment:
      'ชีสเค้กหน้าไหม้เนื้อเนียน ละมุนลิ้นมาก หน้าไหม้หอมคาราเมลเป็นเอกลักษณ์ แพ็กเกจจิ้งมาอย่างดีไม่มีบุบสลาย ประทับใจมากครับ',
    highlight: 'ชีสเค้กหน้าไหม้เนื้อเนียน ละมุนลิ้น คาราเมลหอมเป็นเอกลักษณ์',
    image:
      'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'rev-3',
    name: 'คุณวรินทร ม.',
    initials: 'วม',
    rating: 5,
    date: '5 วันที่แล้ว',
    menuItem: 'Artisanal French Butter Croissant',
    category: 'ครัวซองต์ & ขนมปัง',
    comment:
      'ครัวซองต์กรอบนอกนุ่มใน รังผึ้งด้านในสวยงามมาก กลิ่นเนยสดแท้จากฝรั่งเศสเตะจมูกตั้งแต่วินาทีที่เปิดกล่อง อบซ้ำในเตา 2 นาทีเหมือนทานที่ปารีสเลย',
    highlight: 'เนยสดแท้จากฝรั่งเศส กรอบนอกนุ่มใน รังผึ้งด้านในสวยงาม',
    image:
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'rev-4',
    name: 'คุณณิชานันท์ ร.',
    initials: 'ณร',
    rating: 5,
    date: '1 สัปดาห์ที่แล้ว',
    menuItem: 'Dark Chocolate Fudge Layer Cake',
    category: 'เค้ก & ทาร์ต',
    comment:
      'ช็อกโกแลตฟัดจ์เข้มข้น ไม่หวานแสบคอ ใช้วัตถุดิบพรีเมียมอย่างเห็นได้ชัด สั่งเป็นเค้กวันเกิดให้เพื่อน ทุกคนชมหมดเลยค่ะ',
    highlight: 'ดาร์กช็อกโกแลตเข้มข้น เนื้อเค้กแน่นนุ่ม หวานน้อยกลมกล่อม',
    image:
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'rev-5',
    name: 'คุณอรอุมา ภ.',
    initials: 'อภ',
    rating: 5,
    date: '1 สัปดาห์ที่แล้ว',
    menuItem: 'Pastel Macaron Box (Set of 6)',
    category: 'มาการอง & เซ็ตของขวัญ',
    comment:
      'มาการองหวานน้อยกำลังดี เปลือกกรอบฟูนุ่ม ไส้เอิร์ลเกรย์กับยูซุคือที่สุด แพ็กเกจหรูหรา ซื้อเป็นของขวัญผู้รับชอบมาก',
    highlight: 'เปลือกกรอบฟู ไส้หอมละมุนไม่หวานบาดคอ แพ็กเกจของขวัญประทับใจ',
    image:
      'https://images.unsplash.com/photo-1569864358642-9d1684040f43?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'rev-6',
    name: 'คุณกิตติศักดิ์ ล.',
    initials: 'กล',
    rating: 5,
    date: '2 สัปดาห์ที่แล้ว',
    menuItem: 'Signature Fudge Brownie',
    category: 'คุกกี้ & บราวนี่',
    comment:
      'บราวนี่ฟัดจ์หน้าฟิล์ม เนื้อแน่นฉ่ำ ช็อกโกแลตเข้มเต็มคำ สั่งทานคู่กับกาแฟตอนเช้าคือลงตัวที่สุด สั่งรอบที่ 4 แล้วครับ',
    highlight: 'หน้าฟิล์มกรอบ เนื้อฟัดจ์ฉ่ำ ช็อกโกแลตเข้มข้น หอมเนยแท้',
    image:
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800&auto=format&fit=crop',
  },
];

export default function ReviewsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll parameters: Smooth runway through reviews
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    mass: 0.12,
    stiffness: 75,
    damping: 24,
  });

  // Vector translation steps (refined for subtle depth and high legibility)
  const stepX = isMobile ? 220 : 310;
  const stepY = isMobile ? -30 : -42;
  const stepZ = isMobile ? -140 : -180;

  const totalCards = reviewsData.length;
  const maxShift = totalCards - 1;

  const x = useTransform(smoothProgress, [0, 1], [0, -maxShift * stepX]);
  const y = useTransform(smoothProgress, [0, 1], [0, -maxShift * stepY]);
  const z = useTransform(smoothProgress, [0, 1], [0, -maxShift * stepZ]);

  // Mouse / Touch position for Magnetic Hover
  const mouseX = useMotionValue(-10000);
  const mouseY = useMotionValue(-10000);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  const handleMouseLeave = () => {
    mouseX.set(-10000);
    mouseY.set(-10000);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      mouseX.set(e.touches[0].clientX);
      mouseY.set(e.touches[0].clientY);
    }
  };

  return (
    <section
      ref={containerRef}
      id="reviews"
      className="relative bg-gradient-to-b from-[#FAF7F2] via-[#FDFBF7] to-[#F5EFEB] border-t border-[#EAE3D6]"
      style={{ height: isMobile ? '230vh' : '270vh' }}
    >
      {/* Subtle luxury ambient texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#292524 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Sticky Fullscreen Viewport during Scroll Runway */}
      <div
        className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
      >
        {/* Left-Aligned Editorial Header */}
        <div className="absolute z-30 pointer-events-none top-20 sm:top-1/2 sm:-translate-y-1/2 left-6 sm:left-12 lg:left-24 max-w-sm sm:max-w-md text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/5 border border-amber-900/10 text-amber-900 text-xs font-medium tracking-wide mb-3">
            <span>Verified Customer Stories</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-stone-900 tracking-tight font-prompt leading-[1.15]">
            รีวิวจากลูกค้า
          </h2>
          <p className="text-sm sm:text-base text-stone-600 font-normal mt-3 mb-5 leading-relaxed">
            ความประทับใจจากลูกค้าตัวจริงที่หลงรักรสชาติขนมอบสดใหม่ของ Bibi&apos;s Treats
          </p>

          {/* Clean Editorial Rating Box */}
          <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-xs border border-stone-200/80 shadow-xs pointer-events-auto">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <FontAwesomeIcon key={i} icon={faStar} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <div className="h-4 w-px bg-stone-200" />
            <span className="font-bold text-stone-900 text-base sm:text-lg font-prompt">4.98</span>
            <span className="text-stone-300">/</span>
            <span className="text-xs sm:text-sm text-stone-600 font-medium">500+ รีวิวจากผู้สั่งซื้อ</span>
          </div>
        </div>

        {/* 3D Scene Container */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
          style={{
            perspective: isMobile ? '1800px' : '2400px',
            perspectiveOrigin: isMobile ? '40% 50%' : '56% 45%',
          }}
        >
          {/* Animated 3D Track */}
          <motion.div
            className="relative w-0 h-0 pointer-events-auto"
            style={{
              x,
              y,
              z,
              transformStyle: 'preserve-3d',
              left: isMobile ? '20px' : '220px',
            }}
          >
            {reviewsData.map((review, i) => (
              <ReviewCard
                key={review.id}
                review={review}
                i={i}
                stepX={stepX}
                stepY={stepY}
                stepZ={stepZ}
                mouseX={mouseX}
                mouseY={mouseY}
                scrollSpring={smoothProgress}
                isMobile={isMobile}
                onSelect={(selected) => setSelectedReview(selected)}
              />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Luxury Review Reader Modal Popup */}
      <AnimatePresence>
        {selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop with Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReview(null)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Content Card - Luxury Ivory & Warm Stone */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              className="relative z-10 w-full max-w-lg bg-white rounded-[32px] border border-stone-200 shadow-2xl p-6 sm:p-8 overflow-hidden"
            >
              {/* Product Image with Category Pill & Close Button */}
              <div className="relative w-full h-52 sm:h-60 rounded-2xl overflow-hidden mb-4 bg-stone-100 border border-stone-100">
                <img
                  src={selectedReview.image}
                  alt={selectedReview.menuItem}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-stone-800 text-xs font-medium shadow-xs">
                  {selectedReview.category}
                </div>

                {/* Refined Integrated Close Button */}
                <button
                  onClick={() => setSelectedReview(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-md text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm border border-white/25"
                  aria-label="ปิดหน้าต่างรีวิว"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Stars & Menu Title */}
              <div className="flex items-center gap-1.5 text-amber-500 mb-1.5">
                {[...Array(selectedReview.rating)].map((_, i) => (
                  <FontAwesomeIcon key={i} icon={faStar} className="w-4 h-4 fill-current" />
                ))}
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-stone-900 font-prompt tracking-tight mb-3">
                {selectedReview.menuItem}
              </h3>

              {/* Full Review Text */}
              <div className="relative mb-5 bg-[#FAF7F2] rounded-2xl p-4 border border-stone-200/60">
                <FontAwesomeIcon icon={faQuoteLeft} className="w-4 h-4 text-amber-900/20 mb-2 block" />
                <p className="text-stone-800 text-sm sm:text-base leading-relaxed font-normal">
                  {selectedReview.comment}
                </p>
                {selectedReview.highlight && (
                  <div className="mt-3 text-xs font-semibold text-amber-900 pt-2.5 border-t border-stone-200/70 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>{selectedReview.highlight}</span>
                  </div>
                )}
              </div>

              {/* Customer Info Footer */}
              <div className="flex items-center justify-between text-xs pt-1 pb-4 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-900/10 text-amber-950 border border-amber-900/15 flex items-center justify-center font-bold text-xs">
                    {selectedReview.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-stone-900 text-sm">
                      {selectedReview.name}
                    </div>
                    <div className="text-[11px] flex items-center gap-1 font-medium text-emerald-700">
                      <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
                      <span>ยืนยันการสั่งซื้อจริงกับร้าน</span>
                    </div>
                  </div>
                </div>
                <span className="text-stone-400 text-xs font-light">{selectedReview.date}</span>
              </div>

              {/* Order CTA Button */}
              <button
                onClick={() => {
                  setSelectedReview(null);
                  const menuEl = document.getElementById('menu');
                  if (menuEl) {
                    menuEl.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="w-full mt-4 py-3.5 px-5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-98 cursor-pointer"
              >
                <span>เลือกสั่งซื้อ {selectedReview.menuItem}</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3 text-amber-300" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ReviewCard({
  review,
  i,
  stepX,
  stepY,
  stepZ,
  mouseX,
  mouseY,
  scrollSpring,
  isMobile,
  onSelect,
}: {
  review: ReviewItem;
  i: number;
  stepX: number;
  stepY: number;
  stepZ: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  scrollSpring: MotionValue<number>;
  isMobile: boolean;
  onSelect: (review: ReviewItem) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Distance from mouse to center of card
  const distance = useTransform([mouseX, mouseY, scrollSpring], ([mx = -10000, my = -10000]: number[]) => {
    if (!ref.current) return 400;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.sqrt(Math.pow(mx - centerX, 2) + Math.pow(my - centerY, 2));
  });

  // Magnetic Scale: Subtle, high-end response
  const targetScale = useTransform(distance, [0, 300], [isMobile ? 1.08 : 1.15, 1]);
  const springScale = useSpring(targetScale, {
    mass: 0.35,
    stiffness: 260,
    damping: 24,
  });

  // Natural 3D Perspective (-14deg instead of steep -34deg for crisp legibility)
  const transform = useTransform(springScale, (s) => {
    const baseX = i * stepX;
    const baseY = i * stepY;
    const baseZ = i * stepZ;
    return `translate3d(${baseX}px, ${baseY}px, ${baseZ}px) rotateY(-14deg) scale(${s})`;
  });

  return (
    <motion.div
      ref={ref}
      onClick={() => onSelect(review)}
      className={`absolute ${
        isMobile ? 'w-[270px] h-[395px]' : 'w-[325px] h-[435px]'
      } bg-white rounded-[28px] border border-[#EBE3D5] shadow-[0_12px_32px_-12px_rgba(40,25,15,0.08)] hover:shadow-[0_24px_48px_-12px_rgba(40,25,15,0.16)] overflow-hidden flex flex-col justify-between p-5 transition-all duration-300 group cursor-pointer active:scale-98`}
      style={{
        transform,
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
      }}
    >
      <div>
        {/* Product Image Preview with Category Badge */}
        <div className="relative w-full h-36 sm:h-44 rounded-2xl overflow-hidden mb-3.5 bg-stone-100 border border-stone-100">
          <img
            src={review.image}
            alt={review.menuItem}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-stone-700 text-[11px] font-medium shadow-2xs border border-stone-200/40">
            {review.category}
          </div>
        </div>

        {/* Rating Stars & Date */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-amber-500">
            {[...Array(review.rating)].map((_, starIdx) => (
              <FontAwesomeIcon key={starIdx} icon={faStar} className="w-3.5 h-3.5 fill-current" />
            ))}
          </div>
          <span className="text-[11px] text-stone-400 font-light">{review.date}</span>
        </div>

        {/* Menu Item Name */}
        <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight font-prompt truncate mb-2">
          {review.menuItem}
        </h3>

        {/* Customer Review Quote */}
        <p className="text-stone-700 text-xs sm:text-[13px] leading-relaxed font-normal line-clamp-3">
          &ldquo;{review.comment}&rdquo;
        </p>
      </div>

      {/* Card Footer: Verified Customer Identity */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-amber-900/8 text-amber-950 border border-amber-900/12 flex items-center justify-center font-bold text-xs shrink-0">
            {review.initials}
          </div>
          <div className="truncate min-w-0">
            <div className="font-semibold text-stone-900 text-xs sm:text-sm truncate">
              {review.name}
            </div>
            <div className="text-[10px] sm:text-[11px] flex items-center gap-1 font-medium text-emerald-700">
              <FontAwesomeIcon icon={faCheckCircle} className="w-2.5 h-2.5" />
              <span>สั่งซื้อจริง</span>
            </div>
          </div>
        </div>

        <span className="text-xs font-semibold text-amber-900/80 group-hover:text-amber-900 transition-colors">
          อ่านรีวิว →
        </span>
      </div>
    </motion.div>
  );
}
