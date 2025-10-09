-- Migration: 072_create_inventory_requests_table.sql
-- Description: Create inventory_requests table for managing vaccine stock requests
-- Date: 2025-01-27

-- Create inventory_requests table
CREATE TABLE IF NOT EXISTS inventory_requests (
    id SERIAL PRIMARY KEY,
    vaccine_id INTEGER NOT NULL REFERENCES vaccinemaster(vaccine_id) ON DELETE CASCADE,
    requested_quantity INTEGER NOT NULL CHECK (requested_quantity > 0),
    reason TEXT,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled')),
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_quantity INTEGER CHECK (approved_quantity >= 0),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_requests_vaccine_id ON inventory_requests(vaccine_id);
CREATE INDEX IF NOT EXISTS idx_inventory_requests_requester_id ON inventory_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_inventory_requests_approver_id ON inventory_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_inventory_requests_status ON inventory_requests(status);
CREATE INDEX IF NOT EXISTS idx_inventory_requests_created_at ON inventory_requests(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_inventory_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_requests_updated_at
    BEFORE UPDATE ON inventory_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_requests_updated_at();

-- Add RLS (Row Level Security) policies if RLS is enabled
-- Note: This assumes RLS is enabled on the table, adjust as needed
ALTER TABLE inventory_requests ENABLE ROW LEVEL SECURITY;

-- Policy for requesters to see their own requests
CREATE POLICY "Users can view their own inventory requests" ON inventory_requests
    FOR SELECT USING (requester_id = auth.uid()::integer);

-- Policy for approvers/health workers to see all requests
CREATE POLICY "Health workers can view all inventory requests" ON inventory_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::integer
            AND users.role IN ('health_worker', 'admin')
        )
    );

-- Policy for creating requests (any authenticated user)
CREATE POLICY "Users can create inventory requests" ON inventory_requests
    FOR INSERT WITH CHECK (requester_id = auth.uid()::integer);

-- Policy for approving requests (health workers and admins only)
CREATE POLICY "Health workers can approve inventory requests" ON inventory_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::integer
            AND users.role IN ('health_worker', 'admin')
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON inventory_requests TO authenticated;
GRANT USAGE ON SEQUENCE inventory_requests_id_seq TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE inventory_requests IS 'Table for managing vaccine inventory stock requests and approvals';
COMMENT ON COLUMN inventory_requests.id IS 'Primary key for inventory requests';
COMMENT ON COLUMN inventory_requests.vaccine_id IS 'Reference to the vaccine being requested';
COMMENT ON COLUMN inventory_requests.requested_quantity IS 'Quantity of vaccine requested';
COMMENT ON COLUMN inventory_requests.reason IS 'Reason for the request';
COMMENT ON COLUMN inventory_requests.priority IS 'Priority level of the request (low, normal, high, urgent)';
COMMENT ON COLUMN inventory_requests.status IS 'Status of the request (pending, approved, rejected, fulfilled)';
COMMENT ON COLUMN inventory_requests.requester_id IS 'User who made the request';
COMMENT ON COLUMN inventory_requests.approver_id IS 'User who approved/rejected the request';
COMMENT ON COLUMN inventory_requests.approved_quantity IS 'Quantity approved (may differ from requested)';
COMMENT ON COLUMN inventory_requests.rejection_reason IS 'Reason for rejection if status is rejected';
COMMENT ON COLUMN inventory_requests.created_at IS 'Timestamp when request was created';
COMMENT ON COLUMN inventory_requests.approved_at IS 'Timestamp when request was approved/rejected';
COMMENT ON COLUMN inventory_requests.fulfilled_at IS 'Timestamp when request was fulfilled';
COMMENT ON COLUMN inventory_requests.updated_at IS 'Timestamp when request was last updated';