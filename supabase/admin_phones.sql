-- Admin Phones table — stores WhatsApp notification recipients
-- Run this in Supabase SQL Editor

CREATE TABLE admin_phones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active phones lookup
CREATE INDEX idx_admin_phones_active ON admin_phones(active);

-- Auto-update updated_at
CREATE TRIGGER admin_phones_updated_at
  BEFORE UPDATE ON admin_phones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE admin_phones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON admin_phones FOR ALL
  USING (auth.role() = 'service_role');
