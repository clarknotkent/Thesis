-- Migration 003: Add Capacity Scheduling System
-- Description: Adds daily capacity management and AM/PM time slots for patient scheduling

-- Create daily_capacity_config table
CREATE TABLE IF NOT EXISTS daily_capacity_config (
  config_id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  am_capacity INT NOT NULL DEFAULT 25,
  pm_capacity INT NOT NULL DEFAULT 25,
  am_booked INT NOT NULL DEFAULT 0,
  pm_booked INT NOT NULL DEFAULT 0,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by BIGINT REFERENCES users(user_id),
  updated_by BIGINT REFERENCES users(user_id),
  deleted_by BIGINT REFERENCES users(user_id)
);

-- Create index for date lookups
CREATE INDEX idx_daily_capacity_date ON daily_capacity_config(date) WHERE is_deleted = FALSE;

-- Add time_slot column to patientschedule table
ALTER TABLE patientschedule 
ADD COLUMN IF NOT EXISTS time_slot VARCHAR(10) CHECK (time_slot IN ('AM', 'PM', NULL));

-- Create index for efficient scheduling queries
CREATE INDEX IF NOT EXISTS idx_patientschedule_scheduled_date_slot 
ON patientschedule(scheduled_date, time_slot) WHERE is_deleted = FALSE;

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_patientschedule_date_status 
ON patientschedule(scheduled_date, status) WHERE is_deleted = FALSE;

-- Function to get or create capacity config for a date
CREATE OR REPLACE FUNCTION get_or_create_capacity_config(p_date DATE)
RETURNS TABLE (
  config_id BIGINT,
  date DATE,
  am_capacity INT,
  pm_capacity INT,
  am_booked INT,
  pm_booked INT,
  notes TEXT
) AS $$
BEGIN
  -- Try to get existing config
  RETURN QUERY
  SELECT 
    dc.config_id,
    dc.date,
    dc.am_capacity,
    dc.pm_capacity,
    dc.am_booked,
    dc.pm_booked,
    dc.notes
  FROM daily_capacity_config dc
  WHERE dc.date = p_date AND dc.is_deleted = FALSE;
  
  -- If not found, create with defaults
  IF NOT FOUND THEN
    INSERT INTO daily_capacity_config (date, am_capacity, pm_capacity, am_booked, pm_booked)
    VALUES (p_date, 25, 25, 0, 0)
    RETURNING 
      daily_capacity_config.config_id,
      daily_capacity_config.date,
      daily_capacity_config.am_capacity,
      daily_capacity_config.pm_capacity,
      daily_capacity_config.am_booked,
      daily_capacity_config.pm_booked,
      daily_capacity_config.notes
    INTO 
      config_id,
      date,
      am_capacity,
      pm_capacity,
      am_booked,
      pm_booked,
      notes;
      
    RETURN NEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get available time slot for a date
CREATE OR REPLACE FUNCTION get_available_slot(p_date DATE)
RETURNS VARCHAR(10) AS $$
DECLARE
  v_config RECORD;
BEGIN
  -- Get or create config
  SELECT * INTO v_config FROM get_or_create_capacity_config(p_date) LIMIT 1;
  
  -- Check AM availability first
  IF v_config.am_booked < v_config.am_capacity THEN
    RETURN 'AM';
  END IF;
  
  -- Check PM availability
  IF v_config.pm_booked < v_config.pm_capacity THEN
    RETURN 'PM';
  END IF;
  
  -- Both slots full
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to increment booked count for a slot
CREATE OR REPLACE FUNCTION increment_slot_booking(p_date DATE, p_slot VARCHAR(10))
RETURNS VOID AS $$
DECLARE
  v_config_id BIGINT;
BEGIN
  -- Get or create config
  SELECT config_id INTO v_config_id FROM get_or_create_capacity_config(p_date) LIMIT 1;
  
  -- Increment the appropriate slot
  IF p_slot = 'AM' THEN
    UPDATE daily_capacity_config 
    SET am_booked = am_booked + 1, updated_at = NOW()
    WHERE config_id = v_config_id;
  ELSIF p_slot = 'PM' THEN
    UPDATE daily_capacity_config 
    SET pm_booked = pm_booked + 1, updated_at = NOW()
    WHERE config_id = v_config_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement booked count for a slot
CREATE OR REPLACE FUNCTION decrement_slot_booking(p_date DATE, p_slot VARCHAR(10))
RETURNS VOID AS $$
DECLARE
  v_config_id BIGINT;
BEGIN
  -- Get or create config
  SELECT config_id INTO v_config_id FROM get_or_create_capacity_config(p_date) LIMIT 1;
  
  -- Decrement the appropriate slot (don't go below 0)
  IF p_slot = 'AM' THEN
    UPDATE daily_capacity_config 
    SET am_booked = GREATEST(0, am_booked - 1), updated_at = NOW()
    WHERE config_id = v_config_id;
  ELSIF p_slot = 'PM' THEN
    UPDATE daily_capacity_config 
    SET pm_booked = GREATEST(0, pm_booked - 1), updated_at = NOW()
    WHERE config_id = v_config_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate booked counts from actual schedules
CREATE OR REPLACE FUNCTION recalc_capacity_from_schedules(p_date DATE)
RETURNS VOID AS $$
DECLARE
  v_am_count INT;
  v_pm_count INT;
  v_config_id BIGINT;
BEGIN
  -- Count actual schedules for this date
  SELECT COUNT(*) INTO v_am_count
  FROM patientschedule
  WHERE scheduled_date = p_date 
    AND time_slot = 'AM' 
    AND is_deleted = FALSE
    AND status NOT IN ('Completed', 'Cancelled');
  
  SELECT COUNT(*) INTO v_pm_count
  FROM patientschedule
  WHERE scheduled_date = p_date 
    AND time_slot = 'PM' 
    AND is_deleted = FALSE
    AND status NOT IN ('Completed', 'Cancelled');
  
  -- Get or create config
  SELECT config_id INTO v_config_id FROM get_or_create_capacity_config(p_date) LIMIT 1;
  
  -- Update counts
  UPDATE daily_capacity_config
  SET am_booked = v_am_count,
      pm_booked = v_pm_count,
      updated_at = NOW()
  WHERE config_id = v_config_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update capacity when schedule is inserted
CREATE OR REPLACE FUNCTION auto_update_capacity_on_schedule_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.scheduled_date IS NOT NULL AND NEW.time_slot IS NOT NULL THEN
    PERFORM increment_slot_booking(NEW.scheduled_date, NEW.time_slot);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update capacity when schedule is updated
CREATE OR REPLACE FUNCTION auto_update_capacity_on_schedule_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If date or slot changed, update capacity counts
  IF (OLD.scheduled_date IS DISTINCT FROM NEW.scheduled_date) OR 
     (OLD.time_slot IS DISTINCT FROM NEW.time_slot) OR
     (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted) OR
     (OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- Decrement old slot (if was active)
    IF OLD.scheduled_date IS NOT NULL AND OLD.time_slot IS NOT NULL AND 
       OLD.is_deleted = FALSE AND OLD.status NOT IN ('Completed', 'Cancelled') THEN
      PERFORM decrement_slot_booking(OLD.scheduled_date, OLD.time_slot);
    END IF;
    
    -- Increment new slot (if now active)
    IF NEW.scheduled_date IS NOT NULL AND NEW.time_slot IS NOT NULL AND 
       NEW.is_deleted = FALSE AND NEW.status NOT IN ('Completed', 'Cancelled') THEN
      PERFORM increment_slot_booking(NEW.scheduled_date, NEW.time_slot);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_schedule_insert_capacity ON patientschedule;
CREATE TRIGGER trigger_schedule_insert_capacity
  AFTER INSERT ON patientschedule
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_capacity_on_schedule_insert();

DROP TRIGGER IF EXISTS trigger_schedule_update_capacity ON patientschedule;
CREATE TRIGGER trigger_schedule_update_capacity
  AFTER UPDATE ON patientschedule
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_capacity_on_schedule_update();

-- Initial data: Create capacity configs for next 90 days with default values
DO $$
DECLARE
  v_date DATE;
BEGIN
  FOR i IN 0..89 LOOP
    v_date := CURRENT_DATE + i;
    INSERT INTO daily_capacity_config (date, am_capacity, pm_capacity, am_booked, pm_booked)
    VALUES (v_date, 25, 25, 0, 0)
    ON CONFLICT (date) DO NOTHING;
  END LOOP;
END $$;

-- Recalculate existing schedules to populate booked counts
DO $$
DECLARE
  v_date DATE;
BEGIN
  FOR v_date IN 
    SELECT DISTINCT scheduled_date 
    FROM patientschedule 
    WHERE scheduled_date IS NOT NULL 
      AND is_deleted = FALSE
  LOOP
    PERFORM recalc_capacity_from_schedules(v_date);
  END LOOP;
END $$;

COMMENT ON TABLE daily_capacity_config IS 'Stores daily capacity limits and booking counts for AM/PM appointment slots';
COMMENT ON COLUMN daily_capacity_config.am_capacity IS 'Maximum number of patients allowed in AM slot';
COMMENT ON COLUMN daily_capacity_config.pm_capacity IS 'Maximum number of patients allowed in PM slot';
COMMENT ON COLUMN daily_capacity_config.am_booked IS 'Current number of patients booked in AM slot';
COMMENT ON COLUMN daily_capacity_config.pm_booked IS 'Current number of patients booked in PM slot';
COMMENT ON COLUMN patientschedule.time_slot IS 'Time slot for appointment: AM (morning) or PM (afternoon)';
