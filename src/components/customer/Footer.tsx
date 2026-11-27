'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faClock } from '@fortawesome/free-solid-svg-icons';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';

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
          {/* Brand Column */}
          <div className="max-w-sm space-y-2">
            <Link href="/" className="inline-block group">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans block group-hover:text-amber-200 transition-colors">
                Bibi&apos;s Treats
              </span>
              <span className="text-[11px] font-medium text-amber-400/90 tracking-widest uppercase font-mono block mt-0.5">
                Artisanal Homemade Bakery
              </span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed">
              ขนมเบเกอรี่โฮมเมด คัดสรรวัตถุดิบชั้นดี อบสดใหม่ใส่ใจทุกขั้นตอน
            </p>
          </div>

          {/* Right Columns: Quick Links, Contact & Hours, and Pickup Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 lg:gap-14 flex-1 max-w-2xl">
            {/* Quick Links (เมนูทางลัด) */}
            <div className="space-y-3">
              <h3 className="font-bold text-white text-xs tracking-wider uppercase font-mono">
                เมนูทางลัด
              </h3>
              <ul className="space-y-2 text-slate-400 text-xs">
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
            <div className="space-y-3">
              <h3 className="font-bold text-white text-xs tracking-wider uppercase font-mono">
                ติดต่อเรา &amp; เวลาทำการ
              </h3>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li>
                  <a
                    href="https://www.instagram.com/bibi.streats?fqnt=MXNtZmVvaDhjbmZrOA%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:text-white transition-colors group"
                  >
                    <FontAwesomeIcon icon={faInstagram} className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
                    <span>@bibi.streats</span>
                  </a>
                </li>
                <li>
                  <a
                    href="tel:0862965765"
                    className="inline-flex items-center gap-2 hover:text-white transition-colors group"
                  >
                    <FontAwesomeIcon icon={faPhone} className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
                    <span>086-296-5765</span>
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5 text-slate-400" />
                  <span>อาทิตย์ – ศุกร์ (10:00 – 19:00 น.)</span>
                </li>
              </ul>
            </div>

            {/* Pickup Schedule & Locations (วันและจุดนัดรับขนม) */}
            <div className="space-y-3">
              <h3 className="font-bold text-white text-xs tracking-wider uppercase font-mono">
                วันและจุดนัดรับขนม
              </h3>
              <ul className="space-y-2 text-xs">
                <li className="space-y-0.5">
                  <span className="text-slate-400 text-[11px] block">วันอาทิตย์ – วันพฤหัสบดี</span>
                  <span className="text-slate-200 font-medium block">สถานที่: ตันหยงมัส</span>
                </li>
                <li className="space-y-0.5 pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 text-[11px] block">วันศุกร์ – วันเสาร์</span>
                  <span className="text-slate-200 font-medium block">สถานที่: เมืองนราธิวาส</span>
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
