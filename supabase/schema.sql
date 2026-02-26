-- CUNPOLLO Orders Schema
-- Run this in Supabase SQL Editor to create the orders table

CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number SERIAL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- RLS (allow service_role full access, anon read by UUID)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON orders FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Public read by id"
  ON orders FOR SELECT
  USING (true);
