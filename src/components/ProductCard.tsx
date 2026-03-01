import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onOrder: (productId: string) => void;
}

export default function ProductCard({ product, onOrder }: ProductCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      {/* Banner */}
      {product.imageUrl ? (
        <div className="relative h-28 border-b border-gray-100 overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-1.5 left-2.5 text-2xl drop-shadow">{product.emoji}</span>
        </div>
      ) : (
        <div
          className={`flex items-center justify-center text-5xl h-28 ${product.bgColor} border-b border-gray-100`}
        >
          {product.emoji}
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-base mb-1">{product.name}</h3>
        <p className="text-gray-500 text-xs flex-1">{product.description}</p>

        <div className="mt-3 flex justify-end">
          <button
            onClick={() => onOrder(product.id)}
            className="bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors shadow-sm cursor-pointer"
          >
            Order
          </button>
        </div>
      </div>
    </div>
  );
}
