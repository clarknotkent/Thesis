-- Migration: Create push_subscriptions table
-- Description: Stores Web Push API subscriptions for sending push notifications to users
-- Created: 2025

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    subscription_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key to users table
    CONSTRAINT fk_push_subscriptions_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    
    -- Ensure each device/endpoint is unique per user
    CONSTRAINT uq_user_endpoint
        UNIQUE (user_id, endpoint)
);

-- Add indexes for performance
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Add comment to table
COMMENT ON TABLE push_subscriptions IS 'Stores Web Push API subscription information for browser push notifications';

-- Add comments to columns
COMMENT ON COLUMN push_subscriptions.user_id IS 'Foreign key reference to users table';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push service endpoint URL (unique per browser/device)';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Public key for encrypting push message payload';
COMMENT ON COLUMN push_subscriptions.auth IS 'Authentication secret for push encryption';
COMMENT ON COLUMN push_subscriptions.subscription_data IS 'Complete subscription object as JSON for reference';
COMMENT ON COLUMN push_subscriptions.created_at IS 'Timestamp when subscription was created';
COMMENT ON COLUMN push_subscriptions.updated_at IS 'Timestamp when subscription was last updated';
