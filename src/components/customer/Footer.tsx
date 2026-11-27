'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faClock, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import CursorDrivenParticleTypography from '@/components/ui/CursorDrivenParticleTypography';

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="mt-20 bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 sm:pt-14 pb-24 md:pb-16 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-10 lg:gap-16">
          {/* Left Side: Large Bibi's Treats */}
          <div className="flex-1 max-w-xl">
            <CursorDrivenParticleTypography
              text="Bibi's Treats"
              align="left"
              fontSize={78}
              color="#FFFFFF"
              particleSize={1.8}
              particleDensity={4}
              dispersionStrength={18}
              returnSpeed={0.08}
              fontFamily="'Rubik', sans-serif"
              className="h-24 sm:h-28 md:h-32 w-full max-w-md"
            />
          </div>

          {/* Right Side: Quick Links, Contact & Operating Hours, and Pickup Schedule */}
          <div className="flex flex-col sm:flex-row flex-wrap xl:flex-nowrap gap-8 sm:gap-10 xl:gap-12">
            {/* Quick Links (เมนูทางลัด) */}
            <div className="space-y-3 min-w-[120px]">
              <h3 className="font-bold text-white text-xs tracking-wider uppercase font-mono">
                เมนูทางลัด
              </h3>
              <ul className="space-y-2.5 text-slate-400">
                <li>
                  <Link href="/#menu" className="hover:text-white transition-colors">
                    เมนูขนมทั้งหมด
                  </Link>
                </li>
                <li>
                  <Link href="/#reviews" className="hover:text-white transition-colors">
                    รีวิวจากลูกค้า
                  </Link>
                </li>
                <li>
                  <Link href="/tracking" className="hover:text-white transition-colors">
                    ติดตามสถานะออเดอร์
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact & Operating Hours (ติดต่อเรา & เวลาทำการ) */}
            <div className="space-y-3 min-w-[210px]">
              <h3 className="font-bold text-white text-xs tracking-wider uppercase font-mono">
                ติดต่อเรา &amp; เวลาทำการ
              </h3>
              <ul className="space-y-2.5 text-slate-400">
                <li>
                  <a
                    href="https://www.instagram.com/bibi.streats?fqnt=MXNtZmVvaDhjbmZrOA%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <FontAwesomeIcon icon={faInstagram} className="w-4 h-4 text-slate-400" />
                    <span>@bibi.streats</span>
                  </a>
                </li>
                <li>
                  <a
                    href="tel:0862965765"
                    className="inline-flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <FontAwesomeIcon icon={faPhone} className="w-3.5 h-3.5 text-slate-400" />
                    <span>086-296-5765</span>
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5 text-slate-400" />
                  <span>เปิดบริการ: อาทิตย์ – ศุกร์ (10:00 – 19:00 น.)</span>
                </li>
              </ul>
            </div>

            {/* Pickup Schedule & Locations (วันและจุดนัดรับขนม) */}
            <div className="space-y-3 min-w-[210px]">
              <h3 className="font-bold text-white text-xs tracking-wider uppercase font-mono">
                วันและจุดนัดรับขนม
              </h3>
              <ul className="space-y-2.5 text-slate-400">
                <li className="flex items-start gap-2">
                  <FontAwesomeIcon icon={faLocationDot} className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-200 font-medium block">อาทิตย์ – พฤหัสบดี</span>
                    <span className="text-slate-400 text-[11px]">สถานที่: ตันหยงมัส</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 pt-1.5 border-t border-slate-800/80">
                  <FontAwesomeIcon icon={faLocationDot} className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-200 font-medium block">ศุกร์ – เสาร์</span>
                    <span className="text-slate-400 text-[11px]">สถานที่: เมืองนราธิวาส</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Centered Copyright Notice at Bottom (Desktop & Mobile) */}
        <div className="mt-10 sm:mt-12 lg:mt-14 pt-6 sm:pt-8 border-t border-slate-800/80 text-center text-slate-500 text-xs">
          Copyright © 2026 Bibi&apos;s Treats. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
