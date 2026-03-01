import type { Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onOrder: (productId: string) => void;
}

export default function ProductGrid({ products, onOrder }: ProductGridProps) {
  return (
    <section id="products" className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Our Products</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Sourced fresh from farms. Click &quot;Order&quot; on any product to place a customised order.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onOrder={onOrder} />
          ))}
        </div>
      </div>
    </section>
  );
}
