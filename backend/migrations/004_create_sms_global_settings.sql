-- ============================================================
-- SMS Global Settings (Master Switch)
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create the table (single-row config, enforced by CHECK constraint)
CREATE TABLE IF NOT EXISTS sms_global_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  master_enabled BOOLEAN NOT NULL DEFAULT false,
  default_send_time TEXT DEFAULT '08:00',
  max_per_day INTEGER DEFAULT 50,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert default row (master OFF by default for safety)
INSERT INTO sms_global_settings (id, master_enabled, default_send_time, max_per_day)
VALUES (1, false, '08:00', 50)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable Row Level Security
ALTER TABLE sms_global_settings ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies (backend uses service_role key which bypasses RLS,
--    but these are needed if anon/authenticated clients access directly)
CREATE POLICY "Allow authenticated read sms_global_settings"
  ON sms_global_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update sms_global_settings"
  ON sms_global_settings FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert sms_global_settings"
  ON sms_global_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Also allow service_role full access (redundant since service_role
--    bypasses RLS, but explicit for clarity)
CREATE POLICY "Allow service_role full access sms_global_settings"
  ON sms_global_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
