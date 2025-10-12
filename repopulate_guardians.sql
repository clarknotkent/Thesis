-- Repopulate guardians table with sample data
-- This assumes you have users with role 'guardian' in the users table

-- First, let's see what guardian users exist
-- SELECT user_id, firstname, surname, contact_number, email FROM users WHERE role = 'guardian';

-- Insert sample guardians (adjust user_id values based on your actual users)
INSERT INTO guardians (
    surname, firstname, middlename, birthdate, address, occupation,
    contact_number, alternative_contact_number, email, family_number,
    date_registered, user_id, is_deleted, created_at, created_by, updated_at, updated_by
) VALUES
-- Sample guardian 1
('Santos', 'Maria', 'Cruz', '1985-03-15',
 '123 Barangay San Jose, Municipality of Sample, Province',
 'Housewife', '09123456789', '09129876543', 'maria.santos@email.com', 'FAM-001',
 CURRENT_TIMESTAMP, 1, false, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, 1),

-- Sample guardian 2
('Reyes', 'Juan', 'Dela Cruz', '1982-07-22',
 '456 Barangay San Pedro, Municipality of Sample, Province',
 'Farmer', '09134567890', '09138765432', 'juan.reyes@email.com', 'FAM-002',
 CURRENT_TIMESTAMP, 2, false, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, 1),

-- Sample guardian 3
('Garcia', 'Ana', 'Santiago', '1990-11-08',
 '789 Barangay San Antonio, Municipality of Sample, Province',
 'Teacher', '09145678901', '09147654321', 'ana.garcia@email.com', 'FAM-003',
 CURRENT_TIMESTAMP, 3, false, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, 1),

-- Sample guardian 4
('Mendoza', 'Carlos', 'Ramos', '1978-05-30',
 '321 Barangay San Miguel, Municipality of Sample, Province',
 'Driver', '09156789012', '09156543210', 'carlos.mendoza@email.com', 'FAM-004',
 CURRENT_TIMESTAMP, 4, false, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, 1),

-- Sample guardian 5
('Torres', 'Elena', 'Villanueva', '1988-09-12',
 '654 Barangay San Isidro, Municipality of Sample, Province',
 'Nurse', '09167890123', '09165432109', 'elena.torres@email.com', 'FAM-005',
 CURRENT_TIMESTAMP, 5, false, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, 1),

-- Sample guardian 6
('Flores', 'Roberto', 'Castro', '1983-12-03',
 '987 Barangay San Lorenzo, Municipality of Sample, Province',
 'Mechanic', '09178901234', '09174321098', 'roberto.flores@email.com', 'FAM-006',
 CURRENT_TIMESTAMP, 6, false, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, 1),

-- Sample guardian 7
('Gonzales', 'Sofia', 'Mendoza', '1992-04-18',
 '147 Barangay San Francisco, Municipality of Sample, Province',
 'Student', '09189012345', '09183210987', 'sofia.gonzales@email.com', 'FAM-007',
 CURRENT_TIMESTAMP, 7, false, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, 1),

-- Sample guardian 8
('Hernandez', 'Miguel', 'Aquino', '1975-08-25',
 '258 Barangay San Nicolas, Municipality of Sample, Province',
 'Business Owner', '09190123456', '09192109876', 'miguel.hernandez@email.com', 'FAM-008',
 CURRENT_TIMESTAMP, 8, false, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, 1),

-- Sample guardian 9
('Lopez', 'Isabella', 'Cruz', '1987-01-14',
 '369 Barangay San Roque, Municipality of Sample, Province',
 'Office Worker', '09201234567', '09201098765', 'isabella.lopez@email.com', 'FAM-009',
 CURRENT_TIMESTAMP, 9, false, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, 1),

-- Sample guardian 10
('Rodriguez', 'David', 'Santos', '1980-06-09',
 '741 Barangay San Gabriel, Municipality of Sample, Province',
 'Construction Worker', '09212345678', '09210987654', 'david.rodriguez@email.com', 'FAM-010',
 CURRENT_TIMESTAMP, 10, false, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, 1);

-- Update the sequence to continue from the highest guardian_id
-- SELECT setval('guardians_guardian_id_seq', (SELECT COALESCE(MAX(guardian_id), 0) FROM guardians));

-- Verify the data was inserted
-- SELECT guardian_id, surname, firstname, contact_number, email, user_id FROM guardians ORDER BY guardian_id;