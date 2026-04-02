const stats = [
  { value: '💰', label: 'Slash your food costs' },
  { value: '⭐', label: 'Enjoy premium quality' },
  { value: '🚚', label: 'Free doorstep delivery' },
  { value: '✅', label: 'Pay only on delivery' },
];

export default function StatsBar() {
  return (
    <section className="bg-gray-50 py-10 border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-3xl leading-none mb-1">{s.value}</p>
            <p className="text-sm font-semibold text-gray-700">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
