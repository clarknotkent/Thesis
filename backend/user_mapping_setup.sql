-- USER AND USER_MAPPING CONNECTION SETUP
-- This script sets up the connection between users table and user_mapping table

-- Step 1: Add a trigger function to automatically create user_mapping entry when a user is created
CREATE OR REPLACE FUNCTION create_user_mapping_on_user_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create mapping for users that will use Supabase auth (not for system users)
    IF NEW.role IN ('HealthWorker', 'Nurse', 'Nutritionist', 'Guardian') THEN
        -- Generate a UUID for the mapping (this will be replaced with actual Supabase UUID during auth)
        INSERT INTO user_mapping (uuid, user_id)
        VALUES (gen_random_uuid(), NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger to call the function after user insert
CREATE TRIGGER trg_create_user_mapping_on_user_insert
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_mapping_on_user_insert();

-- Step 3: Function to link Supabase UUID to existing user
CREATE OR REPLACE FUNCTION link_supabase_user(p_supabase_uuid UUID, p_user_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update the user_mapping with the actual Supabase UUID
    UPDATE user_mapping 
    SET uuid = p_supabase_uuid 
    WHERE user_id = p_user_id;
    
    -- Return true if a row was updated
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Function to get user_id from Supabase UUID
CREATE OR REPLACE FUNCTION get_user_id_from_uuid(p_uuid UUID)
RETURNS BIGINT AS $$
DECLARE
    user_id_result BIGINT;
BEGIN
    SELECT user_id INTO user_id_result
    FROM user_mapping
    WHERE uuid = p_uuid;
    
    RETURN user_id_result;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Function to get UUID from user_id
CREATE OR REPLACE FUNCTION get_uuid_from_user_id(p_user_id BIGINT)
RETURNS UUID AS $$
DECLARE
    uuid_result UUID;
BEGIN
    SELECT uuid INTO uuid_result
    FROM user_mapping
    WHERE user_id = p_user_id;
    
    RETURN uuid_result;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Update RLS policies to use user_mapping
-- Drop existing policies first
DROP POLICY IF EXISTS "HealthWorkers can access their own data" ON users;

-- Create new policy using user_mapping
CREATE POLICY "Users can access their own data via mapping" ON users
FOR SELECT USING (
    user_id IN (
        SELECT user_id FROM user_mapping
        WHERE uuid = auth.uid()
    ) OR role = 'Admin'
);

-- Step 7: Create a view for easy user lookup with UUID
CREATE OR REPLACE VIEW users_with_uuid AS
SELECT 
    u.*,
    um.uuid as supabase_uuid
FROM users u
LEFT JOIN user_mapping um ON u.user_id = um.user_id;

-- Step 8: Example usage functions

-- Function to authenticate and get user details
CREATE OR REPLACE FUNCTION authenticate_user(p_supabase_uuid UUID)
RETURNS TABLE(
    user_id BIGINT,
    role VARCHAR,
    firstname VARCHAR,
    surname VARCHAR,
    email VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.role,
        u.firstname,
        u.surname,
        u.email
    FROM users u
    JOIN user_mapping um ON u.user_id = um.user_id
    WHERE um.uuid = p_supabase_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to create user with UUID mapping in one go
CREATE OR REPLACE FUNCTION create_user_with_mapping(
    p_supabase_uuid UUID,
    p_role VARCHAR,
    p_surname VARCHAR,
    p_firstname VARCHAR,
    p_middlename VARCHAR DEFAULT NULL,
    p_sex VARCHAR DEFAULT 'Other',
    p_birthdate DATE DEFAULT CURRENT_DATE,
    p_address TEXT DEFAULT '',
    p_contact_number VARCHAR DEFAULT NULL,
    p_email VARCHAR DEFAULT NULL,
    p_username VARCHAR DEFAULT NULL,
    p_password_hash TEXT DEFAULT ''
)
RETURNS BIGINT AS $$
DECLARE
    new_user_id BIGINT;
BEGIN
    -- Insert user
    INSERT INTO users (role, surname, firstname, middlename, sex, birthdate, address, contact_number, email, username, password_hash)
    VALUES (p_role, p_surname, p_firstname, p_middlename, p_sex, p_birthdate, p_address, p_contact_number, p_email, p_username, p_password_hash)
    RETURNING user_id INTO new_user_id;
    
    -- Create mapping with actual Supabase UUID
    INSERT INTO user_mapping (uuid, user_id)
    VALUES (p_supabase_uuid, new_user_id)
    ON CONFLICT (user_id) DO UPDATE SET uuid = p_supabase_uuid;
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- Usage examples:
-- 1. Create a user with UUID mapping:
-- SELECT create_user_with_mapping(
--     '550e8400-e29b-41d4-a716-446655440000'::UUID,
--     'HealthWorker',
--     'Adams',
--     'Sarah',
--     'D.',
--     'Female',
--     '1990-03-25',
--     'Health Center 1',
--     '1231231234',
--     'sarah.adams@example.com',
--     'sarahadams',
--     'hashedpassword'
-- );

-- 2. Get user details from Supabase UUID:
-- SELECT * FROM authenticate_user('550e8400-e29b-41d4-a716-446655440000'::UUID);

-- 3. Get user_id from UUID:
-- SELECT get_user_id_from_uuid('550e8400-e29b-41d4-a716-446655440000'::UUID);

-- 4. Link existing user to Supabase UUID:
-- SELECT link_supabase_user('550e8400-e29b-41d4-a716-446655440000'::UUID, 1);
