import Link from 'next/link';

interface FooterProps {
  onOrderClick: () => void;
}

export default function Footer({ onOrderClick }: FooterProps) {
  return (
    <>
      {/* Contact section */}
      <section id="contact" className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Get in Touch</h2>
          <p className="text-gray-500 mb-2">Have questions? Reach us on WhatsApp or place an order.</p>
          <p className="text-gray-500 mb-8">
            Email:{' '}
            <a href="mailto:palmspenny@foodpod.com" className="text-brand-700 hover:underline">
              palmspenny@foodpod.com
            </a>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/2348169745631"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-white font-semibold px-6 py-3 rounded-full hover:bg-green-600 transition-colors shadow"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat on WhatsApp
            </a>
            <a
              href="tel:+2348169745631"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-800 font-semibold px-6 py-3 rounded-full hover:bg-gray-50 transition-colors shadow"
            >
              <svg className="w-5 h-5 text-brand-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Us
            </a>
            <button
              onClick={onOrderClick}
              className="inline-flex items-center gap-2 bg-brand-700 text-white font-semibold px-6 py-3 rounded-full hover:bg-brand-800 transition-colors shadow cursor-pointer"
            >
              Place an Order
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <div className="font-bold text-white text-lg">FoodPod</div>
          <p className="text-center">
            Fresh agri produce, delivered with care. &copy; {new Date().getFullYear()} FoodPod.
          </p>
          <div className="flex gap-4">
            <a href="#products" className="hover:text-white transition-colors">Products</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
