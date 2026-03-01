import type { Product, DbProduct } from '@/types';
import { supabase } from './supabase';

// Hardcoded fallback — used when the DB is empty or unreachable
export const PRODUCTS: Product[] = [
  {
    id: 'rice',
    name: 'Rice',
    emoji: '🌾',
    description: 'Premium local & parboiled rice, clean and stone-free.',
    bgColor: 'bg-amber-50',
    options: [
      { label: '25 kg bag', price: 28000 },
      { label: '50 kg bag', price: 54000 },
    ],
  },
  {
    id: 'beans',
    name: 'Beans',
    emoji: '🫘',
    description: 'Honey beans and oloyin varieties, freshly sorted.',
    bgColor: 'bg-red-50',
    options: [
      { label: '25 kg bag', price: 22000 },
      { label: '50 kg bag', price: 42000 },
    ],
  },
  {
    id: 'yam',
    name: 'Yam',
    emoji: '🥔',
    description: 'Fresh, starchy tubers from Jos and Benue farms.',
    bgColor: 'bg-orange-50',
    options: [
      { label: '5 tubers', price: 7500 },
      { label: '10 tubers', price: 14000 },
      { label: '15 tubers', price: 20000 },
    ],
  },
  {
    id: 'palm_oil',
    name: 'Palm Oil',
    emoji: '🛢️',
    description: 'Pure unrefined red palm oil, rich and aromatic.',
    bgColor: 'bg-red-50',
    options: [
      { label: '5 litres', price: 9500 },
      { label: '25 kg keg', price: 38000 },
    ],
  },
  {
    id: 'groundnut_oil',
    name: 'Groundnut Oil',
    emoji: '🥜',
    description: 'Cold-pressed groundnut oil, perfect for frying.',
    bgColor: 'bg-yellow-50',
    options: [
      { label: '5 litres', price: 11000 },
      { label: '25 kg keg', price: 46000 },
    ],
  },
  {
    id: 'potatoes',
    name: 'Potatoes',
    emoji: '🥔',
    description: 'Fresh Irish potatoes, firm and well-sized.',
    bgColor: 'bg-stone-50',
    options: [
      { label: '1 basket (≈50 kg)', price: 18000 },
      { label: '2 baskets', price: 34000 },
    ],
  },
  {
    id: 'tomatoes',
    name: 'Tomatoes',
    emoji: '🍅',
    description: 'Ripe, fresh tomatoes from northern farms.',
    bgColor: 'bg-red-50',
    options: [
      { label: '1 basket (≈50 kg)', price: 16000 },
      { label: '2 baskets', price: 30000 },
    ],
  },
  {
    id: 'plantain',
    name: 'Plantain',
    emoji: '🍌',
    description: 'Sweet ripe and unripe plantain bunches.',
    bgColor: 'bg-yellow-50',
    options: [
      { label: '1 bunch (≈15 pcs)', price: 6000 },
      { label: '2 bunches', price: 11000 },
    ],
  },
];

export function dbToProduct(row: DbProduct): Product {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    description: row.description,
    bgColor: row.bg_color,
    options: row.options,
    imageUrl: row.image_url ?? undefined,
  };
}

/** Fetch active products from Supabase. Falls back to PRODUCTS if DB is empty or errors. */
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error || !data || data.length === 0) {
    return PRODUCTS;
  }
  return (data as DbProduct[]).map(dbToProduct);
}

/** Generate a URL-safe product ID from a name */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export const BG_COLOR_OPTIONS = [
  { value: 'bg-amber-50',  label: 'Amber' },
  { value: 'bg-red-50',    label: 'Red' },
  { value: 'bg-orange-50', label: 'Orange' },
  { value: 'bg-yellow-50', label: 'Yellow' },
  { value: 'bg-green-50',  label: 'Green' },
  { value: 'bg-blue-50',   label: 'Blue' },
  { value: 'bg-stone-50',  label: 'Stone' },
  { value: 'bg-gray-50',   label: 'Gray' },
  { value: 'bg-purple-50', label: 'Purple' },
  { value: 'bg-pink-50',   label: 'Pink' },
];
