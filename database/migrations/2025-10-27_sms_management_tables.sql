-- SMS Management Tables Migration
-- Date: 2025-10-27
-- Description: Tables for SMS logging, templates, and guardian auto-send settings

-- Create sms_logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id SERIAL PRIMARY KEY,
  guardian_id INTEGER REFERENCES guardians(id) ON DELETE SET NULL,
  patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
  phone_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'manual', -- 'manual', 'auto', '1-week', '3-days', '1-day'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  template_id INTEGER REFERENCES sms_templates(id) ON DELETE SET NULL,
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for sms_logs
CREATE INDEX IF NOT EXISTS idx_sms_logs_guardian_id ON sms_logs(guardian_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_patient_id ON sms_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_type ON sms_logs(type);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at ON sms_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone_number ON sms_logs(phone_number);

-- Create sms_templates table
CREATE TABLE IF NOT EXISTS sms_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  template TEXT NOT NULL,
  trigger_type VARCHAR(20) NOT NULL, -- '1-week', '3-days', '1-day', 'manual'
  time_range VARCHAR(50), -- e.g., '08:00-10:00'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for sms_templates
CREATE INDEX IF NOT EXISTS idx_sms_templates_trigger_type ON sms_templates(trigger_type);
CREATE INDEX IF NOT EXISTS idx_sms_templates_is_active ON sms_templates(is_active);

-- Create guardian_auto_send_settings table
CREATE TABLE IF NOT EXISTS guardian_auto_send_settings (
  id SERIAL PRIMARY KEY,
  guardian_id INTEGER UNIQUE NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
  auto_send_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for guardian_auto_send_settings
CREATE INDEX IF NOT EXISTS idx_guardian_auto_send_guardian_id ON guardian_auto_send_settings(guardian_id);
CREATE INDEX IF NOT EXISTS idx_guardian_auto_send_enabled ON guardian_auto_send_settings(auto_send_enabled);

-- Insert sample SMS templates
INSERT INTO sms_templates (name, template, trigger_type, time_range, is_active) VALUES
  (
    '1 Week Before Reminder',
    'Good {greeting_time}, {guardian_title}. {guardian_last_name}. Your child, {patient_name}, is scheduled for vaccination on {appointment_date} for {vaccine_name} Dose {dose_number}.',
    '1-week',
    '06:00-17:59',
    true
  ),
  (
    '3 Days Before Reminder',
    'Good {greeting_time}, {guardian_title}. {guardian_last_name}. Your child, {patient_name}, is scheduled for vaccination on {appointment_date} for {vaccine_name} Dose {dose_number}.',
    '3-days',
    '06:00-17:59',
    true
  ),
  (
    '1 Day Before Reminder',
    'Good {greeting_time}, {guardian_title}. {guardian_last_name}. Your child, {patient_name}, is scheduled for vaccination tomorrow, {appointment_date} for {vaccine_name} Dose {dose_number}.',
    '1-day',
    '06:00-17:59',
    true
  ),
  (
    'Manual Appointment Notice',
    'Good {greeting_time}, {guardian_title}. {guardian_last_name}. Your child, {patient_name}, is scheduled for vaccination on {appointment_date} for {vaccine_name} Dose {dose_number}.',
    'manual',
    NULL,
    true
  )
ON CONFLICT DO NOTHING;

-- Add comment to tables
COMMENT ON TABLE sms_logs IS 'Logs all SMS messages sent through the system';
COMMENT ON TABLE sms_templates IS 'Message templates for automated SMS reminders';
COMMENT ON TABLE guardian_auto_send_settings IS 'Per-guardian settings for auto-send SMS notifications';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON sms_logs TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON sms_templates TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON guardian_auto_send_settings TO your_app_user;
