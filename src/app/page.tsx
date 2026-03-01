'use client';

import { useState, useEffect } from 'react';
import { fetchProducts, PRODUCTS } from '@/lib/products';
import type { Product } from '@/types';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import StatsBar from '@/components/StatsBar';
import ProductGrid from '@/components/ProductGrid';
import HowItWorks from '@/components/HowItWorks';
import Footer from '@/components/Footer';
import OrderModal from '@/components/OrderModal';
import SuccessModal from '@/components/SuccessModal';

export default function HomePage() {
  // Start with hardcoded list so the page isn't blank while loading
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [preselectedId, setPreselectedId] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  function openOrder(productId: string | null) {
    setPreselectedId(productId);
    setModalOpen(true);
  }

  function handleSuccess(id: string) {
    setModalOpen(false);
    setOrderId(id);
    setSuccessOpen(true);
  }

  return (
    <>
      <Navbar onOrderClick={() => openOrder(null)} />
      <Hero onOrderClick={() => openOrder(null)} />
      <StatsBar />
      <ProductGrid products={products} onOrder={openOrder} />
      <HowItWorks />
      <Footer onOrderClick={() => openOrder(null)} />

      <OrderModal
        isOpen={modalOpen}
        products={products}
        preselectedProductId={preselectedId}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />

      <SuccessModal
        isOpen={successOpen}
        orderId={orderId}
        onClose={() => { setSuccessOpen(false); setOrderId(''); }}
      />
    </>
  );
}
