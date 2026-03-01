-- Run this in your Supabase SQL Editor
-- Step 1: Orders table

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  surname TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can place an order"
  ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read for order confirmation"
  ON orders FOR SELECT USING (true);

-- Admin needs to update order statuses
CREATE POLICY "Admin can update orders"
  ON orders FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Admin can delete orders"
  ON orders FOR DELETE USING (true);

-- Step 2: Products table

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📦',
  description TEXT NOT NULL DEFAULT '',
  bg_color TEXT NOT NULL DEFAULT 'bg-gray-50',
  options JSONB NOT NULL DEFAULT '[]',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone can read active products (for the storefront)
CREATE POLICY "Public read active products"
  ON products FOR SELECT USING (true);

-- Anyone can insert/update/delete products (tighten this with auth later)
CREATE POLICY "Admin can manage products"
  ON products FOR ALL USING (true) WITH CHECK (true);

-- Step 3: Shared updated_at trigger

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Step 4: Indexes

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS products_sort_order_idx ON products (sort_order, created_at);
CREATE INDEX IF NOT EXISTS products_active_idx ON products (active);

-- Step 5: Seed default products (skip if they already exist)

INSERT INTO products (id, name, emoji, description, bg_color, options, active, sort_order) VALUES
  ('rice',          'Rice',          '🌾', 'Premium local & parboiled rice, clean and stone-free.',  'bg-amber-50',  '[{"label":"25 kg bag","price":28000},{"label":"50 kg bag","price":54000}]', true, 1),
  ('beans',         'Beans',         '🫘', 'Honey beans and oloyin varieties, freshly sorted.',       'bg-red-50',    '[{"label":"25 kg bag","price":22000},{"label":"50 kg bag","price":42000}]', true, 2),
  ('yam',           'Yam',           '🥔', 'Fresh, starchy tubers from Jos and Benue farms.',         'bg-orange-50', '[{"label":"5 tubers","price":7500},{"label":"10 tubers","price":14000},{"label":"15 tubers","price":20000}]', true, 3),
  ('palm_oil',      'Palm Oil',      '🛢️','Pure unrefined red palm oil, rich and aromatic.',          'bg-red-50',    '[{"label":"5 litres","price":9500},{"label":"25 kg keg","price":38000}]', true, 4),
  ('groundnut_oil', 'Groundnut Oil', '🥜', 'Cold-pressed groundnut oil, perfect for frying.',         'bg-yellow-50', '[{"label":"5 litres","price":11000},{"label":"25 kg keg","price":46000}]', true, 5),
  ('potatoes',      'Potatoes',      '🥔', 'Fresh Irish potatoes, firm and well-sized.',              'bg-stone-50',  '[{"label":"1 basket (≈50 kg)","price":18000},{"label":"2 baskets","price":34000}]', true, 6),
  ('tomatoes',      'Tomatoes',      '🍅', 'Ripe, fresh tomatoes from northern farms.',               'bg-red-50',    '[{"label":"1 basket (≈50 kg)","price":16000},{"label":"2 baskets","price":30000}]', true, 7),
  ('plantain',      'Plantain',      '🍌', 'Sweet ripe and unripe plantain bunches.',                 'bg-yellow-50', '[{"label":"1 bunch (≈15 pcs)","price":6000},{"label":"2 bunches","price":11000}]', true, 8)
ON CONFLICT (id) DO NOTHING;
