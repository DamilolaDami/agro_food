const steps = [
  {
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 5M17 13l2.3 5M9 21h6" />
      </svg>
    ),
    bg: 'bg-brand-600',
    title: '1. Pick Your Produce',
    description: 'Browse our range and click Order on the items you need — choose your quantities.',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    bg: 'bg-earth-500',
    title: '2. Fill Your Details',
    description: "Enter your name, phone, and delivery address. We'll confirm your order via WhatsApp.",
  },
  {
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    bg: 'bg-brand-600',
    title: '3. Get It Delivered',
    description: 'We pack and deliver directly to your location.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-brand-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">How It Works</h2>
          <p className="text-gray-500">Three simple steps to get fresh produce delivered.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.title} className="text-center">
              <div className={`w-14 h-14 ${step.bg} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow`}>
                {step.icon}
              </div>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-gray-500 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
