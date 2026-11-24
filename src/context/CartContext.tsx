'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, ProductWithImages } from '@/types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: ProductWithImages, qty?: number, openDrawer?: boolean) => boolean;
  updateQuantity: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  isLoaded: boolean;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [shippingFee, setShippingFee] = useState<number>(40); // Synced with StoreSettings

  // Load from localStorage on mount & sync store settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bibi_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    }
    setIsLoaded(true);

    // Fetch real-time shipping fee from admin store settings
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.defaultShippingFee === 'number') {
            setShippingFee(data.defaultShippingFee);
          }
        }
      } catch (err) {
        console.warn('Could not sync store settings for shipping fee', err);
      }
    };
    fetchSettings();
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('bibi_cart', JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save cart to storage', e);
      }
    }
  }, [items, isLoaded]);

  const addToCart = (product: ProductWithImages, qty = 1, openDrawer = false): boolean => {
    if (product.stock <= 0) return false;

    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, product.stock);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      } else {
        const initialQty = Math.min(qty, product.stock);
        return [...prev, { product, quantity: initialQty }];
      }
    });

    if (openDrawer) {
      setIsDrawerOpen(true);
    }
    return true;
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxAllowed = Math.min(qty, item.product.stock);
          return { ...item, quantity: maxAllowed };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = subtotal > 0 ? subtotal + shippingFee : 0;

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        shippingFee,
        total,
        isLoaded,
        isDrawerOpen,
        setIsDrawerOpen,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
