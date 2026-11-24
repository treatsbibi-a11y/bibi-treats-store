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

export interface ReviewTheme {
  bg: string;
  avatar: string;
  textColor: string;
  accentColor: string;
}

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
  theme: ReviewTheme;
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
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop',
    theme: {
      bg: 'bg-[#FEF3C7]',
      avatar: 'bg-white text-[#78350F]',
      textColor: 'text-[#78350F]',
      accentColor: 'text-[#92400E]',
    },
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
    theme: {
      bg: 'bg-[#D1FAE5]',
      avatar: 'bg-white text-[#065F46]',
      textColor: 'text-[#064E3B]',
      accentColor: 'text-[#047857]',
    },
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
    theme: {
      bg: 'bg-[#FFEDD5]',
      avatar: 'bg-white text-[#9A3412]',
      textColor: 'text-[#7C2D12]',
      accentColor: 'text-[#C2410C]',
    },
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
    theme: {
      bg: 'bg-[#FCE7F3]',
      avatar: 'bg-white text-[#9D174D]',
      textColor: 'text-[#831843]',
      accentColor: 'text-[#BE185D]',
    },
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
      'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800&auto=format&fit=crop',
    theme: {
      bg: 'bg-[#F3E8FF]',
      avatar: 'bg-white text-[#6B21A8]',
      textColor: 'text-[#581C87]',
      accentColor: 'text-[#7E22CE]',
    },
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
    theme: {
      bg: 'bg-[#E0F2FE]',
      avatar: 'bg-white text-[#0369A1]',
      textColor: 'text-[#0C4A6E]',
      accentColor: 'text-[#0284C7]',
    },
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

  // Scroll parameters: Single pass through without repeating / looping back to start
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    mass: 0.1,
    stiffness: 80,
    damping: 22,
  });

  // Vector translation steps
  const stepX = isMobile ? 185 : 255;
  const stepY = isMobile ? -48 : -65;
  const stepZ = isMobile ? -180 : -240;

  // Total shift for single pass from first card to last card
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
      className="relative bg-gradient-to-b from-[#FDFBF7] via-[#F8FAFC] to-[#F1F5F9] border-t border-slate-200/80"
      style={{ height: isMobile ? '220vh' : '260vh' }}
    >
      {/* Sticky Fullscreen Viewport during Scroll Runway */}
      <div
        className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
      >
        {/* Left-Aligned Header Overlay (Aligned with Cards Row) */}
        <div className="absolute z-30 pointer-events-none top-20 sm:top-1/2 sm:-translate-y-1/2 left-6 sm:left-12 lg:left-20 max-w-sm sm:max-w-md lg:max-w-lg text-left">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight font-prompt leading-[1.1]">
            รีวิวจากลูกค้า
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-500 font-light mt-2 sm:mt-3 mb-3.5 sm:mb-4">
            เสียงตอบรับจากลูกค้าที่สั่งซื้อจริงกับ Bibi&apos;s Treats
          </p>

          {/* Clean Floating Rating Row (No border, No pill background) */}
          <div className="flex items-center gap-2.5 text-slate-700 pointer-events-auto">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <FontAwesomeIcon key={i} icon={faStar} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              ))}
            </div>
            <span className="font-bold text-slate-900 text-sm sm:text-base lg:text-lg">4.98</span>
            <span className="text-slate-300 text-xs sm:text-sm">·</span>
            <span className="text-xs sm:text-sm text-slate-500 font-medium">500+ รีวิว</span>
          </div>
        </div>

        {/* 3D Scene Container */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
          style={{
            perspective: isMobile ? '1600px' : '2200px',
            perspectiveOrigin: isMobile ? '35% 50%' : '52% 38%',
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
              left: isMobile ? '0px' : '150px',
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Content Card - Borderless Solid Luxury */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className={`relative z-10 w-full max-w-lg ${selectedReview.theme.bg} rounded-[32px] border-0 ring-0 shadow-2xl p-6 sm:p-8 overflow-hidden`}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedReview(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 shadow-xs flex items-center justify-center transition-transform active:scale-90"
                aria-label="ปิดหน้าต่างรีวิว"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>

              {/* Product Image */}
              <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden mb-4 shadow-sm bg-white/50">
                <img
                  src={selectedReview.image}
                  alt={selectedReview.menuItem}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Stars & Menu Title */}
              <div className="flex items-center gap-1 text-amber-400 mb-1.5">
                {[...Array(selectedReview.rating)].map((_, i) => (
                  <FontAwesomeIcon key={i} icon={faStar} className="w-4 h-4 fill-current" />
                ))}
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-prompt tracking-tight mb-3">
                {selectedReview.menuItem}
              </h3>

              {/* Full Review Text */}
              <div className="relative mb-5 bg-white/60 rounded-2xl p-4">
                <p className="text-slate-800 text-sm sm:text-base leading-relaxed font-normal">
                  &ldquo;{selectedReview.comment}&rdquo;
                </p>
                {selectedReview.highlight && (
                  <div
                    className={`mt-2.5 text-xs font-medium pt-2 border-t border-black/5 ${selectedReview.theme.accentColor}`}
                  >
                    ✨ {selectedReview.highlight}
                  </div>
                )}
              </div>

              {/* Customer Info Footer */}
              <div className="flex items-center justify-between text-xs pt-1 pb-4 border-b border-black/8">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full ${selectedReview.theme.avatar} shadow-2xs flex items-center justify-center font-bold text-xs`}
                  >
                    {selectedReview.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                      {selectedReview.name}
                    </div>
                    <div className={`text-[11px] flex items-center gap-1 font-medium ${selectedReview.theme.accentColor}`}>
                      <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
                      <span>สั่งซื้อจริงกับ Bibi&apos;s Treats</span>
                    </div>
                  </div>
                </div>
                <span className="text-slate-500 text-xs font-light">{selectedReview.date}</span>
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
                className="w-full mt-4 py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <span>ดูเมนู {selectedReview.menuItem} ในรายการขนม</span>
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

  // Magnetic Scale: Closer = Larger
  const targetScale = useTransform(distance, [0, 320], [isMobile ? 1.14 : 1.28, 1]);
  const springScale = useSpring(targetScale, {
    mass: 0.45,
    stiffness: 280,
    damping: 22,
  });

  // 3D Matrix Transform combining position, rotation, and spring scale
  const transform = useTransform(springScale, (s) => {
    const baseX = i * stepX;
    const baseY = i * stepY;
    const baseZ = i * stepZ;
    return `translate3d(${baseX}px, ${baseY}px, ${baseZ}px) rotateY(-34deg) scale(${s})`;
  });

  const { theme } = review;

  return (
    <motion.div
      ref={ref}
      onClick={() => onSelect(review)}
      className={`absolute ${
        isMobile ? 'w-[255px] h-[375px]' : 'w-[305px] h-[415px]'
      } ${theme.bg} rounded-[28px] border-0 ring-0 shadow-lg hover:shadow-2xl overflow-hidden flex flex-col justify-between p-4 sm:p-5 transition-all duration-300 group cursor-pointer active:scale-98`}
      style={{
        transform,
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
      }}
    >
      <div>
        {/* Product Image Preview - Clean Borderless */}
        <div className="relative w-full h-32 sm:h-40 rounded-2xl overflow-hidden mb-3.5 shadow-2xs bg-white/40">
          <img
            src={review.image}
            alt={review.menuItem}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>

        {/* Rating Stars */}
        <div className="flex items-center gap-1 text-amber-400 mb-1.5">
          {[...Array(review.rating)].map((_, starIdx) => (
            <FontAwesomeIcon key={starIdx} icon={faStar} className="w-3.5 h-3.5 fill-current" />
          ))}
        </div>

        {/* Menu Item Name */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-prompt truncate mb-2">
          {review.menuItem}
        </h3>

        {/* Customer Review Quote - Clean Slate */}
        <p className="text-slate-800 text-xs sm:text-[13px] leading-relaxed font-normal line-clamp-3">
          &ldquo;{review.comment}&rdquo;
        </p>
      </div>

      {/* Card Footer: Minimal Verified Customer Info */}
      <div className="flex items-center gap-2.5 pt-2">
        <div
          className={`w-7 h-7 rounded-full ${theme.avatar} shadow-2xs flex items-center justify-center font-bold text-[11px] shrink-0`}
        >
          {review.initials}
        </div>
        <div className="truncate min-w-0">
          <div className="font-semibold text-slate-900 text-xs sm:text-[13px] truncate">{review.name}</div>
          <div className={`text-[10px] sm:text-[11px] flex items-center gap-1 font-medium ${theme.accentColor}`}>
            <FontAwesomeIcon icon={faCheckCircle} className="w-2.5 h-2.5" />
            <span>สั่งซื้อจริง</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
