const stats = [
  { value: '8+', label: 'Produce Types' },
  { value: '500+', label: 'Happy Customers' },
  { value: '24h', label: 'Delivery Turnaround' },
  { value: '100%', label: 'Farm Fresh' },
];

export default function StatsBar() {
  return (
    <section className="bg-gray-50 py-10 border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-3xl font-extrabold text-brand-700">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
