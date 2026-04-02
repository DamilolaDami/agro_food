'use client';

interface HeroProps {
  onOrderClick: () => void;
}

export default function Hero({ onOrderClick }: HeroProps) {
  return (
    <section
      className="pt-28 pb-20 px-4 text-white"
      style={{
        background: 'linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 70%, #16a34a 100%)',
      }}
    >
      <div className="max-w-5xl mx-auto text-center">
        <span className="inline-block bg-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
          Wholesale Prices · Direct Delivery
        </span>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-3">
          Get Premium Foodstuffs at
          <br />
          <span className="text-earth-300">True Wholesale Prices</span>
        </h1>

        <p className="text-green-200 text-lg font-semibold mb-4">
          Smarter shopping. Bigger savings. Zero stress.
        </p>

        <p className="text-green-100 text-base max-w-xl mx-auto mb-8">
          Tired of buying in small bits and paying premium prices every time? We&apos;ve built
          Foodpod to make the smart switch to bulk buying effortless.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onOrderClick}
            className="bg-white text-brand-800 font-bold px-8 py-3.5 rounded-full text-base shadow-lg hover:bg-earth-50 transition-colors cursor-pointer"
          >
            Place an Order
          </button>
          <a
            href="#products"
            className="border-2 border-white/50 text-white font-semibold px-8 py-3.5 rounded-full text-base hover:bg-white/10 transition-colors"
          >
            Browse Products
          </a>
        </div>
      </div>

      {/* Wave divider */}
      <div className="mt-14 -mb-1 overflow-hidden">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path fill="#f9fafb" d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </section>
  );
}
