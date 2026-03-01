'use client';

import { useEffect } from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  orderId: string;
  onClose: () => void;
}

export default function SuccessModal({ isOpen, orderId, onClose }: SuccessModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-[fadeInUp_0.3s_ease]">
        {/* Check icon */}
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-brand-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Order Received!</h2>
        <p className="text-gray-500 mb-2">
          Thank you for your order. {"We'll"} call you shortly to confirm and arrange delivery.
        </p>
        {orderId && (
          <p className="text-sm text-gray-400 mb-6">
            Order ID:{' '}
            <span className="font-mono font-semibold text-brand-700">
              {orderId.slice(0, 8).toUpperCase()}
            </span>
          </p>
        )}

        <button
          onClick={onClose}
          className="w-full bg-brand-700 hover:bg-brand-800 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer"
        >
          Back to Shop
        </button>
      </div>
    </div>
  );
}
