-- Create notifications table
CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    channel VARCHAR(50) NOT NULL, -- e.g., 'in-app', 'email', 'sms'
    recipient_user_id BIGINT REFERENCES users(user_id),
    recipient_phone VARCHAR(20),
    recipient_email VARCHAR(255),
    template_code VARCHAR(100), -- e.g., 'welcome_guardian', 'vaccination_reminder'
    message_body TEXT NOT NULL,
    related_entity_type VARCHAR(50), -- e.g., 'guardian', 'patient', 'vaccination_schedule'
    related_entity_id BIGINT,
    scheduled_at TIMESTAMP WITHOUT TIME ZONE,
    sent_at TIMESTAMP WITHOUT TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    error_message TEXT,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_by BIGINT REFERENCES users(user_id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT REFERENCES users(user_id),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create notifications_view
CREATE VIEW notifications_view AS
SELECT
    n.*,
    CONCAT(u.firstname, ' ', u.surname) AS recipient_name
FROM notifications n
LEFT JOIN users u ON n.recipient_user_id = u.user_id;

-- Add indexes for performance
CREATE INDEX idx_notifications_recipient_user_id ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled_at ON notifications(scheduled_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);