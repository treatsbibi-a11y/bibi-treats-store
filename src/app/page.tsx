'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import HeroBanner from '@/components/customer/HeroBanner';
import ProductCard from '@/components/customer/ProductCard';
import ProductModal from '@/components/customer/ProductModal';
import ReviewsSection from '@/components/customer/ReviewsSection';
import { CartDrawer } from '@/components/customer/CartDrawer';
import { ProductWithImages } from '@/types';

export default function HomePage() {
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [modalProduct, setModalProduct] = useState<ProductWithImages | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to load menu products', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Extract unique categories
  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category)));
    return ['All', ...list];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStock = !onlyInStock || p.stock > 0;
      return matchCategory && matchSearch && matchStock;
    });
  }, [products, selectedCategory, searchQuery, onlyInStock]);

  return (
    <div className="min-h-screen bg-surface-ground">
      <HeroBanner />

      {/* Main Menu Section */}
      <section id="menu" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10 sm:py-16">
        {/* Filter Bar (Static - stays in place, does not follow scroll) */}
        <div className="relative py-2 sm:py-4 mb-5 sm:mb-8 border-b border-slate-200/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-light tracking-wide transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-subtle'
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {cat === 'All' ? 'เมนูทั้งหมด' : cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาเมนูขนม..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-button focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 animate-pulse space-y-4"
              >
                <div className="aspect-[4/3] bg-slate-100 rounded-xl" />
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-9 bg-slate-100 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/80 p-8 max-w-md mx-auto">
            <p className="text-slate-900 font-semibold text-base mb-1">ไม่พบเมนูขนมที่ค้นหา</p>
            <p className="text-slate-500 text-xs mb-4">
              ลองเปลี่ยนหมวดหมู่หรือคำค้นหาดูใหม่อีกครั้งค่ะ
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
                setOnlyInStock(false);
              }}
              className="text-xs text-brand-600 font-semibold hover:underline"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pb-20">
            {filteredProducts.map((product, idx) => {
              // Staggered vertical rhythm (ฟันปลาสลับระดับหรูหรา)
              const lgStagger = idx % 3 === 1 ? 'lg:translate-y-8' : idx % 3 === 2 ? 'lg:translate-y-4' : 'lg:translate-y-0';
              const smStagger = idx % 2 === 1 ? 'sm:translate-y-6' : 'sm:translate-y-0';

              return (
                <div
                  key={product.id}
                  className={`transition-transform duration-300 ${smStagger} ${lgStagger}`}
                >
                  <ProductCard
                    product={product}
                    index={idx}
                    onOpenModal={(p) => setModalProduct(p)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Customer Reviews Section */}
      <ReviewsSection />

      {/* Product Detail Modal */}
      <ProductModal
        product={modalProduct}
        onClose={() => setModalProduct(null)}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
