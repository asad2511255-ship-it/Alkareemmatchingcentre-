-- ============================================================
-- AL-KAREEM MATCHING CENTRE - SUPABASE SQL SCHEMA
-- Project ID: czkiqhklnnfssrgklsdt
-- Direct Link: https://supabase.com/dashboard/project/czkiqhklnnfssrgklsdt/sql
-- ============================================================

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_id TEXT UNIQUE NOT NULL,
    tracking_token TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_city TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    product_id TEXT,
    product_name_snapshot TEXT,
    product_image_snapshot TEXT,
    selected_colour TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price_snapshot REAL,
    total_price REAL,
    payment_method_id TEXT,
    payment_method_snapshot JSONB,
    payment_proof_filename TEXT,
    payment_proof_path TEXT,
    payment_status TEXT DEFAULT 'Awaiting Verification',
    order_status TEXT DEFAULT 'In Review',
    estimated_delivery_date TEXT,
    status_history JSONB,
    idempotency_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category_id TEXT,
    price_pkr REAL NOT NULL DEFAULT 0,
    available_colours JSONB DEFAULT '[]'::jsonb,
    stock_quantity INTEGER NOT NULL DEFAULT 10,
    is_active INTEGER NOT NULL DEFAULT 1,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Payment Methods Table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id TEXT PRIMARY KEY,
    provider_name TEXT NOT NULL,
    account_holder_name TEXT,
    bank_or_wallet_name TEXT,
    account_number_or_iban TEXT,
    payment_instructions TEXT,
    qr_code_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Store Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 6. Indexes for High Performance Queries
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON public.orders(tracking_token);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 8. Row Level Security Policies (Full Public Access for Website & Admin API)
DROP POLICY IF EXISTS "Allow anon all on orders" ON public.orders;
CREATE POLICY "Allow anon all on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on products" ON public.products;
CREATE POLICY "Allow anon all on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on categories" ON public.categories;
CREATE POLICY "Allow anon all on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on payment_methods" ON public.payment_methods;
CREATE POLICY "Allow anon all on payment_methods" ON public.payment_methods FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on settings" ON public.settings;
CREATE POLICY "Allow anon all on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- 9. Enable Realtime Replication for Orders (Safe execution)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN others THEN NULL;
END $$;
