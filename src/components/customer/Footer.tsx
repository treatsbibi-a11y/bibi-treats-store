'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPhone,
  faClock,
  faLocationDot,
  faCalendarDays,
  faGem,
} from '@fortawesome/free-solid-svg-icons';
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
                  <Link href="/#menu" className="hover:text-amber-300 transition-colors">
                    เมนูขนมทั้งหมด
                  </Link>
                </li>
                <li>
                  <Link href="/#reviews" className="hover:text-amber-300 transition-colors">
                    รีวิวจากลูกค้า
                  </Link>
                </li>
                <li>
                  <Link href="/tracking" className="hover:text-amber-300 transition-colors">
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
                    className="inline-flex items-center gap-2 hover:text-white transition-colors group"
                  >
                    <FontAwesomeIcon icon={faInstagram} className="w-4 h-4 text-slate-400 group-hover:text-amber-300 transition-colors" />
                    <span>@bibi.streats</span>
                  </a>
                </li>
                <li>
                  <a
                    href="tel:0862965765"
                    className="inline-flex items-center gap-2 hover:text-white transition-colors group"
                  >
                    <FontAwesomeIcon icon={faPhone} className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 transition-colors" />
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
            <div className="space-y-3 w-full sm:w-auto min-w-[280px] max-w-sm">
              <h3 className="font-bold text-white text-xs tracking-wider uppercase font-mono flex items-center gap-2">
                <FontAwesomeIcon icon={faLocationDot} className="w-3.5 h-3.5 text-amber-400" />
                <span>วันและจุดนัดรับขนม</span>
              </h3>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-800/50 to-slate-900/90 p-4 border border-slate-700/80 hover:border-amber-400/50 transition-all duration-300 shadow-xl shadow-black/20 group">
                {/* Golden ambient aura */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" />

                <div className="space-y-3 relative z-10">
                  {/* Slot 1: Sun - Thu : Tanyong Mat */}
                  <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-700/60">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-200 font-medium text-xs">
                        <FontAwesomeIcon icon={faCalendarDays} className="w-3 h-3 text-amber-400" />
                        <span>วันอาทิตย์ – วันพฤหัสบดี</span>
                      </div>
                      <p className="text-[11px] text-slate-400 pl-4.5">รอบอบสดใหม่ประจำวัน</p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-xs">
                      <FontAwesomeIcon icon={faLocationDot} className="w-2.5 h-2.5 text-amber-400" />
                      สถานที่ ตันหยงมัส
                    </span>
                  </div>

                  {/* Slot 2: Fri - Sat : Mueang Narathiwat */}
                  <div className="flex items-start justify-between gap-3 pt-0.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-200 font-medium text-xs">
                        <FontAwesomeIcon icon={faCalendarDays} className="w-3 h-3 text-sky-400" />
                        <span>วันศุกร์ – วันเสาร์</span>
                      </div>
                      <p className="text-[11px] text-slate-400 pl-4.5">รอบส่งตัวเมืองประจำสัปดาห์</p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-400/15 text-sky-300 border border-sky-400/30 shadow-xs">
                      <FontAwesomeIcon icon={faLocationDot} className="w-2.5 h-2.5 text-sky-400" />
                      สถานที่ เมืองนราธิวาส
                    </span>
                  </div>
                </div>

                {/* Micro footer note */}
                <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 text-amber-300/90 font-medium">
                    <FontAwesomeIcon icon={faGem} className="w-2.5 h-2.5 text-amber-400" />
                    โฮมเมดอบสดใหม่ตามออเดอร์
                  </span>
                  <span className="text-slate-500">นัดรับตามรอบ</span>
                </div>
              </div>
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
