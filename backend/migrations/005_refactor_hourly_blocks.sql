-- Migration 005: Refactor capacity from AM/PM to hourly blocks
-- Description: Changes scheduling from AM/PM slots to 1-hour blocks (7:30 AM – 4:30 PM).
--   9 blocks × 3 patients = 27 daily capacity; 1 buffer slot reserved for reschedules.

-- Step 1: Drop the CHECK constraint on time_slot to allow block time values
ALTER TABLE patientschedule DROP CONSTRAINT IF EXISTS patientschedule_time_slot_check;

-- Step 2: Add new CHECK constraint accepting block times (and legacy AM/PM for transition)
ALTER TABLE patientschedule ADD CONSTRAINT patientschedule_time_slot_check
  CHECK (time_slot IN (
    'AM', 'PM',
    '07:30', '08:30', '09:30', '10:30', '11:30',
    '12:30', '13:30', '14:30', '15:30'
  ) OR time_slot IS NULL);

-- Step 3: Migrate existing AM/PM rows to block times
--   AM schedules   → spread across morning blocks (07:30, 08:30, 09:30, 10:30, 11:30)
--   PM schedules   → spread across afternoon blocks (12:30, 13:30, 14:30, 15:30)
--   We use ROW_NUMBER to distribute patients evenly across blocks.
WITH ranked_am AS (
  SELECT patient_schedule_id,
         ROW_NUMBER() OVER (PARTITION BY scheduled_date ORDER BY patient_schedule_id) AS rn
  FROM   patientschedule
  WHERE  time_slot = 'AM' AND is_deleted = FALSE
),
am_blocks(idx, block) AS (
  VALUES (1,'07:30'),(2,'08:30'),(3,'09:30'),(4,'10:30'),(5,'11:30')
)
UPDATE patientschedule ps
SET    time_slot = ab.block
FROM   ranked_am r
JOIN   am_blocks ab ON ab.idx = ((r.rn - 1) % 5) + 1
WHERE  ps.patient_schedule_id = r.patient_schedule_id;

WITH ranked_pm AS (
  SELECT patient_schedule_id,
         ROW_NUMBER() OVER (PARTITION BY scheduled_date ORDER BY patient_schedule_id) AS rn
  FROM   patientschedule
  WHERE  time_slot = 'PM' AND is_deleted = FALSE
),
pm_blocks(idx, block) AS (
  VALUES (1,'12:30'),(2,'13:30'),(3,'14:30'),(4,'15:30')
)
UPDATE patientschedule ps
SET    time_slot = pb.block
FROM   ranked_pm r
JOIN   pm_blocks pb ON pb.idx = ((r.rn - 1) % 4) + 1
WHERE  ps.patient_schedule_id = r.patient_schedule_id;

-- Step 4: Add daily_capacity and total_booked columns to daily_capacity_config
ALTER TABLE daily_capacity_config
  ADD COLUMN IF NOT EXISTS daily_capacity INT NOT NULL DEFAULT 27,
  ADD COLUMN IF NOT EXISTS total_booked   INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buffer_slots   INT NOT NULL DEFAULT 1;

-- Populate total_booked from existing am_booked + pm_booked
UPDATE daily_capacity_config
SET daily_capacity = 27,
    total_booked   = am_booked + pm_booked,
    buffer_slots   = 1;

-- Step 5: Replace the get_or_create_capacity_config function
CREATE OR REPLACE FUNCTION get_or_create_capacity_config(p_date DATE)
RETURNS TABLE (
  config_id BIGINT,
  date DATE,
  am_capacity INT,
  pm_capacity INT,
  am_booked INT,
  pm_booked INT,
  notes TEXT,
  daily_capacity INT,
  total_booked INT,
  buffer_slots INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.config_id,
    dc.date,
    dc.am_capacity,
    dc.pm_capacity,
    dc.am_booked,
    dc.pm_booked,
    dc.notes,
    dc.daily_capacity,
    dc.total_booked,
    dc.buffer_slots
  FROM daily_capacity_config dc
  WHERE dc.date = p_date AND dc.is_deleted = FALSE;

  IF NOT FOUND THEN
    INSERT INTO daily_capacity_config (date, am_capacity, pm_capacity, am_booked, pm_booked, daily_capacity, total_booked, buffer_slots)
    VALUES (p_date, 0, 0, 0, 0, 27, 0, 1)
    RETURNING
      daily_capacity_config.config_id,
      daily_capacity_config.date,
      daily_capacity_config.am_capacity,
      daily_capacity_config.pm_capacity,
      daily_capacity_config.am_booked,
      daily_capacity_config.pm_booked,
      daily_capacity_config.notes,
      daily_capacity_config.daily_capacity,
      daily_capacity_config.total_booked,
      daily_capacity_config.buffer_slots
    INTO
      config_id, date, am_capacity, pm_capacity, am_booked, pm_booked, notes,
      daily_capacity, total_booked, buffer_slots;

    RETURN NEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Replace slot-booking helpers to work with total_booked
CREATE OR REPLACE FUNCTION increment_slot_booking(p_date DATE, p_slot VARCHAR(10))
RETURNS VOID AS $$
DECLARE
  v_config_id BIGINT;
BEGIN
  SELECT gc.config_id INTO v_config_id FROM get_or_create_capacity_config(p_date) gc LIMIT 1;

  UPDATE daily_capacity_config
  SET total_booked = total_booked + 1,
      updated_at   = NOW()
  WHERE config_id = v_config_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_slot_booking(p_date DATE, p_slot VARCHAR(10))
RETURNS VOID AS $$
DECLARE
  v_config_id BIGINT;
BEGIN
  SELECT gc.config_id INTO v_config_id FROM get_or_create_capacity_config(p_date) gc LIMIT 1;

  UPDATE daily_capacity_config
  SET total_booked = GREATEST(0, total_booked - 1),
      updated_at   = NOW()
  WHERE config_id = v_config_id;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Replace get_available_slot to return next available block time
CREATE OR REPLACE FUNCTION get_available_slot(p_date DATE)
RETURNS VARCHAR(10) AS $$
DECLARE
  v_block VARCHAR(10);
  v_count INT;
  v_total INT := 0;
  v_daily_cap INT;
  v_buffer INT;
  blocks VARCHAR(10)[] := ARRAY['07:30','08:30','09:30','10:30','11:30','12:30','13:30','14:30','15:30'];
BEGIN
  -- Get daily capacity and buffer
  SELECT dc.daily_capacity, dc.buffer_slots
  INTO v_daily_cap, v_buffer
  FROM daily_capacity_config dc
  WHERE dc.date = p_date AND dc.is_deleted = FALSE;

  IF v_daily_cap IS NULL THEN
    v_daily_cap := 27;
    v_buffer := 1;
  END IF;

  -- Count total active schedules
  SELECT COUNT(*) INTO v_total
  FROM patientschedule
  WHERE scheduled_date = p_date
    AND is_deleted = FALSE
    AND status NOT IN ('Completed', 'Cancelled');

  -- Check bookable capacity (daily_capacity - buffer)
  IF v_total >= (v_daily_cap - v_buffer) THEN
    RETURN NULL;
  END IF;

  -- Find first block with availability (< 3 patients)
  FOREACH v_block IN ARRAY blocks LOOP
    SELECT COUNT(*) INTO v_count
    FROM patientschedule
    WHERE scheduled_date = p_date
      AND time_slot = v_block
      AND is_deleted = FALSE
      AND status NOT IN ('Completed', 'Cancelled');

    IF v_count < 3 THEN
      RETURN v_block;
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Replace recalc to count total (ignore AM/PM split)
CREATE OR REPLACE FUNCTION recalc_capacity_from_schedules(p_date DATE)
RETURNS VOID AS $$
DECLARE
  v_total INT;
  v_config_id BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM patientschedule
  WHERE scheduled_date = p_date
    AND is_deleted = FALSE
    AND status NOT IN ('Completed', 'Cancelled');

  SELECT gc.config_id INTO v_config_id FROM get_or_create_capacity_config(p_date) gc LIMIT 1;

  UPDATE daily_capacity_config
  SET total_booked = v_total,
      am_booked    = v_total,
      pm_booked    = 0,
      updated_at   = NOW()
  WHERE config_id = v_config_id;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Index for efficient block-level queries
CREATE INDEX IF NOT EXISTS idx_patientschedule_date_block
ON patientschedule(scheduled_date, time_slot) WHERE is_deleted = FALSE;
