'use client';

import Link from 'next/link';

interface NavbarProps {
  onOrderClick: () => void;
}

export default function Navbar({ onOrderClick }: NavbarProps) {
  return (
    <nav className="fixed top-0 inset-x-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-brand-800">
          <svg
            className="w-8 h-8 text-brand-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c0 0-4 4-4 9s4 9 4 9 4-4 4-9-4-9-4-9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18" />
          </svg>
          FoodPod
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="#products" className="hover:text-brand-700 transition-colors">Products</a>
          <a href="#how-it-works" className="hover:text-brand-700 transition-colors">How It Works</a>
          <a href="#contact" className="hover:text-brand-700 transition-colors">Contact</a>
        </div>

        <button
          onClick={onOrderClick}
          className="bg-brand-700 text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-brand-800 transition-colors shadow cursor-pointer"
        >
          Order Now
        </button>
      </div>
    </nav>
  );
}
